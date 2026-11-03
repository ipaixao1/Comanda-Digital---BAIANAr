import { Component, signal, computed, inject, OnInit, OnDestroy, ViewChild, ElementRef } from '@angular/core';
import { Chart, registerables } from 'chart.js';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../services/auth.service';
import { PermissionService } from '../../services/permission.service';
import { CompraApiService } from '../../services/api/compra-api.service';
import { FornecedorApiService } from '../../services/api/fornecedor-api.service';
import { IngredienteAdminApiService } from '../../services/api/ingrediente-admin-api.service';
import {
  FornecedorApi, FornecedorProdutoApi, IngredienteApi, MovimentacaoApi, PedidoCompraApi
} from '../../services/api/api-types';
import { mensagemDeErro } from '../../services/api/api-error';

Chart.register(...registerables);

type Acao = 'enviar' | 'receber' | 'cancelar';

interface LinhaPedido { item: FornecedorProdutoApi; qtd: string; }

const ROTULO_STATUS: Record<string, string> = {
  RASCUNHO: 'Rascunho', ENVIADO: 'Enviado', RECEBIDO: 'Recebido', CANCELADO: 'Cancelado',
};

@Component({
  selector: 'app-compras', standalone: true, imports: [CommonModule],
  templateUrl: './compras.component.html', styleUrls: ['./compras.component.scss']
})
export class ComprasComponent implements OnInit, OnDestroy {
  private authService = inject(AuthService);
  private api         = inject(CompraApiService);
  private fornApi     = inject(FornecedorApiService);
  private ingApi      = inject(IngredienteAdminApiService);
  permission           = inject(PermissionService);

  // Só o Dono cria e movimenta pedidos de compra; os demais cargos só consultam
  podeEditar = this.permission.podeEditar('compras');

  aba          = signal<'pedidos' | 'precos'>('pedidos');
  pedidos      = signal<PedidoCompraApi[]>([]);
  fornecedores = signal<FornecedorApi[]>([]);
  ingredientes = signal<IngredienteApi[]>([]);
  carregando   = signal(true);
  erro         = signal('');
  pagina       = signal(0);
  totalPaginas = signal(0);
  expandido    = signal<number | null>(null);

  // ── Novo pedido ──────────────────────────────────────────────
  showModal     = signal(false);
  isSaving      = signal(false);
  erroModal     = signal('');
  fornEscolhido = signal<number | null>(null);
  linhas        = signal<LinhaPedido[]>([]);
  carregandoCat = signal(false);

  fornecedoresAtivos = computed(() => this.fornecedores().filter(f => f.status === 'ATIVO'));
  totalNovo = computed(() => this.linhas().reduce(
    (soma, l) => soma + (parseFloat(l.qtd.replace(',', '.')) || 0) * l.item.preco, 0));

  // ── Ação (enviar / receber / cancelar) ───────────────────────
  acao      = signal<{ tipo: Acao; pedido: PedidoCompraApi } | null>(null);
  erroAcao  = signal('');

  // ── Histórico de preços ──────────────────────────────────────
  precoIngrediente = signal<number | null>(null);
  historico        = signal<MovimentacaoApi[]>([]);
  precoFornecedor  = signal<number | null>(null);
  /** pedido de compra → fornecedor, para filtrar o histórico por fornecedor. */
  private fornDoPedido = new Map<number, number>();

  /** Histórico já filtrado pelo fornecedor escolhido (sem filtro, mostra tudo). */
  historicoFiltrado = computed(() => {
    const f = this.precoFornecedor();
    const h = this.historico();
    if (!f) return h;
    return h.filter(m => m.pedidoCompraId != null && this.fornDoPedido.get(m.pedidoCompraId) === f);
  });

  @ViewChild('grafico') grafico?: ElementRef<HTMLCanvasElement>;
  private chart?: Chart;
  carregandoHist   = signal(false);
  erroHist         = signal('');

  ngOnInit(): void { this.carregar(); }
  ngOnDestroy(): void { this.chart?.destroy(); }

