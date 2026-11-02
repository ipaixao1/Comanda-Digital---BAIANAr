import { Component, signal, computed, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../services/auth.service';
import { EstoqueService } from '../../services/estoque.service';
import { PermissionService } from '../../services/permission.service';
import { EstoqueApiService } from '../../services/api/estoque-api.service';
import { IngredienteApi, MovimentacaoApi } from '../../services/api/api-types';
import { mensagemDeErro } from '../../services/api/api-error';

export type StatusEstoque = 'Normal' | 'Baixo' | 'Crítico';

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

const MOTIVOS_SAIDA = [
  { valor: 'DESPERDICIO', rotulo: 'Desperdício' },
  { valor: 'VENCIMENTO',  rotulo: 'Vencimento' },
  { valor: 'QUEBRA',      rotulo: 'Quebra' },
  { valor: 'USO_INTERNO', rotulo: 'Uso interno' },
];

const ROTULO_MOTIVO: Record<string, string> = {
  COMPRA: 'Compra', VENDA: 'Venda', DESPERDICIO: 'Desperdício', VENCIMENTO: 'Vencimento',
  QUEBRA: 'Quebra', AJUSTE: 'Ajuste', USO_INTERNO: 'Uso interno', ESTORNO: 'Estorno (pedido cancelado)',
};

@Component({
  selector: 'app-estoque', standalone: true, imports: [CommonModule],
  templateUrl: './estoque.component.html', styleUrls: ['./estoque.component.scss']
})
export class EstoqueComponent implements OnInit {
  private authService = inject(AuthService);
  private estoqueSvc  = inject(EstoqueService);      // só o status do KDS (cozinha)
  private api         = inject(EstoqueApiService);
  permission           = inject(PermissionService);

  // Esta página só é editável pelo Dono — Gerente e Supervisor têm acesso somente leitura
  podeEditar = this.permission.podeEditar('estoque');

  readonly unidades = ['KG', 'G', 'L', 'ML', 'UN'];
  readonly motivosSaida = MOTIVOS_SAIDA;

  aba          = signal<'ingredientes' | 'movimentacoes'>('ingredientes');
  ingredientes = signal<IngredienteApi[]>([]);
  carregando   = signal(true);
  erro         = signal('');

  // ── Modal ingrediente ────────────────────────────────────────
  showModal  = signal(false);
  editando   = signal<IngredienteApi | null>(null);
  isSaving   = signal(false);
  erroModal  = signal('');
  mNome   = signal('');
  mSku    = signal('');
  mUnidade= signal('KG');
  mMinimo = signal('0');
  mCusto  = signal('0');

  // ── Modal movimentação manual ────────────────────────────────
  showMov   = signal(false);
  movItem   = signal<IngredienteApi | null>(null);
  movTipo   = signal<'ENTRADA' | 'SAIDA'>('SAIDA');
  movMotivo = signal('DESPERDICIO');
  movQtd    = signal('');
  movLote   = signal('');
  movValid  = signal('');
  erroMov   = signal('');

  // ── Exclusão ─────────────────────────────────────────────────
  showModalExclusao = signal(false);
  prodParaExcluir   = signal<IngredienteApi | null>(null);
  erroExclusao      = signal('');

  // ── Histórico ────────────────────────────────────────────────
  movimentacoes   = signal<MovimentacaoApi[]>([]);
  filtroIng       = signal<number | null>(null);
  paginaMov       = signal(0);
  totalPaginasMov = signal(0);
  carregandoMov   = signal(false);

  totalItens     = computed(() => this.ingredientes().length);
  estoqueBaixo   = computed(() => this.ingredientes().filter(i => this.status(i) === 'Baixo').length);
  estoqueCritico = computed(() => this.ingredientes().filter(i => this.status(i) === 'Crítico').length);

  ngOnInit(): void { this.carregar(); }

  async carregar(): Promise<void> {
    this.carregando.set(true);
    this.erro.set('');
    try {
      const lista = await this.api.listarIngredientes();
      this.ingredientes.set(lista.filter(i => i.status === 'ATIVO'));
      this.api.atualizarAlertas();
    } catch (err) {
      this.erro.set(mensagemDeErro(err, 'Não foi possível carregar o estoque.'));
    } finally {
      this.carregando.set(false);
    }
  }

  getPrimeiroNome(): string {
    const u = this.authService.getCurrentUser();
    return u?.nomeCompleto?.split(' ')[0] || u?.matricula || '';
  }

  /** Crítico: saldo ≤ 50% do mínimo; Baixo: abaixo do mínimo (RF-032). */
  status(i: IngredienteApi): StatusEstoque {
    if (i.saldoAtual <= i.estoqueMinimo * 0.5 && i.estoqueMinimo > 0) return 'Crítico';
    if (i.saldoAtual < i.estoqueMinimo) return 'Baixo';
    return 'Normal';
  }

  getStatusClass(s: StatusEstoque): string {
    return { 'Normal':'badge--normal', 'Baixo':'badge--baixo', 'Crítico':'badge--critico' }[s] ?? '';
  }

  getStatusKdsProduto(nome: string): 'available' | 'em_falta' {
    const kdsId = getKdsId(nome);
    if (!kdsId) return 'available';
    return this.estoqueSvc.getStatusKds(kdsId);
  }

  rotuloMotivo(m: string): string { return ROTULO_MOTIVO[m] ?? m; }

  // ── Ingrediente: criar / editar ──────────────────────────────
  abrirModalNovo(): void {
    this.editando.set(null);
    this.mNome.set(''); this.mSku.set(''); this.mUnidade.set('KG');
    this.mMinimo.set('0'); this.mCusto.set('0');
    this.erroModal.set('');
    this.showModal.set(true);
  }

  abrirModalEditar(p: IngredienteApi, e: Event): void {
    e.stopPropagation();
    this.editando.set(p);
    this.mNome.set(p.nome); this.mSku.set(p.sku); this.mUnidade.set(p.unidadePadrao);
    this.mMinimo.set(String(p.estoqueMinimo)); this.mCusto.set(String(p.custoUnitario));
    this.erroModal.set('');
    this.showModal.set(true);
  }

  fecharModal(): void { if (!this.isSaving()) this.showModal.set(false); }

  async salvar(): Promise<void> {
    if (!this.podeEditar) return;
    if (!this.mNome().trim() || !this.mSku().trim()) {
      this.erroModal.set('Informe o nome e o SKU do ingrediente.');
      return;
    }
    this.isSaving.set(true);
    this.erroModal.set('');
    try {
      const payload = {
        nome: this.mNome().trim(), sku: this.mSku().trim(),
        unidadePadrao: this.mUnidade(),
        estoqueMinimo: parseFloat(this.mMinimo()) || 0,
        custoUnitario: parseFloat(this.mCusto()) || 0,
      };
      const ed = this.editando();
      if (ed) await this.api.atualizarIngrediente(ed.id, payload);
      else    await this.api.criarIngrediente(payload);
      this.showModal.set(false);
      await this.carregar();
    } catch (err) {
      this.erroModal.set(mensagemDeErro(err, 'Não foi possível salvar o ingrediente.'));
    } finally {
      this.isSaving.set(false);
    }
  }

  // ── Movimentação manual (RF-028 / RF-030) ────────────────────
  abrirMov(p: IngredienteApi, tipo: 'ENTRADA' | 'SAIDA', e: Event): void {
    e.stopPropagation();
    this.movItem.set(p);
    this.movTipo.set(tipo);
    this.movMotivo.set(tipo === 'ENTRADA' ? 'AJUSTE' : 'DESPERDICIO');
    this.movQtd.set(''); this.movLote.set(''); this.movValid.set('');
    this.erroMov.set('');
    this.showMov.set(true);
  }

  fecharMov(): void { if (!this.isSaving()) this.showMov.set(false); }

  async salvarMov(): Promise<void> {
    const item = this.movItem();
    if (!this.podeEditar || !item) return;
    const qtd = parseFloat(this.movQtd());
    if (!qtd || qtd <= 0) { this.erroMov.set('Informe uma quantidade maior que zero.'); return; }
    this.isSaving.set(true);
    this.erroMov.set('');
    try {
      await this.api.registrarMovimentacao({
        ingredienteId: item.id, tipo: this.movTipo(), quantidade: qtd, motivo: this.movMotivo(),
        lote: this.movLote().trim() || undefined,
        validade: this.movValid() || undefined,
      });
      this.showMov.set(false);
      await this.carregar();
      if (this.aba() === 'movimentacoes') await this.carregarMovimentacoes();
    } catch (err) {
      this.erroMov.set(mensagemDeErro(err, 'Não foi possível registrar a movimentação.'));
    } finally {
      this.isSaving.set(false);
    }
  }

  // ── Exclusão (lógica) ────────────────────────────────────────
  confirmarExclusao(p: IngredienteApi, e: Event): void {
    e.stopPropagation();
    this.erroExclusao.set('');
    this.prodParaExcluir.set(p);
    this.showModalExclusao.set(true);
  }

  cancelarExclusao(): void {
    this.showModalExclusao.set(false);
    this.prodParaExcluir.set(null);
  }

  async confirmarExclusaoFinal(): Promise<void> {
    if (!this.podeEditar) return;
    const p = this.prodParaExcluir();
    if (!p) return;
    try {
      await this.api.desativarIngrediente(p.id);
      this.cancelarExclusao();
      await this.carregar();
    } catch (err) {
      this.erroExclusao.set(mensagemDeErro(err, 'Não foi possível excluir o ingrediente.'));
    }
  }

  // ── Histórico (RF-033) ───────────────────────────────────────
  trocarAba(aba: 'ingredientes' | 'movimentacoes'): void {
    this.aba.set(aba);
    if (aba === 'movimentacoes') { this.paginaMov.set(0); this.carregarMovimentacoes(); }
  }

  async carregarMovimentacoes(): Promise<void> {
    this.carregandoMov.set(true);
    try {
      const r = await this.api.listarMovimentacoes(this.filtroIng() ?? undefined, this.paginaMov());
      this.movimentacoes.set(r.content);
      this.totalPaginasMov.set(r.totalPages);
    } catch (err) {
      this.erro.set(mensagemDeErro(err, 'Não foi possível carregar as movimentações.'));
    } finally {
      this.carregandoMov.set(false);
    }
  }

  onFiltroIngrediente(e: Event): void {
    const v = (e.target as HTMLSelectElement).value;
    this.filtroIng.set(v ? Number(v) : null);
    this.paginaMov.set(0);
    this.carregarMovimentacoes();
  }

  mudarPagina(delta: number): void {
    const n = this.paginaMov() + delta;
    if (n < 0 || n >= this.totalPaginasMov()) return;
    this.paginaMov.set(n);
    this.carregarMovimentacoes();
  }

  onInput(field: string, e: Event): void {
    const v = (e.target as HTMLInputElement).value;
    if (field === 'nome')   this.mNome.set(v);
    if (field === 'sku')    this.mSku.set(v);
    if (field === 'minimo') this.mMinimo.set(v);
    if (field === 'custo')  this.mCusto.set(v);
    if (field === 'movQtd')   this.movQtd.set(v);
    if (field === 'movLote')  this.movLote.set(v);
    if (field === 'movValid') this.movValid.set(v);
  }

  onSelectUnidade(e: Event): void { this.mUnidade.set((e.target as HTMLSelectElement).value); }
  onSelectMotivo(e: Event): void  { this.movMotivo.set((e.target as HTMLSelectElement).value); }
}
