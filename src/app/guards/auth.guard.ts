import { inject } from '@angular/core';
import { Router, ActivatedRouteSnapshot } from '@angular/router';
import { AuthService } from '../services/auth.service';

// Guard para rotas da dashboard (somente role: admin)
export const authGuard = (route: ActivatedRouteSnapshot) => {
  const authService = inject(AuthService);
  const router      = inject(Router);

  if (!authService.isAuthenticated()) {
    return router.createUrlTree(['/login']);
  }

  // Cozinha não pode acessar nenhuma rota da dashboard
  if (authService.isCozinha()) {
    return router.createUrlTree(['/kds']);
  }

  return true;
};

// Guard para rota do KDS (somente role: cozinha)
export const kdsGuard = () => {
  const authService = inject(AuthService);
  const router      = inject(Router);

  if (!authService.isAuthenticated()) {
    return router.createUrlTree(['/login']);
  }

  // Admin não pode acessar o KDS
  if (authService.isAdmin()) {
    return router.createUrlTree(['/dashboard']);
  }

  return true;
};
