import { Injectable, signal, computed } from '@angular/core';
import { loadRecord, saveRecord } from './local-store.util';

export type StatusIngrediente = 'available' | 'em_falta';
export type StatusEstoqueAdmin = 'Normal' | 'Baixo' | 'Crítico';

export interface EstoqueItemFirestore {
  id: string;               // mesmo id do KDS (ex: 'peixe', 'camarao')
  statusKds: StatusIngrediente;    // cozinheiro controla no KDS
  statusAdmin: StatusEstoqueAdmin; // admin controla na página de estoque
}

const STORAGE_KEY = 'baianar_estoque_config';

@Injectable({ providedIn: 'root' })
export class EstoqueService {

  private _itens = signal<Record<string, EstoqueItemFirestore>>(
    loadRecord<Record<string, EstoqueItemFirestore>>(STORAGE_KEY, {})
  );

  readonly itens = this._itens.asReadonly();

  // ── KDS: cozinheiro alterna disponível ↔ em falta ────────────
  async toggleStatusKds(id: string, nome: string, novoStatus: StatusIngrediente): Promise<void> {
    const atual = this._itens()[id] ?? { id, nome, statusKds: 'available', statusAdmin: 'Normal' };
    const novo  = { ...this._itens(), [id]: { ...atual, id, statusKds: novoStatus } };
    this._itens.set(novo);
    saveRecord(STORAGE_KEY, novo);
  }

  // ── Admin: atualiza nível (Normal/Baixo/Crítico) ─────────────
  async setStatusAdmin(id: string, nome: string, statusAdmin: StatusEstoqueAdmin): Promise<void> {
    const atual = this._itens()[id] ?? { id, nome, statusKds: 'available', statusAdmin: 'Normal' };
    const novo  = { ...this._itens(), [id]: { ...atual, id, statusAdmin } };
    this._itens.set(novo);
    saveRecord(STORAGE_KEY, novo);
  }

  // ── Getters reativos ─────────────────────────────────────────
  getStatusKds(id: string): StatusIngrediente {
    return this._itens()[id]?.statusKds ?? 'available';
  }

  getStatusAdmin(id: string): StatusEstoqueAdmin {
    return this._itens()[id]?.statusAdmin ?? 'Normal';
  }

  // Todos os ingredientes em falta (para admin/estoque)
  emFalta = computed(() =>
    Object.values(this._itens()).filter(i => i.statusKds === 'em_falta')
  );
}
