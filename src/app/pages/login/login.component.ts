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
      const user = this.authService.getCurrentUser();
      if (user?.role === 'cozinha') {
        this.router.navigate(['/kds']);
      } else {
        this.router.navigate(['/dashboard']);
      }
    }

  this.loginForm = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    senha: ['', [Validators.required]]
  });
}

  get emailControl() {
  return this.loginForm.get('email');
}

  get senhaControl() {
    return this.loginForm.get('senha');
  }

  get emailInvalid(): boolean {
    const ctrl = this.emailControl;
    return !!(ctrl && ctrl.invalid && ctrl.touched);
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

    const { email, senha } = this.loginForm.value;
     const result = await this.authService.login(email, senha);

    this.isLoading = false;

    if (result.success) {
      const user = this.authService.getCurrentUser();
      if (user?.role === 'cozinha') {
        this.router.navigate(['/kds']);
      } else {
        this.router.navigate(['/dashboard']);
      }
    } else {
      this.errorMessage = result.error || 'Erro ao realizar login.';
    }
  }
}