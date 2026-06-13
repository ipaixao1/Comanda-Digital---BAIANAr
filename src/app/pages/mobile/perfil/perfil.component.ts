import { Component, signal, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ClienteAuthService } from '../../../services/cliente-auth.service';

@Component({
  selector: 'app-perfil-mobile',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './perfil.component.html',
  styleUrls: ['./perfil.component.scss'],
})
export class PerfilMobileComponent implements OnInit {

  isLogado = signal<boolean>(false);
  cliente  = signal<any>(null);

  modalLoginAberto = signal<boolean>(false);
  senhaVisivel     = signal<boolean>(false);
  senhaConfVisivel = signal<boolean>(false);
  modalAba: 'login' | 'cadastro' = 'login';
  loginEmail        = '';
  loginSenha        = '';
  cadastroNome      = '';
  cadastroTelefone  = '';
  cadastroSenhaConf = '';
  loginErro         = '';

  constructor(
    private clienteAuth: ClienteAuthService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.isLogado.set(this.clienteAuth.isAuthenticated());
    this.cliente.set(this.clienteAuth.getCurrentCliente());

    this.clienteAuth.currentCliente$.subscribe(cliente => {
      this.isLogado.set(!!cliente);
      this.cliente.set(cliente);
      this.cdr.detectChanges();
    });
  }

  abrirModal(aba: 'login' | 'cadastro' = 'login'): void {
    this.modalAba = aba;
    this.modalLoginAberto.set(true);
  }

  fecharModal(): void {
    this.modalLoginAberto.set(false);
    this.loginEmail = '';
    this.loginSenha = '';
    this.loginErro  = '';
    this.cadastroNome = '';
    this.cadastroTelefone = '';
    this.cadastroSenhaConf = '';
    this.modalAba = 'login';
  }

  toggleSenhaVisivel(): void { this.senhaVisivel.update(v => !v); }
  toggleSenhaConfVisivel(): void { this.senhaConfVisivel.update(v => !v); }

  async fazerLogin(): Promise<void> {
    this.loginErro = '';
    const result = await this.clienteAuth.login(this.loginEmail, this.loginSenha);
    if (result.success) {
      this.fecharModal();
      this.cdr.detectChanges();
    } else {
      this.loginErro = result.error ?? 'Erro ao fazer login.';
    }
  }

  async fazerCadastro(): Promise<void> {
    this.loginErro = '';
    if (!this.cadastroNome.trim())                  { this.loginErro = 'Informe seu nome.'; return; }
    if (!this.loginEmail.trim())                    { this.loginErro = 'Informe seu email.'; return; }
    if (this.loginSenha.length < 6)                 { this.loginErro = 'Senha deve ter mínimo 6 caracteres.'; return; }
    if (this.loginSenha !== this.cadastroSenhaConf) { this.loginErro = 'As senhas não coincidem.'; return; }
    const result = await this.clienteAuth.cadastrar(this.cadastroNome, this.loginEmail, this.loginSenha, this.cadastroTelefone);
    if (result.success) {
      this.fecharModal();
      this.cdr.detectChanges();
    } else {
      this.loginErro = result.error ?? 'Erro ao cadastrar.';
    }
  }

  fazerLogout(): void {
    this.clienteAuth.logout();
    this.cdr.detectChanges();
  }
}