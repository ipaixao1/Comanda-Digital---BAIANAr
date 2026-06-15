import { Component, signal, computed, inject, OnInit, ElementRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService, User } from '../../services/auth.service';

@Component({
  selector: 'app-perfil',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './perfil.component.html',
  styleUrls: ['./perfil.component.scss']
})
export class PerfilComponent implements OnInit {
  @ViewChild('fileInput') fileInputRef!: ElementRef<HTMLInputElement>;
  private authService = inject(AuthService);

  editando  = signal(false);
  isSaving  = signal(false);
  user      = signal<User | null>(null);

  // Signals do formulário
  fNome     = signal('');
  fEmail    = signal('');
  fTelefone = signal('');
  fSenha    = signal('');
  fFoto     = signal('');

  ngOnInit(): void {
    this.authService.currentUser$.subscribe(u => {
      this.user.set(u);
      if (u) {
        this.fNome.set(u.nomeCompleto);
        this.fEmail.set(u.email ?? '');
        this.fTelefone.set(u.telefone ?? '');
        this.fSenha.set(u.senha ?? '');
        this.fFoto.set(u.foto ?? '');
      }
    });
  }

  getInitials(): string {
    return (this.user()?.nomeCompleto ?? '')
      .split(' ').slice(0, 2).map(n => n[0]).join('').toUpperCase();
  }

  getPrimeiroNome(): string {
    return this.user()?.nomeCompleto?.split(' ')[0] || '';
  }

  getCargoClass(cargo: string): string {
    return { 'Dono': 'cargo--dono', 'Gerente': 'cargo--gerente', 'Supervisor': 'cargo--supervisor' }[cargo] ?? 'cargo--gerente';
  }

  abrirEdicao(): void { this.editando.set(true); }
  cancelar(): void    { this.editando.set(false); this.ngOnInit(); }

  abrirFoto(): void { this.fileInputRef?.nativeElement.click(); }

  onFotoSelecionada(e: Event): void {
    const file = (e.target as HTMLInputElement).files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => this.fFoto.set(ev.target?.result as string);
    reader.readAsDataURL(file);
  }

  salvar(): void {
    if (!this.fNome().trim()) return;
    this.isSaving.set(true);
    this.authService.updateProfile({
      nomeCompleto: this.fNome().trim(),
      email:        this.fEmail().trim(),
      telefone:     this.fTelefone().trim(),
      senha:        this.fSenha().trim(),
      foto:         this.fFoto(),
    });
    this.isSaving.set(false);
    this.editando.set(false);
  }

  onInput(field: string, e: Event): void {
    const v = (e.target as HTMLInputElement).value;
    if (field === 'nome')     this.fNome.set(v);
    if (field === 'email')    this.fEmail.set(v);
    if (field === 'telefone') this.fTelefone.set(v);
    if (field === 'senha')    this.fSenha.set(v);
    if (field === 'foto')     this.fFoto.set(v);
  }
}
