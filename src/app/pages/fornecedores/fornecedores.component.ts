import { Component, signal, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../services/auth.service';
import { PermissionService } from '../../services/permission.service';
import { FornecedorApiService } from '../../services/api/fornecedor-api.service';
import { IngredienteAdminApiService } from '../../services/api/ingrediente-admin-api.service';
import {
  CotacaoApi, FornecedorApi, FornecedorProdutoApi, IngredienteApi
} from '../../services/api/api-types';
import { mensagemDeErro } from '../../services/api/api-error';

/** Máscara 00.000.000/0000-00 enquanto digita. */
function mascaraCnpj(v: string): string {
  const d = v.replace(/\D/g, '').slice(0, 14);
  return d
    .replace(/^(\d{2})(\d)/, '$1.$2')
    .replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3')
    .replace(/\.(\d{3})(\d)/, '.$1/$2')
    .replace(/(\d{4})(\d)/, '$1-$2');
}

@Component({
  selector: 'app-fornecedores', standalone: true, imports: [CommonModule],
  templateUrl: './fornecedores.component.html', styleUrls: ['./fornecedores.component.scss']
})
export class FornecedoresComponent implements OnInit {
  private authService = inject(AuthService);
  private api         = inject(FornecedorApiService);
  private ingApi      = inject(IngredienteAdminApiService);
  permission           = inject(PermissionService);

  // Esta página só é editável pelo Dono — Gerente e Supervisor têm acesso somente leitura
  podeEditar = this.permission.podeEditar('fornecedores');

  readonly unidades = ['KG', 'G', 'L', 'ML', 'UN'];

  aba          = signal<'fornecedores' | 'cotacao'>('fornecedores');
  fornecedores = signal<FornecedorApi[]>([]);
  ingredientes = signal<IngredienteApi[]>([]);
  carregando   = signal(true);
  erro         = signal('');

  // ── Modal fornecedor ─────────────────────────────────────────
  showModal = signal(false);
  editando  = signal<FornecedorApi | null>(null);
  isSaving  = signal(false);
  erroModal = signal('');
  mNome     = signal('');
  mCnpj     = signal('');
  mTelefone = signal('');
  mEmail    = signal('');

  // ── Exclusão (desativar) ─────────────────────────────────────
  showModalExclusao = signal(false);
  fornParaExcluir   = signal<FornecedorApi | null>(null);
  erroExclusao      = signal('');

  // ── Catálogo (RF-022) ────────────────────────────────────────
  showCatalogo   = signal(false);
  catalogoForn   = signal<FornecedorApi | null>(null);
  catalogo       = signal<FornecedorProdutoApi[]>([]);
  carregandoCat  = signal(false);
  cIngrediente   = signal<number | null>(null);
  cPreco         = signal('');
  cUnidade       = signal('KG');
  erroCatalogo   = signal('');

  // ── Cotação (RF-023) ─────────────────────────────────────────
  cotIngrediente = signal<number | null>(null);
  cotacao        = signal<CotacaoApi | null>(null);
  carregandoCot  = signal(false);
  erroCotacao    = signal('');

  ngOnInit(): void { this.carregar(); }

  async carregar(): Promise<void> {
    this.carregando.set(true);
    this.erro.set('');
    try {
      const [forns, ings] = await Promise.all([this.api.listar(), this.ingApi.listar()]);
      this.fornecedores.set(forns);
      this.ingredientes.set(ings.filter(i => i.status === 'ATIVO'));
    } catch (err) {
      this.erro.set(mensagemDeErro(err, 'Não foi possível carregar os fornecedores.'));
    } finally {
      this.carregando.set(false);
    }
  }

  getPrimeiroNome(): string {
    const u = this.authService.getCurrentUser();
    return u?.nomeCompleto?.split(' ')[0] || u?.matricula || '';
  }

  formatPreco(v: number): string {
    return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', minimumFractionDigits: 2 });
  }

  // ── Fornecedor: criar / editar ───────────────────────────────
  abrirModalNovo(): void {
    this.editando.set(null);
    this.mNome.set(''); this.mCnpj.set(''); this.mTelefone.set(''); this.mEmail.set('');
    this.erroModal.set('');
    this.showModal.set(true);
  }

  abrirModalEditar(f: FornecedorApi, e: Event): void {
    e.stopPropagation();
    this.editando.set(f);
    this.mNome.set(f.razaoSocial); this.mCnpj.set(f.cnpj);
    this.mTelefone.set(f.telefone ?? ''); this.mEmail.set(f.email ?? '');
    this.erroModal.set('');
    this.showModal.set(true);
  }

  fecharModal(): void { if (!this.isSaving()) this.showModal.set(false); }

  async salvar(): Promise<void> {
    if (!this.podeEditar) return;
    if (!this.mNome().trim() || !this.mCnpj().trim()) {
      this.erroModal.set('Informe a razão social e o CNPJ.');
      return;
    }
    this.isSaving.set(true);
    this.erroModal.set('');
    try {
      const payload = {
        razaoSocial: this.mNome().trim(), cnpj: this.mCnpj().trim(),
        telefone: this.mTelefone().trim() || undefined,
        email: this.mEmail().trim() || undefined,
      };
      const ed = this.editando();
      if (ed) await this.api.atualizar(ed.id, payload);
      else    await this.api.criar(payload);
      this.showModal.set(false);
      await this.carregar();
    } catch (err) {
      this.erroModal.set(mensagemDeErro(err, 'Não foi possível salvar o fornecedor.'));
    } finally {
      this.isSaving.set(false);
    }
  }

  // ── Exclusão (RN06: o fornecedor fica inativo) ───────────────
  confirmarExclusao(f: FornecedorApi, e: Event): void {
    e.stopPropagation();
    this.erroExclusao.set('');
    this.fornParaExcluir.set(f);
    this.showModalExclusao.set(true);
  }

  cancelarExclusao(): void {
    this.showModalExclusao.set(false);
    this.fornParaExcluir.set(null);
  }

  async confirmarExclusaoFinal(): Promise<void> {
    if (!this.podeEditar) return;
    const f = this.fornParaExcluir();
    if (!f) return;
    try {
      await this.api.desativar(f.id);
      this.cancelarExclusao();
      await this.carregar();
    } catch (err) {
      this.erroExclusao.set(mensagemDeErro(err, 'Não foi possível desativar o fornecedor.'));
    }
  }

  // ── Catálogo ─────────────────────────────────────────────────
  async abrirCatalogo(f: FornecedorApi, e: Event): Promise<void> {
    e.stopPropagation();
    this.catalogoForn.set(f);
    this.cIngrediente.set(null); this.cPreco.set(''); this.cUnidade.set('KG');
    this.erroCatalogo.set('');
    this.catalogo.set([]);
    this.showCatalogo.set(true);
    await this.carregarCatalogo();
  }

  fecharCatalogo(): void { if (!this.isSaving()) this.showCatalogo.set(false); }

  private async carregarCatalogo(): Promise<void> {
    const f = this.catalogoForn();
    if (!f) return;
    this.carregandoCat.set(true);
    try {
      this.catalogo.set(await this.api.catalogo(f.id));
    } catch (err) {
      this.erroCatalogo.set(mensagemDeErro(err, 'Não foi possível carregar o catálogo.'));
    } finally {
      this.carregandoCat.set(false);
    }
  }

  async salvarNoCatalogo(): Promise<void> {
    const f = this.catalogoForn();
    const ingId = this.cIngrediente();
    const preco = parseFloat(this.cPreco().replace(',', '.'));
    if (!this.podeEditar || !f) return;
    if (!ingId || !preco || preco <= 0) {
      this.erroCatalogo.set('Escolha o ingrediente e informe um preço maior que zero.');
      return;
    }
    this.isSaving.set(true);
    this.erroCatalogo.set('');
    try {
      await this.api.salvarNoCatalogo(f.id, { ingredienteId: ingId, preco, unidadeVenda: this.cUnidade() });
      this.cIngrediente.set(null); this.cPreco.set('');
      await this.carregarCatalogo();
    } catch (err) {
      this.erroCatalogo.set(mensagemDeErro(err, 'Não foi possível salvar o produto no catálogo.'));
    } finally {
      this.isSaving.set(false);
    }
  }

  /** Clicar numa linha do catálogo preenche o formulário para atualizar o preço. */
  editarItemCatalogo(item: FornecedorProdutoApi): void {
    if (!this.podeEditar) return;
    this.cIngrediente.set(item.ingredienteId);
    this.cPreco.set(String(item.preco));
    this.cUnidade.set(item.unidadeVenda);
  }

  // ── Cotação ──────────────────────────────────────────────────
  trocarAba(aba: 'fornecedores' | 'cotacao'): void { this.aba.set(aba); }

  async onCotacaoIngrediente(e: Event): Promise<void> {
    const v = (e.target as HTMLSelectElement).value;
    this.cotIngrediente.set(v ? Number(v) : null);
    this.cotacao.set(null);
    this.erroCotacao.set('');
    if (!v) return;
    this.carregandoCot.set(true);
    try {
      this.cotacao.set(await this.api.cotacao(Number(v)));
    } catch (err) {
      this.erroCotacao.set(mensagemDeErro(err, 'Não foi possível carregar a cotação.'));
    } finally {
      this.carregandoCot.set(false);
    }
  }

  // ── Campos ───────────────────────────────────────────────────
  onInput(field: string, e: Event): void {
    const v = (e.target as HTMLInputElement).value;
    if (field === 'nome')     this.mNome.set(v);
    if (field === 'cnpj')     this.mCnpj.set(mascaraCnpj(v));
    if (field === 'telefone') this.mTelefone.set(v);
    if (field === 'email')    this.mEmail.set(v);
    if (field === 'cPreco')   this.cPreco.set(v);
  }

  onSelectCatIngrediente(e: Event): void {
    const v = (e.target as HTMLSelectElement).value;
    this.cIngrediente.set(v ? Number(v) : null);
  }

  onSelectCatUnidade(e: Event): void { this.cUnidade.set((e.target as HTMLSelectElement).value); }
}
