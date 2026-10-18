/**
 * Pequeno helper de persistência local (localStorage), usado para substituir o Firebase/Firestore
 * nas telas que ainda não têm endpoint correspondente no novo backend Spring Boot (ex.: Funcionários,
 * Administradores por cargo, Motoboy, Avaliações — nenhuma dessas faz parte do escopo do SRS v3.2).
 *
 * Mantém o mesmo contrato (signals + métodos assíncronos) que as telas já consomem, só troca o
 * "banco" de Firestore por localStorage — nenhum componente precisou mudar.
 *
 * Para o Cardápio, Carrinho, Pedidos e Login/Cadastro (jornada do cliente), a ideia é que esses
 * módulos sejam religados à API real (ver `environment.apiUrl` e `services/api/`) — ver README.
 */

export function loadCollection<T>(key: string, seed: T[]): T[] {
  try {
    const raw = localStorage.getItem(key);
    if (raw) {
      return JSON.parse(raw) as T[];
    }
    localStorage.setItem(key, JSON.stringify(seed));
    return [...seed];
  } catch {
    return [...seed];
  }
}

export function saveCollection<T>(key: string, items: T[]): void {
  try {
    localStorage.setItem(key, JSON.stringify(items));
  } catch {
    // localStorage indisponível (ex.: modo privado) — ignora silenciosamente.
  }
}

export function loadRecord<T>(key: string, seed: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (raw) {
      return JSON.parse(raw) as T;
    }
    localStorage.setItem(key, JSON.stringify(seed));
    return seed;
  } catch {
    return seed;
  }
}

export function saveRecord<T>(key: string, value: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // ignora
  }
}

export function nextId(items: { id: number }[]): number {
  return items.length > 0 ? Math.max(...items.map(i => i.id)) + 1 : 1;
}

export function nextLocalId(prefix: string): string {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}
