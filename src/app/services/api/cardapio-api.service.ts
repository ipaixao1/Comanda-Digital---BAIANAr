import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../../environments/environment';
import { PageResponse, PratoPublicoApi } from './api-types';

/** Prato do cardápio já no formato que as telas do cliente usam. */
export interface ProdutoCardapio {
  id: number;
  nome: string;
  descricao: string;
  preco: number;
  imagem: string | null;
  /** slug da categoria (ex.: "principais"), usado para filtrar */
  categoria: string;
  categoriaNome: string;
  tempoPreparoMin: number | null;
  favorito: boolean;
}

/** "Pratos Principais" -> "principais"; "Drinks" -> "drinks" */
export function slugCategoria(nome: string): string {
  return nome
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .trim()
    .replace(/^pratos\s+/, '')
    .replace(/\s+/g, '-');
}

function paraProduto(p: PratoPublicoApi): ProdutoCardapio {
  return {
    id: p.id,
    nome: p.nome,
    descricao: p.descricao ?? '',
    preco: p.precoVenda,
    imagem: p.fotoUrl || null,
    categoria: slugCategoria(p.categoriaNome),
    categoriaNome: p.categoriaNome,
    tempoPreparoMin: p.tempoPreparoMin,
    favorito: false,
  };
}

/** RF-001 e RF-002: cardápio público (sem login). */
@Injectable({ providedIn: 'root' })
export class CardapioApiService {

  private http = inject(HttpClient);
  private base = `${environment.apiUrl}/cardapio`;

  /** Lista todos os pratos ativos, na ordem de cadastro. */
  async listar(): Promise<ProdutoCardapio[]> {
    const page = await firstValueFrom(
      this.http.get<PageResponse<PratoPublicoApi>>(this.base, { params: { size: 200 } })
    );
    return page.content.map(paraProduto).sort((a, b) => a.id - b.id);
  }

  async detalhar(id: number): Promise<ProdutoCardapio> {
    const prato = await firstValueFrom(this.http.get<PratoPublicoApi>(`${this.base}/${id}`));
    return paraProduto(prato);
  }
}
