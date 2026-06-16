import { Component, signal, computed, HostListener, inject } from '@angular/core';
import { ClienteAuthService } from '../../../services/cliente-auth.service';
import { CarrinhoService } from '../../../services/carrinho.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { CardapioStatusService } from '../../../services/cardapio-status.service';

export interface Produto {
  id: number;
  nome: string;
  descricao: string;
  preco: number | null;
  imagem: string | null;
  categoria: string;
  favorito: boolean;
}

export interface Categoria {
  id: string;
  label: string;
  emoji: string;
}

export interface Avaliacao {
  nome: string;
  nota: number;
  texto: string;
}

export interface AvaliacaoDetalhada {
  nome: string;
  nota: number;
  data: string;
  texto: string;
}

const CATEGORIA_ORDER = ['entradas', 'principais', 'sobremesas', 'bebidas', 'drinks'];

const CATEGORIA_MAP: Record<string, { label: string; emoji: string }> = {
  entradas:   { label: 'Entradas',          emoji: '🥘' },
  principais: { label: 'Pratos Principais', emoji: '🍽️' },
  sobremesas: { label: 'Sobremesas',        emoji: '🍰' },
  bebidas:    { label: 'Bebidas',           emoji: '🥤' },
  drinks:     { label: 'Drinks',            emoji: '🍹' },
};

@Component({
  selector: 'app-cardapio',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './cardapio.component.html',
  styleUrls: ['./cardapio.component.scss'],
})
export class CardapioComponent {

  // Navegação interna (cardápio <-> avaliações)
  tela = signal<'cardapio' | 'avaliacoes'>('cardapio');

  categorias: Categoria[] = [
    { id: 'todos',      label: 'Todos',            emoji: '' },
    { id: 'entradas',   ...CATEGORIA_MAP['entradas']   },
    { id: 'principais', ...CATEGORIA_MAP['principais'] },
    { id: 'sobremesas', ...CATEGORIA_MAP['sobremesas'] },
    { id: 'bebidas',    ...CATEGORIA_MAP['bebidas']    },
    { id: 'drinks',     ...CATEGORIA_MAP['drinks']     },
  ];

