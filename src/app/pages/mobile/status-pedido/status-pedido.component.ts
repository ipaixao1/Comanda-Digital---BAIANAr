import { Component, OnDestroy, OnInit, computed, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router, ActivatedRoute } from '@angular/router';
import { PedidoApiService } from '../../../services/api/pedido-api.service';
import { StatusPedidoApi } from '../../../services/api/api-types';
import { calcularTimeline, isFinal, IconeEtapa } from '../../../services/api/pedido-status.util';

type StatusEtapa = 'concluido' | 'atual' | 'pendente';

interface EtapaPedido {
  titulo: string;
  icone: IconeEtapa;
  status: StatusEtapa;
}

/**
 * RF-007: acompanhamento do pedido com timeline
 * RECEBIDO > CONFIRMADO > EM_PREPARO > PRONTO > SAIU_ENTREGA (GET /api/pedidos/{id}/status, atualizado a cada 5 s).
 */
@Component({
  selector: 'app-status-pedido',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './status-pedido.component.html',
  styleUrls: ['./status-pedido.component.scss'],
})
export class StatusPedidoComponent implements OnInit, OnDestroy {

  private pedidoApi = inject(PedidoApiService);
  private route     = inject(ActivatedRoute);
  private router    = inject(Router);

  private pedidoId     = signal('');
  private statusAtual  = signal<StatusPedidoApi | null>(null);
  private timer: ReturnType<typeof setInterval> | null = null;

  carregando = signal(true);

  pedido = computed<{ id: string; numero: string; status: StatusPedidoApi } | null>(() => {
    const id = this.pedidoId();
    const status = this.statusAtual();
    if (!id || !status) return null;
    return { id, numero: `#${id}`, status };
  });

  get numeroPedido(): string { return this.pedido()?.numero ?? ''; }

  get etapas(): EtapaPedido[] {
    const status = this.pedido()?.status ?? 'RECEBIDO';
    return calcularTimeline(status).map(e => ({ titulo: e.titulo, icone: e.icone, status: e.estado }));
  }

  get entregue(): boolean { return this.pedido()?.status === 'FINALIZADO'; }
  get cancelado(): boolean { return this.pedido()?.status === 'CANCELADO'; }

  ngOnInit(): void {
    const id = this.route.snapshot.queryParamMap.get('id') ?? '';
    this.pedidoId.set(id);
    if (!id) {
      this.carregando.set(false);
      return;
    }
    this.atualizar();
    this.timer = setInterval(() => this.atualizar(), 5000);
  }

  ngOnDestroy(): void {
    this.pararPolling();
  }

  private pararPolling(): void {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }

  private async atualizar(): Promise<void> {
    try {
      const status = await this.pedidoApi.status(this.pedidoId());
      this.statusAtual.set(status);
      if (isFinal(status)) this.pararPolling();
    } catch {
      // 403/404 (pedido de outro cliente ou inexistente) ou rede fora: se nunca carregou, mostra "não encontrado".
      if (!this.statusAtual()) this.pararPolling();
    } finally {
      this.carregando.set(false);
    }
  }

  voltar(): void { this.router.navigate(['/mobile/cardapio']); }
}
