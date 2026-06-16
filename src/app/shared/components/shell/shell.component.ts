import { Component, OnInit, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet, RouterLink, RouterLinkActive, Router } from '@angular/router';
import { AuthService } from '../../../services/auth.service';
import { User } from '../../../services/auth.service';
import { PermissionService } from '../../../services/permission.service';

@Component({
  selector: 'app-shell',
  standalone: true,
  imports: [CommonModule, RouterOutlet, RouterLink, RouterLinkActive],
  templateUrl: './shell.component.html',
  styleUrls: ['./shell.component.scss']
})
export class ShellComponent implements OnInit {
  private authService = inject(AuthService);
  private router      = inject(Router);
  permission           = inject(PermissionService);

  sidebarOpen       = signal(true);
  currentUser       = signal<User | null>(null);
  showLogoutConfirm = signal(false);   // ← novo

  private todosItens = [
    { label: 'Início',          icon: 'home',         route: '/dashboard',       pagina: 'dashboard'       },
    { label: 'Cardápio',        icon: 'cardapio',     route: '/cardapio',        pagina: 'cardapio'        },
    { label: 'Pedidos',         icon: 'pedidos',      route: '/pedidos',         pagina: 'pedidos'         },
    { label: 'Funcionários',    icon: 'funcionarios', route: '/funcionarios',    pagina: 'funcionarios'    },
    { label: 'Administradores', icon: 'admins',       route: '/administradores', pagina: 'administradores' },
    { label: 'Estoque',         icon: 'estoque',      route: '/estoque',         pagina: 'estoque'         },
    { label: 'Fornecedores',    icon: 'fornecedores', route: '/fornecedores',    pagina: 'fornecedores'    },
    { label: 'Motoboys',        icon: 'motoboys',     route: '/motoboys',        pagina: 'motoboys'        },
    { label: 'Avaliações',      icon: 'avaliacoes',   route: '/avaliacoes',      pagina: 'avaliacoes'      },
  ];

  // Itens visíveis na sidebar, filtrados conforme o cargo do admin logado
  navItems = computed(() =>
    this.todosItens.filter(item => this.permission.podeAcessarPagina(item.pagina))
  );

  ngOnInit(): void {
    this.authService.currentUser$.subscribe((user: User | null) => {
      this.currentUser.set(user);
    });
  }

  toggleSidebar(): void { this.sidebarOpen.set(!this.sidebarOpen()); }

  getInitials(name: string): string {
    return name.split(' ').slice(0, 2).map(n => n[0]).join('').toUpperCase();
  }

  // Logout com confirmação
  pedirLogout(): void    { this.showLogoutConfirm.set(true); }
  cancelarLogout(): void { this.showLogoutConfirm.set(false); }
  confirmarLogout(): void {
    this.showLogoutConfirm.set(false);
    this.authService.logout();
  }

  irParaPerfil(): void { this.router.navigate(['/perfil']); }

  logout(): void { this.pedirLogout(); }
}
