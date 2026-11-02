import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  EstoqueSaldoApi, IngredienteApi, IngredientePayload,
  MovimentacaoApi, MovimentacaoManualPayload, PageResponse
} from './api-types';

/** Estoque real (RF-027 a RF-033): ingredientes, saldo, alertas e movimentações. */
@Injectable({ providedIn: 'root' })
export class EstoqueApiService {

  private http = inject(HttpClient);
  private ingredientes = `${environment.apiUrl}/admin/ingredientes`;
  private estoque      = `${environment.apiUrl}/admin/estoque`;

  /** Quantidade de ingredientes abaixo do mínimo (selo vermelho do menu, RF-032). */
  readonly qtdAlertas = signal(0);

  async listarIngredientes(): Promise<IngredienteApi[]> {
    const pagina = await firstValueFrom(this.http.get<PageResponse<IngredienteApi>>(
      this.ingredientes, { params: { page: 0, size: 200 } }));
    return pagina.content;
  }

  criarIngrediente(p: IngredientePayload): Promise<IngredienteApi> {
    return firstValueFrom(this.http.post<IngredienteApi>(this.ingredientes, p));
  }

  atualizarIngrediente(id: number, p: IngredientePayload): Promise<IngredienteApi> {
    return firstValueFrom(this.http.put<IngredienteApi>(`${this.ingredientes}/${id}`, p));
  }

  /** Exclusão lógica: o ingrediente fica INATIVO e o histórico é preservado. */
  async desativarIngrediente(id: number): Promise<void> {
    await firstValueFrom(this.http.delete<void>(`${this.ingredientes}/${id}`));
  }

  registrarMovimentacao(p: MovimentacaoManualPayload): Promise<MovimentacaoApi> {
    return firstValueFrom(this.http.post<MovimentacaoApi>(`${this.estoque}/movimentacao`, p));
  }

  async listarMovimentacoes(ingredienteId?: number, page = 0, size = 20): Promise<PageResponse<MovimentacaoApi>> {
    const params: Record<string, string | number> = { page, size };
    if (ingredienteId) params['ingredienteId'] = ingredienteId;
    return firstValueFrom(this.http.get<PageResponse<MovimentacaoApi>>(
      `${this.estoque}/movimentacao`, { params }));
  }

  /** Atualiza o selo de alertas; falhas (ex.: sem permissão) são ignoradas. */
  async atualizarAlertas(): Promise<void> {
    try {
      const alertas = await firstValueFrom(this.http.get<EstoqueSaldoApi[]>(`${this.estoque}/alertas`));
      this.qtdAlertas.set(alertas.length);
    } catch {
      this.qtdAlertas.set(0);
    }
  }
}
