import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../../environments/environment';
import { DashboardResumoApi, EstoqueSaldoApi, TopPratoApi, VendaPeriodoApi } from './api-types';

/** O backend roda em UTC: manda a data em UTC, sem fuso (AAAA-MM-DDTHH:mm:ss). */
function iso(d: Date): string {
  return d.toISOString().slice(0, 19);
}

/** Dashboard (RF-034 a RF-037). Exige ADMIN ou GERENTE. */
@Injectable({ providedIn: 'root' })
export class DashboardApiService {

  private http = inject(HttpClient);
  private base = `${environment.apiUrl}/admin/dashboard`;

  resumo(): Promise<DashboardResumoApi> {
    return firstValueFrom(this.http.get<DashboardResumoApi>(`${this.base}/resumo`));
  }

  topPratos(inicio: Date, fim: Date, limite = 5): Promise<TopPratoApi[]> {
    return firstValueFrom(this.http.get<TopPratoApi[]>(`${this.base}/top-pratos`,
      { params: { inicio: iso(inicio), fim: iso(fim), limite } }));
  }

  alertasEstoque(): Promise<EstoqueSaldoApi[]> {
    return firstValueFrom(this.http.get<EstoqueSaldoApi[]>(`${this.base}/alertas-estoque`));
  }

  vendasPeriodo(inicio: Date, fim: Date): Promise<VendaPeriodoApi[]> {
    return firstValueFrom(this.http.get<VendaPeriodoApi[]>(`${this.base}/vendas-periodo`,
      { params: { inicio: iso(inicio), fim: iso(fim) } }));
  }
}
