import { Component, signal, computed, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CarrinhoService } from '../../../services/carrinho.service';
import { CardapioApiService, ProdutoCardapio } from '../../../services/api/cardapio-api.service';

export type ProdutoBusca = ProdutoCardapio;

@Component({
  selector: 'app-buscar',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './buscar.component.html',
  styleUrls: ['./buscar.component.scss'],
})
export class BuscarComponent implements OnInit {

  private cardapioApi = inject(CardapioApiService);
  private carrinho    = inject(CarrinhoService);

  termoBusca = signal<string>('');

  // Pratos vindos da API (GET /api/cardapio) — a busca é feita no navegador sobre essa lista.
  produtos = signal<ProdutoBusca[]>([]);

  // O carrinho é o mesmo das outras telas (antes a busca guardava as quantidades só localmente).
  totalItens = computed(() => this.carrinho.totalItens());

  resultados = computed(() => {
    const termo = this.termoBusca().toLowerCase().trim();
    if (!termo) return [];
    return this.produtos().filter(p =>
      p.nome.toLowerCase().includes(termo) ||
      p.descricao.toLowerCase().includes(termo) ||
      p.categoriaNome.toLowerCase().includes(termo)
    );
  });

  async ngOnInit(): Promise<void> {
    try {
      this.produtos.set(await this.cardapioApi.listar());
    } catch {
      this.produtos.set([]);
    }
  }

  onInput(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.termoBusca.set(value);
  }

  limparBusca(): void {
    this.termoBusca.set('');
  }

  adicionarProduto(id: number): void {
    const produto = this.produtos().find(p => p.id === id);
    if (produto) {
      this.carrinho.adicionar({ id: produto.id, nome: produto.nome, preco: produto.preco, imagem: produto.imagem });
    }
  }

  removerProduto(id: number): void {
    this.carrinho.remover(id);
  }

  toggleFavorito(id: number): void {
    this.produtos.update(lista => lista.map(p => p.id === id ? { ...p, favorito: !p.favorito } : p));
  }

  getQuantidade(id: number): number {
    return this.carrinho.getQuantidade(id);
  }

  formatarPreco(preco: number): string {
    return preco.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  }
}
