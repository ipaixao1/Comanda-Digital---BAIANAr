/**
 * Tipos que espelham os DTOs do backend Spring Boot (pacote dto/request e dto/response).
 * Qualquer mudança nos DTOs do backend deve ser refletida aqui.
 */

export interface PageResponse<T> {
  content: T[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
  last: boolean;
}

/** Resposta de POST /api/auth/login e /api/auth/register */
export interface AuthResponse {
  token: string;
  id: number;
  nome: string;
  email: string;
  perfil: 'ADMIN' | 'GERENTE' | 'COZINHEIRO' | 'CLIENTE';
  telefone?: string | null;
  endereco?: string | null;
}

/** RF-001/RF-002: GET /api/cardapio e /api/cardapio/{id} */
export interface PratoPublicoApi {
  id: number;
  nome: string;
  descricao: string | null;
  fotoUrl: string | null;
  precoVenda: number;
  tempoPreparoMin: number | null;
  categoriaId: number;
  categoriaNome: string;
}

export type StatusPedidoApi =
  | 'RECEBIDO'
  | 'CONFIRMADO'
  | 'EM_PREPARO'
  | 'PRONTO'
  | 'SAIU_ENTREGA'
  | 'FINALIZADO'
  | 'CANCELADO';

export interface PedidoItemApi {
  id: number;
  pratoId: number;
  pratoNome: string;
  quantidade: number;
  precoUnitario: number;
  observacoes?: string | null;
}

export interface PedidoApi {
  id: number;
  clienteId: number;
  clienteNome: string;
  status: StatusPedidoApi;
  valorTotal: number;
  enderecoEntrega: string;
  observacoes?: string | null;
  motivoCancelamento?: string | null;
  itens: PedidoItemApi[];
  createdAt: string;
  updatedAt: string;
}

/** RF-006: corpo de POST /api/pedidos */
export interface CriarPedidoPayload {
  itens: { pratoId: number; quantidade: number; observacoes?: string }[];
  enderecoEntrega: string;
  observacoes?: string;
}

/** RF-007: GET /api/pedidos/{id}/status */
export interface PedidoStatusApi {
  id: number;
  status: StatusPedidoApi;
}
