import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../../environments/environment';
import { IngredienteApi, PageResponse } from './api-types';

@Injectable({ providedIn: 'root' })
export class IngredienteAdminApiService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/admin/ingredientes`;

  async listar(): Promise<IngredienteApi[]> {
    const pagina = await firstValueFrom(
      this.http.get<PageResponse<IngredienteApi>>(
        this.base,
        { params: { page: 0, size: 200 } }
      )
    );

    return pagina.content;
  }
}