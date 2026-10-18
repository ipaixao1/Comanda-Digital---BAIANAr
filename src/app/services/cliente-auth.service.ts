import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, firstValueFrom } from 'rxjs';
import { environment } from '../../environments/environment';
import { AuthResponse } from './api/api-types';
import { mensagemDeErro } from './api/api-error';
import { clearToken, EVENTO_SESSAO_EXPIRADA, getToken, setToken } from './api/auth-token';

export interface Cliente {
  id: string;
  nome: string;
  email: string;
  telefone?: string;
  endereco?: string;
}

/**
 * Autenticação do cliente contra o backend Spring Boot (RF-004 cadastro, RF-005 login).
 * O JWT fica no localStorage (api/auth-token.ts) e é anexado às chamadas pelo authInterceptor.
 * A API pública (cadastrar/login/logout/isAuthenticated/getCurrentCliente/currentCliente$) é a mesma de antes.
 */
@Injectable({ providedIn: 'root' })
export class ClienteAuthService {

  private http = inject(HttpClient);
  private readonly STORAGE_KEY = 'baianar_cliente';
  private readonly api = `${environment.apiUrl}/auth`;

  private currentClienteSubject = new BehaviorSubject<Cliente | null>(null);
  public currentCliente$: Observable<Cliente | null> = this.currentClienteSubject.asObservable();

  constructor() {
    // Restaura a sessão só se houver token E dados do cliente salvos.
    try {
      const saved = localStorage.getItem(this.STORAGE_KEY);
      if (saved && getToken()) {
        this.currentClienteSubject.next(JSON.parse(saved));
      }
    } catch {
      // localStorage indisponível: segue deslogado
    }

    // O interceptor dispara este evento quando a API responde 401 (token expirado).
    window.addEventListener(EVENTO_SESSAO_EXPIRADA, () => this.logout());
  }

  async cadastrar(
    nome: string, email: string, senha: string, telefone?: string, endereco?: string,
  ): Promise<{ success: boolean; error?: string }> {
    if (!telefone?.trim()) return { success: false, error: 'Informe seu telefone.' };
    if (!endereco?.trim()) return { success: false, error: 'Informe seu endereço de entrega.' };

    try {
      const resp = await firstValueFrom(this.http.post<AuthResponse>(`${this.api}/register`, {
        nome: nome.trim(),
        email: email.trim().toLowerCase(),
        senha,
        telefone: telefone.trim(),
        endereco: endereco.trim(),
      }));
      this.iniciarSessao(resp);
      return { success: true };
    } catch (err) {
      return { success: false, error: mensagemDeErro(err, 'Erro ao cadastrar.') };
    }
  }

  async login(email: string, senha: string): Promise<{ success: boolean; error?: string }> {
    try {
      const resp = await firstValueFrom(this.http.post<AuthResponse>(`${this.api}/login`, {
        email: email.trim().toLowerCase(),
        senha,
      }));

      if (resp.perfil !== 'CLIENTE') {
        return { success: false, error: 'Esta área é exclusiva para clientes. Use o painel administrativo.' };
      }

      this.iniciarSessao(resp);
      return { success: true };
    } catch (err) {
      // 401 = credenciais inválidas
      const status = (err as { status?: number }).status;
      if (status === 401 || status === 403) {
        return { success: false, error: 'Email ou senha incorretos.' };
      }
      return { success: false, error: mensagemDeErro(err, 'Erro ao fazer login.') };
    }
  }

  logout(): void {
    try {
      localStorage.removeItem(this.STORAGE_KEY);
    } catch {
      // ignora
    }
    clearToken();
    this.currentClienteSubject.next(null);
  }

  isAuthenticated(): boolean { return !!this.currentClienteSubject.value && !!getToken(); }
  getCurrentCliente(): Cliente | null { return this.currentClienteSubject.value; }

  private iniciarSessao(resp: AuthResponse): void {
    const cliente: Cliente = {
      id: String(resp.id),
      nome: resp.nome,
      email: resp.email,
      telefone: resp.telefone ?? undefined,
      endereco: resp.endereco ?? undefined,
    };
    setToken(resp.token);
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(cliente));
    } catch {
      // ignora
    }
    this.currentClienteSubject.next(cliente);
  }
}
