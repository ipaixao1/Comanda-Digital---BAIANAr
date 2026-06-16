import { Injectable, signal, computed, inject } from '@angular/core';
import {
  Firestore,
  collection,
  doc,
  addDoc,
  updateDoc,
  onSnapshot,
  query,
  orderBy,
  Unsubscribe,
  Timestamp,
} from '@angular/fire/firestore';

export interface AvaliacaoShared {
  id: string;
  pedidoId: string;
  clienteId: string;
  clienteNome: string;
  numeroPedido: string;
  nota: number;              // 1-5
  comentario: string;
  dataHora: string;          // ISO
  // itens resumidos do pedido (ex: "Moqueca de Peixe, Acarajé")
  pratoResumo: string;
  // resposta do restaurante
  resposta?: string;
  dataResposta?: string;     // ISO
}

function docToAvaliacao(id: string, data: any): AvaliacaoShared {
  const toISO = (v: any) =>
    v instanceof Timestamp ? v.toDate().toISOString() : (typeof v === 'string' ? v : new Date().toISOString());
  return {
    ...data,
    id,
    dataHora:     toISO(data.dataHora),
    dataResposta: data.dataResposta ? toISO(data.dataResposta) : undefined,
  } as AvaliacaoShared;
}

@Injectable({ providedIn: 'root' })
export class AvaliacaoService {

  private firestore = inject(Firestore);
  private colRef    = collection(this.firestore, 'avaliacoes');

  private _avaliacoes   = signal<AvaliacaoShared[]>([]);
  private _carregando   = signal(true);
  private _unsub: Unsubscribe | null = null;

  readonly avaliacoes   = this._avaliacoes.asReadonly();
  readonly carregando   = this._carregando.asReadonly();

  readonly mediaGeral = computed(() => {
    const l = this._avaliacoes();
    if (!l.length) return '0.0';
    return (l.reduce((s, a) => s + a.nota, 0) / l.length).toFixed(1);
  });

  constructor() {
    const q = query(this.colRef, orderBy('dataHora', 'desc'));
    this._unsub = onSnapshot(q, snap => {
      this._avaliacoes.set(snap.docs.map(d => docToAvaliacao(d.id, d.data())));
      this._carregando.set(false);
    }, err => {
      console.error('[AvaliacaoService] onSnapshot erro:', err);
      this._carregando.set(false);
    });
  }

  ngOnDestroy(): void { this._unsub?.(); }

  // ── Cliente envia avaliação ──────────────────────────────────
  async avaliar(dados: {
    pedidoId: string;
    clienteId: string;
    clienteNome: string;
    numeroPedido: string;
    nota: number;
    comentario: string;
    pratoResumo: string;
  }): Promise<void> {
    const payload = this.limpar({
      ...dados,
      dataHora: new Date().toISOString(),
    });
    await addDoc(this.colRef, payload);
  }

  // ── Admin responde avaliação ─────────────────────────────────
  async responder(id: string, resposta: string): Promise<void> {
    const ref = doc(this.firestore, 'avaliacoes', id);
    await updateDoc(ref, {
      resposta,
      dataResposta: new Date().toISOString(),
    });
  }

  // ── Buscar avaliações de um cliente ─────────────────────────
  getAvaliacoesCliente(clienteId: string): AvaliacaoShared[] {
    return this._avaliacoes().filter(a => a.clienteId === clienteId);
  }

  // ── Verifica se pedido já foi avaliado ───────────────────────
  pedidoJaAvaliado(pedidoId: string): boolean {
    return this._avaliacoes().some(a => a.pedidoId === pedidoId);
  }

  // ── Formatar data ────────────────────────────────────────────
  formatarData(iso: string): string {
    if (!iso) return '';
    const d = new Date(iso);
    return d.toLocaleDateString('pt-BR') + ', ' +
           d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  }

  private limpar(obj: any): any {
    return JSON.parse(JSON.stringify(obj, (_, v) => v === undefined ? null : v));
  }
}
