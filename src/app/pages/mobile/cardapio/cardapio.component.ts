import { Component, signal, computed, HostListener, inject, OnInit } from '@angular/core';
import { ClienteAuthService } from '../../../services/cliente-auth.service';
import { CarrinhoService } from '../../../services/carrinho.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { CardapioStatusService } from '../../../services/cardapio-status.service';
import { CardapioApiService } from '../../../services/api/cardapio-api.service';

export interface Produto {
  id: number;
  nome: string;
  descricao: string;
  preco: number | null;
  imagem: string | null;
  categoria: string;
  categoriaNome?: string;
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

// Emoji de cada categoria (só visual). Categorias novas criadas no painel admin usam o emoji padrão.
const CATEGORIA_EMOJI: Record<string, string> = {
  entradas: '🥘', principais: '🍽️', sobremesas: '🍰', bebidas: '🥤', drinks: '🍹',
};

@Component({
  selector: 'app-cardapio',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './cardapio.component.html',
  styleUrls: ['./cardapio.component.scss'],
})
export class CardapioComponent implements OnInit {

  // Navegação interna (cardápio <-> avaliações)
  tela = signal<'cardapio' | 'avaliacoes'>('cardapio');

  // RF-001: cardápio vem da API (GET /api/cardapio), sem login.
  produtos   = signal<Produto[]>([]);
  carregando = signal<boolean>(true);
  erroCarga  = signal<string>('');

  // Faixa de entrega da loja (calculada pelo backend), mostrada no topo do cardápio.
  faixaEntrega = signal<{ min: number; max: number } | null>(null);

  // Filtro por categoria: montado a partir dos pratos que a API devolveu.
  get categorias(): Categoria[] {
    const vistas = new Map<string, Categoria>();
    for (const p of this.produtos() as (Produto & { categoriaNome?: string })[]) {
      if (!vistas.has(p.categoria)) {
        vistas.set(p.categoria, {
          id: p.categoria,
          label: p.categoriaNome ?? p.categoria,
          emoji: CATEGORIA_EMOJI[p.categoria] ?? '🍽️',
        });
      }
    }
    return [{ id: 'todos', label: 'Todos', emoji: '' }, ...vistas.values()];
  }

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
  cadastroEndereco = '';
  cadastroSenhaConf = '';
  loginErro = '';

  toastVisivel = signal<boolean>(false);
  private toastTimeout: any;

  private cardapioStatusSvc = inject(CardapioStatusService);

  private cardapioApi = inject(CardapioApiService);

  constructor(
    private authService: ClienteAuthService,
    public carrinho: CarrinhoService
  ) {}

  ngOnInit(): void {
    this.carregarCardapio();
    this.carregarFaixaEntrega();
  }

  private async carregarFaixaEntrega(): Promise<void> {
    const f = await this.cardapioApi.faixaEntrega();
    if (f) this.faixaEntrega.set({ min: f.minimoMin, max: f.maximoMin });
  }

  async carregarCardapio(): Promise<void> {
    this.carregando.set(true);
    this.erroCarga.set('');
    try {
      this.produtos.set(await this.cardapioApi.listar());
    } catch {
      this.erroCarga.set('Não foi possível carregar o cardápio. Verifique sua conexão e tente novamente.');
    } finally {
      this.carregando.set(false);
    }
  }

  // Verifica se prato está indisponível (KDS ou admin)
  isProdutoIndisponivel(nome: string): boolean {
    return this.cardapioStatusSvc.isIndisPorNome(nome);
  }

  categoriaSelecionada = signal<string>('todos');
  dropdownAberto = signal<boolean>(false);

  totalItens = computed(() => this.carrinho.totalItens());

  produtosFiltrados = computed(() => {
    const cat = this.categoriaSelecionada();
    return cat === 'todos' ? this.produtos() : this.produtos().filter(p => p.categoria === cat);
  });

  categoriasVisiveis = computed(() => {
    const ids = [...new Set(this.produtosFiltrados().map(p => p.categoria))];
    return this.categorias.filter(c => ids.includes(c.id));
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
    this.cadastroEndereco = '';
    this.cadastroSenhaConf = '';
    this.modalAba = 'login';
  }

  async fazerCadastro(): Promise<void> {
    this.loginErro = '';
    if (!this.cadastroNome.trim())                    { this.loginErro = 'Informe seu nome.'; return; }
    if (!this.loginEmail.trim())                       { this.loginErro = 'Informe seu email.'; return; }
    if (!this.cadastroTelefone.trim())                 { this.loginErro = 'Informe seu telefone.'; return; }
    if (!this.cadastroEndereco.trim())                 { this.loginErro = 'Informe seu endereço de entrega.'; return; }
    if (this.loginSenha.length < 6)                    { this.loginErro = 'Senha deve ter mínimo 6 caracteres.'; return; }
    if (this.loginSenha !== this.cadastroSenhaConf)    { this.loginErro = 'As senhas não coincidem.'; return; }
    const result = await this.authService.cadastrar(this.cadastroNome, this.loginEmail, this.loginSenha, this.cadastroTelefone, this.cadastroEndereco);
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