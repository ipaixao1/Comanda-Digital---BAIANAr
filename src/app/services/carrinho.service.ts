import { Injectable, signal, computed } from '@angular/core';

export interface ItemCarrinho {
  id: number;            // id do prato no backend (GET /api/cardapio)
  nome: string;
  preco: number;
  imagem: string | null;
  quantidade: number;
  obs?: string;          // RF-003: observação por item (ex.: "sem cebola")
}

/** RF-003: carrinho local (state em service), conforme o fluxo do SRS. */
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

  // O backend calcula o valor do pedido apenas com os pratos (sem taxa de entrega).
  total = computed(() => this.subtotal());

  adicionar(
    produto: { id: number; nome: string; preco: number; imagem: string | null },
    quantidade = 1,
    obs?: string,
  ): void {
    const lista = this.itens().map(i => ({ ...i }));
    const existente = lista.find(i => i.id === produto.id);
    if (existente) {
      existente.quantidade += quantidade;
      if (obs?.trim()) existente.obs = obs.trim();
    } else {
      lista.push({
        id: produto.id, nome: produto.nome, preco: produto.preco, imagem: produto.imagem,
        quantidade, obs: obs?.trim() || undefined,
      });
    }
    this.itens.set(lista);
  }

  remover(id: number): void {
    const lista = this.itens().map(i => ({ ...i }));
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

  setObsItem(id: number, obs: string): void {
    this.itens.set(this.itens().map(i => i.id === id ? { ...i, obs } : i));
  }

  getQuantidade(id: number): number {
    return this.itens().find(i => i.id === id)?.quantidade ?? 0;
  }

  limpar(): void {
    this.itens.set([]);
    this.observacoes.set('');
  }
}
