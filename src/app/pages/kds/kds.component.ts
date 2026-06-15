import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';

export type OrderStatus = 'received' | 'preparing' | 'ready' | 'out_for_delivery';

export interface OrderItem {
  id: number;
  name: string;
  quantity: number;
  observation?: string;
  missingIngredient?: boolean;
}

export interface Order {
  id: number;
  status: OrderStatus;
  time: string;
  createdAt: Date;
  items: OrderItem[];
}

export interface StockItem {
  id: string;
  name: string;
  status: 'available' | 'em_falta';
}

export interface StockCategory {
  id: string;
  name: string;
  items: StockItem[];
}

export interface Dish {
  id: string;
  name: string;
  manuallyUnavailable: boolean;
  requiredStock: string[];
}

export interface DishCategory {
  id: string;
  name: string;
  dishes: Dish[];
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
  expandedStockCategories = new Set<string>();
  expandedDishCategories  = new Set<string>();

  // ─── Pedidos ────────────────────────────────────────────────
  orders: Order[] = [
    {
      id: 147, status: 'received', time: '14:23',
      createdAt: new Date(Date.now() - 15 * 60000),
      items: [
        { id: 1, name: 'Moqueca de Peixe',  quantity: 2 },
        { id: 2, name: 'Arroz de Polvo',    quantity: 1 },
        { id: 3, name: 'Refrigerante',      quantity: 2 }
      ]
    },
    {
      id: 151, status: 'received', time: '14:32',
      createdAt: new Date(Date.now() - 6 * 60000),
      items: [
        { id: 1, name: 'Mini Abarás',               quantity: 3 },
        { id: 2, name: 'Caldo de Sururu',            quantity: 2 },
        { id: 3, name: 'Caipirinhas e Caipiroskas',  quantity: 2, observation: 'Uma de cada' }
      ]
    },
    {
      id: 153, status: 'received', time: '14:38',
      createdAt: new Date(Date.now() - 3 * 60000),
      items: [
        { id: 1, name: 'Moqueca de Peixe',    quantity: 1 },
        { id: 2, name: 'Porção de Pititinga', quantity: 1 },
        { id: 3, name: 'Refrigerante',        quantity: 2 }
      ]
    },
    {
      id: 148, status: 'preparing', time: '14:25',
      createdAt: new Date(Date.now() - 12 * 60000),
      items: [
        { id: 1, name: 'Mini Acarajés',    quantity: 1, observation: 'Sem pimenta' },
        { id: 2, name: 'Camarão à Baiana', quantity: 2 },
        { id: 3, name: 'Cerveja',          quantity: 3 }
      ]
    },
    {
      id: 149, status: 'preparing', time: '14:28',
      createdAt: new Date(Date.now() - 11 * 60000),
      items: [
        { id: 1, name: 'Casquinhas de Siri', quantity: 1 },
        { id: 2, name: 'Bobó de Camarão',    quantity: 2 },
        { id: 3, name: 'Sucos Naturais',     quantity: 2 }
      ]
    },
    {
      id: 157, status: 'preparing', time: '14:47',
      createdAt: new Date(Date.now() - 4 * 60000),
      items: [
        { id: 1, name: 'Caldo de Sururu', quantity: 2 },
        { id: 2, name: 'Mini Acarajés',   quantity: 2 },
        { id: 3, name: 'Coice de Mula',   quantity: 2 }
      ]
    },
    {
      id: 150, status: 'ready', time: '14:30',
      createdAt: new Date(Date.now() - 5 * 60000),
      items: [
        { id: 1, name: 'Baião de Dois',                     quantity: 2 },
        { id: 2, name: 'Carne do Sol com Purê de Mandioca', quantity: 1 },
        { id: 3, name: 'Água',                              quantity: 2 }
      ]
    },
    {
      id: 156, status: 'ready', time: '14:45',
      createdAt: new Date(Date.now() - 5 * 60000),
      items: [
        { id: 1, name: 'Carne do Sol com Purê de Mandioca', quantity: 1 },
        { id: 2, name: 'Baião de Dois',                     quantity: 1 },
        { id: 3, name: 'Queijadinha',                       quantity: 2 }
      ]
    },
    {
      id: 152, status: 'out_for_delivery', time: '14:35',
      createdAt: new Date(Date.now() - 25 * 60000),
      items: [
        { id: 1, name: 'Arroz de Polvo',         quantity: 1 },
        { id: 2, name: 'Mini Pastel de Camarão', quantity: 1 },
        { id: 3, name: 'Torta de Cocada',        quantity: 1 },
        { id: 4, name: 'Gin Tônica',             quantity: 1 }
      ]
    },
    {
      id: 154, status: 'out_for_delivery', time: '14:40',
      createdAt: new Date(Date.now() - 23 * 60000),
      items: [
        { id: 1, name: 'Camarão à Baiana', quantity: 2 },
        { id: 2, name: 'Pudim de Tapioca', quantity: 2 },
        { id: 3, name: 'Cerveja',          quantity: 2 }
      ]
    },
    {
      id: 155, status: 'out_for_delivery', time: '14:42',
      createdAt: new Date(Date.now() - 21 * 60000),
      items: [
        { id: 1, name: 'Casquinhas de Siri',   quantity: 2 },
        { id: 2, name: 'Bobó de Camarão',      quantity: 1 },
        { id: 3, name: 'Bolinho de Estudante', quantity: 3 },
        { id: 4, name: 'Drinks Tropicais',     quantity: 2 }
      ]
    }
  ];

