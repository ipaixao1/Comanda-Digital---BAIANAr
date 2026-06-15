import { Component, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';

export interface ProdutoBusca {
  id: number;
  nome: string;
  descricao: string;
  preco: number;
  imagem: string | null;
  categoria: string;
  favorito: boolean;
}

@Component({
  selector: 'app-buscar',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './buscar.component.html',
  styleUrls: ['./buscar.component.scss'],
})
export class BuscarComponent {

  termoBusca = signal<string>('');
  quantidades = signal<Record<number, number>>({});

  totalItens = computed(() =>
    Object.values(this.quantidades()).reduce((a, b) => a + b, 0)
  );

  produtos: ProdutoBusca[] = [
    { id: 1,  nome: 'Casquinhas de Siri',      descricao: 'Casquinhas de siri gratinadas',                         preco: 32.90, imagem: 'https://images.unsplash.com/photo-1565680018093-ebb6b9ab5460?w=600&q=80', categoria: 'entradas',   favorito: false },
    { id: 2,  nome: 'Caldo de Sururu',          descricao: 'Caldo quente de sururu com temperos',                   preco: 28.90, imagem: 'https://images.unsplash.com/photo-1547592180-85f173990554?w=600&q=80', categoria: 'entradas',   favorito: false },
    { id: 3,  nome: 'Mini Acarajés',            descricao: 'Bolinho de feijão-fradinho frito no azeite de dendê',   preco: 24.90, imagem: 'https://images.unsplash.com/photo-1565299507177-b0ac66763828?w=600&q=80', categoria: 'entradas',   favorito: false },
    { id: 4,  nome: 'Mini Abarás',              descricao: 'Abarás cozidos no vapor com vatapá',                    preco: 26.90, imagem: 'https://images.unsplash.com/photo-1512058564366-18510be2db19?w=600&q=80', categoria: 'entradas',   favorito: false },
    { id: 5,  nome: 'Mini Pastel de Camarão',   descricao: 'Pastéis crocantes recheados com camarão temperado',     preco: 22.90, imagem: 'https://images.unsplash.com/photo-1529042410759-befb1204b468?w=600&q=80', categoria: 'entradas',   favorito: false },
    { id: 6,  nome: 'Porção de Pitinga',        descricao: 'Manjubinha frita, crocante e temperada',                preco: 28.90, imagem: 'https://images.unsplash.com/photo-1519984388953-d2406bc725e1?w=600&q=80', categoria: 'entradas',   favorito: false },
    { id: 7,  nome: 'Moqueca de Peixe',         descricao: 'Peixe fresco ao molho de dendê e leite de coco',       preco: 75.90, imagem: 'https://images.unsplash.com/photo-1604329760661-e71dc83f8f26?w=600&q=80', categoria: 'principais', favorito: false },
    { id: 8,  nome: 'Bobó de Camarão',          descricao: 'Camarões frescos em creme cremoso de mandioca',         preco: 82.90, imagem: 'https://images.unsplash.com/photo-1599084993891-1b4e9dd5a70a?w=600&q=80', categoria: 'principais', favorito: false },
    { id: 9,  nome: 'Carne do Sol com Purê',    descricao: 'Carne do sol grelhada com purê rústico de macaxeira',   preco: 68.90, imagem: 'https://images.unsplash.com/photo-1544025162-d76694265947?w=600&q=80', categoria: 'principais', favorito: false },
    { id: 10, nome: 'Baião de Dois',            descricao: 'Arroz com feijão de corda, queijo coalho e carne seca', preco: 58.90, imagem: 'https://images.unsplash.com/photo-1516684732162-798a0062be99?w=600&q=80', categoria: 'principais', favorito: false },
    { id: 11, nome: 'Arroz de Polvo',           descricao: 'Polvo ao molho com arroz negro e azeite de ervas',      preco: 89.90, imagem: 'https://images.unsplash.com/photo-1559847844-5315695dadae?w=600&q=80', categoria: 'principais', favorito: false },
    { id: 12, nome: 'Camarão à Baiana',         descricao: 'Camarão salteado com molho de dendê e pimenta',         preco: 78.90, imagem: 'https://images.unsplash.com/photo-1617622141573-cba8e887e3c3?w=600&q=80', categoria: 'principais', favorito: false },
    { id: 13, nome: 'Torta de Cocada',          descricao: 'Torta cremosa de coco com base crocante',               preco: 18.90, imagem: 'https://images.unsplash.com/photo-1571877227200-a0d98ea607e9?w=600&q=80', categoria: 'sobremesas', favorito: false },
    { id: 14, nome: 'Pudim de Tapioca',         descricao: 'Pudim nordestino de tapioca com calda de caramelo',     preco: 16.90, imagem: 'https://images.unsplash.com/photo-1488477181946-6428a0291777?w=600&q=80', categoria: 'sobremesas', favorito: false },
    { id: 15, nome: 'Bolinho de Estudante',     descricao: 'Bolinho frito de tapioca com coco ralado',              preco: 14.90, imagem: 'https://images.unsplash.com/photo-1528975604071-b4dc52a2d18c?w=600&q=80', categoria: 'sobremesas', favorito: false },
    { id: 16, nome: 'Queijadinha',              descricao: 'Docinho de coco e queijo coalho assado',                preco: 12.90, imagem: 'https://images.unsplash.com/photo-1621303837174-89787a7d4729?w=600&q=80', categoria: 'sobremesas', favorito: false },
    { id: 17, nome: 'Sucos Naturais',           descricao: 'Frutas da estação batidas na hora',                     preco: 12.00, imagem: 'https://images.unsplash.com/photo-1600271886742-f049cd451bba?w=600&q=80', categoria: 'bebidas',    favorito: false },
    { id: 18, nome: 'Cerveja 600ml',            descricao: 'Long neck ou garrafa, consulte as marcas',              preco: 15.00, imagem: 'https://images.unsplash.com/photo-1608270586620-248524c67de9?w=600&q=80', categoria: 'bebidas',    favorito: false },
    { id: 19, nome: 'Caipirinhas e Caipiroskas',descricao: 'Cachaça ou vodka com frutas frescas da estação',        preco: 22.00, imagem: 'https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?w=600&q=80', categoria: 'drinks',     favorito: false },
    { id: 20, nome: 'Gin Tônica',               descricao: 'Gin premium com água tônica e botânicos da casa',       preco: 30.00, imagem: 'https://images.unsplash.com/photo-1534353341530-41ae8b93dc16?w=600&q=80', categoria: 'drinks',     favorito: false },
  ];

  resultados = computed(() => {
    const termo = this.termoBusca().toLowerCase().trim();
    if (!termo) return [];
    return this.produtos.filter(p =>
      p.nome.toLowerCase().includes(termo) ||
      p.descricao.toLowerCase().includes(termo) ||
      p.categoria.toLowerCase().includes(termo)
    );
  });

  onInput(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.termoBusca.set(value);
  }

  limparBusca(): void {
    this.termoBusca.set('');
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

  toggleFavorito(id: number): void {
    const produto = this.produtos.find(p => p.id === id);
    if (produto) produto.favorito = !produto.favorito;
  }

  getQuantidade(id: number): number {
    return this.quantidades()[id] ?? 0;
  }

  formatarPreco(preco: number): string {
    return preco.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  }
}