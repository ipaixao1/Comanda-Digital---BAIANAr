import { Component, OnInit, computed, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router, ActivatedRoute } from '@angular/router';
import { PedidoService, PedidoShared, StatusPedido } from '../../../services/pedido.service';

type StatusEtapa = 'concluido' | 'atual' | 'pendente';

interface EtapaPedido {
  titulo: string;
  icone: 'check' | 'chef' | 'box' | 'bike' | 'done';
  status: StatusEtapa;
}

@Component({
  selector: 'app-status-pedido',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './status-pedido.component.html',
  styleUrls: ['./status-pedido.component.scss'],
})
export class StatusPedidoComponent implements OnInit {

  private pedidoService = inject(PedidoService);
  private route         = inject(ActivatedRoute);
  private router        = inject(Router);

  private pedidoId = signal('');

  // Pedido reativo: sempre reflete o estado atual do signal do serviço
  pedido = computed<PedidoShared | null>(() => {
    const id = this.pedidoId();
    if (!id) return null;
    return this.pedidoService.getPedido(id) ?? null;
  });

  get numeroPedido(): string { return this.pedido()?.numero ?? ''; }

  get etapas(): EtapaPedido[] {
    const status = this.pedido()?.status ?? 'recebido';
    return this.calcularEtapas(status);
  }

  get entregue(): boolean { return this.pedido()?.status === 'entregue'; }

  ngOnInit(): void {
    const id = this.route.snapshot.queryParamMap.get('id') ?? '';
    this.pedidoId.set(id);
  }

  private calcularEtapas(status: StatusPedido): EtapaPedido[] {
    const ordem: StatusPedido[] = ['recebido', 'em_preparo', 'pronto', 'a_caminho', 'entregue'];
    const idxAtual = ordem.indexOf(status);

    const etapasConfig: { titulo: string; icone: EtapaPedido['icone']; statusRef: StatusPedido }[] = [
      { titulo: 'Pedido Recebido',   icone: 'check', statusRef: 'recebido'   },
      { titulo: 'Em Preparo',        icone: 'chef',  statusRef: 'em_preparo' },
      { titulo: 'Pronto',            icone: 'box',   statusRef: 'pronto'     },
      { titulo: 'Saiu para Entrega', icone: 'bike',  statusRef: 'a_caminho'  },
      { titulo: 'Entregue',          icone: 'done',  statusRef: 'entregue'   },
    ];

    return etapasConfig.map((e, i) => {
      const etapaIdx = ordem.indexOf(e.statusRef);
      let etapaStatus: StatusEtapa;

      if (status === 'enviado') {
        if (i < 3) etapaStatus = 'concluido';
        else if (i === 3) etapaStatus = 'atual';
        else etapaStatus = 'pendente';
      } else {
        if (etapaIdx < idxAtual)       etapaStatus = 'concluido';
        else if (etapaIdx === idxAtual) etapaStatus = 'atual';
        else                            etapaStatus = 'pendente';
      }

      return { titulo: e.titulo, icone: e.icone, status: etapaStatus };
    });
  }

  voltar(): void { this.router.navigate(['/mobile/cardapio']); }
}
