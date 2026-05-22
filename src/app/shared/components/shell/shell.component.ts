import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet, RouterLink, RouterLinkActive, Router } from '@angular/router';
import { AuthService } from '../../../services/auth.service';
import { User } from '../../../services/auth.service';

@Component({
  selector: 'app-shell',
  standalone: true,
  imports: [CommonModule, RouterOutlet, RouterLink, RouterLinkActive],
  templateUrl: './shell.component.html',
  styleUrls: ['./shell.component.scss']
})
export class ShellComponent implements OnInit {
  private authService = inject(AuthService);
  private router = inject(Router);

  sidebarOpen = signal(true);
  currentUser = signal<User | null>(null);

  navItems = [
    { label: 'Início',          icon: 'home',         route: '/dashboard' },
    { label: 'Cardápio',        icon: 'cardapio',     route: '/cardapio' },
    { label: 'Pedidos',         icon: 'pedidos',      route: '/pedidos' },
    { label: 'Funcionários',    icon: 'funcionarios', route: '/funcionarios' },
    { label: 'Administradores', icon: 'admins',       route: '/administradores' },
    { label: 'Estoque',         icon: 'estoque',      route: '/estoque' },
    { label: 'Fornecedores',    icon: 'fornecedores', route: '/fornecedores' },
    { label: 'Avaliações',      icon: 'avaliacoes',   route: '/avaliacoes' },
  ];

  ngOnInit(): void {
    this.authService.currentUser$.subscribe((user: User | null) => {
      this.currentUser.set(user);
    });
  }

  toggleSidebar(): void {
    this.sidebarOpen.set(!this.sidebarOpen());
  }

  getInitials(name: string): string {
    return name
      .split(' ')
      .slice(0, 2)
      .map(n => n[0])
      .join('')
      .toUpperCase();
  }

  logout(): void {
    this.authService.logout();
  }
}