  // ─── Estoque (toggle simples: available | em_falta) ──────────
  stockCategories: StockCategory[] = [
    {
      id: 'proteinas', name: 'Proteínas e frutos do mar',
      items: [
        { id: 'peixe',        name: 'Peixe branco',          status: 'available' },
        { id: 'camarao',      name: 'Camarão',               status: 'available' },
        { id: 'polvo',        name: 'Polvo',                 status: 'available' },
        { id: 'siri',         name: 'Carne de siri',         status: 'available' },
        { id: 'sururu',       name: 'Sururu',                status: 'available' },
        { id: 'pititinga',    name: 'Manjubinha (pititinga)', status: 'available' },
        { id: 'camaraoseco',  name: 'Camarão seco',          status: 'available' },
        { id: 'carnesol',     name: 'Carne do sol',          status: 'available' }
      ]
    },
    {
      id: 'graos', name: 'Grãos e bases',
      items: [
        { id: 'feijaofradinho', name: 'Feijão fradinho',     status: 'available' },
        { id: 'feijaoverde',    name: 'Feijão verde',        status: 'available' },
        { id: 'arroz',          name: 'Arroz branco',        status: 'available' },
        { id: 'mandioca',       name: 'Mandioca',            status: 'available' },
        { id: 'tapioca',        name: 'Tapioca granulada',   status: 'available' },
        { id: 'farinhaman',     name: 'Farinha de mandioca', status: 'available' },
        { id: 'farinhatrigo',   name: 'Farinha de trigo',    status: 'available' }
      ]
    },
    {
      id: 'laticinios', name: 'Laticínios',
      items: [
        { id: 'leite',     name: 'Leite',            status: 'available' },
        { id: 'leitecond', name: 'Leite condensado', status: 'available' },
        { id: 'queijo',    name: 'Queijo coalho',    status: 'available' }
      ]
    },
    {
      id: 'frutas', name: 'Frutas',
      items: [
        { id: 'limao',    name: 'Limão',    status: 'available' },
        { id: 'laranja',  name: 'Laranja',  status: 'available' },
        { id: 'abacaxi',  name: 'Abacaxi',  status: 'available' },
        { id: 'maracuja', name: 'Maracujá', status: 'available' },
        { id: 'morango',  name: 'Morango',  status: 'available' },
        { id: 'manga',    name: 'Manga',    status: 'available' },
        { id: 'acerola',  name: 'Acerola',  status: 'available' },
        { id: 'caja',     name: 'Cajá',     status: 'available' },
        { id: 'caju',     name: 'Caju',     status: 'available' }
      ]
    },
    {
      id: 'hortalicas', name: 'Hortaliças e temperos',
      items: [
        { id: 'cebola',       name: 'Cebola',            status: 'available' },
        { id: 'alho',         name: 'Alho',              status: 'available' },
        { id: 'tomate',       name: 'Tomate',            status: 'available' },
        { id: 'pimentaoverm', name: 'Pimentão vermelho', status: 'available' },
        { id: 'pimentaoamar', name: 'Pimentão amarelo',  status: 'available' },
        { id: 'pimentaoverd', name: 'Pimentão verde',    status: 'available' },
        { id: 'coentro',      name: 'Coentro',           status: 'available' },
        { id: 'cebolinha',    name: 'Cebolinha',         status: 'available' },
        { id: 'gengibre',     name: 'Gengibre',          status: 'available' }
      ]
    },
    {
      id: 'gerais', name: 'Ingredientes gerais',
      items: [
        { id: 'leitecoco',   name: 'Leite de coco',        status: 'available' },
        { id: 'cocoral',     name: 'Coco ralado',           status: 'available' },
        { id: 'dende',       name: 'Azeite de dendê',       status: 'available' },
        { id: 'azeite',      name: 'Azeite de oliva',       status: 'available' },
        { id: 'sal',         name: 'Sal',                   status: 'available' },
        { id: 'pimenta',     name: 'Pimenta-do-reino',      status: 'available' },
        { id: 'pimentadedo', name: 'Pimenta dedo-de-moça',  status: 'available' },
        { id: 'cominho',     name: 'Cominho',               status: 'available' },
        { id: 'colorau',     name: 'Colorau',               status: 'available' },
        { id: 'canela',      name: 'Canela',                status: 'available' },
        { id: 'acucar',      name: 'Açúcar',                status: 'available' },
        { id: 'oleo',        name: 'Óleo vegetal',          status: 'available' }
      ]
    },
    {
      id: 'bebidas', name: 'Bebidas e insumos',
      items: [
        { id: 'aguamin', name: 'Água mineral',  status: 'available' },
        { id: 'aguagas', name: 'Água com gás',  status: 'available' },
        { id: 'refri',   name: 'Refrigerantes', status: 'available' },
        { id: 'cachaca', name: 'Cachaça',       status: 'available' },
        { id: 'vodka',   name: 'Vodka',         status: 'available' },
        { id: 'gin',     name: 'Gin',           status: 'available' },
        { id: 'cerveja', name: 'Cerveja',       status: 'available' },
        { id: 'gelo',    name: 'Gelo',          status: 'available' },
        { id: 'aguafil', name: 'Água filtrada', status: 'available' }
      ]
    }
  ];

