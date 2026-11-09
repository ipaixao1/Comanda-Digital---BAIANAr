import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../../environments/environment';
import { PageResponse, UsuarioApi, UsuarioPayload } from './api-types';

/** Usuários internos — ADMIN, GERENTE e COZINHEIRO (RF-041). Somente o perfil ADMIN acessa. */
@Injectable({ providedIn: 'root' })
export class UsuarioAdminApiService {

  private http = inject(HttpClient);
  private base = `${environment.apiUrl}/admin/usuarios`;

  async listar(): Promise<UsuarioApi[]> {
    const pagina = await firstValueFrom(this.http.get<PageResponse<UsuarioApi>>(
      this.base, { params: { page: 0, size: 200 } }));
    return pagina.content;
  }

  criar(p: UsuarioPayload): Promise<UsuarioApi> {
    return firstValueFrom(this.http.post<UsuarioApi>(this.base, p));
  }

  atualizar(id: number, p: UsuarioPayload): Promise<UsuarioApi> {
    return firstValueFrom(this.http.put<UsuarioApi>(`${this.base}/${id}`, p));
  }

  /** Exclusão lógica (RN06): o usuário vira INATIVO e deixa de conseguir entrar. */
  async desativar(id: number): Promise<void> {
    await firstValueFrom(this.http.delete<void>(`${this.base}/${id}`));
  }
}
