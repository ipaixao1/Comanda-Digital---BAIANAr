import { Injectable, signal, computed, inject } from '@angular/core';
import { loadCollection, saveCollection, nextLocalId } from './local-store.util';
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

const SEED_MOTOBOYS: MotoboyCadastro[] = [
  { firestoreId: 'seed_1', id:1, matricula:'MB001', nome:'Carlos Souza',   senha:'1234', veiculo:'Moto Honda CG 160',  telefone:'(71) 99111-2233', status:'Disponível', dataAdmissao:'10/01/2024' },
  { firestoreId: 'seed_2', id:2, matricula:'MB002', nome:'Rafael Lima',    senha:'1234', veiculo:'Moto Yamaha Factor', telefone:'(71) 99222-3344', status:'Disponível', dataAdmissao:'15/03/2024' },
  { firestoreId: 'seed_3', id:3, matricula:'MB003', nome:'Diego Ferreira', senha:'1234', veiculo:'Moto Biz 125',       telefone:'(71) 99333-4455', status:'Disponível', dataAdmissao:'02/07/2024' },
];

const STORAGE_KEY = 'baianar_motoboys_cadastro';

@Injectable({ providedIn: 'root' })
export class MotoboyDataService {

  private pedidoSvc = inject(PedidoService);

  private _motoboys = signal<MotoboyCadastro[]>(
    loadCollection<MotoboyCadastro>(STORAGE_KEY, SEED_MOTOBOYS)
  );

  readonly motoboys = this._motoboys.asReadonly();

  // ── CRUD ─────────────────────────────────────────────────────
  async adicionar(m: Omit<MotoboyCadastro, 'firestoreId' | 'id'>): Promise<void> {
    const id = this._motoboys().length > 0 ? Math.max(...this._motoboys().map(x => x.id)) + 1 : 1;
    const novo: MotoboyCadastro = { ...m, id, firestoreId: nextLocalId('motoboy') };
    const lista = [...this._motoboys(), novo];
    this._motoboys.set(lista);
    saveCollection(STORAGE_KEY, lista);
  }

  async atualizar(firestoreId: string, dados: Partial<MotoboyCadastro>): Promise<void> {
    const lista = this._motoboys().map(m =>
      m.firestoreId === firestoreId ? { ...m, ...dados } : m
    );
    this._motoboys.set(lista);
    saveCollection(STORAGE_KEY, lista);
  }

  async excluir(firestoreId: string): Promise<void> {
    const lista = this._motoboys().filter(m => m.firestoreId !== firestoreId);
    this._motoboys.set(lista);
    saveCollection(STORAGE_KEY, lista);
  }

  // ── Métricas derivadas dos pedidos (agora vindas do PedidoService em localStorage) ──

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