  dishCategories: DishCategory[] = [
    {
      id: 'principais', name: 'Pratos principais',
      dishes: [
        { id: 'd1', name: 'Moqueca de Peixe',                  manuallyUnavailable: false, requiredStock: ['peixe'] },
        { id: 'd2', name: 'Bobó de Camarão',                   manuallyUnavailable: false, requiredStock: ['camarao'] },
        { id: 'd3', name: 'Carne do Sol com Purê de Mandioca', manuallyUnavailable: false, requiredStock: ['carnesol'] },
        { id: 'd4', name: 'Baião de Dois',                     manuallyUnavailable: false, requiredStock: ['feijaofradinho'] },
        { id: 'd5', name: 'Arroz de Polvo',                    manuallyUnavailable: false, requiredStock: ['polvo'] },
        { id: 'd6', name: 'Camarão à Baiana',                  manuallyUnavailable: false, requiredStock: ['camarao', 'dende'] }
      ]
    },
    {
      id: 'entradas', name: 'Entradas',
      dishes: [
        { id: 'e1', name: 'Casquinha de Siri',      manuallyUnavailable: false, requiredStock: ['siri'] },
        { id: 'e2', name: 'Caldo de Sururu',         manuallyUnavailable: false, requiredStock: ['sururu'] },
        { id: 'e3', name: 'Mini Acarajés',           manuallyUnavailable: false, requiredStock: ['feijaofradinho', 'dende'] },
        { id: 'e4', name: 'Mini Abarás',             manuallyUnavailable: false, requiredStock: ['feijaofradinho'] },
        { id: 'e5', name: 'Mini Pastel de Camarão',  manuallyUnavailable: false, requiredStock: ['camarao'] },
        { id: 'e6', name: 'Porção de Pititinga',     manuallyUnavailable: false, requiredStock: ['pititinga'] }
      ]
    },
    {
      id: 'sobremesas', name: 'Sobremesas',
      dishes: [
        { id: 's1', name: 'Torta de Cocada',         manuallyUnavailable: false, requiredStock: ['cocoral'] },
        { id: 's2', name: 'Pudim de Tapioca',        manuallyUnavailable: false, requiredStock: ['tapioca'] },
        { id: 's3', name: 'Bolinho de Estudante',    manuallyUnavailable: false, requiredStock: [] },
        { id: 's4', name: 'Bala Baiana na Travessa', manuallyUnavailable: false, requiredStock: [] },
        { id: 's5', name: 'Queijadinha',             manuallyUnavailable: false, requiredStock: ['queijo'] },
        { id: 's6', name: 'Doce de Leite Talhado',   manuallyUnavailable: false, requiredStock: ['leite'] }
      ]
    },
    {
      id: 'beb', name: 'Bebidas',
      dishes: [
        { id: 'b1', name: 'Água',           manuallyUnavailable: false, requiredStock: ['aguamin'] },
        { id: 'b2', name: 'Água com gás',   manuallyUnavailable: false, requiredStock: ['aguagas'] },
        { id: 'b3', name: 'Refrigerante',   manuallyUnavailable: false, requiredStock: ['refri'] },
        { id: 'b4', name: 'Cerveja',        manuallyUnavailable: false, requiredStock: ['cerveja'] },
        { id: 'b5', name: 'Sucos naturais', manuallyUnavailable: false, requiredStock: [] }
      ]
    },
    {
      id: 'drinks', name: 'Drinks',
      dishes: [
        { id: 'dr1', name: 'Caipirinha',       manuallyUnavailable: false, requiredStock: ['cachaca', 'limao'] },
        { id: 'dr2', name: 'Caipiroska',       manuallyUnavailable: false, requiredStock: ['vodka', 'limao'] },
        { id: 'dr3', name: 'Cravinho',         manuallyUnavailable: false, requiredStock: [] },
        { id: 'dr4', name: 'Coice de Mula',    manuallyUnavailable: false, requiredStock: [] },
        { id: 'dr5', name: 'Drinks Tropicais', manuallyUnavailable: false, requiredStock: [] },
        { id: 'dr6', name: 'Gin Tônica',       manuallyUnavailable: false, requiredStock: ['gin'] }
      ]
    }
  ];

