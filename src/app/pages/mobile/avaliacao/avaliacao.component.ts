import { Component, OnInit, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router, ActivatedRoute } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AvaliacaoService } from '../../../services/avaliacao.service';
import { PedidoService, PedidoShared } from '../../../services/pedido.service';
import { ClienteAuthService } from '../../../services/cliente-auth.service';

@Component({
  selector: 'app-avaliacao',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './avaliacao.component.html',
  styleUrls: ['./avaliacao.component.scss'],
})
export class AvaliacaoComponent implements OnInit {

  private avaliacaoService = inject(AvaliacaoService);
  private pedidoService    = inject(PedidoService);
  private clienteAuth      = inject(ClienteAuthService);
  private router           = inject(Router);
  private route            = inject(ActivatedRoute);

  // Pedido sendo avaliado
  pedido = signal<PedidoShared | null>(null);

  // Estrelas selecionadas
  notaSelecionada = signal(0);
  notaHover       = signal(0);
  comentario      = '';

  enviando  = signal(false);
  enviado   = signal(false);
  jaAvaliado = signal(false);

  // Avaliações do cliente (para exibir histórico com respostas)
  avaliacoesDoCliente = computed(() => {
    const id = this.clienteAuth.getCurrentCliente()?.id;
    if (!id) return [];
    return this.avaliacaoService.getAvaliacoesCliente(id);
  });

  ngOnInit(): void {
    const pedidoId = this.route.snapshot.queryParamMap.get('pedidoId') ?? '';

    if (pedidoId) {
      const p = this.pedidoService.getPedido(pedidoId);
      if (p) this.pedido.set(p);
      this.jaAvaliado.set(this.avaliacaoService.pedidoJaAvaliado(pedidoId));
    }
  }

  get pedidoItensResumo(): string {
    return this.pedido()?.itens.map(i => i.nome).join(', ') ?? '';
  }

  get estrelas(): number[] { return [1, 2, 3, 4, 5]; }

  setNota(n: number):  void { this.notaSelecionada.set(n); }
  setHover(n: number): void { this.notaHover.set(n); }
  clearHover():        void { this.notaHover.set(0); }

  estrelaNota(n: number): boolean {
    return n <= (this.notaHover() || this.notaSelecionada());
  }

  async enviarAvaliacao(): Promise<void> {
    if (this.notaSelecionada() === 0) { alert('Selecione uma nota de 1 a 5 estrelas.'); return; }
    if (!this.comentario.trim())      { alert('Escreva um comentário sobre seu pedido.'); return; }
    if (this.enviando()) return;

    const p       = this.pedido();
    const cliente = this.clienteAuth.getCurrentCliente();

    this.enviando.set(true);
    try {
      await this.avaliacaoService.avaliar({
        pedidoId:      p?.id ?? '',
        clienteId:     cliente?.id ?? '',
        clienteNome:   cliente?.nome ?? 'Cliente',
        numeroPedido:  p?.numero ?? '',
        nota:          this.notaSelecionada(),
        comentario:    this.comentario.trim(),
        pratoResumo:   p?.itens.map(i => i.nome).join(', ') ?? '',
      });
      this.enviado.set(true);
    } catch (err) {
      console.error('[Avaliacao] erro ao enviar:', err);
      alert('Erro ao enviar avaliação. Tente novamente.');
    } finally {
      this.enviando.set(false);
    }
  }

  voltar(): void { this.router.navigate(['/mobile/pedidos']); }

  formatarData(iso: string): string {
    return this.avaliacaoService.formatarData(iso);
  }
}
