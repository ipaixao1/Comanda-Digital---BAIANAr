import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../../environments/environment';
import { EstoqueSaldoApi, PageResponse, PratoAdminApi } from './api-types';

/**
 * Chamadas usadas pela tela da cozinha (KDS) — perfis ADMIN, GERENTE e COZINHEIRO.
 * - saldo de estoque (somente leitura): GET /api/admin/estoque/saldo
 * - pratos do cardápio: GET /api/admin/pratos
 * - pausar/reativar prato: PATCH /api/admin/pratos/{id}/disponibilidade
 */
@Injectable({ providedIn: 'root' })
export class CozinhaApiService {

  private http = inject(HttpClient);

  saldoEstoque(): Promise<EstoqueSaldoApi[]> {
    return firstValueFrom(this.http.get<EstoqueSaldoApi[]>(`${environment.apiUrl}/admin/estoque/saldo`));
  }

  async listarPratos(): Promise<PratoAdminApi[]> {
    const pagina = await firstValueFrom(this.http.get<PageResponse<PratoAdminApi>>(
      `${environment.apiUrl}/admin/pratos`, { params: { page: 0, size: 200 } }));
    return pagina.content;
  }

  /** `disponivel = false` pausa o prato (some do cardápio do cliente); `true` volta a vendê-lo. */
  alterarDisponibilidade(id: number, disponivel: boolean): Promise<PratoAdminApi> {
    return firstValueFrom(this.http.patch<PratoAdminApi>(
      `${environment.apiUrl}/admin/pratos/${id}/disponibilidade`, { disponivel }));
  }
}
