import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../../environments/environment';
import { PageResponse, PedidoApi, StatusPedidoApi } from './api-types';

/** Próximo status permitido pelo backend (PedidoService.PROXIMO_STATUS) e o rótulo do botão. */
export const PROXIMO_STATUS: Partial<Record<StatusPedidoApi, { proximo: StatusPedidoApi; rotulo: string }>> = {
  RECEBIDO:     { proximo: 'CONFIRMADO',   rotulo: 'Confirmar' },
  CONFIRMADO:   { proximo: 'EM_PREPARO',   rotulo: 'Iniciar preparo' },
  EM_PREPARO:   { proximo: 'PRONTO',       rotulo: 'Marcar pronto' },
  PRONTO:       { proximo: 'SAIU_ENTREGA', rotulo: 'Saiu para entrega' },
  SAIU_ENTREGA: { proximo: 'FINALIZADO',   rotulo: 'Finalizar' },
};

export const ROTULO_STATUS_PEDIDO: Record<StatusPedidoApi, string> = {
  RECEBIDO: 'Recebido', CONFIRMADO: 'Confirmado', EM_PREPARO: 'Em preparo', PRONTO: 'Pronto',
  SAIU_ENTREGA: 'Saiu para entrega', FINALIZADO: 'Finalizado', CANCELADO: 'Cancelado',
};

export interface FiltroPedidos {
  status?: StatusPedidoApi | '';
  inicio?: Date;
  fim?: Date;
  page?: number;
  size?: number;
}

/** Pedidos no painel admin e na cozinha (RF-015, RF-016, RF-018, RF-019, RF-020). */
@Injectable({ providedIn: 'root' })
export class PedidoAdminApiService {

  private http = inject(HttpClient);
  private base = `${environment.apiUrl}/admin/pedidos`;

  /** Lista paginada, mais recentes primeiro. Datas vão em UTC, como o backend espera. */
  listar(f: FiltroPedidos = {}): Promise<PageResponse<PedidoApi>> {
    let params = new HttpParams().set('page', f.page ?? 0).set('size', f.size ?? 10);
    if (f.status) params = params.set('status', f.status);
    if (f.inicio) params = params.set('inicio', f.inicio.toISOString().slice(0, 19));
    if (f.fim)    params = params.set('fim', f.fim.toISOString().slice(0, 19));
    return firstValueFrom(this.http.get<PageResponse<PedidoApi>>(this.base, { params }));
  }

  /** Avança o status (CONFIRMADO dá baixa automática no estoque). */
  mudarStatus(id: number, novoStatus: StatusPedidoApi): Promise<PedidoApi> {
    return firstValueFrom(this.http.patch<PedidoApi>(`${this.base}/${id}/status`, { novoStatus }));
  }

  /** Cancela com motivo obrigatório (estorna o estoque se já havia baixa). Só ADMIN e GERENTE. */
  cancelar(id: number, motivo: string): Promise<PedidoApi> {
    return firstValueFrom(this.http.patch<PedidoApi>(`${this.base}/${id}/cancelar`, { motivo }));
  }
}
