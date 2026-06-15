import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CarrinhoService } from '../../../services/carrinho.service';

interface Endereco {
  id: string;
  tipo: 'casa' | 'trabalho';
  nome: string;
  rua: string;
  cidade: string;
}

interface Pagamento {
  id: string;
  tipo: 'cartao-credito' | 'cartao-debito' | 'pix' | 'dinheiro';
  nome: string;
  detalhe: string;
}

@Component({
  selector: 'app-finalizar-pedido',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './finalizar-pedido.component.html',
  styleUrls: ['./finalizar-pedido.component.scss'],
})
export class FinalizarPedidoComponent {

  observacoesEntrega = '';

  enderecoSelecionado: string | null = 'casa';
  pagamentoSelecionado: string | null = 'credito';

  // TODO: substituir por dados reais (ex: vindos de um EnderecoService / UsuarioService)
  enderecos: Endereco[] = [
    {
      id: 'casa',
      tipo: 'casa',
      nome: 'Casa',
      rua: 'Rua das Flores, 123 - Centro',
      cidade: 'Salvador - BA',
    },
    {
      id: 'trabalho',
      tipo: 'trabalho',
      nome: 'Trabalho',
      rua: 'Av. Sete de Setembro, 456 - Comércio',
      cidade: 'Salvador - BA',
    },
  ];

  // TODO: substituir por dados reais (ex: vindos de um PagamentoService / UsuarioService)
  pagamentos: Pagamento[] = [
    {
      id: 'credito',
      tipo: 'cartao-credito',
      nome: 'Cartão de Crédito',
      detalhe: '**** **** **** 1234',
    },
    {
      id: 'debito',
      tipo: 'cartao-debito',
      nome: 'Cartão de Débito',
      detalhe: '**** **** **** 5678',
    },
    {
      id: 'pix',
      tipo: 'pix',
      nome: 'Pix',
      detalhe: 'Pagamento instantâneo',
    },
    {
      id: 'dinheiro',
      tipo: 'dinheiro',
      nome: 'Dinheiro',
      detalhe: 'Pagamento na entrega',
    },
  ];

  constructor(public carrinho: CarrinhoService, private router: Router) {}

  voltar(): void {
    this.router.navigate(['/mobile/carrinho']);
  }

  formatarPreco(preco: number): string {
    return preco.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  }

  selecionarEndereco(id: string): void {
    this.enderecoSelecionado = id;
  }

  selecionarPagamento(id: string): void {
    this.pagamentoSelecionado = id;
  }

  adicionarEndereco(): void {
    this.router.navigate(['/mobile/enderecos']);
  }

  adicionarPagamento(): void {
    this.router.navigate(['/mobile/configuracoes'], { queryParams: { tela: 'adicionar-cartao', origem: 'checkout' } });
  }

  confirmarPedido(): void {
    if (!this.enderecoSelecionado) {
      alert('Selecione um endereço de entrega');
      return;
    }
    if (!this.pagamentoSelecionado) {
      alert('Selecione uma forma de pagamento');
      return;
    }

    const pedido = {
      itens: this.carrinho.itens(),
      observacoesPedido: this.carrinho.observacoes(),
      observacoesEntrega: this.observacoesEntrega,
      endereco: this.enderecos.find(e => e.id === this.enderecoSelecionado),
      pagamento: this.pagamentos.find(p => p.id === this.pagamentoSelecionado),
      subtotal: this.carrinho.subtotal(),
      taxaEntrega: this.carrinho.taxaEntrega,
      total: this.carrinho.total(),
    };

    console.log('Pedido confirmado:', pedido);

    // TODO: chamar serviço de pedidos para enviar ao backend

    this.carrinho.limpar();
    this.router.navigate(['/mobile/status-pedido']);
  }
}