  constructor(private router: Router) {}

  ngOnInit(): void {
    this.updateClock();
    this.clockInterval = setInterval(() => this.updateClock(), 1000);
    this.timerInterval = setInterval(() => {}, 30000);
  }

  ngOnDestroy(): void {
    if (this.clockInterval) clearInterval(this.clockInterval);
    if (this.timerInterval) clearInterval(this.timerInterval);
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

  // ─── Toggle simples do item de estoque (disponível ↔ em falta)
  toggleStockItem(categoryId: string, itemId: string): void {
    const cat  = this.stockCategories.find(c => c.id === categoryId);
    const item = cat?.items.find(i => i.id === itemId);
    if (item) item.status = item.status === 'available' ? 'em_falta' : 'available';
  }

  // ─── Toggle manual do prato ──────────────────────────────────
  toggleDish(categoryId: string, dishId: string): void {
    const cat  = this.dishCategories.find(c => c.id === categoryId);
    const dish = cat?.dishes.find(d => d.id === dishId);
    if (dish) dish.manuallyUnavailable = !dish.manuallyUnavailable;
  }

  // ─── Helpers estoque ─────────────────────────────────────────
  get unavailableCount(): number {
    return this.stockCategories.flatMap(c => c.items).filter(i => i.status === 'em_falta').length;
  }

  getStockItemById(id: string): StockItem | undefined {
    return this.stockCategories.flatMap(c => c.items).find(i => i.id === id);
  }

  getDishStatus(dish: Dish): 'available' | 'warning' | 'unavailable' {
    if (dish.manuallyUnavailable) return 'unavailable';
    const hasWarning = dish.requiredStock.some(sid => {
      const item = this.getStockItemById(sid);
      return item && item.status === 'em_falta';
    });
    return hasWarning ? 'warning' : 'available';
  }

  categoryHasWarnings(cat: DishCategory): boolean {
    return cat.dishes.some(d => this.getDishStatus(d) === 'warning');
  }

  stockCategoryUnavailableCount(cat: StockCategory): number {
    return cat.items.filter(i => i.status === 'em_falta').length;
  }

  dishCategoryUnavailableCount(cat: DishCategory): number {
    return cat.dishes.filter(d => this.getDishStatus(d) === 'unavailable').length;
  }

  // ─── Helpers pedidos ─────────────────────────────────────────
  getOrdersByStatus(status: OrderStatus): Order[] {
    return this.orders.filter(o => o.status === status);
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

  getButtonLabel(status: OrderStatus): string {
    const map: Record<OrderStatus, string> = {
      received:         'Iniciar Preparo',
      preparing:        'Marcar Pronto',
      ready:            'Saiu para Entrega',
      out_for_delivery: ''
    };
    return map[status];
  }

  advanceOrder(order: Order): void {
    const map: Partial<Record<OrderStatus, OrderStatus>> = {
      received:  'preparing',
      preparing: 'ready',
      ready:     'out_for_delivery'
    };
    const next = map[order.status];
    if (next) order.status = next;
  }

  columns: { status: OrderStatus; label: string }[] = [
    { status: 'received',         label: 'Recebido'   },
    { status: 'preparing',        label: 'Em Preparo' },
    { status: 'ready',            label: 'Pronto'     },
    { status: 'out_for_delivery', label: 'Enviado'    }
  ];
}