import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  CotacaoApi, FornecedorApi, FornecedorPayload,
  FornecedorProdutoApi, FornecedorProdutoPayload, PageResponse
} from './api-types';

/** Fornecedores, catálogo e cotação (RF-021 a RF-023). Exige ADMIN ou GERENTE. */
@Injectable({ providedIn: 'root' })
export class FornecedorApiService {

  private http = inject(HttpClient);
  private base = `${environment.apiUrl}/admin/fornecedores`;

  async listar(): Promise<FornecedorApi[]> {
    const pagina = await firstValueFrom(this.http.get<PageResponse<FornecedorApi>>(
      this.base, { params: { page: 0, size: 200 } }));
    return pagina.content;
  }

  criar(p: FornecedorPayload): Promise<FornecedorApi> {
    return firstValueFrom(this.http.post<FornecedorApi>(this.base, p));
  }

  atualizar(id: number, p: FornecedorPayload): Promise<FornecedorApi> {
    return firstValueFrom(this.http.put<FornecedorApi>(`${this.base}/${id}`, p));
  }

  /** Exclusão lógica (RN06): o fornecedor vira INATIVO e o histórico é preservado. */
  async desativar(id: number): Promise<void> {
    await firstValueFrom(this.http.delete<void>(`${this.base}/${id}`));
  }

  catalogo(id: number): Promise<FornecedorProdutoApi[]> {
    return firstValueFrom(this.http.get<FornecedorProdutoApi[]>(`${this.base}/${id}/catalogo`));
  }

  /** Adiciona o ingrediente ao catálogo ou atualiza o preço se ele já existir. */
  salvarNoCatalogo(id: number, p: FornecedorProdutoPayload): Promise<FornecedorProdutoApi> {
    return firstValueFrom(this.http.post<FornecedorProdutoApi>(`${this.base}/${id}/catalogo`, p));
  }

  cotacao(ingredienteId: number): Promise<CotacaoApi> {
    return firstValueFrom(this.http.get<CotacaoApi>(
      `${environment.apiUrl}/admin/cotacao/${ingredienteId}`));
  }
}
