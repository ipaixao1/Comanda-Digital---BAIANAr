/**
 * Guarda os JWTs no localStorage (com try/catch: pode estar indisponível em modo privado).
 *
 * Há DOIS tokens independentes, um por "área" do sistema, para que o painel administrativo e o
 * app do cliente possam ficar logados no mesmo navegador sem que um sobrescreva o outro:
 *   - 'cliente' → jornada mobile (/mobile/*)
 *   - 'admin'   → painel administrativo e KDS (/api/admin/**)
 */

export type AreaToken = 'admin' | 'cliente';

const CHAVES: Record<AreaToken, string> = {
  cliente: 'baianar_token_cliente',
  admin: 'baianar_token_admin',
};
const CHAVE_LEGADA = 'baianar_token'; // chave única usada antes da separação

/** Disparado quando a API responde 401 para uma chamada do cliente (token expirado/inválido). */
export const EVENTO_SESSAO_EXPIRADA = 'baianar:sessao-expirada';
/** Disparado quando a API responde 401 para uma chamada do painel administrativo. */
export const EVENTO_SESSAO_ADMIN_EXPIRADA = 'baianar:sessao-admin-expirada';

export function getToken(area: AreaToken = 'cliente'): string | null {
  try {
    return localStorage.getItem(CHAVES[area]);
  } catch {
    return null;
  }
}

export function setToken(token: string, area: AreaToken = 'cliente'): void {
  try {
    localStorage.setItem(CHAVES[area], token);
    localStorage.removeItem(CHAVE_LEGADA);
  } catch {
    // ignora
  }
}

export function clearToken(area: AreaToken = 'cliente'): void {
  try {
    localStorage.removeItem(CHAVES[area]);
    localStorage.removeItem(CHAVE_LEGADA);
  } catch {
    // ignora
  }
}
