import { Component, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../services/auth.service';
import { AdminDataService, Fornecedor } from '../../services/admin-data.service';
import { PermissionService } from '../../services/permission.service';

@Component({
  selector: 'app-fornecedores', standalone: true, imports: [CommonModule],
  templateUrl: './fornecedores.component.html', styleUrls: ['./fornecedores.component.scss']
})
export class FornecedoresComponent {
  private authService = inject(AuthService);
  private adminData   = inject(AdminDataService);
  permission           = inject(PermissionService);

  // Esta página só é editável pelo Dono — Gerente e Supervisor têm acesso somente leitura
  podeEditar = this.permission.podeEditar('fornecedores');

  showModal         = signal(false);
  editando          = signal<Fornecedor | null>(null);
  isSaving          = signal(false);
  showModalExclusao = signal(false);
  fornParaExcluir   = signal<Fornecedor | null>(null);

  mNome        = signal('');
  mCnpj        = signal('');
  mProdutos    = signal('');
  mEndereco    = signal('');
  mTelefone    = signal('');
  mEmail       = signal('');
  mValor       = signal('0');
  mStatus      = signal<'Ativo' | 'Inativo'>('Ativo');
  mObservacoes = signal('');

  // Dados vivos do Firestore
  fornecedores = this.adminData.fornecedores;

  getPrimeiroNome(): string {
    const u = this.authService.getCurrentUser();
    return u?.nomeCompleto?.split(' ')[0] || u?.matricula || '';
  }

  formatValor(v: number): string {
    return v.toLocaleString('pt-BR', { minimumFractionDigits: 2 });
  }

  abrirModalNovo(): void {
    this.editando.set(null);
    this.mNome.set(''); this.mCnpj.set(''); this.mProdutos.set('');
    this.mEndereco.set(''); this.mTelefone.set(''); this.mEmail.set('');
    this.mValor.set('0'); this.mStatus.set('Ativo'); this.mObservacoes.set('');
    this.showModal.set(true);
  }

  abrirModalEditar(f: Fornecedor, e: Event): void {
    e.stopPropagation();
    this.editando.set(f);
    this.mNome.set(f.nome); this.mCnpj.set(f.cnpj); this.mProdutos.set(f.produtos);
    this.mEndereco.set(f.endereco); this.mTelefone.set(f.telefone); this.mEmail.set(f.email);
    this.mValor.set(String(f.valorMedio)); this.mStatus.set(f.status); this.mObservacoes.set(f.observacoes);
    this.showModal.set(true);
  }

  fecharModal(): void { if (!this.isSaving()) this.showModal.set(false); }

  async salvar(): Promise<void> {
    if (!this.podeEditar) return;
    if (!this.mNome().trim()) return;
    this.isSaving.set(true);
    try {
      const dados = {
        nome: this.mNome(), cnpj: this.mCnpj(), produtos: this.mProdutos(),
        endereco: this.mEndereco(), telefone: this.mTelefone(), email: this.mEmail(),
        valorMedio: parseFloat(this.mValor()) || 0,
        status: this.mStatus(), observacoes: this.mObservacoes(),
      };
      const ed = this.editando();
      if (ed?.firestoreId) {
        await this.adminData.atualizarFornecedor(ed.firestoreId, dados);
      } else {
        await this.adminData.adicionarFornecedor(dados);
      }
      this.fecharModal();
    } catch (err) {
      console.error('[Fornecedores] salvar erro:', err);
    } finally {
      this.isSaving.set(false);
    }
  }

  confirmarExclusao(f: Fornecedor, e: Event): void {
    e.stopPropagation();
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
    if (f?.firestoreId) {
      await this.adminData.excluirFornecedor(f.firestoreId).catch(console.error);
    }
    this.cancelarExclusao();
  }

  onInput(field: string, e: Event): void {
    const v = (e.target as HTMLInputElement | HTMLTextAreaElement).value;
    if (field === 'nome')        this.mNome.set(v);
    if (field === 'cnpj')        this.mCnpj.set(v);
    if (field === 'produtos')    this.mProdutos.set(v);
    if (field === 'endereco')    this.mEndereco.set(v);
    if (field === 'telefone')    this.mTelefone.set(v);
    if (field === 'email')       this.mEmail.set(v);
    if (field === 'valor')       this.mValor.set(v);
    if (field === 'observacoes') this.mObservacoes.set(v);
  }

  onSelectStatus(e: Event): void {
    this.mStatus.set((e.target as HTMLSelectElement).value as 'Ativo' | 'Inativo');
  }
}
