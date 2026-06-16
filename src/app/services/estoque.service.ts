import { Injectable, signal, computed, inject } from '@angular/core';
import {
  Firestore, doc, setDoc, onSnapshot, Unsubscribe, getDoc,
} from '@angular/fire/firestore';

export type StatusIngrediente = 'available' | 'em_falta';
export type StatusEstoqueAdmin = 'Normal' | 'Baixo' | 'Crítico';

export interface EstoqueItemFirestore {
  id: string;               // mesmo id do KDS (ex: 'peixe', 'camarao')
  statusKds: StatusIngrediente;    // cozinheiro controla no KDS
  statusAdmin: StatusEstoqueAdmin; // admin controla na página de estoque
}

const DOC_PATH = 'config/estoque';

@Injectable({ providedIn: 'root' })
export class EstoqueService {

  private firestore = inject(Firestore);
  private _itens    = signal<Record<string, EstoqueItemFirestore>>({});
  private _unsub: Unsubscribe | null = null;

  readonly itens = this._itens.asReadonly();

  constructor() {
    const ref = doc(this.firestore, DOC_PATH);
    this._unsub = onSnapshot(ref, snap => {
      if (snap.exists()) {
        this._itens.set(snap.data() as Record<string, EstoqueItemFirestore>);
      }
    }, err => console.error('[EstoqueService] erro:', err));
  }

  ngOnDestroy(): void { this._unsub?.(); }

  // ── KDS: cozinheiro alterna disponível ↔ em falta ────────────
  async toggleStatusKds(id: string, nome: string, novoStatus: StatusIngrediente): Promise<void> {
    const ref    = doc(this.firestore, DOC_PATH);
    const atual  = this._itens()[id] ?? { id, nome, statusKds: 'available', statusAdmin: 'Normal' };
    await setDoc(ref, {
      [id]: { ...atual, id, statusKds: novoStatus },
    }, { merge: true });
  }

  // ── Admin: atualiza nível (Normal/Baixo/Crítico) ─────────────
  async setStatusAdmin(id: string, nome: string, statusAdmin: StatusEstoqueAdmin): Promise<void> {
    const ref   = doc(this.firestore, DOC_PATH);
    const atual = this._itens()[id] ?? { id, nome, statusKds: 'available', statusAdmin: 'Normal' };
    await setDoc(ref, {
      [id]: { ...atual, id, statusAdmin },
    }, { merge: true });
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
