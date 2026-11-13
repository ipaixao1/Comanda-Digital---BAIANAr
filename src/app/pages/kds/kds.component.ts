import { Component, OnInit, OnDestroy, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { PedidoAdminApiService } from '../../services/api/pedido-admin-api.service';
import { EstoqueSaldoApi, PedidoApi, PratoAdminApi, StatusPedidoApi } from '../../services/api/api-types';
import { isoUtc } from '../../services/api/pedido-status.util';
import { mensagemDeErro } from '../../services/api/api-error';
import { CozinhaApiService } from '../../services/api/cozinha-api.service';
import { HttpErrorResponse } from '@angular/common/http';

export type OrderStatus = 'received' | 'preparing' | 'ready' | 'out_for_delivery';

export interface OrderItem {
  id: number;
  name: string;
  quantity: number;
  observation?: string;
  missingIngredient?: boolean;
}

export interface Order {
  id: number | string;
  status: OrderStatus;
  time: string;
  createdAt: Date;
  items: OrderItem[];
  numeroPedido?: string;       // ex: "#4"
  pedidoId?: number;           // id do pedido na API
  apiStatus?: StatusPedidoApi; // status real no backend
}

export type NivelEstoque = 'Normal' | 'Baixo' | 'Crítico';

export interface GrupoPratos {
  id: string;
  name: string;
  dishes: PratoAdminApi[];
}

@Component({
  selector: 'app-kds',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './kds.component.html',
  styleUrls: ['./kds.component.scss']
})
export class KdsComponent implements OnInit, OnDestroy {

  // ─── Relógio ────────────────────────────────────────────────
  currentTime = '';
  currentDate = '';
  private clockInterval: any;
  private timerInterval: any;

  // ─── Dropdown ───────────────────────────────────────────────
  isDropdownOpen = false;
  expandedStockCategories = new Set<string>(['ingredientes']);
  expandedDishCategories  = new Set<string>();

  // ─── Pedidos ────────────────────────────────────────────────
  // Pedidos vindos da API (atualizados a cada 10 s)
  orders = signal<Order[]>([]);
  erroPedidos = '';

  // ─── Estoque e cardápio (API) ────────────────────────────────
  saldo        = signal<EstoqueSaldoApi[]>([]);
  pratos       = signal<PratoAdminApi[]>([]);
  erroPainel   = '';
  salvandoPrato: number | null = null;

  /** Só pratos publicados (ATIVO) ou pausados pela cozinha; pratos INATIVO não aparecem aqui. */
  categoriasPratos = computed<GrupoPratos[]>(() => {
    const grupos = new Map<number, GrupoPratos>();
    for (const p of this.pratos()) {
      if (p.status !== 'ATIVO' && p.status !== 'PAUSADO') continue;
      if (!grupos.has(p.categoriaId)) {
        grupos.set(p.categoriaId, { id: String(p.categoriaId), name: p.categoriaNome, dishes: [] });
      }
      grupos.get(p.categoriaId)!.dishes.push(p);
    }
    return [...grupos.values()];
  });

  private pedidoApi          = inject(PedidoAdminApiService);
  private cozinhaApi         = inject(CozinhaApiService);
  private pedidoTimer: any;
  private painelTimer: any;

  constructor(private router: Router) {}

  ngOnInit(): void {
    this.updateClock();
    this.clockInterval = setInterval(() => this.updateClock(), 1000);
    this.carregarPedidos();
    this.pedidoTimer = setInterval(() => this.carregarPedidos(), 10000);
    this.carregarPainel();
    this.painelTimer = setInterval(() => this.carregarPainel(), 30000);
  }

  ngOnDestroy(): void {
    if (this.clockInterval) clearInterval(this.clockInterval);
    if (this.timerInterval) clearInterval(this.timerInterval);
    if (this.pedidoTimer) clearInterval(this.pedidoTimer);
    if (this.painelTimer) clearInterval(this.painelTimer);
  }

  // ─── Pedidos (API) ───────────────────────────────────────────
  /** Coluna do KDS para cada status do backend. Finalizado e cancelado saem do quadro. */
  private toOrderStatus(s: StatusPedidoApi): OrderStatus | null {
    const map: Partial<Record<StatusPedidoApi, OrderStatus>> = {
      RECEBIDO:     'received',
      CONFIRMADO:   'received',
      EM_PREPARO:   'preparing',
      PRONTO:       'ready',
      SAIU_ENTREGA: 'out_for_delivery',
    };
    return map[s] ?? null;
  }

  private paraOrder(p: PedidoApi): Order | null {
    const status = this.toOrderStatus(p.status);
    if (!status) return null;
    const criado = new Date(isoUtc(p.createdAt));
    return {
      id: p.id,
      status,
      apiStatus: p.status,
      time: criado.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
      createdAt: criado,
      numeroPedido: `#${p.id}`,
      pedidoId: p.id,
      items: p.itens.map((i, idx) => ({
        id: idx + 1, name: i.pratoNome, quantity: i.quantidade, observation: i.observacoes ?? undefined,
      })),
    };
  }

  async carregarPedidos(): Promise<void> {
    try {
      const r = await this.pedidoApi.listar({ size: 100 });
      const lista = r.content.map(p => this.paraOrder(p)).filter((o): o is Order => o !== null);
      // Mais antigos primeiro: quem chegou antes é atendido antes.
      lista.sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
      this.orders.set(lista);
      this.erroPedidos = '';
    } catch (err) {
      this.erroPedidos = mensagemDeErro(err, 'Não foi possível carregar os pedidos.');
    }
  }

  /** Próximo status no backend: Recebido→Confirmado (baixa o estoque)→Em preparo→Pronto→Saiu para entrega. */
  private static readonly PROXIMO: Partial<Record<StatusPedidoApi, StatusPedidoApi>> = {
    RECEBIDO: 'CONFIRMADO', CONFIRMADO: 'EM_PREPARO', EM_PREPARO: 'PRONTO', PRONTO: 'SAIU_ENTREGA',
  };

  async advanceOrder(order: Order): Promise<void> {
    const atual = order.apiStatus;
    const proximo = atual ? KdsComponent.PROXIMO[atual] : undefined;
    if (!proximo || order.pedidoId == null) return;
    this.erroPedidos = '';
    try {
      await this.pedidoApi.mudarStatus(order.pedidoId, proximo);
      await this.carregarPedidos();
    } catch (err) {
      this.erroPedidos = mensagemDeErro(err, 'Não foi possível atualizar o pedido.');
    }
  }

  // ─── Relógio ────────────────────────────────────────────────
  private updateClock(): void {
    const now = new Date();
    const h = String(now.getHours()).padStart(2, '0');
    const m = String(now.getMinutes()).padStart(2, '0');
    const s = String(now.getSeconds()).padStart(2, '0');
    this.currentTime = `${h}:${m}:${s}`;
    const days   = ['Domingo','Segunda-Feira','Terça-Feira','Quarta-Feira','Quinta-Feira','Sexta-Feira','Sábado'];
    const months = ['janeiro','fevereiro','março','abril','maio','junho','julho','agosto','setembro','outubro','novembro','dezembro'];
    this.currentDate = `${days[now.getDay()]}, ${now.getDate()} de ${months[now.getMonth()]}`;
  }

  // ─── Navegação ────────────────────────────────────────────────
  goToLogin(): void { this.router.navigate(['/login']); }

  // ─── Estoque / cardápio: dados reais ─────────────────────────
  async carregarPainel(): Promise<void> {
    const [saldo, pratos] = await Promise.allSettled([
      this.cozinhaApi.saldoEstoque(),
      this.cozinhaApi.listarPratos(),
    ]);
    const erros: string[] = [];
    if (saldo.status === 'fulfilled')  this.saldo.set(saldo.value);
    else erros.push(this.textoErro(saldo.reason, 'estoque'));
    if (pratos.status === 'fulfilled') this.pratos.set(pratos.value);
    else erros.push(this.textoErro(pratos.reason, 'cardápio'));
    this.erroPainel = erros.join(' ');
  }

  private textoErro(err: unknown, parte: string): string {
    if (err instanceof HttpErrorResponse && err.status === 403) {
      return `Sem permissão para ver o ${parte}.`;
    }
    return mensagemDeErro(err, `Não foi possível carregar o ${parte}.`);
  }

  /** Pausa ou reativa o prato no backend (ATIVO ↔ PAUSADO). Prato pausado some do cardápio do cliente. */
  async alternarPrato(prato: PratoAdminApi): Promise<void> {
    if (this.salvandoPrato !== null) return;
    this.salvandoPrato = prato.id;
    this.erroPainel = '';
    try {
      const atualizado = await this.cozinhaApi.alterarDisponibilidade(prato.id, prato.status !== 'ATIVO');
      this.pratos.update(lista => lista.map(p => p.id === atualizado.id ? atualizado : p));
    } catch (err) {
      this.erroPainel = mensagemDeErro(err, 'Não foi possível alterar o prato.');
      await this.carregarPainel();
    } finally {
      this.salvandoPrato = null;
    }
  }

  // ─── Dropdown ────────────────────────────────────────────────
  toggleDropdown(): void { this.isDropdownOpen = !this.isDropdownOpen; }

  toggleStockCategory(id: string): void {
    this.expandedStockCategories.has(id)
      ? this.expandedStockCategories.delete(id)
      : this.expandedStockCategories.add(id);
  }

  toggleDishCategory(id: string): void {
    this.expandedDishCategories.has(id)
      ? this.expandedDishCategories.delete(id)
      : this.expandedDishCategories.add(id);
  }

  // ─── Helpers estoque ─────────────────────────────────────────
  nivel(i: EstoqueSaldoApi): NivelEstoque {
    if (i.saldoAtual <= 0) return 'Crítico';
    return i.abaixoDoMinimo ? 'Baixo' : 'Normal';
  }

  /** Ingredientes zerados ou abaixo do mínimo (acende o ponto laranja do botão). */
  get unavailableCount(): number {
    return this.saldo().filter(i => this.nivel(i) !== 'Normal').length;
  }

  /** Mais urgentes primeiro: crítico, baixo, normal; dentro do mesmo nível, ordem alfabética. */
  get saldoOrdenado(): EstoqueSaldoApi[] {
    const peso: Record<NivelEstoque, number> = { 'Crítico': 0, 'Baixo': 1, 'Normal': 2 };
    return [...this.saldo()].sort((a, b) =>
      peso[this.nivel(a)] - peso[this.nivel(b)] || a.nome.localeCompare(b.nome, 'pt-BR'));
  }

  pratosPausados(g: GrupoPratos): number {
    return g.dishes.filter(d => d.status === 'PAUSADO').length;
  }

  // ─── Helpers pedidos ─────────────────────────────────────────
  getOrdersByStatus(status: OrderStatus): Order[] {
    return this.orders().filter(o => o.status === status);
  }

  getStatusColor(status: OrderStatus): string {
    const map: Record<OrderStatus, string> = {
      received:         '#F29F05',
      preparing:        '#F28705',
      ready:            '#D9A05B',
      out_for_delivery: '#734002'
    };
    return map[status];
  }

  getElapsedTime(order: Order): string {
    const diff = Math.floor((Date.now() - order.createdAt.getTime()) / 60000);
    if (diff < 1)   return '< 1 min';
    if (diff === 1) return '1 min';
    return `${diff} min`;
  }

  getButtonLabel(order: Order): string {
    const map: Partial<Record<StatusPedidoApi, string>> = {
      RECEBIDO:   'Confirmar Pedido',
      CONFIRMADO: 'Iniciar Preparo',
      EM_PREPARO: 'Marcar Pronto',
      PRONTO:     'Saiu para Entrega',
    };
    return (order.apiStatus && map[order.apiStatus]) || '';
  }

  columns: { status: OrderStatus; label: string }[] = [
    { status: 'received',         label: 'Recebido'   },
    { status: 'preparing',        label: 'Em Preparo' },
    { status: 'ready',            label: 'Pronto'     },
    { status: 'out_for_delivery', label: 'Enviado'    }
  ];
}