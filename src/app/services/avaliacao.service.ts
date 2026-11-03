import { Injectable, signal, computed } from '@angular/core';
import { loadCollection, saveCollection, nextLocalId } from './local-store.util';

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

const STORAGE_KEY = 'baianar_avaliacoes';

function ordenarPorDataDesc(lista: AvaliacaoShared[]): AvaliacaoShared[] {
  return [...lista].sort((a, b) => b.dataHora.localeCompare(a.dataHora));
}

@Injectable({ providedIn: 'root' })
export class AvaliacaoService {

  private _avaliacoes = signal<AvaliacaoShared[]>(
    ordenarPorDataDesc(loadCollection<AvaliacaoShared>(STORAGE_KEY, []))
  );
  private _carregando = signal(false);

  readonly avaliacoes = this._avaliacoes.asReadonly();
  readonly carregando = this._carregando.asReadonly();

  readonly mediaGeral = computed(() => {
    const l = this._avaliacoes();
    if (!l.length) return '0.0';
    return (l.reduce((s, a) => s + a.nota, 0) / l.length).toFixed(1);
  });

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
    const nova: AvaliacaoShared = {
      ...dados,
      id: nextLocalId('avaliacao'),
      dataHora: new Date().toISOString(),
    };
    const lista = ordenarPorDataDesc([nova, ...this._avaliacoes()]);
    this._avaliacoes.set(lista);
    saveCollection(STORAGE_KEY, lista);
  }

  // ── Admin responde avaliação ─────────────────────────────────
  async responder(id: string, resposta: string): Promise<void> {
    const lista = this._avaliacoes().map(a =>
      a.id === id ? { ...a, resposta, dataResposta: new Date().toISOString() } : a
    );
    this._avaliacoes.set(lista);
    saveCollection(STORAGE_KEY, lista);
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
}