  produtos: Produto[] = [
    { id: 1,  nome: 'Casquinhas de Siri',      descricao: 'Casquinhas de siri gratinadas',                         preco: 32.90, imagem: 'assets/images/Casquinhas de Siri.jpg', categoria: 'entradas',   favorito: false },
    { id: 2,  nome: 'Caldo de Sururu',          descricao: 'Caldo quente de sururu com temperos',                   preco: 28.90, imagem: 'assets/images/Caldo de Sururu.jpg', categoria: 'entradas',   favorito: false },
    { id: 3,  nome: 'Mini Acarajés',            descricao: 'Bolinho de feijão-fradinho frito no azeite de dendê',   preco: 24.90, imagem: 'assets/images/Mini acarajé.jpg', categoria: 'entradas',   favorito: true  },
    { id: 4,  nome: 'Mini Abarás',              descricao: 'Abarás cozidos no vapor com vatapá',                    preco: 26.90, imagem: 'assets/images/Mini Abara.jpg', categoria: 'entradas',   favorito: false },
    { id: 5,  nome: 'Mini Pastel de Camarão',   descricao: 'Pastéis crocantes recheados com camarão temperado',     preco: 22.90, imagem: 'assets/images/Pastel de camarao.jpg', categoria: 'entradas',   favorito: false },
    { id: 6,  nome: 'Porção de Pitinga',        descricao: 'Manjubinha frita, crocante e temperada',                preco: 28.90, imagem: 'assets/images/Porcao de Pititinga.jpg', categoria: 'entradas',   favorito: false },
    { id: 7,  nome: 'Moqueca de Peixe',         descricao: 'Peixe fresco ao molho de dendê e leite de coco',       preco: 75.90, imagem: 'assets/images/Moqueca de Peixe.jpg', categoria: 'principais', favorito: true  },
    { id: 8,  nome: 'Bobó de Camarão',          descricao: 'Camarões frescos em creme cremoso de mandioca',         preco: 82.90, imagem: 'assets/images/Bobo de Camarao.jpg', categoria: 'principais', favorito: true  },
    { id: 9,  nome: 'Carne do Sol com Purê',    descricao: 'Carne do sol grelhada com purê rústico de macaxeira',   preco: 68.90, imagem: 'assets/images/Carne do Sol.jpg', categoria: 'principais', favorito: false },
    { id: 10, nome: 'Baião de Dois',            descricao: 'Arroz com feijão de corda, queijo coalho e carne seca', preco: 58.90, imagem: 'assets/images/Baiao de Dois.jpg', categoria: 'principais', favorito: false },
    { id: 11, nome: 'Arroz de Polvo',           descricao: 'Polvo ao molho com arroz negro e azeite de ervas',      preco: 89.90, imagem: 'assets/images/Arroz de Polvo.jpg', categoria: 'principais', favorito: false },
    { id: 12, nome: 'Camarão à Baiana',         descricao: 'Camarão salteado com molho de dendê e pimenta',         preco: 78.90, imagem: 'assets/images/Camarao a Baiana.jpg', categoria: 'principais', favorito: false },
    { id: 13, nome: 'Torta de Cocada',                      descricao: 'Torta cremosa de coco com base crocante',              preco: 18.90, imagem: 'assets/images/Torta de Cocada.jpg', categoria: 'sobremesas', favorito: false },
    { id: 14, nome: 'Pudim de Tapioca',                     descricao: 'Pudim nordestino de tapioca com calda de caramelo',     preco: 16.90, imagem: 'assets/images/Pudim de Tapioca.jpg', categoria: 'sobremesas', favorito: false },
    { id: 15, nome: 'Bolinho de Estudante',                 descricao: 'Bolinho frito de tapioca com coco ralado',              preco: 14.90, imagem: 'assets/images/Bolinho de Estudante.jpg', categoria: 'sobremesas', favorito: false },
    { id: 16, nome: 'Bala Baiana na Travessa',              descricao: 'Doce tradicional baiano servido na travessa',           preco: 22.90, imagem: 'assets/images/Bala baiana.jpg', categoria: 'sobremesas', favorito: false },
    { id: 17, nome: 'Queijadinha',                          descricao: 'Docinho de coco e queijo coalho assado',                preco: 12.90, imagem: 'assets/images/Queijadinha.jpg', categoria: 'sobremesas', favorito: false },
    { id: 18, nome: 'Doce de Leite Talhado',               descricao: 'Doce de leite artesanal no ponto rústico',              preco: 15.90, imagem: 'assets/images/Doce de Leite.jpg', categoria: 'sobremesas', favorito: false },
    { id: 19, nome: 'Pudim de Tapioca com Leite Condensado', descricao: 'Versão especial do pudim com leite condensado',        preco: 17.90, imagem: 'assets/images/Pudim.jpg', categoria: 'sobremesas', favorito: false },
    { id: 20, nome: 'Água',           descricao: 'Água mineral gelada (500ml)',                   preco: 4.00,  imagem: 'assets/images/Agua.jpg', categoria: 'bebidas', favorito: false },
    { id: 21, nome: 'Água com Gás',   descricao: 'Água mineral com gás gelada (500ml)',            preco: 5.00,  imagem: 'assets/images/Agua com gas.jpg', categoria: 'bebidas', favorito: false },
    { id: 22, nome: 'Refrigerante',   descricao: 'Lata 350ml · consulte os sabores disponíveis',  preco: 6.00,  imagem: 'assets/images/refrigerante.jpg', categoria: 'bebidas', favorito: false },
    { id: 23, nome: 'Sucos Naturais', descricao: 'Frutas da estação batidas na hora',              preco: 12.00, imagem: 'assets/images/Sucos.jpg', categoria: 'bebidas', favorito: false },
    { id: 24, nome: 'Cerveja 600ml',  descricao: 'Long neck ou garrafa, consulte as marcas',       preco: 15.00, imagem: 'assets/images/Cerveja.jpg', categoria: 'bebidas', favorito: false },
    { id: 25, nome: 'Caipirinhas e Caipiroskas', descricao: 'Cachaça ou vodka com frutas frescas da estação', preco: 22.00, imagem: 'assets/images/Caipirnha e Caipiroska.jpg', categoria: 'drinks', favorito: false },
    { id: 26, nome: 'Cravinho',                  descricao: 'Licor artesanal de cravo com cachaça envelhecida', preco: 24.00, imagem: 'assets/images/Cravinho.jpg', categoria: 'drinks', favorito: false },
    { id: 27, nome: 'Coice de Mula',             descricao: 'Moscow Mule tropical com gengibre e limão',       preco: 26.00, imagem: 'assets/images/Moscow Mule.jpg', categoria: 'drinks', favorito: false },
    { id: 28, nome: 'Drinks Tropicais',          descricao: 'Combinações exclusivas com frutas nordestinas',   preco: 28.00, imagem: 'assets/images/Drinks tropicais.jpg', categoria: 'drinks', favorito: false },
    { id: 29, nome: 'Gin Tônica',                descricao: 'Gin premium com água tônica e botânicos da casa', preco: 30.00, imagem: 'assets/images/Gin tonica.jpg', categoria: 'drinks', favorito: false },
  ];

