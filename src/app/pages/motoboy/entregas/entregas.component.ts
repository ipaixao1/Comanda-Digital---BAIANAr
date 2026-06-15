import { Component, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { MotoboyAuthService } from '../../../services/motoboy-auth.service';
import { EntregasService } from '../../../services/entregas.service';

@Component({
  selector: 'app-entregas',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './entregas.component.html',
  styleUrls: ['./entregas.component.scss'],
})
export class EntregasComponent {

  motoboy = this.auth.motoboy;
  entregas = this.entregasService.entregas;

  primeiroNome = computed(() => this.auth.motoboy()?.nome?.split(' ')[0] ?? '');

  entregasPendentes  = computed(() => this.entregas().filter(e => e.status === 'pendente').length);
  entregasACaminho   = computed(() => this.entregas().filter(e => e.status === 'a_caminho').length);
  entregasEntregues  = computed(() => this.entregas().filter(e => e.status === 'entregue').length);

  constructor(
    private auth: MotoboyAuthService,
    private entregasService: EntregasService,
    private router: Router,
  ) {}

  abrirDetalhe(id: string): void {
    this.router.navigate(['/motoboy/entrega', id]);
  }

  formatarPreco(preco: number): string {
    return preco.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  }

  sair(): void {
    this.auth.logout();
    this.router.navigate(['/motoboy/login']);
  }
}