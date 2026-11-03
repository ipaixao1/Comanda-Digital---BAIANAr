import { Injectable, signal } from '@angular/core';
import { loadRecord, saveRecord } from './local-store.util';

export interface DishStatus {
  id: string;       // id do prato (ex: 'd1', 'e2', ou o id numérico do admin)
  nome: string;
  indisponivel: boolean;  // true = desabilitado
  origem: 'kds' | 'admin' | 'ambos';
}

const STORAGE_KEY = 'baianar_cardapio_status';

@Injectable({ providedIn: 'root' })
export class CardapioStatusService {

  private _status = signal<Record<string, DishStatus>>(
    loadRecord<Record<string, DishStatus>>(STORAGE_KEY, {})
  );

  readonly status = this._status.asReadonly();

  // ── KDS: cozinheiro desabilita/habilita prato ────────────────
  async setDisponibilidadeKds(id: string, nome: string, indisponivel: boolean): Promise<void> {
    const atual = this._status()[id];
    const origem: DishStatus['origem'] = indisponivel
      ? (atual?.origem === 'admin' ? 'ambos' : 'kds')
      : (atual?.origem === 'ambos' ? 'admin' : 'kds');
    const novo = { ...this._status(), [id]: { id, nome, indisponivel, origem } };
    this._status.set(novo);
    saveRecord(STORAGE_KEY, novo);
  }

  // ── Admin: alterna disponibilidade pelo cardápio ─────────────
  async setDisponibilidadeAdmin(id: string, nome: string, indisponivel: boolean): Promise<void> {
    const atual = this._status()[id];
    const origem: DishStatus['origem'] = indisponivel
      ? (atual?.origem === 'kds' ? 'ambos' : 'admin')
      : (atual?.origem === 'ambos' ? 'kds' : 'admin');
    const novo = { ...this._status(), [id]: { id, nome, indisponivel, origem } };
    this._status.set(novo);
    saveRecord(STORAGE_KEY, novo);
  }

  // ── Getters reativos ─────────────────────────────────────────
  isIndisponivel(id: string): boolean {
    return this._status()[id]?.indisponivel ?? false;
  }

  // Para mobile: busca por nome (pois os ids do admin e KDS podem divergir)
  isIndisPorNome(nome: string): boolean {
    const normalizado = nome.toLowerCase().trim();
    return Object.values(this._status()).some(
      s => s.indisponivel && s.nome.toLowerCase().trim() === normalizado
    );
  }
}
