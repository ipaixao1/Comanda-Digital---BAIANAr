import { Component, OnInit, OnDestroy, ViewChild, ElementRef, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { Chart, registerables } from 'chart.js';
import { AuthService } from '../../services/auth.service';
import { DashboardApiService } from '../../services/api/dashboard-api.service';
import {
  DashboardResumoApi, EstoqueSaldoApi, TopPratoApi, VendaPeriodoApi
} from '../../services/api/api-types';
import { mensagemDeErro } from '../../services/api/api-error';

Chart.register(...registerables);

const ACCENT = '#F29F05';
const GRID   = 'rgba(255,255,255,0.06)';
const TICK   = 'rgba(255,255,255,0.55)';

/**
 * Dashboard administrativo (RF-034 a RF-037), ligado à API:
 * KPIs do dia, top 5 pratos, alertas de estoque e vendas por período.
 */
@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss']
})
export class DashboardComponent implements OnInit, OnDestroy {
  @ViewChild('chartTop')    chartTopRef?:    ElementRef<HTMLCanvasElement>;
  @ViewChild('chartVendas') chartVendasRef?: ElementRef<HTMLCanvasElement>;

  private auth = inject(AuthService);
  private api  = inject(DashboardApiService);

  private chartTop?: Chart;
  private chartVendas?: Chart;
  private timer?: ReturnType<typeof setInterval>;

  readonly periodos = [7, 30, 90];
  periodo = signal(30);

  resumo   = signal<DashboardResumoApi | null>(null);
  top      = signal<TopPratoApi[]>([]);
  vendas   = signal<VendaPeriodoApi[]>([]);
  alertas  = signal<EstoqueSaldoApi[]>([]);

  carregando = signal(true);
  erro       = signal('');
  erroTop    = signal('');
  erroVendas = signal('');
  erroAlertas = signal('');

  totalVendas = computed(() => this.vendas().reduce((s, v) => s + v.total, 0));

  /** Cores do food cost (RF-013): verde até 30%, amarelo de 31 a 35%, vermelho acima. */
  corFoodCost = computed(() => {
    const f = this.resumo()?.foodCostMedio ?? 0;
    return f <= 30 ? 'fc-verde' : f <= 35 ? 'fc-amarelo' : 'fc-vermelho';
  });

  ngOnInit(): void {
    this.carregar();
    // Os números são do banco: atualiza sozinho a cada 60 s.
    this.timer = setInterval(() => this.carregar(false), 60000);
  }

  ngOnDestroy(): void {
    if (this.timer) clearInterval(this.timer);
    this.chartTop?.destroy();
    this.chartVendas?.destroy();
  }

  getPrimeiroNome(): string {
    const u = this.auth.getCurrentUser();
    return u?.nomeCompleto?.split(' ')[0] || u?.matricula || '';
  }

  formatMoeda(v: number | null | undefined): string {
    return (v ?? 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  }

  formatDia(dia: string): string {
    const [a, m, d] = dia.split('-');
    return `${d}/${m}/${a}`;
  }

  onPeriodo(e: Event): void {
    this.periodo.set(Number((e.target as HTMLSelectElement).value));
    this.carregar();
  }

  async carregar(mostrarLoading = true): Promise<void> {
    if (mostrarLoading) this.carregando.set(true);
    const fim = new Date();
    const inicio = new Date();
    inicio.setDate(inicio.getDate() - (this.periodo() - 1));
    inicio.setHours(0, 0, 0, 0);

    const [r, t, v, a] = await Promise.allSettled([
      this.api.resumo(),
      this.api.topPratos(inicio, fim),
      this.api.vendasPeriodo(inicio, fim),
      this.api.alertasEstoque(),
    ]);

    this.erro.set(r.status === 'rejected' ? mensagemDeErro(r.reason, 'Não foi possível carregar o dashboard.') : '');
    this.resumo.set(r.status === 'fulfilled' ? r.value : null);

    this.erroTop.set(t.status === 'rejected' ? mensagemDeErro(t.reason, 'Não foi possível carregar o ranking.') : '');
    this.top.set(t.status === 'fulfilled' ? t.value : []);

    this.erroVendas.set(v.status === 'rejected' ? mensagemDeErro(v.reason, 'Não foi possível carregar as vendas.') : '');
    this.vendas.set(v.status === 'fulfilled' ? v.value : []);

    this.erroAlertas.set(a.status === 'rejected' ? mensagemDeErro(a.reason, 'Não foi possível carregar os alertas.') : '');
    this.alertas.set(a.status === 'fulfilled' ? a.value : []);

    this.carregando.set(false);
    setTimeout(() => this.desenhar());
  }

  private opcoesBase(): any {
    return {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { display: false } },
      scales: {
        x: { grid: { color: GRID }, ticks: { color: TICK } },
        y: { grid: { color: GRID }, ticks: { color: TICK }, beginAtZero: true },
      },
    };
  }

  /** RF-035 (barras) e RF-037 (linha) com Chart.js. */
  private desenhar(): void {
    this.chartTop?.destroy();
    this.chartVendas?.destroy();
    this.chartTop = this.chartVendas = undefined;

    const topCanvas = this.chartTopRef?.nativeElement;
    if (topCanvas && this.top().length) {
      const opts = this.opcoesBase();
      opts.indexAxis = 'y';
      opts.scales.x.ticks.precision = 0;
      this.chartTop = new Chart(topCanvas, {
        type: 'bar',
        data: {
          labels: this.top().map(p => p.nome),
          datasets: [{
            label: 'Unidades vendidas',
            data: this.top().map(p => p.totalVendido),
            backgroundColor: ACCENT, borderRadius: 4,
          }],
        },
        options: opts,
      });
    }

    const vendasCanvas = this.chartVendasRef?.nativeElement;
    if (vendasCanvas && this.vendas().length) {
      this.chartVendas = new Chart(vendasCanvas, {
        type: 'line',
        data: {
          labels: this.vendas().map(v => this.formatDia(v.dia).slice(0, 5)),
          datasets: [{
            label: 'Faturamento (R$)',
            data: this.vendas().map(v => v.total),
            borderColor: ACCENT, backgroundColor: 'rgba(242,159,5,0.2)',
            fill: true, tension: 0.35, pointBackgroundColor: ACCENT,
          }],
        },
        options: this.opcoesBase(),
      });
    }
  }
}
