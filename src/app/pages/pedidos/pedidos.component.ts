import { Component, OnInit, OnDestroy, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Chart, registerables } from 'chart.js';
import { AuthService } from '../../services/auth.service';
import { PermissionService } from '../../services/permission.service';
import {
  PedidoAdminApiService, PROXIMO_STATUS, ROTULO_STATUS_PEDIDO
} from '../../services/api/pedido-admin-api.service';
import { PedidoApi, StatusPedidoApi } from '../../services/api/api-types';
import { isoUtc } from '../../services/api/pedido-status.util';
import { mensagemDeErro } from '../../services/api/api-error';

Chart.register(...registerables);

const DIAS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

/**
 * Pedidos do painel admin, ligados à API (RF-015, RF-016, RF-018, RF-019, RF-020):
 * lista paginada com filtro de status, detalhe, avanço de status e cancelamento com motivo.
 */
@Component({
  selector: 'app-pedidos',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './pedidos.component.html',
  styleUrls: ['./pedidos.component.scss']
})
export class PedidosComponent implements OnInit, OnDestroy {

  private authService = inject(AuthService);
  private api         = inject(PedidoAdminApiService);
  permission          = inject(PermissionService);

  private chart?: Chart;
  private timer?: ReturnType<typeof setInterval>;

  /** Dono e Gerente movimentam e cancelam pedidos (o backend permite ADMIN e GERENTE). Supervisor só consulta. */
  podeMovimentar = this.permission.isDono() || this.permission.isGerente();

  readonly filtros: { valor: StatusPedidoApi | ''; rotulo: string }[] = [
    { valor: '', rotulo: 'Todos' },
    { valor: 'RECEBIDO', rotulo: 'Recebido' },
    { valor: 'CONFIRMADO', rotulo: 'Confirmado' },
    { valor: 'EM_PREPARO', rotulo: 'Em preparo' },
    { valor: 'PRONTO', rotulo: 'Pronto' },
    { valor: 'SAIU_ENTREGA', rotulo: 'Saiu p/ entrega' },
    { valor: 'FINALIZADO', rotulo: 'Finalizado' },
    { valor: 'CANCELADO', rotulo: 'Cancelado' },
  ];

  pedidos      = signal<PedidoApi[]>([]);
  filtro       = signal<StatusPedidoApi | ''>('');
  pagina       = signal(0);
  totalPaginas = signal(0);
  carregando   = signal(true);
  erro         = signal('');
  pedidoAberto = signal<number | null>(null);

  totalSemana = signal(0);
  emPreparo   = signal(0);
  finalizados = signal(0);
  cancelados  = signal(0);

  // Cancelamento
  pedidoCancelar = signal<PedidoApi | null>(null);
  motivo         = signal('');
  erroAcao       = signal('');
  salvando       = signal(false);

  ngOnInit(): void {
    this.carregar();
    this.carregarResumo();
    this.timer = setInterval(() => { this.carregar(false); this.carregarResumo(); }, 15000);
  }

  ngOnDestroy(): void {
    if (this.timer) clearInterval(this.timer);
    this.chart?.destroy();
  }

  getPrimeiroNome(): string {
    const u = this.authService.getCurrentUser();
    return u?.nomeCompleto?.split(' ')[0] || u?.matricula || '';
  }

  // ── Lista ────────────────────────────────────────────────────
  async carregar(mostrarLoading = true): Promise<void> {
    if (mostrarLoading) this.carregando.set(true);
    try {
      const r = await this.api.listar({ status: this.filtro(), page: this.pagina(), size: 10 });
      this.pedidos.set(r.content);
      this.totalPaginas.set(r.totalPages);
      this.erro.set('');
    } catch (err) {
      this.erro.set(mensagemDeErro(err, 'Não foi possível carregar os pedidos.'));
    } finally {
      this.carregando.set(false);
    }
  }

  onFiltro(valor: StatusPedidoApi | ''): void {
    this.filtro.set(valor);
    this.pagina.set(0);
    this.carregar();
  }

  mudarPagina(delta: number): void {
    const nova = this.pagina() + delta;
    if (nova < 0 || nova >= this.totalPaginas()) return;
    this.pagina.set(nova);
    this.carregar();
  }

  // ── KPIs e gráfico (dados reais) ─────────────────────────────
  private async carregarResumo(): Promise<void> {
    try {
      const inicio = new Date();
      inicio.setDate(inicio.getDate() - 6);
      inicio.setHours(0, 0, 0, 0);
      const [semana, prep, fin, canc] = await Promise.all([
        this.api.listar({ inicio, size: 200 }),
        this.api.listar({ status: 'EM_PREPARO', size: 1 }),
        this.api.listar({ status: 'FINALIZADO', size: 1 }),
        this.api.listar({ status: 'CANCELADO', size: 1 }),
      ]);
      this.totalSemana.set(semana.totalElements);
      this.emPreparo.set(prep.totalElements);
      this.finalizados.set(fin.totalElements);
      this.cancelados.set(canc.totalElements);
      this.desenharGrafico(semana.content);
    } catch {
      // KPIs são complementares: se falharem, a lista continua funcionando.
    }
  }

