import { HttpErrorResponse } from '@angular/common/http';

/**
 * Extrai uma mensagem amigável de um erro HTTP do backend.
 * O backend (GlobalExceptionHandler) devolve { status, error, message, details[] }.
 */
export function mensagemDeErro(err: unknown, padrao: string): string {
  if (err instanceof HttpErrorResponse) {
    if (err.status === 0) {
      return 'Não foi possível conectar ao servidor. Tente novamente em instantes.';
    }
    const corpo = err.error as { message?: string; details?: string[] } | null;
    if (corpo?.details?.length) {
      return corpo.details.map(d => d.replace(/^[^:]+:\s*/, '')).join(' ');
    }
    if (corpo?.message) {
      return corpo.message;
    }
  }
  return padrao;
}
