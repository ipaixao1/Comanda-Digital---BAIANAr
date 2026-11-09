import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../../environments/environment';
import { MovimentacaoApi, PageResponse, PedidoCompraApi, PedidoCompraPayload } from './api-types';

/** Pedidos de compra (RF-024/RF-025) e histórico de preços (RF-026). Exige ADMIN ou GERENTE. */
@Injectable({ providedIn: 'root' })
export class CompraApiService {

  private http = inject(HttpClient);
  private base = `${environment.apiUrl}/admin/compras`;

  async listar(page = 0, size = 20): Promise<PageResponse<PedidoCompraApi>> {
    return firstValueFrom(this.http.get<PageResponse<PedidoCompraApi>>(
      this.base, { params: { page, size } }));
  }

  /** Cria o pedido como RASCUNHO; o preço de cada item vem do catálogo do fornecedor. */
  criar(p: PedidoCompraPayload): Promise<PedidoCompraApi> {
    return firstValueFrom(this.http.post<PedidoCompraApi>(this.base, p));
  }

  /** RASCUNHO → ENVIADO. */
  enviar(id: number): Promise<PedidoCompraApi> {
    return firstValueFrom(this.http.patch<PedidoCompraApi>(`${this.base}/${id}/enviar`, {}));
  }

  async cancelar(id: number): Promise<void> {
    await firstValueFrom(this.http.patch<void>(`${this.base}/${id}/cancelar`, {}));
  }

  /** Recebe o pedido: cria a entrada no estoque e atualiza o custo dos ingredientes. */
  receber(id: number): Promise<PedidoCompraApi> {
    return firstValueFrom(this.http.post<PedidoCompraApi>(`${this.base}/${id}/receber`, {}));
  }

  /** RF-026: compras anteriores do ingrediente, para acompanhar a evolução do preço. */
  historicoPrecos(ingredienteId: number): Promise<MovimentacaoApi[]> {
    return firstValueFrom(this.http.get<MovimentacaoApi[]>(
      `${environment.apiUrl}/admin/estoque/${ingredienteId}/historico-precos`));
  }
}