  async carregar(): Promise<void> {
    this.carregando.set(true);
    this.erro.set('');
    try {
      const [pagina, forns, ings] = await Promise.all([
        this.api.listar(this.pagina()), this.fornApi.listar(), this.ingApi.listar()
      ]);
      this.pedidos.set(pagina.content);
      this.totalPaginas.set(pagina.totalPages);
      this.fornecedores.set(forns);
      this.ingredientes.set(ings.filter(i => i.status === 'ATIVO'));
    } catch (err) {
      this.erro.set(mensagemDeErro(err, 'Não foi possível carregar as compras.'));
    } finally {
      this.carregando.set(false);
    }
  }

  getPrimeiroNome(): string {
    const u = this.authService.getCurrentUser();
    return u?.nomeCompleto?.split(' ')[0] || u?.matricula || '';
  }

  rotuloStatus(s: string): string { return ROTULO_STATUS[s] ?? s; }

  formatPreco(v: number): string {
    return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', minimumFractionDigits: 2 });
  }

  toggle(p: PedidoCompraApi): void {
    this.expandido.set(this.expandido() === p.id ? null : p.id);
  }

  mudarPagina(delta: number): void {
    const n = this.pagina() + delta;
    if (n < 0 || n >= this.totalPaginas()) return;
    this.pagina.set(n);
    this.carregar();
  }

  // ── Novo pedido ──────────────────────────────────────────────
  abrirNovo(): void {
    this.fornEscolhido.set(null);
    this.linhas.set([]);
    this.erroModal.set('');
    this.showModal.set(true);
  }

  fecharModal(): void { if (!this.isSaving()) this.showModal.set(false); }

  async onFornecedor(e: Event): Promise<void> {
    const v = (e.target as HTMLSelectElement).value;
    this.fornEscolhido.set(v ? Number(v) : null);
    this.linhas.set([]);
    this.erroModal.set('');
    if (!v) return;
    this.carregandoCat.set(true);
    try {
      const catalogo = await this.fornApi.catalogo(Number(v));
      this.linhas.set(catalogo.map(item => ({ item, qtd: '' })));
    } catch (err) {
      this.erroModal.set(mensagemDeErro(err, 'Não foi possível carregar o catálogo do fornecedor.'));
    } finally {
      this.carregandoCat.set(false);
    }
  }

  onQtd(index: number, e: Event): void {
    const v = (e.target as HTMLInputElement).value;
    this.linhas.set(this.linhas().map((l, i) => i === index ? { ...l, qtd: v } : l));
  }

  subtotal(l: LinhaPedido): number {
    return (parseFloat(l.qtd.replace(',', '.')) || 0) * l.item.preco;
  }

  async salvarNovo(): Promise<void> {
    const forn = this.fornEscolhido();
    if (!this.podeEditar || !forn) { this.erroModal.set('Escolha o fornecedor.'); return; }
    const itens = this.linhas()
      .map(l => ({ ingredienteId: l.item.ingredienteId, quantidade: parseFloat(l.qtd.replace(',', '.')) || 0 }))
      .filter(i => i.quantidade > 0);
    if (!itens.length) { this.erroModal.set('Informe a quantidade de pelo menos um produto.'); return; }
    this.isSaving.set(true);
    this.erroModal.set('');
    try {
      await this.api.criar({ fornecedorId: forn, itens });
      this.showModal.set(false);
      this.pagina.set(0);
      await this.carregar();
    } catch (err) {
      this.erroModal.set(mensagemDeErro(err, 'Não foi possível criar o pedido de compra.'));
    } finally {
      this.isSaving.set(false);
    }
  }

  // ── Enviar / receber / cancelar ──────────────────────────────
  pedirAcao(tipo: Acao, pedido: PedidoCompraApi, e: Event): void {
    e.stopPropagation();
    this.erroAcao.set('');
    this.acao.set({ tipo, pedido });
  }

  cancelarAcao(): void { this.acao.set(null); }

  textoAcao(): string {
    const a = this.acao();
    if (!a) return '';
    if (a.tipo === 'enviar')  return `Enviar o pedido #${a.pedido.id} para ${a.pedido.fornecedorNome}?`;
    if (a.tipo === 'receber') return `Confirmar o recebimento do pedido #${a.pedido.id}?`;
    return `Cancelar o pedido #${a.pedido.id}?`;
  }

