import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../../environments/environment';
import { clearToken, setToken } from './auth-token';

export interface LoginBackendResponse {
  token: string;
  id: number;
  nome: string;
  email: string;
  perfil: string;
  telefone: string | null;
  endereco: string | null;
}

@Injectable({ providedIn: 'root' })
export class AdminBackendAuthService {
  constructor(private http: HttpClient) {}

  async login(email: string, senha: string): Promise<void> {
    clearToken();

    const resposta = await firstValueFrom(
      this.http.post<LoginBackendResponse>(
        `${environment.apiUrl}/auth/login`,
        { email, senha }
      )
    );

    if (!resposta.token) {
      throw new Error('O Back-end não retornou um token.');
    }

    if (resposta.perfil.toUpperCase() !== 'ADMIN') {
      throw new Error('Esta conta não possui perfil de administrador.');
    }

    setToken(resposta.token);
  }

  async loginFuncionario(email: string, senha: string): Promise<LoginBackendResponse> {
  const resposta = await firstValueFrom(
    this.http.post<LoginBackendResponse>(
      `${environment.apiUrl}/auth/login`,
      { email, senha }
    )
  );

  if (!resposta.token) {
    throw new Error('O Back-end não retornou um token.');
  }

  const perfil = resposta.perfil.toUpperCase();

  if (!['ADMIN', 'GERENTE', 'COZINHEIRO'].includes(perfil)) {
    throw new Error('Esta conta não possui permissão para acessar o painel de funcionários.');
  }

  setToken(resposta.token);

  return resposta;
}

  logout(): void {
    clearToken();
  }
}