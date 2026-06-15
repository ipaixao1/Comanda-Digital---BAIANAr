import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { MotoboyAuthService } from '../../../services/motoboy-auth.service';

@Component({
  selector: 'app-motoboy-login',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss'],
})
export class MotoboyLoginComponent {

  matricula = '';
  senha = '';
  senhaVisivel = false;
  erro = '';
  carregando = false;

  constructor(
    private auth: MotoboyAuthService,
    private router: Router,
  ) {
    // Se já está logado, vai direto para entregas
    if (this.auth.isAutenticado()) {
      this.router.navigate(['/motoboy/entregas']);
    }
  }

  fazerLogin(): void {
    this.erro = '';

    if (!this.matricula.trim()) { this.erro = 'Informe sua matrícula.'; return; }
    if (!this.senha.trim())     { this.erro = 'Informe sua senha.'; return; }

    this.carregando = true;

    const result = this.auth.login(this.matricula.trim(), this.senha);

    if (result.success) {
      this.router.navigate(['/motoboy/entregas']);
    } else {
      this.erro = result.error ?? 'Erro ao fazer login.';
      this.carregando = false;
    }
  }
}