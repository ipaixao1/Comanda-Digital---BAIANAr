import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../../environments/environment';

import {
  CategoriaApi,
  PageResponse
} from './api-types';

/** RF-009: serviço de integração das categorias com o Spring Boot. */
@Injectable({ providedIn: 'root' })
export class CategoriaAdminApiService {

  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/admin/categorias`;

  /** RF-009: lista as categorias cadastradas no Back-end. */
async listar(): Promise<CategoriaApi[]> {
  const pagina = await firstValueFrom(
    this.http.get<PageResponse<CategoriaApi>>(
      this.base,
      { params: { page: 0, size: 100 } }
    )
  );

  return pagina.content;
}

async cadastrar(dados: {
  nome: string;
  descricao: string;
  ordem: number;
  status: string;
}): Promise<CategoriaApi> {
  return firstValueFrom(
    this.http.post<CategoriaApi>(this.base, dados)
  );
}

async atualizar(id: number, dados: {
  nome: string;
  descricao: string;
  ordem: number;
  status: string;
}): Promise<CategoriaApi> {
  return firstValueFrom(
    this.http.put<CategoriaApi>(`${this.base}/${id}`, dados)
  );
}

async desativar(id: number): Promise<void> {
  await firstValueFrom(
    this.http.delete<void>(`${this.base}/${id}`)
  );
}
}