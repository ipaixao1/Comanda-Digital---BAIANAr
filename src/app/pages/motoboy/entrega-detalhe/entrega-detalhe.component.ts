import { Component, OnInit, computed, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { PedidoService, PedidoShared } from '../../../services/pedido.service';
import { MotoboyAuthService } from '../../../services/motoboy-auth.service';

@Component({
  selector: 'app-entrega-detalhe',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './entrega-detalhe.component.html',
  styleUrls: ['./entrega-detalhe.component.scss'],
})
export class EntregaDetalheComponent implements OnInit {

  private route         = inject(ActivatedRoute);
  private router        = inject(Router);
  private pedidoService = inject(PedidoService);
  private auth          = inject(MotoboyAuthService);

  private pedidoId = signal('');

  // Reativo — atualiza automaticamente com o onSnapshot
  pedido = computed<PedidoShared | undefined>(() =>
    this.pedidoService.getPedido(this.pedidoId())
  );

  salvando = signal(false);

  ngOnInit(): void {
    this.pedidoId.set(this.route.snapshot.paramMap.get('id') ?? '');
  }

  voltar(): void { this.router.navigate(['/motoboy/entregas']); }

  async aceitarEntrega(): Promise<void> {
    if (this.salvando()) return;
    this.salvando.set(true);
    try {
      const motoboy = this.auth.motoboy();
      await this.pedidoService.atualizarStatus(this.pedidoId(), 'a_caminho', {
        motoboyNome:    motoboy?.nome,
        motoboyVeiculo: motoboy?.veiculo,
      });
    } catch (err) {
      console.error('[EntregaDetalhe] erro ao aceitar:', err);
    } finally {
      this.salvando.set(false);
    }
  }

  async confirmarEntrega(): Promise<void> {
    if (this.salvando()) return;
    this.salvando.set(true);
    try {
      await this.pedidoService.atualizarStatus(this.pedidoId(), 'entregue');
    } catch (err) {
      console.error('[EntregaDetalhe] erro ao confirmar:', err);
    } finally {
      this.salvando.set(false);
    }
  }

  formatarPreco(preco: number): string {
    return preco.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  }

  formatarHora(iso: string): string {
    return new Date(iso).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  }

  statusLabel(status: string): string {
    const map: Record<string, string> = {
      enviado:   'Novo pedido',
      a_caminho: 'A caminho',
      entregue:  'Entregue',
    };
    return map[status] ?? status;
  }
}
