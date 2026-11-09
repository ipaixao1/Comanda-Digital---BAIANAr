import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { AuthService } from '../../services/auth.service';
import { PermissionService } from '../../services/permission.service';
import { UsuarioAdminApiService } from '../../services/api/usuario-admin-api.service';
import { PerfilApi, UsuarioApi, UsuarioPayload } from '../../services/api/api-types';
import { mensagemDeErro } from '../../services/api/api-error';

type PerfilEditavel = 'GERENTE' | 'COZINHEIRO';

/**
 * Contas de acesso ao sistema (RF-041), ligadas à API: /api/admin/usuarios.
 * - Somente o perfil ADMIN (Dono) consegue listar/criar/editar/desativar (regra do backend).
 * - O backend só cria/edita GERENTE e COZINHEIRO; contas ADMIN aparecem, mas não são editáveis aqui.
 * - Senhas nunca são exibidas: ficam com BCrypt no servidor. Na edição, senha em branco = manter.
 */
@Component({
  selector: 'app-administradores', standalone: true, imports: [CommonModule],
  templateUrl: './administradores.component.html', styleUrls: ['./administradores.component.scss']
})
export class AdministradoresComponent implements OnInit {
  private authService = inject(AuthService);
  private api         = inject(UsuarioAdminApiService);
  permission           = inject(PermissionService);

  // Só o Dono (ADMIN) pode alterar contas — o backend recusa os demais perfis com 403.
  podeEditar = this.permission.isDono();

  usuarios     = signal<UsuarioApi[]>([]);
  carregando   = signal(true);
  erroLista    = signal('');
  erroModal    = signal('');

  showModal         = signal(false);
  editando          = signal<UsuarioApi | null>(null);
  isSaving          = signal(false);
  showModalExclusao = signal(false);
  paraDesativar     = signal<UsuarioApi | null>(null);
  erroDesativar     = signal('');

  mNome     = signal('');
  mEmail    = signal('');
  mSenha    = signal('');
  mTelefone = signal('');
  mPerfil   = signal<PerfilEditavel>('GERENTE');

  perfisEditaveis: { valor: PerfilEditavel; rotulo: string }[] = [
    { valor: 'GERENTE',    rotulo: 'Gerente' },
    { valor: 'COZINHEIRO', rotulo: 'Cozinheiro' },
  ];

  ngOnInit(): void { void this.carregar(); }

  async carregar(): Promise<void> {
    this.carregando.set(true);
    this.erroLista.set('');
    try {
      this.usuarios.set(await this.api.listar());
    } catch (err) {
      if (err instanceof HttpErrorResponse && err.status === 403) {
        this.erroLista.set('Somente o Dono (administrador) pode ver e gerenciar as contas de acesso.');
      } else {
        this.erroLista.set(mensagemDeErro(err, 'Não foi possível carregar os usuários.'));
      }
    } finally {
      this.carregando.set(false);
    }
  }

  getPrimeiroNome(): string {
    const u = this.authService.getCurrentUser();
    return u?.nomeCompleto?.split(' ')[0] || u?.matricula || '';
  }

  getInitials(nome: string): string {
    return nome.split(' ').slice(0, 2).map(n => n[0]).join('').toUpperCase();
  }

  rotuloPerfil(p: PerfilApi): string {
    return ({ ADMIN: 'Dono', GERENTE: 'Gerente', COZINHEIRO: 'Cozinheiro', CLIENTE: 'Cliente' } as const)[p];
  }

  getCargoClass(p: PerfilApi): string {
    return ({ ADMIN: 'cargo--dono', GERENTE: 'cargo--gerente', COZINHEIRO: 'cargo--supervisor', CLIENTE: '' } as const)[p];
  }

  /** O backend não permite editar/desativar contas ADMIN por este endpoint. */
  editavel(u: UsuarioApi): boolean { return this.podeEditar && u.perfil !== 'ADMIN' && u.status === 'ATIVO'; }

  abrirModalNovo(): void {
    this.editando.set(null);
    this.mNome.set(''); this.mEmail.set(''); this.mSenha.set('');
    this.mTelefone.set(''); this.mPerfil.set('GERENTE');
    this.erroModal.set('');
    this.showModal.set(true);
  }

  abrirModalEditar(u: UsuarioApi, e?: Event): void {
    e?.stopPropagation();
    this.editando.set(u);
    this.mNome.set(u.nome); this.mEmail.set(u.email); this.mSenha.set('');
    this.mTelefone.set(u.telefone ?? '');
    this.mPerfil.set(u.perfil === 'COZINHEIRO' ? 'COZINHEIRO' : 'GERENTE');
    this.erroModal.set('');
    this.showModal.set(true);
  }

  fecharModal(): void { if (!this.isSaving()) this.showModal.set(false); }

  async salvar(): Promise<void> {
    if (!this.podeEditar) return;

    const nome  = this.mNome().trim();
    const email = this.mEmail().trim();
    const senha = this.mSenha();
    const ed    = this.editando();

    if (!nome) { this.erroModal.set('Informe o nome.'); return; }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { this.erroModal.set('Informe um e-mail válido.'); return; }
    if (!ed && senha.length < 6) { this.erroModal.set('Defina uma senha de pelo menos 6 caracteres.'); return; }
    if (ed && senha && senha.length < 6) { this.erroModal.set('A nova senha deve ter pelo menos 6 caracteres.'); return; }

    const payload: UsuarioPayload = {
      nome, email, perfil: this.mPerfil(),
      telefone: this.mTelefone().trim() || null,
      ...(senha ? { senha } : {}),
    };

    this.isSaving.set(true);
    this.erroModal.set('');
    try {
      if (ed) await this.api.atualizar(ed.id, payload);
      else    await this.api.criar(payload);
      this.showModal.set(false);
      await this.carregar();
    } catch (err) {
      this.erroModal.set(mensagemDeErro(err, 'Não foi possível salvar o usuário.'));
    } finally {
      this.isSaving.set(false);
    }
  }

  confirmarDesativacao(u: UsuarioApi, e?: Event): void {
    e?.stopPropagation();
    this.paraDesativar.set(u);
    this.erroDesativar.set('');
    this.showModalExclusao.set(true);
  }

  cancelarDesativacao(): void {
    this.showModalExclusao.set(false);
    this.paraDesativar.set(null);
  }

  async confirmarDesativacaoFinal(): Promise<void> {
    if (!this.podeEditar) return;
    const u = this.paraDesativar();
    if (!u) return;
    try {
      await this.api.desativar(u.id);
      this.cancelarDesativacao();
      await this.carregar();
    } catch (err) {
      this.erroDesativar.set(mensagemDeErro(err, 'Não foi possível desativar o usuário.'));
    }
  }

  onInput(field: string, e: Event): void {
    const v = (e.target as HTMLInputElement).value;
    if (field === 'nome')     this.mNome.set(v);
    if (field === 'email')    this.mEmail.set(v);
    if (field === 'senha')    this.mSenha.set(v);
    if (field === 'telefone') this.mTelefone.set(v);
  }

  onSelectPerfil(e: Event): void {
    this.mPerfil.set((e.target as HTMLSelectElement).value as PerfilEditavel);
  }
}
