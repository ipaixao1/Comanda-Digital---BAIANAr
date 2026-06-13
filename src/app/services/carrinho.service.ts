import { Injectable, signal, computed } from '@angular/core';

export interface ItemCarrinho {
  id: number;
  nome: string;
  preco: number;
  imagem: string | null;
  quantidade: number;
}

@Injectable({ providedIn: 'root' })
export class CarrinhoService {

  itens = signal<ItemCarrinho[]>([]);
  observacoes = signal<string>('');

  totalItens = computed(() =>
    this.itens().reduce((soma, item) => soma + item.quantidade, 0)
  );

  subtotal = computed(() =>
    this.itens().reduce((soma, item) => soma + item.preco * item.quantidade, 0)
  );

  taxaEntrega = 5.00;

  total = computed(() => this.subtotal() + (this.itens().length > 0 ? this.taxaEntrega : 0));

  adicionar(produto: { id: number; nome: string; preco: number; imagem: string | null }): void {
    const lista = [...this.itens()];
    const existente = lista.find(i => i.id === produto.id);
    if (existente) {
      existente.quantidade++;
    } else {
      lista.push({ ...produto, quantidade: 1 });
    }
    this.itens.set(lista);
  }

  remover(id: number): void {
    const lista = [...this.itens()];
    const item = lista.find(i => i.id === id);
    if (item) {
      item.quantidade--;
      if (item.quantidade <= 0) {
        this.itens.set(lista.filter(i => i.id !== id));
      } else {
        this.itens.set(lista);
      }
    }
  }

  removerTudo(id: number): void {
    this.itens.set(this.itens().filter(i => i.id !== id));
  }

  getQuantidade(id: number): number {
    return this.itens().find(i => i.id === id)?.quantidade ?? 0;
  }

  limpar(): void {
    this.itens.set([]);
    this.observacoes.set('');
  }
}