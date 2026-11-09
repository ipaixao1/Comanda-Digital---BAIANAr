import { Component, signal, computed, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, ActivatedRoute, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CarrinhoService } from '../../../services/carrinho.service';
import { CardapioApiService, ProdutoCardapio } from '../../../services/api/cardapio-api.service';

/** RF-002: detalhe do prato (GET /api/cardapio/{id}) com descrição, tempo de preparo e "Adicionar ao Carrinho". */
@Component({
  selector: 'app-descricao',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './descricao.component.html',
  styleUrls: ['./descricao.component.scss'],
})
export class DescricaoComponent implements OnInit {

  private cardapioApi = inject(CardapioApiService);
  private carrinho    = inject(CarrinhoService);

  produto    = signal<ProdutoCardapio | null>(null);
  carregando = signal<boolean>(true);
  quantidade = signal<number>(1);
  observacao = '';

  totalPreco = computed(() => {
    const p = this.produto();
    return p ? p.preco * this.quantidade() : 0;
  });

  /** Tempo de preparo do prato e o quão elaborado ele é (3 níveis, pela duração). */
  preparo = computed<{ texto: string; rotulo: string; nivel: 1 | 2 | 3 } | null>(() => {
    const min = this.produto()?.tempoPreparoMin;
    if (!min || min <= 0) return null;
    const nivel = min <= 10 ? 1 : min <= 25 ? 2 : 3;
    const rotulo = nivel === 1 ? 'Rápido' : nivel === 2 ? 'Médio' : 'Elaborado';
    const texto = min >= 60
      ? `${Math.floor(min / 60)} h${min % 60 ? ' ' + (min % 60) + ' min' : ''}`
      : `${min} min`;
    return { texto: `Aprox. ${texto}`, rotulo, nivel };
  });

  constructor(private route: ActivatedRoute, private router: Router) {}

  async ngOnInit(): Promise<void> {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    try {
      this.produto.set(await this.cardapioApi.detalhar(id));
    } catch {
      this.produto.set(null);
    } finally {
      this.carregando.set(false);
    }
  }

  voltar(): void {
    this.router.navigate(['/mobile/cardapio']);
  }

  toggleFavorito(): void {
    const p = this.produto();
    if (p) this.produto.set({ ...p, favorito: !p.favorito });
  }

  adicionar(): void {
    this.quantidade.update(q => q + 1);
  }

  remover(): void {
    if (this.quantidade() > 1) this.quantidade.update(q => q - 1);
  }

  // RF-003: adiciona ao carrinho com quantidade e observação.
  adicionarAoCarrinho(): void {
    const p = this.produto();
    if (!p) return;
    this.carrinho.adicionar(
      { id: p.id, nome: p.nome, preco: p.preco, imagem: p.imagem },
      this.quantidade(),
      this.observacao,
    );
    this.router.navigate(['/mobile/carrinho']);
  }

  formatarPreco(preco: number): string {
    return preco.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  }
}
