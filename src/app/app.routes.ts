import { Routes } from '@angular/router';
import { authGuard } from './guards/auth.guard';

export const routes: Routes = [
  {
    path: '',
    redirectTo: 'login',
    pathMatch: 'full'
  },
  {
    path: 'login',
    loadComponent: () =>
      import('./pages/login/login.component').then(m => m.LoginComponent)
  },
  {
    path: 'kds',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./pages/kds/kds.component').then(m => m.KdsComponent)
  },
  {
    path: '',
    loadComponent: () =>
      import('./shared/components/shell/shell.component').then(m => m.ShellComponent),
    canActivate: [authGuard],
    children: [
      {
        path: 'dashboard',
        loadComponent: () =>
          import('./pages/dashboard/dashboard.component').then(m => m.DashboardComponent)
      },
      {
        path: 'cardapio',
        loadComponent: () =>
          import('./pages/cardapio/cardapio.component').then(m => m.CardapioComponent)
      },
      {
        path: 'pedidos',
        loadComponent: () =>
          import('./pages/dashboard/dashboard.component').then(m => m.DashboardComponent)
        // TODO: PedidosComponent
      },
      {
        path: 'funcionarios',
        loadComponent: () =>
          import('./pages/dashboard/dashboard.component').then(m => m.DashboardComponent)
        // TODO: FuncionariosComponent
      },
      {
        path: 'administradores',
        loadComponent: () =>
          import('./pages/dashboard/dashboard.component').then(m => m.DashboardComponent)
        // TODO: AdministradoresComponent
      },
      {
        path: 'estoque',
        loadComponent: () =>
          import('./pages/dashboard/dashboard.component').then(m => m.DashboardComponent)
        // TODO: EstoqueComponent
      },
      {
        path: 'fornecedores',
        loadComponent: () =>
          import('./pages/dashboard/dashboard.component').then(m => m.DashboardComponent)
        // TODO: FornecedoresComponent
      },
      {
        path: 'avaliacoes',
        loadComponent: () =>
          import('./pages/dashboard/dashboard.component').then(m => m.DashboardComponent)
        // TODO: AvaliacoesComponent
      }
    ]
  },
  {
    path: '**',
    redirectTo: 'login'
  }
];