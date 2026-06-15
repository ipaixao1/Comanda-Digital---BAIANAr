import { Injectable, signal } from '@angular/core';

export interface ItemEntrega {
  nome: string;
  quantidade: number;
}

export type StatusEntrega = 'pendente' | 'a_caminho' | 'entregue';

export interface Entrega {
  id: string;
  numeroPedido: string;
  cliente: string;
  telefone: string;
  endereco: string;
  complemento: string;
  bairro: string;
  cidade: string;
  itens: ItemEntrega[];
  total: number;
  pagamento: string;
  status: StatusEntrega;
  horario: string;
}

@Injectable({ providedIn: 'root' })
export class EntregasService {

  private _entregas = signal<Entrega[]>([
    {
      id: '1',
      numeroPedido: '#8742',
      cliente: 'Maria Silva',
      telefone: '(71) 99999-1111',
      endereco: 'Rua das Flores, 123',
      complemento: 'Apto 201, interfone 201',
      bairro: 'Centro',
      cidade: 'Salvador - BA',
      itens: [
        { nome: 'Mini Acarajés', quantidade: 2 },
        { nome: 'Caldo de Sururu', quantidade: 1 },
      ],
      total: 78.70,
      pagamento: 'Cartão de Crédito',
      status: 'pendente',
      horario: '19:30',
    },
    {
      id: '2',
      numeroPedido: '#8743',
      cliente: 'João Santos',
      telefone: '(71) 99999-2222',
      endereco: 'Av. Sete de Setembro, 456',
      complemento: 'Casa, portão azul',
      bairro: 'Comércio',
      cidade: 'Salvador - BA',
      itens: [
        { nome: 'Moqueca de Peixe', quantidade: 1 },
        { nome: 'Refrigerante', quantidade: 2 },
      ],
      total: 87.90,
      pagamento: 'Pix',
      status: 'pendente',
      horario: '19:45',
    },
    {
      id: '3',
      numeroPedido: '#8744',
      cliente: 'Ana Oliveira',
      telefone: '(71) 99999-3333',
      endereco: 'Rua do Salete, 78',
      complemento: 'Bloco B, Apto 302',
      bairro: 'Barra',
      cidade: 'Salvador - BA',
      itens: [
        { nome: 'Bobó de Camarão', quantidade: 1 },
        { nome: 'Pudim de Tapioca', quantidade: 2 },
      ],
      total: 116.70,
      pagamento: 'Dinheiro',
      status: 'a_caminho',
      horario: '18:50',
    },
  ]);

  entregas = this._entregas.asReadonly();

  getEntrega(id: string): Entrega | undefined {
    return this._entregas().find(e => e.id === id);
  }

  atualizarStatus(id: string, status: StatusEntrega): void {
    this._entregas.update(lista =>
      lista.map(e => e.id === id ? { ...e, status } : e)
    );
  }

  formatarPreco(preco: number): string {
    return preco.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  }
}