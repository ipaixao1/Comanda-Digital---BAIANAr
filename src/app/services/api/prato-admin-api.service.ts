import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../../environments/environment';

import {
  PageResponse,
  PratoAdminApi,
  PratoAdminRequest,
  FichaTecnicaApi,
  FichaTecnicaRequest,
  CustoApi
} from './api-types';

/** Serviço de integração dos pratos administrativos com o Spring Boot. */
@Injectable({ providedIn: 'root' })
export class PratoAdminApiService {

  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/admin/pratos`;

  /** RF-010: lista os pratos cadastrados no Back-end. */
async listar(): Promise<PratoAdminApi[]> {
  const pagina = await firstValueFrom(
    this.http.get<PageResponse<PratoAdminApi>>(
      this.base,
      { params: { size: 200 } }
    )
  );

  return pagina.content;
}

/** RF-010: consulta um prato pelo ID. */
async buscarPorId(id: number): Promise<PratoAdminApi> {
  return firstValueFrom(
    this.http.get<PratoAdminApi>(`${this.base}/${id}`)
  );
}

/** RF-010: cadastra um novo prato no Back-end. */
async cadastrar(dados: PratoAdminRequest): Promise<PratoAdminApi> {
  return firstValueFrom(
    this.http.post<PratoAdminApi>(this.base, dados)
  );
}

/** RF-010: atualiza os dados de um prato existente. */
async atualizar(
  id: number,
  dados: PratoAdminRequest
): Promise<PratoAdminApi> {
  return firstValueFrom(
    this.http.put<PratoAdminApi>(`${this.base}/${id}`, dados)
  );
}

/** RF-010: desativa um prato sem apagá-lo do banco de dados. */
async desativar(id: number): Promise<void> {
  await firstValueFrom(
    this.http.delete<void>(`${this.base}/${id}`)
  );
}

/** RF-011: consulta a ficha técnica de um prato. */
async buscarFicha(id: number): Promise<FichaTecnicaApi> {
  return firstValueFrom(
    this.http.get<FichaTecnicaApi>(`${this.base}/${id}/ficha`)
  );
}

/** RF-011 e RF-014: salva a ficha técnica de um prato. */
async salvarFicha(
  id: number,
  dados: FichaTecnicaRequest
): Promise<FichaTecnicaApi> {
  return firstValueFrom(
    this.http.put<FichaTecnicaApi>(
      `${this.base}/${id}/ficha`,
      dados
    )
  );
}

/** RF-012 e RF-013: consulta os custos e o food cost de um prato. */
async buscarCusto(id: number): Promise<CustoApi> {
  return firstValueFrom(
    this.http.get<CustoApi>(`${this.base}/${id}/custo`)
  );
}

/** RF-012: simula a ficha com custos individuais, sem salvar. */
async simularCusto(
  id: number,
  dados: FichaTecnicaRequest
): Promise<FichaTecnicaApi> {
  return firstValueFrom(
    this.http.post<FichaTecnicaApi>(
      `${this.base}/${id}/custo/simular`,
      dados
    )
  );
}

/** RF-012: simula os custos de um prato novo, sem cadastrá-lo. */
async simularCustoNovoPrato(
  precoVenda: number,
  dados: FichaTecnicaRequest
): Promise<FichaTecnicaApi> {
  return firstValueFrom(
    this.http.post<FichaTecnicaApi>(
      `${this.base}/custo/simular`,
      dados,
      {
        params: {
          precoVenda: String(precoVenda)
        }
      }
    )
  );
}
}