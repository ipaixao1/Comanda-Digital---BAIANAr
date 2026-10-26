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
  /** Estimativa calculada pelo backend (minutos). */
  tempoPreparoMin: number;
  tempoEntregaMin: number;
  tempoTotalMin: number;
  /** createdAt + tempoTotalMin (LocalDateTime UTC sem sufixo). */
  previsaoEntregaEm: string | null;
}

/** GET /api/cardapio/estimativa-entrega: faixa de entrega da loja (ex.: 20–30 min). */
export interface FaixaEntregaApi {
  minimoMin: number;
  maximoMin: number;
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
  createdAt: string;
  tempoPreparoMin: number;
  tempoEntregaMin: number;
  tempoTotalMin: number;
  previsaoEntregaEm: string | null;
}

/** RF-009: dados de uma categoria retornados pelo Back-end. */
export interface CategoriaApi {
  id: number;
  nome: string;
  descricao?: string | null;
  ordem: number;
  status: string;
}

/** RF-010: dados de um prato retornados pelo Back-end. */
export interface PratoAdminApi {
  id: number;
  categoriaId: number;
  categoriaNome: string;
  nome: string;
  descricao: string | null;
  fotoUrl: string | null;
  precoVenda: number;
  tempoPreparoMin: number | null;
  status: string;
  temFichaTecnica: boolean;
}

/** RF-011: ingrediente utilizado na ficha técnica de um prato. */
export interface FichaTecnicaItemApi {
  id: number;
  ingredienteId: number;
  ingredienteNome: string;
  quantidade: number;
  unidade: string;
  fatorCorrecao: number;
  custoUnitario: number;
  custoItem: number;
}

/** RF-012 e RF-013: custos e food cost calculados pelo Back-end. */
export interface CustoApi {
  custoTotal: number;
  custoPorPorcao: number;
  foodCostPercent: number;
  cor: 'VERDE' | 'AMARELO' | 'VERMELHO';
  alertaFoodCostAlto: boolean;
}

/** RF-011 e RF-014: ficha técnica completa de um prato. */
export interface FichaTecnicaApi {
  id: number;
  pratoId: number;
  rendimento: number;
  modoPreparo: string;
  itens: FichaTecnicaItemApi[];
  custo: CustoApi;
}

/** RF-010: dados enviados para cadastrar ou editar um prato. */
export interface PratoAdminRequest {
  categoriaId: number;
  nome: string;
  descricao: string;
  fotoUrl: string;
  precoVenda: number;
  tempoPreparoMin: number;
  status: string;
}

/** RF-011: dados de um ingrediente enviados na ficha técnica. */
export interface FichaTecnicaItemRequest {
  ingredienteId: number;
  quantidade: number;
  unidade: string;
  fatorCorrecao: number;
}

/** RF-011 e RF-014: dados enviados para salvar a ficha técnica. */
export interface FichaTecnicaRequest {
  rendimento: number;
  modoPreparo: string;
  itens: FichaTecnicaItemRequest[];
}

/** Ingrediente retornado pelo Back-end para a ficha técnica. */
export interface IngredienteApi {
  id: number;
  nome: string;
  sku: string;
  unidadePadrao: string;
  estoqueMinimo: number;
  custoUnitario: number;
  status: string;
  saldoAtual: number;
}

/** GET/POST/PUT /api/enderecos — endereços de entrega do cliente logado. */
export interface EnderecoApi {
  id: number;
  nome: string;
  cep: string;
  rua: string;
  numero: string;
  complemento: string | null;
  bairro: string;
  cidade: string;
  estado: string;
  padrao: boolean;
}

export interface EnderecoPayload {
  nome: string;
  cep: string;
  rua: string;
  numero: string;
  complemento?: string;
  bairro: string;
  cidade: string;
  estado: string;
  padrao?: boolean;
}
