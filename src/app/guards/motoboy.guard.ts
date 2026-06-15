import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { MotoboyAuthService } from '../services/motoboy-auth.service';

export const motoboyGuard: CanActivateFn = () => {
  const auth = inject(MotoboyAuthService);
  const router = inject(Router);

  if (auth.isAutenticado()) {
    return true;
  }

  router.navigate(['/motoboy/login']);
  return false;
};