  /** Quantidade de pedidos por dia, nos últimos 7 dias (horário local). */
  private desenharGrafico(pedidos: PedidoApi[]): void {
    const canvas = document.getElementById('chartDia') as HTMLCanvasElement | null;
    if (!canvas) return;
    const dias: Date[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      d.setHours(0, 0, 0, 0);
      dias.push(d);
    }
    const contagem = dias.map(d => pedidos.filter(p => {
      const c = new Date(isoUtc(p.createdAt));
      return c.getFullYear() === d.getFullYear() && c.getMonth() === d.getMonth() && c.getDate() === d.getDate();
    }).length);

    this.chart?.destroy();
    this.chart = new Chart(canvas, {
      type: 'bar',
      data: {
        labels: dias.map(d => DIAS[d.getDay()]),
        datasets: [{ label: 'Pedidos', data: contagem, backgroundColor: '#F29F05', borderRadius: 5 }],
      },
      options: {
        responsive: true, maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: {
          x: { grid: { color: 'rgba(255,255,255,0.06)' }, ticks: { color: 'rgba(255,255,255,0.55)' } },
          y: { grid: { color: 'rgba(255,255,255,0.06)' }, ticks: { color: 'rgba(255,255,255,0.55)', precision: 0 }, beginAtZero: true },
        },
      },
    });
  }

  // ── Ações ────────────────────────────────────────────────────
  proximo(p: PedidoApi) { return PROXIMO_STATUS[p.status]; }

  podeCancelar(p: PedidoApi): boolean {
    return this.podeMovimentar && p.status !== 'FINALIZADO' && p.status !== 'CANCELADO';
  }

  async avancar(p: PedidoApi, e: Event): Promise<void> {
    e.stopPropagation();
    const prox = PROXIMO_STATUS[p.status];
    if (!prox || !this.podeMovimentar) return;
    this.erro.set('');
    try {
      await this.api.mudarStatus(p.id, prox.proximo);
      await this.carregar(false);
      this.carregarResumo();
    } catch (err) {
      this.erro.set(mensagemDeErro(err, 'Não foi possível atualizar o status do pedido.'));
    }
  }

  abrirCancelar(p: PedidoApi, e: Event): void {
    e.stopPropagation();
    this.motivo.set('');
    this.erroAcao.set('');
    this.pedidoCancelar.set(p);
  }

  fecharCancelar(): void { if (!this.salvando()) this.pedidoCancelar.set(null); }

  onMotivo(e: Event): void { this.motivo.set((e.target as HTMLTextAreaElement).value); }

  async confirmarCancelar(): Promise<void> {
    const p = this.pedidoCancelar();
    if (!p) return;
    if (!this.motivo().trim()) { this.erroAcao.set('Informe o motivo do cancelamento.'); return; }
    this.salvando.set(true);
    this.erroAcao.set('');
    try {
      await this.api.cancelar(p.id, this.motivo().trim());
      this.pedidoCancelar.set(null);
      await this.carregar(false);
      this.carregarResumo();
    } catch (err) {
      this.erroAcao.set(mensagemDeErro(err, 'Não foi possível cancelar o pedido.'));
    } finally {
      this.salvando.set(false);
    }
  }

  // ── Helpers de exibição ──────────────────────────────────────
  togglePedido(id: number): void {
    this.pedidoAberto.set(this.pedidoAberto() === id ? null : id);
  }

  rotulo(s: StatusPedidoApi): string { return ROTULO_STATUS_PEDIDO[s]; }

  qtdItens(p: PedidoApi): number { return p.itens.reduce((s, i) => s + i.quantidade, 0); }

  comanda(p: PedidoApi): 'Aberta' | 'Fechada' {
    return p.status === 'FINALIZADO' || p.status === 'CANCELADO' ? 'Fechada' : 'Aberta';
  }

  formatDataHora(utc: string): string {
    const d = new Date(isoUtc(utc));
    return d.toLocaleDateString('pt-BR') + ' ' + d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  }

  formatValor(v: number): string {
    return v.toLocaleString('pt-BR', { minimumFractionDigits: 2 });
  }

  getPreparoClass(s: StatusPedidoApi): string {
    const m: Record<StatusPedidoApi, string> = {
      RECEBIDO: 'badge--aguardando', CONFIRMADO: 'badge--aguardando', EM_PREPARO: 'badge--preparo',
      PRONTO: 'badge--pronto', SAIU_ENTREGA: 'badge--pronto', FINALIZADO: 'badge--finalizado', CANCELADO: 'badge--cancelado',
    };
    return m[s];
  }

  getComandaClass(s: 'Aberta' | 'Fechada'): string {
    return s === 'Aberta' ? 'badge--aberta' : 'badge--fechada';
  }
}
