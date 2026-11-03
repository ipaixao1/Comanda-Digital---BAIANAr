import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { catchError, throwError } from 'rxjs';
import { environment } from '../../../environments/environment';
import { clearToken, EVENTO_SESSAO_EXPIRADA, getToken } from './auth-token';

/**
 * Anexa `Authorization: Bearer <jwt>` em toda chamada à API (exceto login/cadastro).
 * Se a API responder 401 com um token presente (expirado/inválido), limpa a sessão e avisa o app.
 */
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const daApi = req.url.startsWith(environment.apiUrl);
  const rotaPublicaDeAuth = req.url.startsWith(`${environment.apiUrl}/auth/`);
  const token = getToken();

  if (!daApi || rotaPublicaDeAuth || !token) {
    return next(req);
  }

  return next(req.clone({ setHeaders: { Authorization: `Bearer ${token}` } })).pipe(
    catchError((err: unknown) => {
      if (err instanceof HttpErrorResponse && err.status === 401) {
        clearToken();
        window.dispatchEvent(new Event(EVENTO_SESSAO_EXPIRADA));
      }
      return throwError(() => err);
    })
  );
};
