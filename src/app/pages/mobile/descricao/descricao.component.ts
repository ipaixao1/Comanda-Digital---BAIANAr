import { Component, signal, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, ActivatedRoute, Router } from '@angular/router';

export interface ProdutoDetalhe {
  id: number;
  nome: string;
  descricao: string;
  descricaoLonga: string;
  preco: number;
  imagem: string | null;
  categoria: string;
  favorito: boolean;
  avaliacao: number;
  ingredientes: string[];
}

const PRODUTOS: ProdutoDetalhe[] = [
  { id: 1,  nome: 'Casquinhas de Siri',      descricao: 'Casquinhas de siri gratinadas',                       descricaoLonga: 'Deliciosas casquinhas de siri recheadas com carne de siri temperada e gratinadas ao forno.',         preco: 32.90, imagem: 'https://images.unsplash.com/photo-1565680018093-ebb6b9ab5460?w=600&q=80', categoria: 'entradas',   favorito: false, avaliacao: 4.5, ingredientes: ['Siri', 'Cebola', 'Tomate', 'Pimentão', 'Queijo', 'Temperos regionais'] },
  { id: 2,  nome: 'Caldo de Sururu',          descricao: 'Caldo quente de sururu com temperos',                 descricaoLonga: 'Caldo tradicional baiano feito com sururu fresco, temperos regionais e azeite de dendê.',           preco: 28.90, imagem: 'https://images.unsplash.com/photo-1547592180-85f173990554?w=600&q=80', categoria: 'entradas',   favorito: false, avaliacao: 4.0, ingredientes: ['Sururu', 'Dendê', 'Cebola', 'Alho', 'Coentro', 'Pimenta'] },
  { id: 3,  nome: 'Mini Acarajés',            descricao: 'Bolinho de feijão-fradinho frito no azeite de dendê', descricaoLonga: 'Tradicional acarajé baiano feito com feijão-fradinho, frito no azeite de dendê e recheado com vatapá e camarão.', preco: 24.90, imagem: 'https://images.unsplash.com/photo-1565299507177-b0ac66763828?w=600&q=80', categoria: 'entradas',   favorito: true,  avaliacao: 5.0, ingredientes: ['Feijão-fradinho', 'Dendê', 'Vatapá', 'Camarão', 'Pimenta'] },
  { id: 4,  nome: 'Mini Abarás',              descricao: 'Abarás cozidos no vapor com vatapá',                  descricaoLonga: 'Abarás tradicionais cozidos no vapor envoltos em folha de bananeira, servidos com vatapá.',          preco: 26.90, imagem: 'https://images.unsplash.com/photo-1512058564366-18510be2db19?w=600&q=80', categoria: 'entradas',   favorito: false, avaliacao: 4.0, ingredientes: ['Feijão-fradinho', 'Folha de bananeira', 'Vatapá', 'Dendê'] },
  { id: 5,  nome: 'Mini Pastel de Camarão',   descricao: 'Pastéis crocantes recheados com camarão temperado',   descricaoLonga: 'Pastéis crocantes e dourados recheados com camarão fresco temperado com ervas e especiarias.',       preco: 22.90, imagem: 'https://images.unsplash.com/photo-1529042410759-befb1204b468?w=600&q=80', categoria: 'entradas',   favorito: false, avaliacao: 4.5, ingredientes: ['Camarão', 'Massa de pastel', 'Cebola', 'Alho', 'Coentro'] },
  { id: 6,  nome: 'Porção de Pitinga',        descricao: 'Manjubinha frita, crocante e temperada',               descricaoLonga: 'Porção generosa de pitinga frita, crocante e bem temperada, acompanhada de molho especial.',      preco: 28.90, imagem: 'https://images.unsplash.com/photo-1519984388953-d2406bc725e1?w=600&q=80', categoria: 'entradas',   favorito: false, avaliacao: 4.0, ingredientes: ['Pitinga', 'Farinha temperada', 'Limão', 'Sal', 'Pimenta'] },
  { id: 7,  nome: 'Moqueca de Peixe',         descricao: 'Peixe fresco ao molho de dendê e leite de coco',      descricaoLonga: 'Moqueca baiana tradicional com peixe fresco cozido no leite de coco e azeite de dendê com legumes.', preco: 75.90, imagem: 'https://images.unsplash.com/photo-1604329760661-e71dc83f8f26?w=600&q=80', categoria: 'principais', favorito: true,  avaliacao: 5.0, ingredientes: ['Peixe fresco', 'Leite de coco', 'Dendê', 'Tomate', 'Cebola', 'Pimentão', 'Coentro'] },
  { id: 8,  nome: 'Bobó de Camarão',          descricao: 'Camarões frescos em creme cremoso de mandioca',        descricaoLonga: 'Clássico bobó baiano com camarões frescos em creme aveludado de mandioca com leite de coco.',      preco: 82.90, imagem: 'https://images.unsplash.com/photo-1599084993891-1b4e9dd5a70a?w=600&q=80', categoria: 'principais', favorito: true,  avaliacao: 5.0, ingredientes: ['Camarão', 'Mandioca', 'Leite de coco', 'Dendê', 'Alho', 'Cebola'] },
  { id: 9,  nome: 'Carne do Sol com Purê',    descricao: 'Carne do sol grelhada com purê rústico de macaxeira',  descricaoLonga: 'Carne do sol artesanal grelhada na brasa acompanhada de purê rústico de macaxeira com manteiga.',  preco: 68.90, imagem: 'https://images.unsplash.com/photo-1544025162-d76694265947?w=600&q=80', categoria: 'principais', favorito: false, avaliacao: 4.5, ingredientes: ['Carne do sol', 'Macaxeira', 'Manteiga', 'Alho', 'Sal'] },
  { id: 10, nome: 'Baião de Dois',            descricao: 'Arroz com feijão de corda, queijo coalho e carne seca', descricaoLonga: 'Tradicional baião de dois com arroz, feijão de corda, queijo coalho e carne seca desfiada.',      preco: 58.90, imagem: 'https://images.unsplash.com/photo-1516684732162-798a0062be99?w=600&q=80', categoria: 'principais', favorito: false, avaliacao: 4.5, ingredientes: ['Arroz', 'Feijão de corda', 'Queijo coalho', 'Carne seca', 'Manteiga'] },
  { id: 11, nome: 'Arroz de Polvo',           descricao: 'Polvo ao molho com arroz negro e azeite de ervas',     descricaoLonga: 'Polvo cozido lentamente ao molho servido sobre arroz negro temperado com azeite de ervas finas.',  preco: 89.90, imagem: 'https://images.unsplash.com/photo-1559847844-5315695dadae?w=600&q=80', categoria: 'principais', favorito: false, avaliacao: 4.5, ingredientes: ['Polvo', 'Arroz negro', 'Azeite', 'Ervas finas', 'Alho', 'Limão'] },
  { id: 12, nome: 'Camarão à Baiana',         descricao: 'Camarão salteado com molho de dendê e pimenta',        descricaoLonga: 'Camarões frescos salteados no azeite de dendê com pimenta, cebola e temperos baianos.',         preco: 78.90, imagem: 'https://images.unsplash.com/photo-1617622141573-cba8e887e3c3?w=600&q=80', categoria: 'principais', favorito: false, avaliacao: 4.5, ingredientes: ['Camarão', 'Dendê', 'Pimenta', 'Cebola', 'Alho', 'Coentro'] },
  { id: 13, nome: 'Torta de Cocada',          descricao: 'Torta cremosa de coco com base crocante',               descricaoLonga: 'Torta artesanal com base crocante de biscoito e recheio cremoso de cocada baiana.',             preco: 18.90, imagem: 'https://images.unsplash.com/photo-1571877227200-a0d98ea607e9?w=600&q=80', categoria: 'sobremesas', favorito: false, avaliacao: 4.0, ingredientes: ['Coco', 'Biscoito', 'Leite condensado', 'Manteiga', 'Açúcar'] },
  { id: 14, nome: 'Pudim de Tapioca',         descricao: 'Pudim nordestino de tapioca com calda de caramelo',     descricaoLonga: 'Pudim tradicional nordestino feito com tapioca granulada e calda de caramelo artesanal.',         preco: 16.90, imagem: 'https://images.unsplash.com/photo-1488477181946-6428a0291777?w=600&q=80', categoria: 'sobremesas', favorito: false, avaliacao: 4.0, ingredientes: ['Tapioca', 'Leite', 'Ovos', 'Açúcar', 'Baunilha'] },
  { id: 20, nome: 'Água',                     descricao: 'Água mineral gelada (500ml)',                           descricaoLonga: 'Água mineral natural gelada em garrafa de 500ml.',                                              preco: 4.00,  imagem: null, categoria: 'bebidas', favorito: false, avaliacao: 5.0, ingredientes: ['Água mineral'] },
  { id: 23, nome: 'Sucos Naturais',           descricao: 'Frutas da estação batidas na hora',                     descricaoLonga: 'Sucos frescos feitos na hora com frutas da estação selecionadas. Consulte os sabores disponíveis.', preco: 12.00, imagem: 'https://images.unsplash.com/photo-1600271886742-f049cd451bba?w=600&q=80', categoria: 'bebidas', favorito: false, avaliacao: 4.5, ingredientes: ['Frutas da estação', 'Gelo', 'Água'] },
  { id: 25, nome: 'Caipirinhas e Caipiroskas', descricao: 'Cachaça ou vodka com frutas frescas da estação',       descricaoLonga: 'Caipirinhas e caipiroskas artesanais com cachaça premium ou vodka e frutas frescas da estação.',  preco: 22.00, imagem: 'https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?w=600&q=80', categoria: 'drinks', favorito: false, avaliacao: 4.5, ingredientes: ['Cachaça ou Vodka', 'Frutas da estação', 'Açúcar', 'Gelo'] },
  { id: 29, nome: 'Gin Tônica',               descricao: 'Gin premium com água tônica e botânicos da casa',       descricaoLonga: 'Gin tônica premium servido com água tônica artesanal e botânicos selecionados da casa.',          preco: 30.00, imagem: 'https://images.unsplash.com/photo-1534353341530-41ae8b93dc16?w=600&q=80', categoria: 'drinks', favorito: false, avaliacao: 4.5, ingredientes: ['Gin premium', 'Água tônica', 'Botânicos', 'Gelo', 'Limão'] },
];

@Component({
  selector: 'app-descricao',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './descricao.component.html',
  styleUrls: ['./descricao.component.scss'],
})
export class DescricaoComponent implements OnInit {

  produto = signal<ProdutoDetalhe | null>(null);
  quantidade = signal<number>(1);

  totalPreco = computed(() => {
    const p = this.produto();
    return p ? p.preco * this.quantidade() : 0;
  });

  constructor(private route: ActivatedRoute, private router: Router) {}

  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    const found = PRODUTOS.find(p => p.id === id) ?? null;
    this.produto.set(found);
  }

  voltar(): void {
    this.router.navigate(['/mobile/cardapio']);
  }

  toggleFavorito(): void {
    const p = this.produto();
    if (p) this.produto.set({ ...p, favorito: !p.favorito });
  }

  adicionar(): void {
    this.quantidade.update(q => q + 1);
  }

  remover(): void {
    if (this.quantidade() > 1) this.quantidade.update(q => q - 1);
  }

  getEstrelas(): number[] {
    return [1, 2, 3, 4, 5];
  }

  formatarPreco(preco: number): string {
    return preco.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  }
}