  avaliacoes: Avaliacao[] = [
    { nome: 'Maria Silva',  nota: 5, texto: 'Comida excelente e entrega rápida!' },
    { nome: 'João Santos',  nota: 5, texto: 'Muito saboroso, recomendo' },
    { nome: 'Ana Oliveira', nota: 4, texto: 'Ótima qualidade e bem servido' },
  ];

  mediaAvaliacoes = 4.8;

  // Avaliações detalhadas (sub-tela "Avaliações")
  // TODO: substituir por dados reais (ex: vindos de um AvaliacaoService)
  avaliacoesDetalhadas: AvaliacaoDetalhada[] = [
    { nome: 'Maria Silva',    nota: 5, data: '18 Mar 2026', texto: 'Comida excelente e entrega rápida! O acarajé estava perfeito.' },
    { nome: 'João Santos',    nota: 5, data: '17 Mar 2026', texto: 'Muito saboroso, recomendo! A moqueca de peixe é espetacular.' },
    { nome: 'Ana Oliveira',   nota: 4, data: '16 Mar 2026', texto: 'Ótima qualidade e bem servido. Preço justo pelo que oferece.' },
    { nome: 'Carlos Pereira', nota: 5, data: '15 Mar 2026', texto: 'Melhor comida baiana da região! Sempre peço aqui.' },
    { nome: 'Fernanda Costa', nota: 5, data: '14 Mar 2026', texto: 'Simplesmente perfeito! O bobó de camarão é divino.' },
    { nome: 'Roberto Lima',   nota: 4, data: '13 Mar 2026', texto: 'Comida boa e chegou no prazo certo.' },
  ];

  modalLoginAberto = signal<boolean>(false);
  senhaVisivel = signal<boolean>(false);
  senhaConfVisivel = signal<boolean>(false);
  modalAba: 'login' | 'cadastro' = 'login';
  loginEmail = '';
  loginSenha = '';
  cadastroNome = '';
  cadastroTelefone = '';
  cadastroSenhaConf = '';
  loginErro = '';

  toastVisivel = signal<boolean>(false);
  private toastTimeout: any;

  private cardapioStatusSvc = inject(CardapioStatusService);

  constructor(
    private authService: ClienteAuthService,
    public carrinho: CarrinhoService
  ) {}

  // Verifica se prato está indisponível (KDS ou admin)
  isProdutoIndisponivel(nome: string): boolean {
    return this.cardapioStatusSvc.isIndisPorNome(nome);
  }

  categoriaSelecionada = signal<string>('todos');
  dropdownAberto = signal<boolean>(false);

  totalItens = computed(() => this.carrinho.totalItens());

