import { Routes } from '@angular/router';
import { authGuard, kdsGuard } from './guards/auth.guard';
import { motoboyGuard } from './guards/motoboy.guard';
import { pageAccessGuard } from './guards/page-access.guard';

export const routes: Routes = [
  { path: '', redirectTo: 'mobile/cardapio', pathMatch: 'full' },
  { path: 'login', loadComponent: () => import('./pages/login/login.component').then(m => m.LoginComponent) },
  { path: 'kds', canActivate: [kdsGuard], loadComponent: () => import('./pages/kds/kds.component').then(m => m.KdsComponent) },

  // ── Rotas mobile — todas dentro do MobileComponent (max-width: 430px) ──
  {
    path: 'mobile',
    loadComponent: () => import('./pages/mobile/mobile.component').then(m => m.MobileComponent),
    children: [
      { path: 'cardapio', loadComponent: () => import('./pages/mobile/cardapio/cardapio.component').then(m => m.CardapioComponent) },
      { path: 'buscar',   loadComponent: () => import('./pages/mobile/buscar/buscar.component').then(m => m.BuscarComponent) },
      { path: 'produto/:id', loadComponent: () => import('./pages/mobile/descricao/descricao.component').then(m => m.DescricaoComponent) },
      { path: 'pedidos',  loadComponent: () => import('./pages/mobile/pedidos/pedidos.component').then(m => m.PedidosMobileComponent) },
      { path: 'perfil',   loadComponent: () => import('./pages/mobile/perfil/perfil.component').then(m => m.PerfilMobileComponent) },
      { path: 'favoritos',   loadComponent: () => import('./pages/mobile/favoritos/favoritos.component').then(m => m.FavoritosComponent) },
      { path: 'enderecos', loadComponent: () => import('./pages/mobile/enderecos/enderecos.component').then(m => m.EnderecosComponent) },
      { path: 'configuracoes', loadComponent: () => import('./pages/mobile/configuracao/configuracao.component').then(m => m.ConfiguracoesComponent) },
      { path: 'carrinho', loadComponent: () => import('./pages/mobile/carrinho/carrinho.component').then(m => m.CarrinhoComponent) },
      { path: 'finalizar-pedido', loadComponent: () => import('./pages/mobile/finalizar-pedido/finalizar-pedido.component').then(m => m.FinalizarPedidoComponent) },
      { path: 'status-pedido', loadComponent: () => import('./pages/mobile/status-pedido/status-pedido.component').then(m => m.StatusPedidoComponent) },
      { path: 'avaliacao', loadComponent: () => import('./pages/mobile/avaliacao/avaliacao.component').then(m => m.AvaliacaoComponent) },
    ]
  },

  // ── Rotas motoboy ──
  {
    path: 'motoboy',
    loadComponent: () => import('./pages/motoboy/motoboy.component').then(m => m.MotoboyComponent),
    children: [
      { path: '', redirectTo: 'login', pathMatch: 'full' },
      { path: 'login', loadComponent: () => import('./pages/motoboy/login/login.component').then(m => m.MotoboyLoginComponent) },
      { path: 'entregas', canActivate: [motoboyGuard], loadComponent: () => import('./pages/motoboy/entregas/entregas.component').then(m => m.EntregasComponent) },
      { path: 'entrega/:id', canActivate: [motoboyGuard], loadComponent: () => import('./pages/motoboy/entrega-detalhe/entrega-detalhe.component').then(m => m.EntregaDetalheComponent) },
    ]
  },

  // ── Rotas desktop/admin ──
  {
    path: '',
    loadComponent: () => import('./shared/components/shell/shell.component').then(m => m.ShellComponent),
    canActivate: [authGuard],
    children: [
      { path: 'dashboard',       canActivate: [pageAccessGuard], data: { pagina: 'dashboard' },       loadComponent: () => import('./pages/dashboard/dashboard.component').then(m => m.DashboardComponent) },
      { path: 'cardapio',        canActivate: [pageAccessGuard], data: { pagina: 'cardapio' },        loadComponent: () => import('./pages/cardapio/cardapio.component').then(m => m.CardapioComponent) },
      { path: 'pedidos',         canActivate: [pageAccessGuard], data: { pagina: 'pedidos' },         loadComponent: () => import('./pages/pedidos/pedidos.component').then(m => m.PedidosComponent) },
      { path: 'funcionarios',    canActivate: [pageAccessGuard], data: { pagina: 'funcionarios' },    loadComponent: () => import('./pages/funcionarios/funcionarios.component').then(m => m.FuncionariosComponent) },
      { path: 'administradores', canActivate: [pageAccessGuard], data: { pagina: 'administradores' }, loadComponent: () => import('./pages/administradores/administradores.component').then(m => m.AdministradoresComponent) },
      { path: 'estoque',         canActivate: [pageAccessGuard], data: { pagina: 'estoque' },         loadComponent: () => import('./pages/estoque/estoque.component').then(m => m.EstoqueComponent) },
      { path: 'fornecedores',    canActivate: [pageAccessGuard], data: { pagina: 'fornecedores' },    loadComponent: () => import('./pages/fornecedores/fornecedores.component').then(m => m.FornecedoresComponent) },
      { path: 'motoboys',        canActivate: [pageAccessGuard], data: { pagina: 'motoboys' },        loadComponent: () => import('./pages/motoboys-admin/motoboys-admin.component').then(m => m.MotoboysAdminComponent) },
      { path: 'avaliacoes',      canActivate: [pageAccessGuard], data: { pagina: 'avaliacoes' },      loadComponent: () => import('./pages/avaliacoes/avaliacoes.component').then(m => m.AvaliacoesComponent) },
      { path: 'perfil',          canActivate: [pageAccessGuard], data: { pagina: 'perfil' },          loadComponent: () => import('./pages/perfil/perfil.component').then(m => m.PerfilComponent) },
    ]
  },
  { path: '**', redirectTo: 'login' }
];