import { Injectable } from '@angular/core';

export interface EnderecoPorCep {
  rua: string;
  bairro: string;
  cidade: string;
  estado: string;
}

/** Só os dígitos do CEP (máx. 8). */
export function somenteDigitosCep(valor: string): string {
  return (valor ?? '').replace(/\D/g, '').slice(0, 8);
}

/** Máscara 00000-000 enquanto digita. */
export function formatarCep(valor: string): string {
  const d = somenteDigitosCep(valor);
  return d.length > 5 ? `${d.slice(0, 5)}-${d.slice(5)}` : d;
}

/**
 * Consulta de CEP pelo ViaCEP (https://viacep.com.br) — serviço público e gratuito, sem chave.
 * Devolve null quando o CEP não existe; lança erro quando a rede/serviço falha.
 */
@Injectable({ providedIn: 'root' })
export class CepService {

  async buscar(cep: string): Promise<EnderecoPorCep | null> {
    const digitos = somenteDigitosCep(cep);
    if (digitos.length !== 8) return null;

    const controle = new AbortController();
    const limite = setTimeout(() => controle.abort(), 7000);
    try {
      const resp = await fetch(`https://viacep.com.br/ws/${digitos}/json/`, { signal: controle.signal });
      if (!resp.ok) throw new Error('ViaCEP indisponível');
      const d = await resp.json();
      if (d?.erro) return null;
      return {
        rua: d.logradouro ?? '',
        bairro: d.bairro ?? '',
        cidade: d.localidade ?? '',
        estado: (d.uf ?? '').toUpperCase(),
      };
    } finally {
      clearTimeout(limite);
    }
  }
}
