import {
  Component, OnInit, OnDestroy, AfterViewInit,
  signal, computed, inject, ElementRef, ViewChild, DestroyRef
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../services/auth.service';
import { PedidoService, PedidoShared, StatusPedido as StatusPedidoShared } from '../../services/pedido.service';
import { interval } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

declare const Chart: any;

export type StatusPreparo = 'Aguardando preparo' | 'Em preparo' | 'Pronto' | 'Finalizado' | 'Cancelado';
export type StatusComanda = 'Aberta' | 'Fechada';

export interface ItemPedido {
  nome: string;
  quantidade: number;
  obs?: string;
  status: 'Aguardando' | 'Em preparo' | 'Pronto' | 'Entregue';
}

export interface Pedido {
  numero: number | string;
  dataHora: Date;
  qtdItens: number;
  itens: ItemPedido[];
  statusPreparo: StatusPreparo;
  statusComanda: StatusComanda;
  valorTotal: number;
  isReal?: boolean;
  pedidoId?: string;
}

@Component({
  selector: 'app-pedidos',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './pedidos.component.html',
  styleUrls: ['./pedidos.component.scss']
})
export class PedidosComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('chartDia') chartDiaRef!: ElementRef<HTMLCanvasElement>;

  private authService  = inject(AuthService);
  private pedidoSvc    = inject(PedidoService);
  private destroyRef   = inject(DestroyRef);
  private chart: any;

  pedidoAberto = signal<number | string | null>(null);
  private _extra = signal(0);

  // ── Mapa: StatusPedidoShared → StatusPreparo (admin) ────────
  private toStatusPreparo(s: StatusPedidoShared): StatusPreparo {
    const map: Record<StatusPedidoShared, StatusPreparo> = {
      recebido:   'Aguardando preparo',
      em_preparo: 'Em preparo',
      pronto:     'Pronto',
      enviado:    'Pronto',
      a_caminho:  'Finalizado',
      entregue:   'Finalizado',
      cancelado:  'Cancelado',
    };
    return map[s];
  }

  private toStatusComanda(s: StatusPedidoShared): StatusComanda {
    return ['entregue', 'cancelado', 'a_caminho'].includes(s) ? 'Fechada' : 'Aberta';
  }

  // Mapa: StatusPedidoShared → status do item individual
  private toItemStatus(s: StatusPedidoShared): ItemPedido['status'] {
    const map: Record<StatusPedidoShared, ItemPedido['status']> = {
      recebido:   'Aguardando',
      em_preparo: 'Em preparo',
      pronto:     'Pronto',
      enviado:    'Pronto',
      a_caminho:  'Entregue',
      entregue:   'Entregue',
      cancelado:  'Aguardando',
    };
    return map[s];
  }

  // Converte PedidoShared → Pedido (admin)
  private converterPedido(p: PedidoShared): Pedido {
    return {
      numero: p.numero as any,   // string "#8750"
      dataHora: new Date(p.dataHora),
      qtdItens: p.itens.reduce((s, i) => s + i.quantidade, 0),
      statusPreparo: this.toStatusPreparo(p.status),
      statusComanda: this.toStatusComanda(p.status),
      valorTotal: p.total,
      isReal: true,
      pedidoId: p.id,
      itens: p.itens.map(i => ({
        nome: i.nome,
        quantidade: i.quantidade,
        obs: i.obs,
        status: this.toItemStatus(p.status),
      })),
    };
  }

  // Pedidos mockados (demo) — mantidos exatamente como estavam
  private pedidosMock: Pedido[] = [
    {
      numero: 2045, dataHora: new Date('2026-03-05T19:45'), qtdItens: 4,
      statusPreparo: 'Em preparo', statusComanda: 'Aberta', valorTotal: 128.50,
      itens: [
        { nome: 'Moqueca de Peixe',      quantidade: 2, obs: 'Menos pimenta', status: 'Em preparo' },
        { nome: 'Acarajé com Vatapá',    quantidade: 1,                        status: 'Pronto' },
        { nome: 'Caipirinha de Cachaça', quantidade: 2,                        status: 'Entregue' },
      ]
    },
    {
      numero: 2044, dataHora: new Date('2026-03-05T19:30'), qtdItens: 3,
      statusPreparo: 'Pronto', statusComanda: 'Aberta', valorTotal: 95.70,
      itens: [
        { nome: 'Bobó de Camarão',  quantidade: 1, status: 'Pronto' },
        { nome: 'Água com Gás',     quantidade: 2, status: 'Entregue' },
        { nome: 'Pudim de Tapioca', quantidade: 1, status: 'Pronto' },
      ]
    },
    {
      numero: 2043, dataHora: new Date('2026-03-05T19:15'), qtdItens: 5,
      statusPreparo: 'Finalizado', statusComanda: 'Fechada', valorTotal: 213.40,
      itens: [
        { nome: 'Carne do Sol',     quantidade: 2, status: 'Entregue' },
        { nome: 'Baião de Dois',    quantidade: 1, status: 'Entregue' },
        { nome: 'Drinks Tropicais', quantidade: 2, status: 'Entregue' },
      ]
    },
    {
      numero: 2042, dataHora: new Date('2026-03-05T19:00'), qtdItens: 2,
      statusPreparo: 'Aguardando preparo', statusComanda: 'Aberta', valorTotal: 67.80,
      itens: [
        { nome: 'Mini Acarajés', quantidade: 2, status: 'Aguardando' },
        { nome: 'Refrigerante',  quantidade: 2, status: 'Aguardando' },
      ]
    },
    {
      numero: 2041, dataHora: new Date('2026-03-05T18:45'), qtdItens: 6,
      statusPreparo: 'Em preparo', statusComanda: 'Aberta', valorTotal: 189.90,
      itens: [
        { nome: 'Arroz de Polvo',    quantidade: 2, status: 'Em preparo' },
        { nome: 'Casquinhas de Siri',quantidade: 1, status: 'Pronto' },
        { nome: 'Gin Tônica',        quantidade: 2, status: 'Entregue' },
        { nome: 'Torta de Cocada',   quantidade: 1, status: 'Aguardando' },
      ]
    },
    {
      numero: 2040, dataHora: new Date('2026-03-05T18:30'), qtdItens: 3,
      statusPreparo: 'Finalizado', statusComanda: 'Fechada', valorTotal: 142.60,
      itens: [
        { nome: 'Camarão à Baiana', quantidade: 1, status: 'Entregue' },
        { nome: 'Cravinho',         quantidade: 2, status: 'Entregue' },
      ]
    },
    {
      numero: 2039, dataHora: new Date('2026-03-05T18:15'), qtdItens: 4,
      statusPreparo: 'Pronto', statusComanda: 'Aberta', valorTotal: 76.50,
      itens: [
        { nome: 'Caldo de Sururu', quantidade: 2, status: 'Entregue' },
        { nome: 'Baião de Dois',   quantidade: 1, status: 'Pronto' },
        { nome: 'Sucos Naturais',  quantidade: 1, status: 'Entregue' },
      ]
    },
    {
      numero: 2038, dataHora: new Date('2026-03-05T18:00'), qtdItens: 2,
      statusPreparo: 'Finalizado', statusComanda: 'Fechada', valorTotal: 58.90,
      itens: [
        { nome: 'Bobó de Camarão', quantidade: 1, status: 'Entregue' },
        { nome: 'Água com Gás',    quantidade: 2, status: 'Entregue' },
      ]
    },
  ];

  // Signal de pedidos (reais do Firestore + mockados)
  pedidos = computed<Pedido[]>(() => {
    const reais = this.pedidoSvc.pedidos().map(p => this.converterPedido(p));
    return [...reais, ...this.pedidosMock];
  });

  // Sincroniza pedidos reais do PedidoService — mantido por compatibilidade mas não faz nada agora
  private sincronizarPedidos(): void {}

  // KPIs
  totalSemana = computed(() => 446 + this._extra() + this.pedidoSvc.pedidos().length);
  emPreparo   = computed(() => this.pedidos().filter(p => p.statusPreparo === 'Em preparo').length);
  finalizados = computed(() => this.pedidos().filter(p => p.statusPreparo === 'Finalizado').length);
  cancelados  = computed(() => this.pedidos().filter(p => p.statusPreparo === 'Cancelado').length);

  diasSemana    = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'];
  pedidosPorDia = [45, 37, 52, 63, 74, 95, 80];

  ngOnInit(): void {
    // Pequena oscilação aleatória no KPI para simular movimento (apenas visual)
    interval(8000).pipe(takeUntilDestroyed(this.destroyRef)).subscribe(() => {
      this._extra.update(v => v + Math.floor(Math.random() * 2));
    });
  }

  ngAfterViewInit(): void {
    this.waitChart().then(() => this.initChart());
  }

  private waitChart(): Promise<void> {
    return new Promise(resolve => {
      if (typeof Chart !== 'undefined') { resolve(); return; }
      const t = setInterval(() => { if (typeof Chart !== 'undefined') { clearInterval(t); resolve(); } }, 100);
    });
  }

  private initChart(): void {
    const accent = '#F29F05';
    const grid   = 'rgba(255,255,255,0.06)';
    const tick   = 'rgba(255,255,255,0.45)';
    const card   = '#3A3550';
    const poppinsItalic = { family: "'Poppins', sans-serif", style: 'italic' as const, weight: '200' as const };

    this.chart = new Chart(this.chartDiaRef.nativeElement, {
      type: 'bar',
      data: {
        labels: this.diasSemana,
        datasets: [{
          data: [...this.pedidosPorDia],
          backgroundColor: accent,
          hoverBackgroundColor: 'rgba(242,159,5,0.5)',
          borderRadius: 5,
          borderSkipped: false,
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: { mode: 'index', intersect: false },
        plugins: {
          legend: { display: false },
          tooltip: {
            backgroundColor: card,
            borderColor: accent,
            borderWidth: 1.5,
            cornerRadius: 8,
            padding: 12,
            titleColor: 'rgba(255,255,255,0.7)',
            bodyColor: accent,
            displayColors: false,
            titleFont: { ...poppinsItalic, size: 12 },
            bodyFont:  { ...poppinsItalic, size: 14 },
            callbacks: {
              title: (i: any[]) => i[0]?.label ?? '',
              label: (i: any)   => `pedidos : ${i.raw}`
            }
          }
        },
        scales: {
          x: { grid: { color: grid }, ticks: { color: tick, font: { ...poppinsItalic, size: 11 } } },
          y: { grid: { color: grid }, ticks: { color: tick, font: { ...poppinsItalic, size: 11 } } }
        }
      }
    });
  }

  // Helpers
  getPrimeiroNome(): string {
    const u = this.authService.getCurrentUser();
    return u?.nomeCompleto?.split(' ')[0] || u?.matricula || '';
  }

  formatDataHora(d: Date): string {
    return d.toLocaleDateString('pt-BR') + ' ' +
           d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  }

  formatValor(v: number): string {
    return v.toLocaleString('pt-BR', { minimumFractionDigits: 2 });
  }

  togglePedido(num: number | string): void {
    this.pedidoAberto.set(this.pedidoAberto() === num ? null : num);
  }

  getPreparoClass(s: StatusPreparo): string {
    const m: Record<StatusPreparo, string> = {
      'Aguardando preparo': 'badge--aguardando',
      'Em preparo':         'badge--preparo',
      'Pronto':             'badge--pronto',
      'Finalizado':         'badge--finalizado',
      'Cancelado':          'badge--cancelado',
    };
    return m[s] ?? '';
  }

  getComandaClass(s: StatusComanda): string {
    return s === 'Aberta' ? 'badge--aberta' : 'badge--fechada';
  }

  getItemClass(s: string): string {
    const m: Record<string, string> = {
      'Aguardando': 'item-badge--aguardando',
      'Em preparo': 'item-badge--preparo',
      'Pronto':     'item-badge--pronto',
      'Entregue':   'item-badge--entregue',
    };
    return m[s] ?? '';
  }

  ngOnDestroy(): void { this.chart?.destroy(); }
}
