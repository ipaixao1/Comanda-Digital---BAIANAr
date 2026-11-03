import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CarrinhoService } from '../../../services/carrinho.service';
import { ClienteAuthService } from '../../../services/cliente-auth.service';

@Component({
  selector: 'app-carrinho',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './carrinho.component.html',
  styleUrls: ['./carrinho.component.scss'],
})
export class CarrinhoComponent {

  constructor(
    public carrinho: CarrinhoService,
    private clienteAuth: ClienteAuthService,
    private router: Router,
  ) {}

  voltar(): void {
    this.router.navigate(['/mobile/cardapio']);
  }

  formatarPreco(preco: number): string {
    return preco.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  }

  // SRS (fluxo do cliente, passo 4): sem login → vai para login/cadastro e volta ao checkout depois.
  finalizarPedido(): void {
    if (!this.clienteAuth.isAuthenticated()) {
      this.router.navigate(['/mobile/perfil'], {
        queryParams: { login: '1', redirect: '/mobile/finalizar-pedido' },
      });
      return;
    }
    this.router.navigate(['/mobile/finalizar-pedido']);
  }
}
