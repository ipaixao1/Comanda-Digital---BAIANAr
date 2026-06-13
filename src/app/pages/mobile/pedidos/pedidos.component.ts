import { Component, computed, signal } from "@angular/core";
import { CommonModule } from "@angular/common";
import { RouterModule } from "@angular/router";
import { FormsModule } from "@angular/forms";
import { ClienteAuthService } from "../../../services/cliente-auth.service";
import { CarrinhoService } from "../../../services/carrinho.service";

export interface ItemHistorico {
  nome: string;
  quantidade: number;
  preco: number;
}

export interface PedidoHistorico {
  id: string;
  numero: string;
  data: string;
  hora: string;
  status: string;
  itens: ItemHistorico[];
  total: number;
}

export interface EtapaStatus {
  label: string;
  estado: 'concluido' | 'atual' | 'pendente' | 'cancelado';
}

@Component({
  selector: "app-pedidos-mobile",
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: "./pedidos.component.html",
  styleUrls: ["./pedidos.component.scss"],
})
export class PedidosMobileComponent {

  isLogado = computed(() => this.clienteAuth.isAuthenticated());
  cliente  = computed(() => this.clienteAuth.getCurrentCliente());

  modalLoginAberto = signal<boolean>(false);
  senhaVisivel     = signal<boolean>(false);
  senhaConfVisivel = signal<boolean>(false);
  modalAba: "login" | "cadastro" = "login";
  loginEmail       = "";
  loginSenha       = "";
  cadastroNome     = "";
  cadastroTelefone = "";
  cadastroSenhaConf = "";
  loginErro        = "";

  // Navegação interna
  tela = signal<'lista' | 'status' | 'historico'>('lista');

  // Pedido atual (mockado fixo)
  numeroPedidoAtual = '#8742';

  itensPedidoAtual = signal<ItemHistorico[]>([
    { nome: 'Mini Acarajés', quantidade: 2, preco: 24.90 },
    { nome: 'Caldo de Sururu', quantidade: 1, preco: 28.90 },
  ]);

  totalPedidoAtual = computed(() =>
    this.itensPedidoAtual().reduce((soma, item) => soma + item.preco * item.quantidade, 0)
  );

  totalItensPedidoAtual = computed(() =>
    this.itensPedidoAtual().reduce((soma, item) => soma + item.quantidade, 0)
  );

  temPedidoAtual = signal<boolean>(true);

  // Pedido sendo visualizado na tela de status (null = pedido atual)
  pedidoVisualizado = signal<PedidoHistorico | null>(null);

  // Etapas da timeline (dependem do pedido visualizado)
  // Etapas da timeline (apenas para o pedido atual)
  etapasStatus = computed<EtapaStatus[]>(() => [
    { label: 'Pedido recebido',     estado: 'concluido' },
    { label: 'Em preparo',          estado: 'atual' },
    { label: 'Pronto',              estado: 'pendente' },
    { label: 'Saiu para entrega',   estado: 'pendente' },
  ]);

  // Itens e número exibidos na tela de status
  numeroPedidoExibido = computed(() =>
    this.pedidoVisualizado()?.numero ?? this.numeroPedidoAtual
  );

  itensPedidoExibido = computed<ItemHistorico[]>(() =>
    this.pedidoVisualizado()?.itens ?? this.itensPedidoAtual()
  );

  totalPedidoExibido = computed(() =>
    this.pedidoVisualizado()?.total ?? this.totalPedidoAtual()
  );

  // true quando estamos vendo o pedido atual (em andamento)
  ehPedidoAtual = computed(() => this.pedidoVisualizado() === null);

  // Histórico de pedidos (mockado)
  historico: PedidoHistorico[] = [
    {
      id: 'h1', numero: '#8701', data: '08 Jun 2026', hora: '19:15', status: 'Entregue',
      itens: [
        { nome: 'Moqueca de Peixe', quantidade: 1, preco: 75.90 },
        { nome: 'Pudim de Tapioca', quantidade: 2, preco: 16.90 },
      ],
      total: 109.70,
    },
    {
      id: 'h2', numero: '#8654', data: '02 Jun 2026', hora: '20:40', status: 'Entregue',
      itens: [
        { nome: 'Bobó de Camarão', quantidade: 1, preco: 82.90 },
        { nome: 'Refrigerante', quantidade: 2, preco: 6.00 },
      ],
      total: 94.90,
    },
    {
      id: 'h3', numero: '#8590', data: '25 Mai 2026', hora: '18:05', status: 'Cancelado',
      itens: [
        { nome: 'Casquinhas de Siri', quantidade: 2, preco: 32.90 },
      ],
      total: 65.80,
    },
  ];

  constructor(
    private clienteAuth: ClienteAuthService,
    public carrinho: CarrinhoService
  ) {}

  abrirStatus(): void {
    this.pedidoVisualizado.set(null);
    this.tela.set('status');
  }

  abrirStatusHistorico(pedido: PedidoHistorico): void {
    this.pedidoVisualizado.set(pedido);
    this.tela.set('status');
  }

  abrirHistorico(): void {
    this.tela.set('historico');
  }

  voltarLista(): void {
    this.tela.set('lista');
    this.pedidoVisualizado.set(null);
  }

  voltarHistorico(): void {
    this.tela.set('historico');
    this.pedidoVisualizado.set(null);
  }

  avaliarPedido(): void {
    alert('Em breve você poderá avaliar este pedido!');
  }

  formatarPreco(preco: number): string {
    return preco.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  }

  abrirModal(): void {
    this.modalLoginAberto.set(true);
  }

  fecharModal(): void {
    this.modalLoginAberto.set(false);
    this.loginEmail = "";
    this.loginSenha = "";
    this.loginErro  = "";
    this.cadastroNome = "";
    this.cadastroTelefone = "";
    this.cadastroSenhaConf = "";
    this.modalAba = "login";
  }

  toggleSenhaVisivel(): void { this.senhaVisivel.update(v => !v); }
  toggleSenhaConfVisivel(): void { this.senhaConfVisivel.update(v => !v); }

  async fazerLogin(): Promise<void> {
    this.loginErro = "";
    const result = await this.clienteAuth.login(this.loginEmail, this.loginSenha);
    if (result.success) {
      this.fecharModal();
    } else {
      this.loginErro = result.error ?? "Erro ao fazer login.";
    }
  }

  async fazerCadastro(): Promise<void> {
    this.loginErro = "";
    if (!this.cadastroNome.trim())                 { this.loginErro = "Informe seu nome."; return; }
    if (!this.loginEmail.trim())                   { this.loginErro = "Informe seu email."; return; }
    if (this.loginSenha.length < 6)                { this.loginErro = "Senha deve ter mínimo 6 caracteres."; return; }
    if (this.loginSenha !== this.cadastroSenhaConf){ this.loginErro = "As senhas não coincidem."; return; }
    const result = await this.clienteAuth.cadastrar(this.cadastroNome, this.loginEmail, this.loginSenha, this.cadastroTelefone);
    if (result.success) {
      this.fecharModal();
    } else {
      this.loginErro = result.error ?? "Erro ao cadastrar.";
    }
  }
}