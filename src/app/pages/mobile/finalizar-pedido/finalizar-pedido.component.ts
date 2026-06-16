import { Component, OnDestroy, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CarrinhoService } from '../../../services/carrinho.service';
import { PedidoService } from '../../../services/pedido.service';
import { ClienteAuthService } from '../../../services/cliente-auth.service';

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

// Telas internas do componente
type Tela = 'checkout' | 'pix' | 'cartao' | 'confirmado';

@Component({
  selector: 'app-finalizar-pedido',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './finalizar-pedido.component.html',
  styleUrls: ['./finalizar-pedido.component.scss'],
})
export class FinalizarPedidoComponent implements OnDestroy {

  observacoesEntrega    = '';
  enderecoSelecionado:  string | null = 'casa';
  pagamentoSelecionado: string | null = 'credito';
  enviando = false;

  // Controle de telas
  tela = signal<Tela>('checkout');

  // PIX
  pixCopiado       = signal(false);
  pixConfirmado    = signal(false);
  pixSegundos      = signal(240); // 4 minutos
  private pixTimer: any;
  private pixCountdown: any;

  // Cartão
  cartaoSegundos   = signal(10);
  cartaoConfirmado = signal(false);
  private cartaoTimer: any;

  // ID do pedido criado (para navegar ao status)
  private pedidoIdCriado = '';

  enderecos: Endereco[] = [
    { id: 'casa',     tipo: 'casa',     nome: 'Casa',     rua: 'Rua das Flores, 123 - Centro',         cidade: 'Salvador - BA' },
    { id: 'trabalho', tipo: 'trabalho', nome: 'Trabalho', rua: 'Av. Sete de Setembro, 456 - Comércio', cidade: 'Salvador - BA' },
  ];

  pagamentos: Pagamento[] = [
    { id: 'credito',  tipo: 'cartao-credito', nome: 'Cartão de Crédito', detalhe: '**** **** **** 1234'    },
    { id: 'debito',   tipo: 'cartao-debito',  nome: 'Cartão de Débito',  detalhe: '**** **** **** 5678'    },
    { id: 'pix',      tipo: 'pix',            nome: 'Pix',               detalhe: 'Pagamento instantâneo' },
    { id: 'dinheiro', tipo: 'dinheiro',       nome: 'Dinheiro',          detalhe: 'Pagamento na entrega'  },
  ];

  constructor(
    public carrinho: CarrinhoService,
    private pedidoService: PedidoService,
    private clienteAuth: ClienteAuthService,
    private router: Router,
  ) {}

  ngOnDestroy(): void {
    this.limparTimers();
  }

  private limparTimers(): void {
    if (this.pixTimer)      clearTimeout(this.pixTimer);
    if (this.pixCountdown)  clearInterval(this.pixCountdown);
    if (this.cartaoTimer)   clearTimeout(this.cartaoTimer);
  }

  voltar(): void {
    if (this.tela() !== 'checkout') {
      this.tela.set('checkout');
      this.limparTimers();
    } else {
      this.router.navigate(['/mobile/carrinho']);
    }
  }

  formatarPreco(preco: number): string {
    return preco.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  }

  selecionarEndereco(id: string):  void { this.enderecoSelecionado  = id; }
  selecionarPagamento(id: string): void { this.pagamentoSelecionado = id; }

  adicionarEndereco():  void { this.router.navigate(['/mobile/enderecos']); }
  adicionarPagamento(): void {
    this.router.navigate(['/mobile/configuracoes'], {
      queryParams: { tela: 'adicionar-cartao', origem: 'checkout' },
    });
  }

  get tipoPagamentoSelecionado(): Pagamento['tipo'] | null {
    return this.pagamentos.find(p => p.id === this.pagamentoSelecionado)?.tipo ?? null;
  }

  // Formato MM:SS para o contador PIX
  get pixTempoFormatado(): string {
    const s = this.pixSegundos();
    const m = Math.floor(s / 60);
    const seg = s % 60;
    return `${String(m).padStart(2, '0')}:${String(seg).padStart(2, '0')}`;
  }

  // Código PIX fictício mas realista
  readonly pixCodigo = '00020126580014BR.GOV.BCB.PIX0136baianar@restaurante.com.br5204000053039865406' +
    this.gerarValorPix() + '5802BR5910BAIANAr6009SALVADOR62070503***6304A1B2';