  produtosFiltrados = computed(() => {
    const cat = this.categoriaSelecionada();
    return cat === 'todos' ? this.produtos : this.produtos.filter(p => p.categoria === cat);
  });

  categoriasVisiveis = computed(() => {
    const ids = [...new Set(this.produtosFiltrados().map(p => p.categoria))];
    return CATEGORIA_ORDER.filter(id => ids.includes(id)).map(id => ({ id, ...CATEGORIA_MAP[id] }));
  });

  categoriaSelecionadaLabel = computed(() =>
    this.categorias.find(c => c.id === this.categoriaSelecionada())?.label ?? 'Todos'
  );

  getEstrelas(nota: number): number[] {
    return Array.from({ length: 5 }, (_, i) => i + 1);
  }

  @HostListener('document:keydown.escape')
  fecharDropdown(): void {
    this.dropdownAberto.set(false);
  }

  toggleDropdown(): void {
    this.dropdownAberto.update(v => !v);
  }

  selecionarCategoria(id: string): void {
    this.categoriaSelecionada.set(id);
    this.dropdownAberto.set(false);
  }

  produtosPorCategoria(categoriaId: string): Produto[] {
    return this.produtosFiltrados().filter(p => p.categoria === categoriaId);
  }

  adicionarProduto(produto: Produto): void {
    if (!this.authService.isAuthenticated()) {
      this.modalLoginAberto.set(true);
      return;
    }
    if (produto.preco === null) return;

    this.carrinho.adicionar({
      id: produto.id,
      nome: produto.nome,
      preco: produto.preco,
      imagem: produto.imagem,
    });

    this.mostrarToast();
  }

  mostrarToast(): void {
    this.toastVisivel.set(true);
    clearTimeout(this.toastTimeout);
    this.toastTimeout = setTimeout(() => this.toastVisivel.set(false), 2500);
  }

  fecharModal(): void {
    this.modalLoginAberto.set(false);
    this.loginEmail = '';
    this.loginSenha = '';
    this.loginErro = '';
    this.cadastroNome = '';
    this.cadastroTelefone = '';
    this.cadastroSenhaConf = '';
    this.modalAba = 'login';
  }

  async fazerCadastro(): Promise<void> {
    this.loginErro = '';
    if (!this.cadastroNome.trim())                    { this.loginErro = 'Informe seu nome.'; return; }
    if (!this.loginEmail.trim())                       { this.loginErro = 'Informe seu email.'; return; }
    if (this.loginSenha.length < 6)                    { this.loginErro = 'Senha deve ter mínimo 6 caracteres.'; return; }
    if (this.loginSenha !== this.cadastroSenhaConf)    { this.loginErro = 'As senhas não coincidem.'; return; }
    const result = await this.authService.cadastrar(this.cadastroNome, this.loginEmail, this.loginSenha, this.cadastroTelefone);
    if (result.success) {
      this.fecharModal();
    } else {
      this.loginErro = result.error ?? 'Erro ao cadastrar.';
    }
  }

  toggleSenhaVisivel(): void {
    this.senhaVisivel.update(v => !v);
  }

  toggleSenhaConfVisivel(): void {
    this.senhaConfVisivel.update(v => !v);
  }

  async fazerLogin(): Promise<void> {
    this.loginErro = '';
    const result = await this.authService.login(this.loginEmail, this.loginSenha);
    if (result.success) {
      this.fecharModal();
    } else {
      this.loginErro = result.error ?? 'Erro ao fazer login.';
    }
  }

  removerProduto(produto: Produto): void {
    this.carrinho.remover(produto.id);
  }

  toggleFavorito(produto: Produto): void {
    produto.favorito = !produto.favorito;
  }

  getQuantidade(produto: Produto): number {
    return this.carrinho.getQuantidade(produto.id);
  }

  formatarPreco(preco: number): string {
    return preco.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  }

  // ── Navegação Avaliações ──
  abrirAvaliacoes(): void {
    this.tela.set('avaliacoes');
  }

  voltar(): void {
    this.tela.set('cardapio');
  }
}