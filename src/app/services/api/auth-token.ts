/** Guarda o JWT do cliente no localStorage (com try/catch: pode estar indisponível em modo privado). */

const TOKEN_KEY = 'baianar_token';

export const EVENTO_SESSAO_EXPIRADA = 'baianar:sessao-expirada';

export function getToken(): string | null {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

export function setToken(token: string): void {
  try {
    localStorage.setItem(TOKEN_KEY, token);
  } catch {
    // ignora
  }
}

export function clearToken(): void {
  try {
    localStorage.removeItem(TOKEN_KEY);
  } catch {
    // ignora
  }
}
