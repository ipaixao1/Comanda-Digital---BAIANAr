import { Component, signal, inject, ElementRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../services/auth.service';
import { AdminDataService, Funcionario } from '../../services/admin-data.service';

export type StatusFuncionario = 'Ativo' | 'Afastado' | 'De férias' | 'Inativo';

export interface HistoricoBH    { data: string; descricao: string; horas: string; positivo: boolean; }
export interface HistoricoFerias { inicio: string; fim: string; dias: number; }

@Component({
  selector: 'app-funcionarios', standalone: true, imports: [CommonModule],
  templateUrl: './funcionarios.component.html', styleUrls: ['./funcionarios.component.scss']
})
export class FuncionariosComponent {
  @ViewChild('fileInput') fileInputRef!: ElementRef<HTMLInputElement>;
  private authService = inject(AuthService);
  private adminData   = inject(AdminDataService);

  funcionarioAberto = signal<number | null>(null);
  showModal  = signal(false);
  editando   = signal<Funcionario | null>(null);
  isSaving   = signal(false);
  showModalExclusao   = signal(false);
  funcParaExcluir     = signal<Funcionario | null>(null);

  mNome      = signal('');
  mCpf       = signal('');
  mCarteira  = signal('');
  mFuncao    = signal('');
  mHorario   = signal('');
  mSalario   = signal('');
  mTelefone  = signal('');
  mEmail     = signal('');
  mEndereco  = signal('');
  mAdmissao  = signal('');
  mObs       = signal('');
  mStatus    = signal<StatusFuncionario>('Ativo');
  mFoto      = signal('');
  mSenha     = signal('');
  mFerias    = signal(false);
  mAtestado  = signal(false);

  statusOpcoes: StatusFuncionario[] = ['Ativo', 'Afastado', 'De férias', 'Inativo'];

  mAdmissaoISO(): string {
    const v = this.mAdmissao();
    if (!v) return '';
    const parts = v.split('/');
    if (parts.length === 3) return parts[2] + '-' + parts[1] + '-' + parts[0];
    return v;
  }

  // Dados vivos do Firestore
  funcionarios = this.adminData.funcionarios;

  // ── Helpers ───────────────────────────────────────────────────
  getPrimeiroNome(): string {
    const u = this.authService.getCurrentUser();
    return u?.nomeCompleto?.split(' ')[0] || u?.matricula || '';
  }

  getStatusClass(s: StatusFuncionario): string {
    const m: Record<StatusFuncionario, string> = {
      'Ativo':'badge--ativo','Afastado':'badge--afastado',
      'De férias':'badge--ferias','Inativo':'badge--inativo'
    };
    return m[s] ?? '';
  }

  getBoolClass(v: boolean): string { return v ? 'badge--sim' : 'badge--nao'; }

  getInitials(nome: string): string {
    return nome.split(' ').slice(0, 2).map(n => n[0]).join('').toUpperCase();
  }

  toggleFuncionario(id: number): void {
    this.funcionarioAberto.set(this.funcionarioAberto() === id ? null : id);
  }

  // ── Modal ─────────────────────────────────────────────────────
  abrirModalNovo(): void {
    this.editando.set(null);
    this.mNome.set(''); this.mCpf.set(''); this.mCarteira.set('');
    this.mFuncao.set(''); this.mHorario.set(''); this.mSalario.set('');
    this.mTelefone.set(''); this.mEmail.set(''); this.mEndereco.set('');
    this.mAdmissao.set(''); this.mObs.set(''); this.mStatus.set('Ativo');
    this.mFoto.set(''); this.mSenha.set('');
    this.mFerias.set(false); this.mAtestado.set(false);
    this.showModal.set(true);
  }

  abrirModalEditar(f: Funcionario, e: Event): void {
    e.stopPropagation();
    this.editando.set(f);
    this.mNome.set(f.nomeCompleto); this.mCpf.set(f.cpf); this.mCarteira.set(f.carteira);
    this.mFuncao.set(f.funcao); this.mHorario.set(f.horario); this.mSalario.set(f.salario);
    this.mTelefone.set(f.telefone); this.mEmail.set(f.email); this.mEndereco.set(f.endereco);
    this.mAdmissao.set(f.dataAdmissao); this.mObs.set(f.observacoes);
    this.mStatus.set(f.status); this.mFoto.set(f.foto ?? '');
    this.mSenha.set(''); this.mFerias.set(f.ferias); this.mAtestado.set(f.atestado);
    this.showModal.set(true);
  }

  fecharModal(): void { if (!this.isSaving()) this.showModal.set(false); }

  abrirFoto(): void { this.fileInputRef?.nativeElement.click(); }

  onFotoSelecionada(e: Event): void {
    const file = (e.target as HTMLInputElement).files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => this.mFoto.set(ev.target?.result as string);
    reader.readAsDataURL(file);
  }

  async salvar(): Promise<void> {
    if (!this.mNome().trim()) return;
    this.isSaving.set(true);
    try {
      const dados = {
        nomeCompleto: this.mNome(), cpf: this.mCpf(), carteira: this.mCarteira(),
        funcao: this.mFuncao(), horario: this.mHorario(), salario: this.mSalario(),
        telefone: this.mTelefone(), email: this.mEmail(), endereco: this.mEndereco(),
        dataAdmissao: this.mAdmissao(), observacoes: this.mObs(),
        status: this.mStatus(), foto: this.mFoto(),
        ferias: this.mFerias(), atestado: this.mAtestado(),
      };
      const ed = this.editando();
      if (ed?.firestoreId) {
        await this.adminData.atualizarFuncionario(ed.firestoreId, dados);
      } else {
        await this.adminData.adicionarFuncionario({
          ...dados, bancoHoras: '0h', bancoHorasPositivo: true,
          historicoBH: [], historicoFerias: [],
        });
      }
      this.fecharModal();
    } catch (err) {
      console.error('[Funcionarios] salvar erro:', err);
    } finally {
      this.isSaving.set(false);
    }
  }

  confirmarExclusao(f: Funcionario, e: Event): void {
    e.stopPropagation();
    this.funcParaExcluir.set(f);
    this.showModalExclusao.set(true);
  }

  cancelarExclusao(): void {
    this.showModalExclusao.set(false);
    this.funcParaExcluir.set(null);
  }

  async confirmarExclusaoFinal(): Promise<void> {
    const f = this.funcParaExcluir();
    if (f?.firestoreId) {
      await this.adminData.excluirFuncionario(f.firestoreId).catch(console.error);
      if (this.funcionarioAberto() === f.id) this.funcionarioAberto.set(null);
    }
    this.cancelarExclusao();
  }

  excluir(id: number, e: Event): void { e.stopPropagation(); /* via modal */ }

  onInput(field: string, e: Event): void {
    const v = (e.target as HTMLInputElement | HTMLTextAreaElement).value;
    const m: Record<string, (v: string) => void> = {
      nome:      v => this.mNome.set(v),
      cpf:       v => this.mCpf.set(v),
      carteira:  v => this.mCarteira.set(v),
      funcao:    v => this.mFuncao.set(v),
      horario:   v => this.mHorario.set(v),
      salario:   v => this.mSalario.set(v),
      telefone:  v => this.mTelefone.set(v),
      email:     v => this.mEmail.set(v),
      endereco:  v => this.mEndereco.set(v),
      obs:       v => this.mObs.set(v),
      senha:     v => this.mSenha.set(v),
      foto:      v => this.mFoto.set(v),
      admissao:  v => {
        // input[type=date] retorna YYYY-MM-DD → converte para DD/MM/AAAA
        if (v.length === 10 && v.includes('-')) {
          const [y, mo, d] = v.split('-');
          this.mAdmissao.set(d + '/' + mo + '/' + y);
        } else {
          this.mAdmissao.set(v);
        }
      },
    };
    m[field]?.(v);
  }

  onSelectStatus(e: Event): void {
    this.mStatus.set((e.target as HTMLSelectElement).value as StatusFuncionario);
  }
}
