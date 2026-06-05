import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { BehaviorSubject, Observable } from 'rxjs';

export interface User {
  matricula: string;
  nomeCompleto: string;
  cargo: string;
  role: 'admin' | 'cozinha';
  email?: string;
  telefone?: string;
  senha?: string;
  foto?: string;
  status?: string;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private currentUserSubject = new BehaviorSubject<User | null>(null);
  public currentUser$: Observable<User | null> = this.currentUserSubject.asObservable();

  // Lista de admins sincronizada com a tela de Administradores
  private admins = new BehaviorSubject<User[]>([
    { matricula:'ADM001', nomeCompleto:'Eliacira Santos', cargo:'Dono',       role:'admin', email:'santos.eli@baianar.com',   telefone:'11979745714', senha:'123456', status:'Ativo'  },
    { matricula:'ADM002', nomeCompleto:'Isabel Paixão',   cargo:'Gerente',    role:'admin', email:'paixao.bel@baianar.com',   telefone:'11979907856', senha:'12345',  status:'Ativo'  },
    { matricula:'ADM003', nomeCompleto:'Eliza Moreira',   cargo:'Gerente',    role:'admin', email:'moreira.liz@baianar.com',  telefone:'11979896257', senha:'1234',   status:'Ativo'  },
    { matricula:'ADM004', nomeCompleto:'Evellyn Reis',    cargo:'Gerente',    role:'admin', email:'reis.eve@baianar.com',     telefone:'11966714161', senha:'123',    status:'Ativo'  },
    { matricula:'ADM005', nomeCompleto:'Lucas Oliveira',  cargo:'Supervisor', role:'admin', email:'oliveira.luc@baianar.com', telefone:'11987654321', senha:'12',     status:'Ativo'  },
    { matricula:'KDS001', nomeCompleto:'Cozinha',         cargo:'Cozinheiro', role:'cozinha', email:'',                      telefone:'',            senha:'123456', status:'Ativo'  },
  ]);

  public admins$ = this.admins.asObservable();

  constructor(private router: Router) {
    const saved = sessionStorage.getItem('baianar_user');
    if (saved) this.currentUserSubject.next(JSON.parse(saved));
  }

  async login(matricula: string, senha: string): Promise<{ success: boolean; error?: string }> {
    const found = this.admins.value.find(
      a => a.matricula === matricula.toUpperCase() && a.senha === senha
    );
    if (found) {
      const user = { ...found };
      sessionStorage.setItem('baianar_user', JSON.stringify(user));
      this.currentUserSubject.next(user);
      return { success: true };
    }
    return { success: false, error: 'Matrícula ou senha incorretos.' };
  }

  // Atualiza perfil do usuário logado e na lista de admins
  updateProfile(updates: Partial<User>): void {
    const current = this.currentUserSubject.value;
    if (!current) return;
    const updated = { ...current, ...updates };
    sessionStorage.setItem('baianar_user', JSON.stringify(updated));
    this.currentUserSubject.next(updated);
    // Sincroniza na lista de admins
    this.admins.next(
      this.admins.value.map(a => a.matricula === updated.matricula ? { ...a, ...updates } : a)
    );
  }

  // Atualiza um admin específico (usado pela tela de Administradores)
  updateAdmin(matricula: string, updates: Partial<User>): void {
    this.admins.next(
      this.admins.value.map(a => a.matricula === matricula ? { ...a, ...updates } : a)
    );
    // Se for o usuário logado, atualiza a sessão também
    if (this.currentUserSubject.value?.matricula === matricula) {
      const updated = { ...this.currentUserSubject.value, ...updates };
      sessionStorage.setItem('baianar_user', JSON.stringify(updated));
      this.currentUserSubject.next(updated);
    }
  }

  getAdmins(): User[] { return this.admins.value; }

  logout(): void {
    sessionStorage.removeItem('baianar_user');
    this.currentUserSubject.next(null);
    this.router.navigate(['/login']);
  }

  isAuthenticated(): boolean { return !!this.currentUserSubject.value; }
  isAdmin(): boolean    { return this.currentUserSubject.value?.role === 'admin'; }
  isCozinha(): boolean  { return this.currentUserSubject.value?.role === 'cozinha'; }
  getCurrentUser(): User | null { return this.currentUserSubject.value; }
}
