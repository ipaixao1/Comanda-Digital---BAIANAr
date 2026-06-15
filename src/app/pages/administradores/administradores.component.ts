import { Component, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../services/auth.service';

export type CargoAdmin = 'Dono' | 'Gerente' | 'Supervisor';
export type StatusAdmin = 'Ativo' | 'Inativo';

export interface Administrador {
  id: number;
  matricula: string;
  nome: string;
  senha: string;
  cargo: CargoAdmin;
  telefone: string;
  email: string;
  status: StatusAdmin;
  foto: string;
  senhaVisivel: boolean;
}

@Component({
  selector: 'app-administradores', standalone: true, imports: [CommonModule],
  templateUrl: './administradores.component.html', styleUrls: ['./administradores.component.scss']
})
export class AdministradoresComponent {
  private authService = inject(AuthService);

  showModal  = signal(false);
  editando   = signal<Administrador | null>(null);
  isSaving            = signal(false);
  showModalExclusao   = signal(false);
  adminParaExcluir    = signal<Administrador | null>(null);

  // Signals do modal
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

  admins = signal<Administrador[]>([
    { id:1, matricula:'ADM001', nome:'Eliacira Santos', senha:'123456', cargo:'Dono',       telefone:'11979745714', email:'santos.eli@baianar.com',   status:'Ativo', foto:'', senhaVisivel:false },
    { id:2, matricula:'ADM002', nome:'Isabel Paixão',   senha:'12345',  cargo:'Gerente',    telefone:'11979907856', email:'paixao.bel@baianar.com',   status:'Ativo', foto:'', senhaVisivel:false },
    { id:3, matricula:'ADM003', nome:'Eliza Moreira',   senha:'1234',   cargo:'Gerente',    telefone:'11979896257', email:'moreira.liz@baianar.com',  status:'Ativo', foto:'', senhaVisivel:false },
    { id:4, matricula:'ADM004', nome:'Evellyn Reis',    senha:'123',    cargo:'Gerente',    telefone:'11966714161', email:'reis.eve@baianar.com',     status:'Ativo', foto:'', senhaVisivel:false },
    { id:5, matricula:'ADM005', nome:'Lucas Oliveira',  senha:'12',     cargo:'Supervisor', telefone:'11987654321', email:'oliveira.luc@baianar.com', status:'Ativo', foto:'', senhaVisivel:false },
  ]);

  getPrimeiroNome(): string {
    const u = this.authService.getCurrentUser();
    return u?.nomeCompleto?.split(' ')[0] || u?.matricula || '';
  }

  getInitials(nome: string): string {
    return nome.split(' ').slice(0, 2).map(n => n[0]).join('').toUpperCase();
  }

  getCargoClass(c: CargoAdmin): string {
    return { 'Dono':'cargo--dono', 'Gerente':'cargo--gerente', 'Supervisor':'cargo--supervisor' }[c] ?? '';
  }

  toggleSenha(id: number, e: Event): void {
    e.stopPropagation();
    this.admins.update(l => l.map(a => a.id === id ? { ...a, senhaVisivel: !a.senhaVisivel } : a));
  }

  // ── Modal ──────────────────────────────────────────────────────
  abrirModalNovo(): void {
    this.editando.set(null);
    this.mNome.set(''); this.mMatricula.set(''); this.mSenha.set('');
    this.mCargo.set('Supervisor'); this.mTelefone.set('');
    this.mEmail.set(''); this.mStatus.set('Ativo'); this.mFoto.set('');
    this.showModal.set(true);
  }

  abrirModalEditar(a: Administrador, e: Event): void {
    e.stopPropagation();
    this.editando.set(a);
    this.mNome.set(a.nome); this.mMatricula.set(a.matricula); this.mSenha.set(a.senha);
    this.mCargo.set(a.cargo); this.mTelefone.set(a.telefone);
    this.mEmail.set(a.email); this.mStatus.set(a.status); this.mFoto.set(a.foto ?? '');
    this.showModal.set(true);
  }

  fecharModal(): void { if (!this.isSaving()) this.showModal.set(false); }

  salvar(): void {
    if (!this.mNome().trim() || !this.mMatricula().trim()) return;
    this.isSaving.set(true);
    const dados = {
      nome: this.mNome(), matricula: this.mMatricula().toUpperCase(),
      senha: this.mSenha(), cargo: this.mCargo(),
      telefone: this.mTelefone(), email: this.mEmail(),
      status: this.mStatus(), foto: this.mFoto(),
    };
    const ed = this.editando();
    if (ed) {
      this.admins.update(l => l.map(a => a.id === ed.id ? { ...a, ...dados } : a));
    } else {
      this.admins.update(l => [...l, { id: Date.now(), senhaVisivel: false, ...dados }]);
    }
    this.isSaving.set(false);
    this.fecharModal();
  }

  confirmarExclusao(a: Administrador, e: Event): void {
    e.stopPropagation();
    this.adminParaExcluir.set(a);
    this.showModalExclusao.set(true);
  }

  cancelarExclusao(): void {
    this.showModalExclusao.set(false);
    this.adminParaExcluir.set(null);
  }

  confirmarExclusaoFinal(): void {
    const a = this.adminParaExcluir();
    if (a) this.admins.update(l => l.filter(x => x.id !== a.id));
    this.cancelarExclusao();
  }

  excluir(id: number, e: Event): void {
    e.stopPropagation();
    this.admins.update(l => l.filter(a => a.id !== id));
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

  onSelectCargo(e: Event):  void { this.mCargo.set((e.target  as HTMLSelectElement).value as CargoAdmin); }
  onSelectStatus(e: Event): void { this.mStatus.set((e.target as HTMLSelectElement).value as StatusAdmin); }
}
