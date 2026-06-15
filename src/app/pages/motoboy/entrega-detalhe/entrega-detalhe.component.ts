import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { EntregasService, Entrega } from '../../../services/entregas.service';

@Component({
  selector: 'app-entrega-detalhe',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './entrega-detalhe.component.html',
  styleUrls: ['./entrega-detalhe.component.scss'],
})
export class EntregaDetalheComponent implements OnInit {

  entrega: Entrega | undefined;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private entregasService: EntregasService,
  ) {}

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id') ?? '';
    this.entrega = this.entregasService.getEntrega(id);
  }

  voltar(): void {
    this.router.navigate(['/motoboy/entregas']);
  }

  iniciarEntrega(): void {
    if (!this.entrega) return;
    this.entregasService.atualizarStatus(this.entrega.id, 'a_caminho');
    this.entrega = this.entregasService.getEntrega(this.entrega.id);
  }

  confirmarEntrega(): void {
    if (!this.entrega) return;
    this.entregasService.atualizarStatus(this.entrega.id, 'entregue');
    this.entrega = this.entregasService.getEntrega(this.entrega.id);
  }

  formatarPreco(preco: number): string {
    return preco.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  }
}