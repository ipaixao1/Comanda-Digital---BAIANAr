import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  CriarPedidoPayload, PageResponse, PedidoApi, PedidoStatusApi, StatusPedidoApi,
} from './api-types';
import { EstimativaTempo, isoUtc, paraEstimativa } from './pedido-status.util';

/** Pedido já no formato usado pelas telas do cliente. */
export interface PedidoCliente {
  id: string;
  numero: string;                 // "#12"
  status: StatusPedidoApi;
  dataHora: string;               // ISO (UTC)
  itens: { nome: string; quantidade: number; preco: number; obs?: string }[];
  total: number;
  enderecoEntrega: string;
  observacoes?: string;
  motivoCancelamento?: string;
  /** Tempo estimado de preparo + entrega (calculado pelo backend). */
  estimativa: EstimativaTempo;
}

/** Resposta do polling de status (RF-007). */
export interface StatusPedidoCliente {
  status: StatusPedidoApi;
  estimativa: EstimativaTempo;
}

export function paraPedidoCliente(p: PedidoApi): PedidoCliente {
  return {
    id: String(p.id),
    numero: `#${p.id}`,
    status: p.status,
    dataHora: isoUtc(p.createdAt),
    itens: p.itens.map(i => ({
      nome: i.pratoNome,
      quantidade: i.quantidade,
      preco: i.precoUnitario,
      obs: i.observacoes ?? undefined,
    })),
    total: p.valorTotal,
    enderecoEntrega: p.enderecoEntrega,
    observacoes: p.observacoes ?? undefined,
    motivoCancelamento: p.motivoCancelamento ?? undefined,
    estimativa: paraEstimativa(p),
  };
}

/** RF-006 (checkout), RF-007 (acompanhar status) e RF-008 (meus pedidos). Exige cliente logado (JWT). */
@Injectable({ providedIn: 'root' })
export class PedidoApiService {

  private http = inject(HttpClient);
  private base = `${environment.apiUrl}/pedidos`;

  async criar(payload: CriarPedidoPayload): Promise<PedidoCliente> {
    const pedido = await firstValueFrom(this.http.post<PedidoApi>(this.base, payload));
    return paraPedidoCliente(pedido);
  }

  /** Histórico do cliente logado, mais recente primeiro. */
  async meusPedidos(): Promise<PedidoCliente[]> {
    const page = await firstValueFrom(
      this.http.get<PageResponse<PedidoApi>>(`${this.base}/meus`, { params: { size: 100 } })
    );
    return page.content.map(paraPedidoCliente);
  }

  async status(id: string): Promise<StatusPedidoCliente> {
    const r = await firstValueFrom(this.http.get<PedidoStatusApi>(`${this.base}/${id}/status`));
    return { status: r.status, estimativa: paraEstimativa(r) };
  }
}
