import { Injectable, signal, computed, inject, OnDestroy } from '@angular/core';
import {
  Firestore,
  collection,
  doc,
  addDoc,
  updateDoc,
  onSnapshot,
  query,
  orderBy,
  Unsubscribe,
  serverTimestamp,
  Timestamp,
} from '@angular/fire/firestore';

// ─── Tipos compartilhados por todas as telas ──────────────────────────────

export type StatusPedido =
  | 'recebido'
  | 'em_preparo'
  | 'pronto'
  | 'enviado'
  | 'a_caminho'
  | 'entregue'
  | 'cancelado';

export interface ItemPedidoShared {
  nome: string;
  quantidade: number;
  preco: number;
  obs?: string;
}

export interface EnderecoEntrega {
  nome: string;
  rua: string;
  cidade: string;
}

export interface PagamentoPedido {
  nome: string;
  detalhe: string;
}

export interface PedidoShared {
  id: string;
  numero: string;
  status: StatusPedido;
  dataHora: string;         // ISO string
  itens: ItemPedidoShared[];
  subtotal: number;
  taxaEntrega: number;
  total: number;
  observacoesPedido?: string;
  observacoesEntrega?: string;
  endereco?: EnderecoEntrega;
  pagamento?: PagamentoPedido;
  clienteId?: string;
  clienteNome?: string;
  clienteTelefone?: string;
  motoboyNome?: string;
  motoboyVeiculo?: string;
}

// ─── Helpers ─────────────────────────────────────────────────────────────

function gerarNumeroPedido(pedidos: PedidoShared[]): string {
  if (pedidos.length === 0) return '#8750';
  const nums = pedidos
    .map(p => parseInt(p.numero.replace('#', ''), 10))
    .filter(n => !isNaN(n));
  const max = nums.length > 0 ? Math.max(...nums) : 8749;
  return `#${max + 1}`;
}

// Converte documento Firestore → PedidoShared (trata Timestamp)
function docToPedido(id: string, data: any): PedidoShared {
  let dataHora: string;
  if (data.dataHora instanceof Timestamp) {
    dataHora = data.dataHora.toDate().toISOString();
  } else if (typeof data.dataHora === 'string') {
    dataHora = data.dataHora;
  } else {
    dataHora = new Date().toISOString();
  }
  return { ...data, id, dataHora } as PedidoShared;
}

// ─── Serviço ─────────────────────────────────────────────────────────────

@Injectable({ providedIn: 'root' })
export class PedidoService {

  private firestore = inject(Firestore);
  private colRef    = collection(this.firestore, 'pedidos');

  private _pedidos      = signal<PedidoShared[]>([]);
  private _carregando   = signal(true);
  private _unsub: Unsubscribe | null = null;

  readonly pedidos    = this._pedidos.asReadonly();
  readonly carregando = this._carregando.asReadonly();

  // ── Filtros ──────────────────────────────────────────────────
  readonly pedidosParaKds = computed(() =>
    this._pedidos().filter(p =>
      ['recebido', 'em_preparo', 'pronto', 'enviado'].includes(p.status)
    )
  );

  readonly pedidosParaMotoboy = computed(() =>
    this._pedidos().filter(p =>
      ['enviado', 'a_caminho', 'entregue'].includes(p.status)
    )
  );

  constructor() {
    this.iniciarListener();
  }

  // ── Listener em tempo real (onSnapshot) ──────────────────────
  private iniciarListener(): void {
    const q = query(this.colRef, orderBy('dataHora', 'desc'));
    this._unsub = onSnapshot(
      q,
      snapshot => {
        const lista = snapshot.docs.map(d => docToPedido(d.id, d.data()));
        this._pedidos.set(lista);
        this._carregando.set(false);
      },
      err => {
        console.error('[PedidoService] onSnapshot erro:', err);
        this._carregando.set(false);
      }
    );
  }

  // Destrói o listener quando o serviço for destruído
  ngOnDestroy(): void {
    this._unsub?.();
  }

  // ── Criar pedido ─────────────────────────────────────────────
  async criarPedido(dados: {
    itens: ItemPedidoShared[];
    subtotal: number;
    taxaEntrega: number;
    total: number;
    observacoesPedido?: string;
    observacoesEntrega?: string;
    endereco?: EnderecoEntrega;
    pagamento?: PagamentoPedido;
    clienteId?: string;
    clienteNome?: string;
    clienteTelefone?: string;
  }): Promise<PedidoShared> {
    const numero = gerarNumeroPedido(this._pedidos());
    const dataHora = new Date().toISOString();

    // Remove campos undefined — Firestore não aceita undefined
    const payload = this.limparUndefined({
      ...dados,
      numero,
      status: 'recebido' as StatusPedido,
      dataHora,
    });

    const ref  = await addDoc(this.colRef, payload);
    // Retorna imediatamente com o id local (onSnapshot vai sincronizar)
    return { ...payload, id: ref.id } as PedidoShared;
  }

  // ── Atualizar status ─────────────────────────────────────────
  async atualizarStatus(
    id: string,
    status: StatusPedido,
    extra?: Partial<PedidoShared>,
  ): Promise<void> {
    const ref     = doc(this.firestore, 'pedidos', id);
    const updates = this.limparUndefined({ status, ...(extra ?? {}) });
    await updateDoc(ref, updates);
  }

  // ── Consultas locais (signal já tem os dados) ────────────────
  getPedido(id: string): PedidoShared | undefined {
    return this._pedidos().find(p => p.id === id);
  }

  getPedidosCliente(clienteId: string): PedidoShared[] {
    return this._pedidos().filter(p => p.clienteId === clienteId);
  }

  getPedidoAtivoCliente(clienteId: string): PedidoShared | undefined {
    return this._pedidos().find(p =>
      p.clienteId === clienteId &&
      !['entregue', 'cancelado'].includes(p.status)
    );
  }

  // ── Helpers ──────────────────────────────────────────────────
  formatarPreco(preco: number): string {
    return preco.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  }

  labelStatus(status: StatusPedido): string {
    const map: Record<StatusPedido, string> = {
      recebido:   'Recebido',
      em_preparo: 'Em preparo',
      pronto:     'Pronto',
      enviado:    'Enviado',
      a_caminho:  'A caminho',
      entregue:   'Entregue',
      cancelado:  'Cancelado',
    };
    return map[status] ?? status;
  }

  // Remove campos undefined recursivamente (Firestore rejeita undefined)
  private limparUndefined(obj: any): any {
    return JSON.parse(JSON.stringify(obj, (_, v) => v === undefined ? null : v));
  }
}
