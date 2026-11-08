import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { catchError, throwError } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  AreaToken,
  clearToken,
  EVENTO_SESSAO_ADMIN_EXPIRADA,
  EVENTO_SESSAO_EXPIRADA,
  getToken,
} from './auth-token';

/**
 * Anexa `Authorization: Bearer <jwt>` em toda chamada à API (exceto login/cadastro).
 * O token usado depende da rota: `/api/admin/**` usa o token do painel administrativo;
 * as demais rotas usam o token do cliente.
 * Se a API responder 401 com um token presente (expirado/inválido), limpa a sessão dessa área
 * e avisa o app, que redireciona para o login correspondente.
 */
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const daApi = req.url.startsWith(environment.apiUrl);
  const rotaPublicaDeAuth = req.url.startsWith(`${environment.apiUrl}/auth/`);
  const area: AreaToken = req.url.startsWith(`${environment.apiUrl}/admin`) ? 'admin' : 'cliente';
  const token = getToken(area);

  if (!daApi || rotaPublicaDeAuth || !token) {
    return next(req);
  }

  return next(req.clone({ setHeaders: { Authorization: `Bearer ${token}` } })).pipe(
    catchError((err: unknown) => {
      if (err instanceof HttpErrorResponse && err.status === 401) {
        clearToken(area);
        window.dispatchEvent(
          new Event(area === 'admin' ? EVENTO_SESSAO_ADMIN_EXPIRADA : EVENTO_SESSAO_EXPIRADA)
        );
      }
      return throwError(() => err);
    })
  );
};
