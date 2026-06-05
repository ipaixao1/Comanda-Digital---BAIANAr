import { Routes } from '@angular/router';
import { authGuard, kdsGuard } from './guards/auth.guard';

export const routes: Routes = [
  { path: '', redirectTo: 'login', pathMatch: 'full' },
  { path: 'login', loadComponent: () => import('./pages/login/login.component').then(m => m.LoginComponent) },
  { path: 'kds',   canActivate: [kdsGuard], loadComponent: () => import('./pages/kds/kds.component').then(m => m.KdsComponent) },
  {
    path: '',
    loadComponent: () => import('./shared/components/shell/shell.component').then(m => m.ShellComponent),
    canActivate: [authGuard],
    children: [
      { path: 'dashboard',       loadComponent: () => import('./pages/dashboard/dashboard.component').then(m => m.DashboardComponent) },
      { path: 'cardapio',        loadComponent: () => import('./pages/cardapio/cardapio.component').then(m => m.CardapioComponent) },
      { path: 'pedidos',         loadComponent: () => import('./pages/pedidos/pedidos.component').then(m => m.PedidosComponent) },
      { path: 'funcionarios',    loadComponent: () => import('./pages/funcionarios/funcionarios.component').then(m => m.FuncionariosComponent) },
      { path: 'administradores', loadComponent: () => import('./pages/administradores/administradores.component').then(m => m.AdministradoresComponent) },
      { path: 'estoque',         loadComponent: () => import('./pages/estoque/estoque.component').then(m => m.EstoqueComponent) },
      { path: 'fornecedores',    loadComponent: () => import('./pages/fornecedores/fornecedores.component').then(m => m.FornecedoresComponent) },
      { path: 'avaliacoes',      loadComponent: () => import('./pages/avaliacoes/avaliacoes.component').then(m => m.AvaliacoesComponent) },
      { path: 'perfil',          loadComponent: () => import('./pages/perfil/perfil.component').then(m => m.PerfilComponent) },
    ]
  },
  { path: '**', redirectTo: 'login' }
];
