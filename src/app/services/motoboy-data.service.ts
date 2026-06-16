import { Injectable, signal, computed, inject } from '@angular/core';
import {
  Firestore, collection, doc,
  addDoc, updateDoc, deleteDoc,
  onSnapshot, query, orderBy, Unsubscribe,
} from '@angular/fire/firestore';
import { PedidoService } from './pedido.service';

export type StatusMotoboy = 'Disponível' | 'Em entrega' | 'Offline';

export interface MotoboyCadastro {
  firestoreId?: string;
  id: number;
  matricula: string;
  nome: string;
  senha: string;
  veiculo: string;
  telefone: string;
  status: StatusMotoboy;
  fotoUrl?: string;
  dataAdmissao: string;
}

const SEED_MOTOBOYS: Omit<MotoboyCadastro, 'firestoreId'>[] = [
  { id:1, matricula:'MB001', nome:'Carlos Souza',   senha:'1234', veiculo:'Moto Honda CG 160',  telefone:'(71) 99111-2233', status:'Disponível', dataAdmissao:'10/01/2024' },
  { id:2, matricula:'MB002', nome:'Rafael Lima',    senha:'1234', veiculo:'Moto Yamaha Factor', telefone:'(71) 99222-3344', status:'Disponível', dataAdmissao:'15/03/2024' },
  { id:3, matricula:'MB003', nome:'Diego Ferreira', senha:'1234', veiculo:'Moto Biz 125',       telefone:'(71) 99333-4455', status:'Disponível', dataAdmissao:'02/07/2024' },
];

function limpar(obj: any): any {
  return JSON.parse(JSON.stringify(obj, (_, v) => v === undefined ? null : v));
}

@Injectable({ providedIn: 'root' })
export class MotoboyDataService {

  private fs        = inject(Firestore);
  private pedidoSvc = inject(PedidoService);

  private _motoboys = signal<MotoboyCadastro[]>([]);
  private _unsub: Unsubscribe | null = null;

  readonly motoboys = this._motoboys.asReadonly();

  constructor() {
    const col = collection(this.fs, 'motoboys_cadastro');
    const q   = query(col, orderBy('id', 'asc'));
    this._unsub = onSnapshot(q, async snap => {
      if (snap.empty) {
        for (const m of SEED_MOTOBOYS) {
          await addDoc(col, limpar(m)).catch(() => {});
        }
        return;
      }
      this._motoboys.set(snap.docs.map(d => ({ ...d.data(), firestoreId: d.id } as MotoboyCadastro)));
    }, err => console.error('[MotoboyDataService] erro:', err));
  }

  ngOnDestroy(): void { this._unsub?.(); }

  // ── CRUD ─────────────────────────────────────────────────────
  async adicionar(m: Omit<MotoboyCadastro, 'firestoreId' | 'id'>): Promise<void> {
    const col = collection(this.fs, 'motoboys_cadastro');
    const id  = this._motoboys().length > 0 ? Math.max(...this._motoboys().map(x => x.id)) + 1 : 1;
    await addDoc(col, limpar({ ...m, id }));
  }

  async atualizar(firestoreId: string, dados: Partial<MotoboyCadastro>): Promise<void> {
    await updateDoc(doc(this.fs, 'motoboys_cadastro', firestoreId), limpar(dados));
  }

  async excluir(firestoreId: string): Promise<void> {
    await deleteDoc(doc(this.fs, 'motoboys_cadastro', firestoreId));
  }

  // ── Métricas derivadas dos pedidos (Firestore já carregado pelo PedidoService) ──

  // Quantidade de entregas concluídas por motoboy (status entregue)
  totalEntregasPorNome(nome: string): number {
    return this.pedidoSvc.pedidos().filter(
      p => p.motoboyNome === nome && p.status === 'entregue'
    ).length;
  }

  // Entrega em andamento (a_caminho) do motoboy, se houver
  entregaAtualPorNome(nome: string) {
    return this.pedidoSvc.pedidos().find(
      p => p.motoboyNome === nome && p.status === 'a_caminho'
    );
  }

  // Status calculado dinamicamente: se está com entrega em andamento → "Em entrega"
  statusCalculado(m: MotoboyCadastro): StatusMotoboy {
    if (m.status === 'Offline') return 'Offline';
    const emEntrega = this.entregaAtualPorNome(m.nome);
    return emEntrega ? 'Em entrega' : 'Disponível';
  }

  // Total geral de entregas (todos os motoboys)
  totalEntregasGeral = computed(() =>
    this.pedidoSvc.pedidos().filter(p => p.status === 'entregue').length
  );

  // Motoboys atualmente em rota
  motoboysEmRota = computed(() =>
    this.pedidoSvc.pedidos().filter(p => p.status === 'a_caminho').length
  );
}
