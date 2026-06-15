import { Component, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

export interface ProdutoFavorito {
  id: number;
  nome: string;
  descricao: string;
  preco: number;
  imagem: string | null;
  categoria: string;
}

@Component({
  selector: 'app-favoritos',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './favoritos.component.html',
  styleUrls: ['./favoritos.component.scss'],
})
export class FavoritosComponent {

  favoritos = signal<ProdutoFavorito[]>([
    { id: 3,  nome: 'Mini Acarajés',    descricao: 'Bolinho de feijão-fradinho frito no azeite de dendê',  preco: 24.90, imagem: 'https://images.unsplash.com/photo-1565299507177-b0ac66763828?w=600&q=80', categoria: 'entradas'   },
    { id: 7,  nome: 'Moqueca de Peixe', descricao: 'Peixe fresco ao molho de dendê e leite de coco',      preco: 75.90, imagem: 'https://images.unsplash.com/photo-1604329760661-e71dc83f8f26?w=600&q=80', categoria: 'principais' },
    { id: 8,  nome: 'Bobó de Camarão',  descricao: 'Camarões frescos em creme cremoso de mandioca',        preco: 82.90, imagem: 'https://images.unsplash.com/photo-1599084993891-1b4e9dd5a70a?w=600&q=80', categoria: 'principais' },
  ]);

  quantidades = signal<Record<number, number>>({});

  totalItens = computed(() =>
    Object.values(this.quantidades()).reduce((a, b) => a + b, 0)
  );

  removerFavorito(produto: ProdutoFavorito): void {
    this.favoritos.update(favs => favs.filter(f => f.id !== produto.id));
  }

  adicionarProduto(id: number): void {
    const qtds = { ...this.quantidades() };
    qtds[id] = (qtds[id] ?? 0) + 1;
    this.quantidades.set(qtds);
  }

  removerProduto(id: number): void {
    const qtds = { ...this.quantidades() };
    if ((qtds[id] ?? 0) > 0) {
      qtds[id]--;
      if (qtds[id] === 0) delete qtds[id];
    }
    this.quantidades.set(qtds);
  }

  getQuantidade(id: number): number {
    return this.quantidades()[id] ?? 0;
  }

  formatarPreco(preco: number): string {
    return preco.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  }
}