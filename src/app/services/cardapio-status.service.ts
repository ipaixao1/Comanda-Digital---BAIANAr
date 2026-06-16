import { Injectable, signal, computed, inject } from '@angular/core';
import {
  Firestore, doc, setDoc, onSnapshot, Unsubscribe,
} from '@angular/fire/firestore';

export interface DishStatus {
  id: string;       // id do prato (ex: 'd1', 'e2', ou o id numérico do admin)
  nome: string;
  indisponivel: boolean;  // true = desabilitado
  origem: 'kds' | 'admin' | 'ambos';
}

const DOC_PATH = 'config/cardapio_status';

@Injectable({ providedIn: 'root' })
export class CardapioStatusService {

  private firestore = inject(Firestore);
  private _status   = signal<Record<string, DishStatus>>({});
  private _unsub: Unsubscribe | null = null;

  readonly status = this._status.asReadonly();

  constructor() {
    const ref = doc(this.firestore, DOC_PATH);
    this._unsub = onSnapshot(ref, snap => {
      if (snap.exists()) {
        this._status.set(snap.data() as Record<string, DishStatus>);
      }
    }, err => console.error('[CardapioStatusService] erro:', err));
  }

  ngOnDestroy(): void { this._unsub?.(); }

  // ── KDS: cozinheiro desabilita/habilita prato ────────────────
  async setDisponibilidadeKds(id: string, nome: string, indisponivel: boolean): Promise<void> {
    const ref   = doc(this.firestore, DOC_PATH);
    const atual = this._status()[id];
    const origem = indisponivel
      ? (atual?.origem === 'admin' ? 'ambos' : 'kds')
      : (atual?.origem === 'ambos' ? 'admin' : 'kds');
    await setDoc(ref, {
      [id]: { id, nome, indisponivel, origem },
    }, { merge: true });
  }

  // ── Admin: alterna disponibilidade pelo cardápio ─────────────
  async setDisponibilidadeAdmin(id: string, nome: string, indisponivel: boolean): Promise<void> {
    const ref   = doc(this.firestore, DOC_PATH);
    const atual = this._status()[id];
    const origem = indisponivel
      ? (atual?.origem === 'kds' ? 'ambos' : 'admin')
      : (atual?.origem === 'ambos' ? 'kds' : 'admin');
    await setDoc(ref, {
      [id]: { id, nome, indisponivel, origem },
    }, { merge: true });
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
