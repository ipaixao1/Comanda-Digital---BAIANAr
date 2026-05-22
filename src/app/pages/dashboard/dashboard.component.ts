import { Component, OnInit, OnDestroy, AfterViewInit, signal, ElementRef, ViewChild, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../services/auth.service';
import { User } from '../../services/auth.service';
import { Subject, interval } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

declare const Chart: any;

export interface KpiData {
  faturamentoAno: number;
  faturamentoVariacao: number;
  totalPedidosAno: number;
  pedidosMesMedia: number;
  mediaAvaliacoes: number;
  totalAvaliacoes: number;
}

export interface StatusOperacional {
  aguardandoPreparo: number;
  emPreparo: number;
  prontoEntrega: number;
  finalizadosHoje: number;
  canceladosHoje: number;
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss']
})
export class DashboardComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('chartFaturamento') chartFaturamentoRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild('chartPedidos')     chartPedidosRef!:     ElementRef<HTMLCanvasElement>;
  @ViewChild('chartAvaliacoes')  chartAvaliacoesRef!:  ElementRef<HTMLCanvasElement>;

  private destroy$ = new Subject<void>();
  private chartFaturamento: any;
  private chartPedidos: any;
  private chartAvaliacoes: any;

  private authService = inject(AuthService);

  constructor() {}

  currentUser = signal<User | null>(null);

  kpi = signal<KpiData>({
    faturamentoAno: 625990,
    faturamentoVariacao: 18,
    totalPedidosAno: 12638,
    pedidosMesMedia: 1053,
    mediaAvaliacoes: 4.7,
    totalAvaliacoes: 4850
  });

  status = signal<StatusOperacional>({
    aguardandoPreparo: 12,
    emPreparo: 8,
    prontoEntrega: 5,
    finalizadosHoje: 45,
    canceladosHoje: 2
  });

  meses = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez'];

  faturamentoMensal = [42000, 45000, 43000, 47000, 54947, 52000, 55000, 54000, 56000, 58000, 65000, 68000];
  pedidosMensal     = [720, 680, 760, 900, 980, 825, 1050, 1020, 1050, 1060, 1080, 1380];
  avaliacoesMensal  = [4.8, 4.6, 4.7, 4.7, 4.6, 4.8, 4.9, 4.8, 4.9, 4.9, 4.8, 4.7];

  ngOnInit(): void {
    this.authService.currentUser$.subscribe((user: User | null) => {
      this.currentUser.set(user);
    });

    // Atualização em tempo real a cada 5s
    // TODO: substituir por Firestore onSnapshot()
    interval(5000).pipe(takeUntil(this.destroy$)).subscribe(() => {
      this.simulateRealTimeUpdate();
    });
  }

  ngAfterViewInit(): void {
    this.waitForChartJs().then(() => this.initCharts());
  }

  private waitForChartJs(): Promise<void> {
    return new Promise(resolve => {
      if (typeof Chart !== 'undefined') { resolve(); return; }
      const check = setInterval(() => {
        if (typeof Chart !== 'undefined') { clearInterval(check); resolve(); }
      }, 100);
    });
  }

  private initCharts(): void {
    const accent     = '#F29F05';
    const accentFill = 'rgba(242, 159, 5, 0.22)';
    const grid       = 'rgba(255,255,255,0.06)';
    const tick       = 'rgba(255,255,255,0.45)';
    const cardBg     = '#3A3550';

    const tooltipBase = {
      backgroundColor: cardBg,
      borderColor: accent,
      borderWidth: 1.5,
      cornerRadius: 8,
      padding: 12,
      titleColor: 'rgba(255,255,255,0.7)',
      bodyColor: accent,
      titleFont: { family: "'Poppins', sans-serif", style: 'italic' as const, size: 12, weight: '200' as const },
      bodyFont:  { family: "'Poppins', sans-serif", style: 'italic' as const, size: 14, weight: '200' as const },
      displayColors: false,
    };

    const scaleBase = {
      x: {
        grid: { color: grid, drawBorder: false },
        ticks: { color: tick, font: { family: "'Poppins', sans-serif", style: 'italic' as const, size: 11 } }
      },
      y: {
        grid: { color: grid, drawBorder: false },
        ticks: { color: tick, font: { family: "'Poppins', sans-serif", style: 'italic' as const, size: 11 } }
      }
    };

    // ── Faturamento (area) ─────────────────────────────────────
    this.chartFaturamento = new Chart(this.chartFaturamentoRef.nativeElement, {
      type: 'line',
      data: {
        labels: this.meses,
        datasets: [{
          data: [...this.faturamentoMensal],
          borderColor: accent,
          backgroundColor: accentFill,
          fill: true,
          tension: 0.45,
          pointRadius: 4,
          pointHoverRadius: 7,
          pointBackgroundColor: accent,
          pointBorderColor: cardBg,
          pointBorderWidth: 2,
          pointHoverBackgroundColor: accent,
          pointHoverBorderColor: '#fff',
          pointHoverBorderWidth: 2,
          borderWidth: 2.5
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: { mode: 'index', intersect: false },
        plugins: {
          legend: { display: false },
          tooltip: {
            ...tooltipBase,
            callbacks: {
              title: (items: any[]) => items[0]?.label ?? '',
              label: (item: any) => `valor : ${item.raw.toLocaleString('pt-BR')}`
            }
          }
        },
        scales: scaleBase
      }
    });

    // ── Pedidos (bar) ──────────────────────────────────────────
    this.chartPedidos = new Chart(this.chartPedidosRef.nativeElement, {
      type: 'bar',
      data: {
        labels: this.meses,
        datasets: [{
          data: [...this.pedidosMensal],
          backgroundColor: accent,
          hoverBackgroundColor: 'rgba(242,159,5,0.5)',
          borderRadius: 4,
          borderSkipped: false
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: { mode: 'index', intersect: false },
        plugins: {
          legend: { display: false },
          tooltip: {
            ...tooltipBase,
            callbacks: {
              title: (items: any[]) => items[0]?.label ?? '',
              label: (item: any) => `pedidos : ${item.raw}`
            }
          }
        },
        scales: scaleBase
      }
    });

    // ── Avaliações (line) ──────────────────────────────────────
    this.chartAvaliacoes = new Chart(this.chartAvaliacoesRef.nativeElement, {
      type: 'line',
      data: {
        labels: this.meses,
        datasets: [{
          data: [...this.avaliacoesMensal],
          borderColor: accent,
          backgroundColor: 'transparent',
          fill: false,
          tension: 0.5,
          pointRadius: 4,
          pointHoverRadius: 7,
          pointBackgroundColor: accent,
          pointBorderColor: cardBg,
          pointBorderWidth: 2,
          pointHoverBackgroundColor: accent,
          pointHoverBorderColor: '#fff',
          pointHoverBorderWidth: 2,
          borderWidth: 2.5
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: { mode: 'index', intersect: false },
        plugins: {
          legend: { display: false },
          tooltip: {
            ...tooltipBase,
            callbacks: {
              title: (items: any[]) => items[0]?.label ?? '',
              label: (item: any) => `média : ${item.raw}`
            }
          }
        },
        scales: {
          ...scaleBase,
          y: {
            ...scaleBase.y,
            min: 0,
            max: 5,
            ticks: { ...scaleBase.y.ticks, stepSize: 1 }
          }
        }
      }
    });
  }

  private simulateRealTimeUpdate(): void {
    // TODO: substituir por Firestore onSnapshot()
    const statusAtual = this.status();

    this.status.set({
      aguardandoPreparo: Math.max(0, statusAtual.aguardandoPreparo + Math.floor(Math.random() * 3) - 1),
      emPreparo:         Math.max(0, statusAtual.emPreparo         + Math.floor(Math.random() * 3) - 1),
      prontoEntrega:     Math.max(0, statusAtual.prontoEntrega     + Math.floor(Math.random() * 3) - 1),
      finalizadosHoje:   statusAtual.finalizadosHoje + (Math.random() > 0.5 ? 1 : 0),
      canceladosHoje:    statusAtual.canceladosHoje  + (Math.random() > 0.9 ? 1 : 0)
    });

    if (this.chartFaturamento && this.chartPedidos) {
      const lastFat = this.faturamentoMensal[11] + Math.floor(Math.random() * 600 - 300);
      this.chartFaturamento.data.datasets[0].data[11] = lastFat;
      this.chartFaturamento.update('none');

      const lastPed = this.pedidosMensal[11] + Math.floor(Math.random() * 6 - 3);
      this.chartPedidos.data.datasets[0].data[11] = lastPed;
      this.chartPedidos.update('none');

      const novoFat = (this.chartFaturamento.data.datasets[0].data as number[]).reduce((a, b) => a + b, 0);
      const novoPed = (this.chartPedidos.data.datasets[0].data as number[]).reduce((a, b) => a + b, 0);

      this.kpi.set({
        ...this.kpi(),
        faturamentoAno:  Math.round(novoFat),
        totalPedidosAno: Math.round(novoPed),
        pedidosMesMedia: Math.round(novoPed / 12)
      });
    }
  }

  getPrimeiroNome(): string {
    const user = this.currentUser();
    if (!user) return '';
    return user.nomeCompleto?.split(' ')[0] || user.matricula;
  }

  formatCurrency(value: number): string {
    return value.toLocaleString('pt-BR');
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    this.chartFaturamento?.destroy();
    this.chartPedidos?.destroy();
    this.chartAvaliacoes?.destroy();
  }
}
