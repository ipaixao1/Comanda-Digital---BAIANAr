import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { BehaviorSubject, Observable } from 'rxjs';

export interface User {
  matricula: string;
  nomeCompleto: string;
  cargo: string;
  role: string;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private currentUserSubject = new BehaviorSubject<User | null>(null);
  public currentUser$: Observable<User | null> = this.currentUserSubject.asObservable();

  // Credenciais temporárias — substituir por Firebase Auth
  private readonly TEMP_CREDENTIALS = [
    {
      matricula: 'ADM001',
      senha: '123456',
      nomeCompleto: 'Eliacira Santos',
      cargo: 'Dono',
      role: 'admin'
    }
  ];

  constructor(private router: Router) {
    const savedUser = sessionStorage.getItem('baianar_user');
    if (savedUser) {
      this.currentUserSubject.next(JSON.parse(savedUser));
    }
  }

  async login(matricula: string, senha: string): Promise<{ success: boolean; error?: string }> {
    try {
      // TODO: Substituir por Firebase Authentication
      const found = this.TEMP_CREDENTIALS.find(
        c => c.matricula === matricula.toUpperCase() && c.senha === senha
      );

      if (found) {
        const user: User = {
          matricula: found.matricula,
          nomeCompleto: found.nomeCompleto,
          cargo: found.cargo,
          role: found.role
        };
        sessionStorage.setItem('baianar_user', JSON.stringify(user));
        this.currentUserSubject.next(user);
        return { success: true };
      } else {
        return { success: false, error: 'Matrícula ou senha incorretos.' };
      }
    } catch (error: any) {
      return { success: false, error: 'Erro ao realizar login. Tente novamente.' };
    }
  }

  logout(): void {
    sessionStorage.removeItem('baianar_user');
    this.currentUserSubject.next(null);
    this.router.navigate(['/login']);
  }

  isAuthenticated(): boolean {
    return this.currentUserSubject.value !== null;
  }

  getCurrentUser(): User | null {
    return this.currentUserSubject.value;
  }
}
