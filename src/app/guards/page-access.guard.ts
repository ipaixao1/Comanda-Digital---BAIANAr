import { inject } from '@angular/core';
import { Router, ActivatedRouteSnapshot } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { PermissionService } from '../services/permission.service';

/**
 * Guard de acesso por página, baseado no cargo do admin logado.
 * Usado nas rotas que o Supervisor não deve conseguir acessar.
 *
 * route.data['pagina'] deve conter o nome da rota (ex: 'estoque', 'pedidos').
 */
export const pageAccessGuard = (route: ActivatedRouteSnapshot) => {
  const authService = inject(AuthService);
  const permission   = inject(PermissionService);
  const router        = inject(Router);

  if (!authService.isAuthenticated()) {
    return router.createUrlTree(['/login']);
  }

  const pagina = route.data?.['pagina'] as string;

  if (pagina && !permission.podeAcessarPagina(pagina)) {
    // Supervisor tentando acessar página não autorizada → redireciona para Cardápio
    return router.createUrlTree(['/cardapio']);
  }

  return true;
};
