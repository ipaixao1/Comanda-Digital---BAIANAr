import { Injectable, signal } from '@angular/core';

export interface Motoboy {
  matricula: string;
  nome: string;
  veiculo: string;
}

// Motoboys cadastrados (mockado — substituir por Firestore futuramente)
const MOTOBOYS_CADASTRADOS: (Motoboy & { senha: string })[] = [
  { matricula: 'MB001', nome: 'Carlos Souza',   veiculo: 'Moto Honda CG 160', senha: '1234' },
  { matricula: 'MB002', nome: 'Rafael Lima',    veiculo: 'Moto Yamaha Factor', senha: '1234' },
  { matricula: 'MB003', nome: 'Diego Ferreira', veiculo: 'Moto Biz 125',       senha: '1234' },
];

@Injectable({ providedIn: 'root' })
export class MotoboyAuthService {

  private _motoboy = signal<Motoboy | null>(this.carregarSessao());

  motoboy = this._motoboy.asReadonly();

  isAutenticado(): boolean {
    return this._motoboy() !== null;
  }

  login(matricula: string, senha: string): { success: boolean; error?: string } {
    const encontrado = MOTOBOYS_CADASTRADOS.find(
      m => m.matricula.toUpperCase() === matricula.toUpperCase() && m.senha === senha
    );

    if (!encontrado) {
      return { success: false, error: 'Matrícula ou senha incorretos.' };
    }

    const motoboy: Motoboy = {
      matricula: encontrado.matricula,
      nome: encontrado.nome,
      veiculo: encontrado.veiculo,
    };

    this._motoboy.set(motoboy);
    sessionStorage.setItem('motoboy', JSON.stringify(motoboy));
    return { success: true };
  }

  logout(): void {
    this._motoboy.set(null);
    sessionStorage.removeItem('motoboy');
  }

  private carregarSessao(): Motoboy | null {
    try {
      const salvo = sessionStorage.getItem('motoboy');
      return salvo ? JSON.parse(salvo) : null;
    } catch {
      return null;
    }
  }
}