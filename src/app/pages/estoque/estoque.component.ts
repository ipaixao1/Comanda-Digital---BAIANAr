import { Component, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../services/auth.service';
import { EstoqueService, StatusEstoqueAdmin } from '../../services/estoque.service';
import { AdminDataService, ProdutoEstoque } from '../../services/admin-data.service';

export type StatusEstoque = 'Normal' | 'Baixo' | 'Crítico';
export type Produto = ProdutoEstoque; // alias para o HTML não precisar mudar

// Mapeamento nome → id KDS (usando escape unicode para evitar problemas de encoding)
function getKdsId(nome: string): string | undefined {
  const map: Record<string, string> = {
    'peixe branco': 'peixe',
    'camar\u00e3o': 'camarao',
    'polvo': 'polvo',
    'carne de siri': 'siri',
    'sururu': 'sururu',
    'manjubinha (pititinga)': 'pititinga',
    'camar\u00e3o seco': 'camaraoseco',
    'carne do sol': 'carnesol',
    'feij\u00e3o fradinho': 'feijaofradinho',
    'feij\u00e3o verde': 'feijaoverde',
    'arroz branco': 'arroz',
    'mandioca': 'mandioca',
    'tapioca granulada': 'tapioca',
    'leite': 'leite',
    'leite condensado': 'leitecond',
    'queijo coalho': 'queijo',
    'lim\u00e3o': 'limao',
    'laranja': 'laranja',
    'abacaxi': 'abacaxi',
    'maracuj\u00e1': 'maracuja',
    'morango': 'morango',
    'manga': 'manga',
    'acerola': 'acerola',
    'caj\u00e1': 'caja',
    'caju': 'caju',
    'cebola': 'cebola',
    'alho': 'alho',
    'tomate': 'tomate',
    'piment\u00e3o vermelho': 'pimentaoverm',
    'piment\u00e3o amarelo': 'pimentaoamar',
    'piment\u00e3o verde': 'pimentaoverd',
    'coentro': 'coentro',
    'cebolinha': 'cebolinha',
    'gengibre': 'gengibre',
    'leite de coco': 'leitecoco',
    'coco ralado': 'cocoral',
    'azeite de dend\u00ea': 'dende',
    'azeite de oliva': 'azeite',
    'sal': 'sal',
    'pimenta-do-reino': 'pimenta',
    'pimenta dedo-de-mo\u00e7a': 'pimentadedo',
    'cominho': 'cominho',
    'colorau': 'colorau',
    'canela': 'canela',
    'a\u00e7\u00facar': 'acucar',
    'farinha de mandioca': 'farinhaman',
    'farinha de trigo': 'farinhatrigo',
    '\u00f3leo vegetal': 'oleo',
    '\u00e1gua mineral': 'aguamin',
    '\u00e1gua com g\u00e1s': 'aguagas',
    'refrigerantes': 'refri',
    'cacha\u00e7a': 'cachaca',
    'vodka': 'vodka',
    'gin': 'gin',
    'cerveja': 'cerveja',
    'gelo': 'gelo',
    '\u00e1gua filtrada': 'aguafil',
  };
  return map[nome.toLowerCase().trim()];
}

@Component({
  selector: 'app-estoque', standalone: true, imports: [CommonModule],
  templateUrl: './estoque.component.html', styleUrls: ['./estoque.component.scss']
})
export class EstoqueComponent {
  private authService = inject(AuthService);
  private estoqueSvc  = inject(EstoqueService);
  private adminData   = inject(AdminDataService);

  // Dados vivos do Firestore
  produtos = this.adminData.estoqueItens;

  showModal         = signal(false);
  editando          = signal<Produto | null>(null);
  isSaving          = signal(false);
  showModalExclusao = signal(false);
  prodParaExcluir   = signal<Produto | null>(null);

  mNome      = signal('');
  mCategoria = signal('');
  mFornecedor= signal('');
  mQtd       = signal('0');
  mUnidade   = signal('kg');
  mMinimo    = signal('0');
  mPreco     = signal('0');
  mDescricao = signal('');
  mEmoji     = signal('📦');

  unidades = ['kg', 'g', 'litro', 'ml', 'unidade'];

  totalItens     = computed(() => this.produtos().length);
  estoqueBaixo   = computed(() => this.produtos().filter(p => p.status === 'Baixo').length);
  estoqueCritico = computed(() => this.produtos().filter(p => p.status === 'Crítico').length);

  getPrimeiroNome(): string {
    const u = this.authService.getCurrentUser();
    return u?.nomeCompleto?.split(' ')[0] || u?.matricula || '';
  }

  getStatusClass(s: StatusEstoque): string {
    return { 'Normal':'badge--normal', 'Baixo':'badge--baixo', 'Crítico':'badge--critico' }[s] ?? '';
  }

  getStatusKdsProduto(nome: string): 'available' | 'em_falta' {
    const kdsId = getKdsId(nome);
    if (!kdsId) return 'available';
    return this.estoqueSvc.getStatusKds(kdsId);
  }

  private calcStatus(qtd: number, min: number): StatusEstoque {
    if (qtd <= min * 0.5) return 'Crítico';
    if (qtd < min)        return 'Baixo';
    return 'Normal';
  }

  private hoje(): string {
    return new Date().toLocaleDateString('pt-BR');
  }

  // ── Modal ─────────────────────────────────────────────────────
  abrirModalNovo(): void {
    this.editando.set(null);
    this.mNome.set(''); this.mCategoria.set(''); this.mFornecedor.set('');
    this.mQtd.set('0'); this.mUnidade.set('kg');
    this.mMinimo.set('0'); this.mPreco.set('0');
    this.mDescricao.set(''); this.mEmoji.set('📦');
    this.showModal.set(true);
  }

  abrirModalEditar(p: Produto, e: Event): void {
    e.stopPropagation();
    this.editando.set(p);
    this.mNome.set(p.nome); this.mCategoria.set(p.categoria);
    this.mFornecedor.set(p.fornecedor); this.mQtd.set(String(p.qtdAtual));
    this.mUnidade.set(p.unidade); this.mMinimo.set(String(p.nivelMinimo));
    this.mPreco.set(String(p.preco)); this.mDescricao.set(p.descricao);
    this.mEmoji.set('📦');
    this.showModal.set(true);
  }

  fecharModal(): void { if (!this.isSaving()) this.showModal.set(false); }

  async salvar(): Promise<void> {
    if (!this.mNome().trim()) return;
    this.isSaving.set(true);
    try {
      const qtd = parseFloat(this.mQtd()) || 0;
      const min = parseFloat(this.mMinimo()) || 0;
      const novoStatus = this.calcStatus(qtd, min);
      const dados: Omit<ProdutoEstoque, 'firestoreId' | 'id'> = {
        nome: this.mNome(), categoria: this.mCategoria(),
        fornecedor: this.mFornecedor(), qtdAtual: qtd,
        unidade: this.mUnidade(), nivelMinimo: min,
        preco: parseFloat(this.mPreco()) || 0,
        descricao: this.mDescricao(),
        status: novoStatus,
        ultimaAtualizacao: this.hoje(),
      };
      const ed = this.editando();
      if (ed?.firestoreId) {
        await this.adminData.atualizarProduto(ed.firestoreId, dados);
      } else {
        await this.adminData.adicionarProduto(dados);
      }
      // Sincroniza com KDS via EstoqueService
      const kdsId = getKdsId(this.mNome());
      if (kdsId) {
        await this.estoqueSvc.setStatusAdmin(kdsId, this.mNome(), novoStatus as StatusEstoqueAdmin)
          .catch(err => console.error('[Estoque] sync KDS erro:', err));
      }
      this.fecharModal();
    } catch (err) {
      console.error('[Estoque] salvar erro:', err);
    } finally {
      this.isSaving.set(false);
    }
  }

  confirmarExclusao(p: Produto, e: Event): void {
    e.stopPropagation();
    this.prodParaExcluir.set(p);
    this.showModalExclusao.set(true);
  }

  cancelarExclusao(): void {
    this.showModalExclusao.set(false);
    this.prodParaExcluir.set(null);
  }

  async confirmarExclusaoFinal(): Promise<void> {
    const p = this.prodParaExcluir();
    if (p?.firestoreId) {
      await this.adminData.excluirProduto(p.firestoreId).catch(console.error);
    }
    this.cancelarExclusao();
  }

  onInput(field: string, e: Event): void {
    const v = (e.target as HTMLInputElement | HTMLTextAreaElement).value;
    if (field === 'nome')       this.mNome.set(v);
    if (field === 'categoria')  this.mCategoria.set(v);
    if (field === 'fornecedor') this.mFornecedor.set(v);
    if (field === 'qtd')        this.mQtd.set(v);
    if (field === 'minimo')     this.mMinimo.set(v);
    if (field === 'preco')      this.mPreco.set(v);
    if (field === 'descricao')  this.mDescricao.set(v);
    if (field === 'emoji')      this.mEmoji.set(v);
  }

  onSelectUnidade(e: Event): void {
    this.mUnidade.set((e.target as HTMLSelectElement).value);
  }
}
