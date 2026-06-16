import { Component, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { MotoboyAuthService } from '../../../services/motoboy-auth.service';
import { PedidoService, PedidoShared } from '../../../services/pedido.service';

@Component({
  selector: 'app-entregas',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './entregas.component.html',
  styleUrls: ['./entregas.component.scss'],
})
export class EntregasComponent {

  private auth          = inject(MotoboyAuthService);
  private pedidoService = inject(PedidoService);
  private router        = inject(Router);

  motoboy      = this.auth.motoboy;
  primeiroNome = computed(() => this.motoboy()?.nome?.split(' ')[0] ?? '');

  // Reativos ao onSnapshot do PedidoService
  entregas          = this.pedidoService.pedidosParaMotoboy;
  entregasPendentes = computed(() => this.entregas().filter(e => e.status === 'enviado').length);
  entregasACaminho  = computed(() => this.entregas().filter(e => e.status === 'a_caminho').length);
  entregasEntregues = computed(() => this.entregas().filter(e => e.status === 'entregue').length);

  statusLabel(p: PedidoShared): string {
    if (p.status === 'enviado')   return 'Novo pedido';
    if (p.status === 'a_caminho') return 'A caminho';
    if (p.status === 'entregue')  return 'Entregue';
    return p.status;
  }

  abrirDetalhe(id: string): void {
    this.router.navigate(['/motoboy/entrega', id]);
  }

  formatarPreco(preco: number): string {
    return preco.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  }

  formatarHora(iso: string): string {
    return new Date(iso).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  }

  sair(): void {
    this.auth.logout();
    this.router.navigate(['/motoboy/login']);
  }
}
