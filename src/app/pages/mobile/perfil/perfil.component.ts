import { Component, signal, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
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
  cadastroEndereco  = '';
  cadastroSenhaConf = '';
  loginErro         = '';

  // RF-005: se o cliente veio do carrinho, depois do login volta direto para o checkout.
  private redirectApos: string | null = null;

  constructor(
    private clienteAuth: ClienteAuthService,
    private route: ActivatedRoute,
    private router: Router,
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

    const q = this.route.snapshot.queryParamMap;
    this.redirectApos = q.get('redirect');
    if (q.get('login') && !this.clienteAuth.isAuthenticated()) {
      this.abrirModal('login');
    }
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
    this.cadastroEndereco = '';
    this.cadastroSenhaConf = '';
    this.modalAba = 'login';
  }

  toggleSenhaVisivel(): void { this.senhaVisivel.update(v => !v); }
  toggleSenhaConfVisivel(): void { this.senhaConfVisivel.update(v => !v); }

  private aposAutenticar(): void {
    this.fecharModal();
    this.cdr.detectChanges();
    if (this.redirectApos) {
      const destino = this.redirectApos;
      this.redirectApos = null;
      this.router.navigateByUrl(destino);
    }
  }

  async fazerLogin(): Promise<void> {
    this.loginErro = '';
    const result = await this.clienteAuth.login(this.loginEmail, this.loginSenha);
    if (result.success) {
      this.aposAutenticar();
    } else {
      this.loginErro = result.error ?? 'Erro ao fazer login.';
    }
  }

  async fazerCadastro(): Promise<void> {
    this.loginErro = '';
    if (!this.cadastroNome.trim())                  { this.loginErro = 'Informe seu nome.'; return; }
    if (!this.loginEmail.trim())                    { this.loginErro = 'Informe seu email.'; return; }
    if (!this.cadastroTelefone.trim())              { this.loginErro = 'Informe seu telefone.'; return; }
    if (!this.cadastroEndereco.trim())              { this.loginErro = 'Informe seu endereço de entrega.'; return; }
    if (this.loginSenha.length < 6)                 { this.loginErro = 'Senha deve ter mínimo 6 caracteres.'; return; }
    if (this.loginSenha !== this.cadastroSenhaConf) { this.loginErro = 'As senhas não coincidem.'; return; }
    const result = await this.clienteAuth.cadastrar(
      this.cadastroNome, this.loginEmail, this.loginSenha, this.cadastroTelefone, this.cadastroEndereco
    );
    if (result.success) {
      this.aposAutenticar();
    } else {
      this.loginErro = result.error ?? 'Erro ao cadastrar.';
    }
  }

  fazerLogout(): void {
    this.clienteAuth.logout();
    this.cdr.detectChanges();
  }
}
