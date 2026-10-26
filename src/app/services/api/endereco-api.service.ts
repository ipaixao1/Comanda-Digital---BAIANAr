import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../../environments/environment';
import { EnderecoApi, EnderecoPayload } from './api-types';

/** Linha única do endereço, usada no checkout e gravada no pedido (máx. 255 caracteres). */
export function enderecoEmLinha(e: EnderecoApi): string {
  const rua = `${e.rua}, ${e.numero}${e.complemento ? ' - ' + e.complemento : ''}`;
  return `${rua} - ${e.bairro}, ${e.cidade}/${e.estado} - CEP ${e.cep}`.slice(0, 255);
}

/** "Meus Endereços" (GET/POST/PUT/PATCH/DELETE /api/enderecos). Exige cliente logado (JWT). */
@Injectable({ providedIn: 'root' })
export class EnderecoApiService {

  private http = inject(HttpClient);
  private base = `${environment.apiUrl}/enderecos`;

  /** O endereço padrão vem primeiro. */
  listar(): Promise<EnderecoApi[]> {
    return firstValueFrom(this.http.get<EnderecoApi[]>(this.base));
  }

  criar(payload: EnderecoPayload): Promise<EnderecoApi> {
    return firstValueFrom(this.http.post<EnderecoApi>(this.base, payload));
  }

  atualizar(id: number, payload: EnderecoPayload): Promise<EnderecoApi> {
    return firstValueFrom(this.http.put<EnderecoApi>(`${this.base}/${id}`, payload));
  }

  definirPadrao(id: number): Promise<EnderecoApi> {
    return firstValueFrom(this.http.patch<EnderecoApi>(`${this.base}/${id}/padrao`, {}));
  }

  async remover(id: number): Promise<void> {
    await firstValueFrom(this.http.delete<void>(`${this.base}/${id}`));
  }
}