  avisoAcao(): string {
    const a = this.acao();
    if (a?.tipo === 'receber') return 'Isso lança a entrada de cada item no estoque e atualiza o custo dos ingredientes.';
    if (a?.tipo === 'cancelar') return 'Um pedido cancelado não pode mais ser enviado nem recebido.';
    return 'Depois de enviado, o pedido não pode mais ser alterado.';
  }

  async confirmarAcao(): Promise<void> {
    const a = this.acao();
    if (!a || !this.podeEditar) return;
    try {
      if (a.tipo === 'enviar')  await this.api.enviar(a.pedido.id);
      if (a.tipo === 'receber') await this.api.receber(a.pedido.id);
      if (a.tipo === 'cancelar') await this.api.cancelar(a.pedido.id);
      this.acao.set(null);
      await this.carregar();
    } catch (err) {
      this.erroAcao.set(mensagemDeErro(err, 'Não foi possível concluir a ação.'));
    }
  }

  // ── Histórico de preços (RF-026) ─────────────────────────────
  trocarAba(aba: 'pedidos' | 'precos'): void {
    this.aba.set(aba);
    if (aba === 'precos') setTimeout(() => this.desenhar());
    else { this.chart?.destroy(); this.chart = undefined; }
  }

  async onPrecoIngrediente(e: Event): Promise<void> {
    const v = (e.target as HTMLSelectElement).value;
    this.precoIngrediente.set(v ? Number(v) : null);
    this.historico.set([]);
    this.erroHist.set('');
    this.desenhar();
    if (!v) return;
    this.carregandoHist.set(true);
    try {
      const [hist, pedidos] = await Promise.all([
        this.api.historicoPrecos(Number(v)), this.api.listar(0, 200)
      ]);
      this.fornDoPedido = new Map(pedidos.content.map(p => [p.id, p.fornecedorId] as [number, number]));
      this.historico.set(hist);
    } catch (err) {
      this.erroHist.set(mensagemDeErro(err, 'Não foi possível carregar o histórico de preços.'));
    } finally {
      this.carregandoHist.set(false);
      setTimeout(() => this.desenhar());
    }
  }

  onPrecoFornecedor(e: Event): void {
    const v = (e.target as HTMLSelectElement).value;
    this.precoFornecedor.set(v ? Number(v) : null);
    setTimeout(() => this.desenhar());
  }

  /** Variação em relação à compra anterior. Só compara compras reais (com pedido); entradas sem pedido, como o estoque inicial, ficam de fora. */
  variacao(i: number): number | null {
    const h = this.historicoFiltrado();
    const atual = h[i];
    if (!atual.pedidoCompraId || atual.custoUnitario == null) return null;
    for (let j = i - 1; j >= 0; j--) {
      if (h[j].pedidoCompraId && h[j].custoUnitario != null) {
        const antes = h[j].custoUnitario as number;
        return antes === 0 ? null : (atual.custoUnitario - antes) / antes * 100;
      }
    }
    return null;
  }

  /** Gráfico de evolução do preço pago nas compras recebidas (Chart.js). */
  private desenhar(): void {
    this.chart?.destroy();
    this.chart = undefined;
    const canvas = this.grafico?.nativeElement;
    if (!canvas) return;
    const compras = this.historicoFiltrado().filter(m => m.pedidoCompraId != null && m.custoUnitario != null);
    if (!compras.length) return;
    this.chart = new Chart(canvas, {
      type: 'line',
      data: {
        labels: compras.map(m => new Date(m.createdAt).toLocaleDateString('pt-BR')),
        datasets: [{
          label: 'Preço pago (R$)',
          data: compras.map(m => m.custoUnitario as number),
          borderColor: '#F5A00B', backgroundColor: 'rgba(245,160,11,.15)',
          pointBackgroundColor: '#F5A00B', tension: .25, fill: true,
        }],
      },
      options: {
        responsive: true, maintainAspectRatio: false,
        plugins: { legend: { labels: { color: '#ddd' } } },
        scales: {
          x: { ticks: { color: '#bbb' }, grid: { color: 'rgba(255,255,255,.06)' } },
          y: { ticks: { color: '#bbb' }, grid: { color: 'rgba(255,255,255,.06)' } },
        },
      },
    });
  }
}
