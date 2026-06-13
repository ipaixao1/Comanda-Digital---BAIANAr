import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';

type StatusEtapa = 'concluido' | 'atual' | 'pendente';

interface EtapaPedido {
  titulo: string;
  icone: 'check' | 'chef' | 'box' | 'bike';
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

  numeroPedido = '';
  tempoEstimado = '20–25 minutos';

  etapas: EtapaPedido[] = [
    { titulo: 'Pedido Recebido', icone: 'check', status: 'concluido' },
    { titulo: 'Em Preparo',      icone: 'chef',  status: 'atual' },
    { titulo: 'Pronto',          icone: 'box',   status: 'pendente' },
    { titulo: 'Saiu para Entrega', icone: 'bike', status: 'pendente' },
  ];

  constructor(private router: Router) {}

  ngOnInit(): void {
    // Gera/recupera um número de pedido. Em produção, substituir pelo número retornado pelo backend.
    this.numeroPedido = this.gerarNumeroPedido();
  }

  private gerarNumeroPedido(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  voltar(): void {
    this.router.navigate(['/mobile/cardapio']);
  }
}