  private gerarValorPix(): string {
    const total = this.carrinho.total();
    return total.toFixed(2).replace('.', '').padStart(6, '0');
  }

  // ── Confirmar pedido ────────────────────────────────────────────
  async confirmarPedido(): Promise<void> {
    if (!this.enderecoSelecionado)  { alert('Selecione um endereço de entrega'); return; }
    if (!this.pagamentoSelecionado) { alert('Selecione uma forma de pagamento');  return; }
    if (this.enviando) return;

    this.enviando = true;
    try {
      const endObj  = this.enderecos.find(e => e.id === this.enderecoSelecionado);
      const pagObj  = this.pagamentos.find(p => p.id === this.pagamentoSelecionado);
      const cliente = this.clienteAuth.getCurrentCliente();

      const pedido = await this.pedidoService.criarPedido({
        itens: this.carrinho.itens().map(i => ({
          nome: i.nome, quantidade: i.quantidade, preco: i.preco,
        })),
        subtotal:           this.carrinho.subtotal(),
        taxaEntrega:        this.carrinho.taxaEntrega,
        total:              this.carrinho.total(),
        observacoesPedido:  this.carrinho.observacoes() || undefined,
        observacoesEntrega: this.observacoesEntrega || undefined,
        endereco: endObj ? { nome: endObj.nome, rua: endObj.rua, cidade: endObj.cidade } : undefined,
        pagamento: pagObj ? { nome: pagObj.nome, detalhe: pagObj.detalhe } : undefined,
        clienteId:       cliente?.id,
        clienteNome:     cliente?.nome,
        clienteTelefone: cliente?.telefone,
      });

      this.pedidoIdCriado = pedido.id;
      this.carrinho.limpar();

      // Redireciona conforme o tipo de pagamento
      const tipo = this.tipoPagamentoSelecionado;

      if (tipo === 'dinheiro') {
        // Dinheiro → vai direto para acompanhamento
        this.irParaStatus();

      } else if (tipo === 'pix') {
        // Pix → mostra QR Code
        this.iniciarFluxoPix();

      } else {
        // Cartão crédito/débito → aguarda processamento
        this.iniciarFluxoCartao();
      }

    } catch (err) {
      console.error('[FinalizarPedido] erro:', err);
      alert('Erro ao enviar pedido. Verifique sua conexão e tente novamente.');
    } finally {
      this.enviando = false;
    }
  }

  // ── Fluxo PIX ──────────────────────────────────────────────────
  private iniciarFluxoPix(): void {
    this.tela.set('pix');
    this.pixSegundos.set(240);
    this.pixCopiado.set(false);
    this.pixConfirmado.set(false);

    // Countdown
    this.pixCountdown = setInterval(() => {
      const atual = this.pixSegundos();
      if (atual <= 0) {
        clearInterval(this.pixCountdown);
      } else {
        this.pixSegundos.set(atual - 1);
      }
    }, 1000);
  }

  copiarCodigoPix(): void {
    navigator.clipboard.writeText(this.pixCodigo).catch(() => {});
    this.pixCopiado.set(true);

    // Após 10 segundos, confirma pagamento e vai para status
    this.pixTimer = setTimeout(() => {
      this.pixConfirmado.set(true);
      clearInterval(this.pixCountdown);
      setTimeout(() => this.irParaStatus(), 2000);
    }, 10000);
  }

  // ── Fluxo Cartão ───────────────────────────────────────────────
  private iniciarFluxoCartao(): void {
    this.tela.set('cartao');
    this.cartaoSegundos.set(10);
    this.cartaoConfirmado.set(false);

    // Countdown regressivo de exibição
    const countdown = setInterval(() => {
      const atual = this.cartaoSegundos();
      if (atual <= 1) {
        clearInterval(countdown);
        this.cartaoSegundos.set(0);
      } else {
        this.cartaoSegundos.set(atual - 1);
      }
    }, 1000);

    // Após 10 segundos confirma e vai para status
    this.cartaoTimer = setTimeout(() => {
      this.cartaoConfirmado.set(true);
      setTimeout(() => this.irParaStatus(), 2000);
    }, 10000);
  }

  // ── Navegar para status ─────────────────────────────────────────
  private irParaStatus(): void {
    this.router.navigate(['/mobile/status-pedido'], {
      queryParams: { id: this.pedidoIdCriado },
    });
  }
}
