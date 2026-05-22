import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
})
export class LoginComponent implements OnInit {
  loginForm!: FormGroup;
  isLoading = false;
  errorMessage = '';

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    // Redirecionar se já estiver logado
    if (this.authService.isAuthenticated()) {
      this.router.navigate(['/dashboard']);
    }

    this.loginForm = this.fb.group({
      matricula: ['', [Validators.required]],
      senha: ['', [Validators.required]]
    });
  }

  get matriculaControl() {
    return this.loginForm.get('matricula');
  }

  get senhaControl() {
    return this.loginForm.get('senha');
  }

  get matriculaInvalid(): boolean {
    const ctrl = this.matriculaControl;
    return !!(ctrl && ctrl.invalid && ctrl.touched && ctrl.errors?.['required']);
  }

  get senhaInvalid(): boolean {
    const ctrl = this.senhaControl;
    return !!(ctrl && ctrl.invalid && ctrl.touched && ctrl.errors?.['required']);
  }

  async onSubmit(): Promise<void> {
    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';

    const { matricula, senha } = this.loginForm.value;
    const result = await this.authService.login(matricula, senha);

    this.isLoading = false;

    if (result.success) {
      this.router.navigate(['/dashboard']);
    } else {
      this.errorMessage = result.error || 'Erro ao realizar login.';
    }
  }
}
