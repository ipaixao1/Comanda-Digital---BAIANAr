import { Component, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../services/auth.service';
import { AdminDataService, Administrador, CargoAdmin, StatusAdmin } from '../../services/admin-data.service';
import { PermissionService } from '../../services/permission.service';

@Component({
  selector: 'app-administradores', standalone: true, imports: [CommonModule],
  templateUrl: './administradores.component.html', styleUrls: ['./administradores.component.scss']
})
export class AdministradoresComponent {
  private authService = inject(AuthService);
  private adminData   = inject(AdminDataService);
  permission           = inject(PermissionService);

  // Esta página só é editável pelo Dono — Gerente e Supervisor têm acesso somente leitura
  podeEditar = this.permission.podeEditar('administradores');

  showModal           = signal(false);
  editando            = signal<Administrador | null>(null);
  isSaving            = signal(false);
  showModalExclusao   = signal(false);
  adminParaExcluir    = signal<Administrador | null>(null);

  mNome      = signal('');
  mMatricula = signal('');
  mSenha     = signal('');
  mCargo     = signal<CargoAdmin>('Supervisor');
  mTelefone  = signal('');
  mEmail     = signal('');
  mStatus    = signal<StatusAdmin>('Ativo');
  mFoto      = signal('');

  cargos:       CargoAdmin[]  = ['Dono', 'Gerente', 'Supervisor'];
  statusOpcoes: StatusAdmin[] = ['Ativo', 'Inativo'];

  // Dados vivos do Firestore
  admins = this.adminData.administradores;

  getPrimeiroNome(): string {
    const u = this.authService.getCurrentUser();
    return u?.nomeCompleto?.split(' ')[0] || u?.matricula || '';
  }

  getInitials(nome: string): string {
    return nome.split(' ').slice(0, 2).map(n => n[0]).join('').toUpperCase();
  }

  toggleSenha(id: number, e?: Event): void {
    e?.stopPropagation();
    // Alterna visibilidade apenas localmente (sem persistir no Firestore)
    const lista = this.admins();
    const adm = lista.find(a => a.id === id);
    if (adm) (adm as any).senhaVisivel = !(adm as any).senhaVisivel;
  }

  getCargoClass(cargo: CargoAdmin): string {
    const map: Record<CargoAdmin, string> = {
      'Dono':       'cargo--dono',
      'Gerente':    'cargo--gerente',
      'Supervisor': 'cargo--supervisor',
    };
    return map[cargo] ?? '';
  }

  toggleSenhaAdmin(adm: Administrador): void {
    (adm as any).senhaVisivel = !(adm as any).senhaVisivel;
  }

  abrirModalNovo(): void {
    this.editando.set(null);
    this.mNome.set(''); this.mMatricula.set(''); this.mSenha.set('');
    this.mCargo.set('Supervisor'); this.mTelefone.set(''); this.mEmail.set('');
    this.mStatus.set('Ativo'); this.mFoto.set('');
    this.showModal.set(true);
  }

  abrirModalEditar(adm: Administrador, e?: Event): void {
    e?.stopPropagation();
    this.editando.set(adm);
    this.mNome.set(adm.nome); this.mMatricula.set(adm.matricula); this.mSenha.set(adm.senha);
    this.mCargo.set(adm.cargo); this.mTelefone.set(adm.telefone); this.mEmail.set(adm.email);
    this.mStatus.set(adm.status); this.mFoto.set(adm.foto ?? '');
    this.showModal.set(true);
  }

  fecharModal(): void { if (!this.isSaving()) this.showModal.set(false); }

  async salvar(): Promise<void> {
    if (!this.podeEditar) return;
    if (!this.mNome().trim() || !this.mMatricula().trim()) return;
    this.isSaving.set(true);
    try {
      const dados = {
        nome: this.mNome(), matricula: this.mMatricula().toUpperCase(),
        senha: this.mSenha(), cargo: this.mCargo(),
        telefone: this.mTelefone(), email: this.mEmail(),
        status: this.mStatus(), foto: this.mFoto(), senhaVisivel: false,
      };
      const ed = this.editando();
      if (ed?.firestoreId) {
        await this.adminData.atualizarAdmin(ed.firestoreId, dados);
      } else {
        await this.adminData.adicionarAdmin(dados);
      }
      this.fecharModal();
    } catch (err) {
      console.error('[Administradores] salvar erro:', err);
    } finally {
      this.isSaving.set(false);
    }
  }

  confirmarExclusao(adm: Administrador, e?: Event): void {
    e?.stopPropagation();
    this.adminParaExcluir.set(adm);
    this.showModalExclusao.set(true);
  }

  cancelarExclusao(): void {
    this.showModalExclusao.set(false);
    this.adminParaExcluir.set(null);
  }

  async confirmarExclusaoFinal(): Promise<void> {
    if (!this.podeEditar) return;
    const adm = this.adminParaExcluir();
    if (adm?.firestoreId) {
      await this.adminData.excluirAdmin(adm.firestoreId).catch(console.error);
    }
    this.cancelarExclusao();
  }

  onInput(field: string, e: Event): void {
    const v = (e.target as HTMLInputElement).value;
    if (field === 'nome')      this.mNome.set(v);
    if (field === 'matricula') this.mMatricula.set(v);
    if (field === 'senha')     this.mSenha.set(v);
    if (field === 'telefone')  this.mTelefone.set(v);
    if (field === 'email')     this.mEmail.set(v);
    if (field === 'foto')      this.mFoto.set(v);
  }

  onSelectCargo(e: Event): void { this.mCargo.set((e.target as HTMLSelectElement).value as CargoAdmin); }
  onSelectStatus(e: Event): void { this.mStatus.set((e.target as HTMLSelectElement).value as StatusAdmin); }
}
