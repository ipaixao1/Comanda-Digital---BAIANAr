import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

export interface Cliente {
  id: string;
  nome: string;
  email: string;
  telefone?: string;
  senha: string;
}

@Injectable({ providedIn: 'root' })
export class ClienteAuthService {

  private readonly STORAGE_KEY = 'baianar_cliente';
  private readonly CLIENTES_KEY = 'baianar_clientes';

  private currentClienteSubject = new BehaviorSubject<Cliente | null>(null);
  public currentCliente$: Observable<Cliente | null> = this.currentClienteSubject.asObservable();

  constructor() {
    const saved = localStorage.getItem(this.STORAGE_KEY);
    if (saved) this.currentClienteSubject.next(JSON.parse(saved));
  }

  private getClientes(): Cliente[] {
    const saved = localStorage.getItem(this.CLIENTES_KEY);
    return saved ? JSON.parse(saved) : [];
  }

  private saveClientes(clientes: Cliente[]): void {
    localStorage.setItem(this.CLIENTES_KEY, JSON.stringify(clientes));
  }

  async cadastrar(nome: string, email: string, senha: string, telefone?: string): Promise<{ success: boolean; error?: string }> {
    const clientes = this.getClientes();
    const existe = clientes.find(c => c.email.toLowerCase() === email.toLowerCase());
    if (existe) {
      return { success: false, error: 'Este email já está cadastrado.' };
    }

    const novo: Cliente = {
      id: Date.now().toString(),
      nome,
      email: email.toLowerCase(),
      senha,
      telefone,
    };

    clientes.push(novo);
    this.saveClientes(clientes);

    // Loga automaticamente após cadastro
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(novo));
    this.currentClienteSubject.next(novo);

    return { success: true };
  }

  async login(email: string, senha: string): Promise<{ success: boolean; error?: string }> {
    const clientes = this.getClientes();
    const found = clientes.find(
      c => c.email.toLowerCase() === email.toLowerCase() && c.senha === senha
    );

    if (found) {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(found));
      this.currentClienteSubject.next(found);
      return { success: true };
    }

    return { success: false, error: 'Email ou senha incorretos.' };
  }

  logout(): void {
    localStorage.removeItem(this.STORAGE_KEY);
    this.currentClienteSubject.next(null);
  }

  isAuthenticated(): boolean { return !!this.currentClienteSubject.value; }
  getCurrentCliente(): Cliente | null { return this.currentClienteSubject.value; }
}