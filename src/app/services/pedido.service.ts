import { Injectable, signal, computed } from '@angular/core';
import { loadCollection, saveCollection, nextLocalId } from './local-store.util';

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

const STORAGE_KEY = 'baianar_pedidos';

function gerarNumeroPedido(pedidos: PedidoShared[]): string {
  if (pedidos.length === 0) return '#8750';
  const nums = pedidos
    .map(p => parseInt(p.numero.replace('#', ''), 10))
    .filter(n => !isNaN(n));
  const max = nums.length > 0 ? Math.max(...nums) : 8749;
  return `#${max + 1}`;
}

function ordenarPorDataDesc(pedidos: PedidoShared[]): PedidoShared[] {
  return [...pedidos].sort((a, b) => b.dataHora.localeCompare(a.dataHora));
}

// ─── Serviço ─────────────────────────────────────────────────────────────
//
// Esta tela (jornada do cliente / pedidos) é o principal candidato a ser
// religada à API real do backend Spring Boot (ver `environment.apiUrl` e
// `services/api/`) — ver README. Por ora, mantém o mesmo contrato
// (signals + métodos assíncronos) só trocando Firestore por localStorage,
// para nenhum componente consumidor precisar mudar.

@Injectable({ providedIn: 'root' })
export class PedidoService {

  private _pedidos    = signal<PedidoShared[]>(ordenarPorDataDesc(loadCollection<PedidoShared>(STORAGE_KEY, [])));
  private _carregando = signal(false);

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

    const novo: PedidoShared = {
      ...dados,
      id: nextLocalId('pedido'),
      numero,
      status: 'recebido',
      dataHora,
    };

    const lista = ordenarPorDataDesc([novo, ...this._pedidos()]);
    this._pedidos.set(lista);
    saveCollection(STORAGE_KEY, lista);

    return novo;
  }

  // ── Atualizar status ─────────────────────────────────────────
  async atualizarStatus(
    id: string,
    status: StatusPedido,
    extra?: Partial<PedidoShared>,
  ): Promise<void> {
    const lista = this._pedidos().map(p =>
      p.id === id ? { ...p, ...(extra ?? {}), status } : p
    );
    this._pedidos.set(lista);
    saveCollection(STORAGE_KEY, lista);
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
}
