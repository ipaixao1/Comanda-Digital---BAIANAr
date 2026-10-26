import { Component, computed, signal, inject, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';
import { Cliente, ClienteAuthService } from '../../../services/cliente-auth.service';
import { CarrinhoService } from '../../../services/carrinho.service';
import { PedidoApiService, PedidoCliente } from '../../../services/api/pedido-api.service';
import { StatusPedidoApi } from '../../../services/api/api-types';
import {
  calcularTimeline, isFinal, labelStatus, EstimativaTempo,
  minutosRestantes, horaPrevista, formatarMinutos,
} from '../../../services/api/pedido-status.util';

export interface EtapaStatus {
  label: string;
  estado: 'concluido' | 'atual' | 'pendente' | 'cancelado';
}

/**
 * RF-007 (acompanhar pedido) e RF-008 (meus pedidos):
 * GET /api/pedidos/meus — atualizado a cada 10 s enquanto a tela está aberta.
 */
@Component({
  selector: 'app-pedidos-mobile',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './pedidos.component.html',
  styleUrls: ['./pedidos.component.scss'],
})
export class PedidosMobileComponent implements OnInit, OnDestroy {

  private clienteAuth = inject(ClienteAuthService);
  public  carrinho    = inject(CarrinhoService);
  private pedidoApi   = inject(PedidoApiService);

  private sub: Subscription | null = null;
  private timer: ReturnType<typeof setInterval> | null = null;

  cliente  = signal<Cliente | null>(null);
  isLogado = computed(() => !!this.cliente());

  // ── Pedidos do cliente (mais recente primeiro, como a API devolve) ───────
  private pedidos = signal<PedidoCliente[]>([]);

  pedidoAtivo = computed<PedidoCliente | null>(() =>
    this.pedidos().find(p => !isFinal(p.status)) ?? null
  );

  // RF-008: histórico lista TODOS os pedidos do cliente (data, itens, valor e status).
  historico = computed<PedidoCliente[]>(() => this.pedidos());

  temPedidoAtual = computed(() => this.pedidoAtivo() !== null);

  // ── Modal + navegação ─────────────────────────────────────────
  modalLoginAberto  = signal(false);
  senhaVisivel      = signal(false);
  senhaConfVisivel  = signal(false);
  modalAba: 'login' | 'cadastro' = 'login';
  loginEmail        = '';
  loginSenha        = '';
  cadastroNome      = '';
  cadastroTelefone  = '';
  cadastroEndereco  = '';
  cadastroSenhaConf = '';
  loginErro         = '';

  tela = signal<'lista' | 'status' | 'historico'>('lista');
  private selecionadoId = signal<string | null>(null);

  // Pedido exibido na tela de status: o escolhido; se nenhum, o pedido ativo.
  private pedidoParaExibir = computed<PedidoCliente | null>(() => {
    const id = this.selecionadoId();
    const escolhido = id ? this.pedidos().find(p => p.id === id) : undefined;
    return escolhido ?? this.pedidoAtivo();
  });

  // Alias usado pelo template do detalhe (pedido finalizado/cancelado).
  pedidoVisualizado = computed<PedidoCliente | null>(() => this.pedidoParaExibir());

  ehPedidoAtual = computed(() => {
    const p = this.pedidoParaExibir();
    return !!p && !isFinal(p.status);
  });

  // ── Estimativa de preparo + entrega (calculada pelo backend) ───────────
  private agora = signal(Date.now());

  /** Estimativa do pedido exibido na tela de status. */
  estimativaExibida = computed<EstimativaTempo | null>(() => this.pedidoParaExibir()?.estimativa ?? null);
  horaChegadaExibida = computed(() => horaPrevista(this.estimativaExibida()));
  textoRestanteExibido = computed(() => {
    const min = minutosRestantes(this.estimativaExibida(), this.agora());
    return min > 0 ? `Faltam cerca de ${formatarMinutos(min)}` : 'Seu pedido deve chegar a qualquer momento';
  });

  /** Previsão do pedido ativo, mostrada no card da lista. */
  horaChegadaAtiva = computed(() => horaPrevista(this.pedidoAtivo()?.estimativa ?? null));

  fmt(min: number): string { return formatarMinutos(min); }

  numeroPedidoExibido = computed(() => this.pedidoParaExibir()?.numero ?? '');
  itensPedidoExibido  = computed(() => this.pedidoParaExibir()?.itens ?? []);
  totalPedidoExibido  = computed(() => this.pedidoParaExibir()?.total ?? 0);

  totalItensPedidoAtual = computed(() =>
    (this.pedidoAtivo()?.itens ?? []).reduce((s, i) => s + i.quantidade, 0)
  );
  totalValorPedidoAtual = computed(() => this.pedidoAtivo()?.total ?? 0);

  labelStatusAtual = computed(() => {
    const s = this.pedidoAtivo()?.status;
    return s ? labelStatus(s) : '';
  });

  // ── Timeline (SRS RF-007) ─────────────────────────────────────
  etapasStatus = computed<EtapaStatus[]>(() => {
    const p = this.pedidoParaExibir();
    if (!p) return [];
    return calcularTimeline(p.status).map(e => ({ label: e.titulo, estado: e.estado }));
  });

  labelStatus(status: StatusPedidoApi): string { return labelStatus(status); }

  // ── Ciclo de vida: carrega e atualiza os pedidos enquanto logado ─────────
  ngOnInit(): void {
    this.sub = this.clienteAuth.currentCliente$.subscribe(c => {
      this.cliente.set(c);
      if (c) {
        this.carregar();
        this.iniciarPolling();
      } else {
        this.pedidos.set([]);
        this.pararPolling();
      }
    });
  }

  ngOnDestroy(): void {
    this.sub?.unsubscribe();
    this.pararPolling();
  }

  private iniciarPolling(): void {
    this.pararPolling();
    this.timer = setInterval(() => this.carregar(), 10000);
  }

  private pararPolling(): void {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }

  private async carregar(): Promise<void> {
    try {
      this.pedidos.set(await this.pedidoApi.meusPedidos());
      this.agora.set(Date.now());
    } catch {
      // mantém a lista anterior se a rede falhar; o próximo ciclo tenta de novo
    }
  }

  // ── Navegação ─────────────────────────────────────────────────
  abrirStatus(): void {
    this.selecionadoId.set(this.pedidoAtivo()?.id ?? null);
    this.tela.set('status');
  }

  abrirStatusHistorico(pedido: PedidoCliente): void {
    this.selecionadoId.set(pedido.id);
    this.tela.set('status');
  }

  abrirHistorico(): void { this.tela.set('historico'); }

  voltarLista(): void {
    this.tela.set('lista');
    this.selecionadoId.set(null);
  }

  voltarHistorico(): void {
    this.tela.set('historico');
    this.selecionadoId.set(null);
  }

  formatarPreco(preco: number): string {
    return preco.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  }

  formatarData(iso: string): string {
    if (!iso) return '';
    const d = new Date(iso);
    return d.toLocaleDateString('pt-BR') + ' ' +
           d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  }

  // ── Modal login ───────────────────────────────────────────────
  abrirModal(): void { this.modalLoginAberto.set(true); }

  fecharModal(): void {
    this.modalLoginAberto.set(false);
    this.loginEmail = ''; this.loginSenha = ''; this.loginErro = '';
    this.cadastroNome = ''; this.cadastroTelefone = ''; this.cadastroEndereco = ''; this.cadastroSenhaConf = '';
    this.modalAba = 'login';
  }

  toggleSenhaVisivel():     void { this.senhaVisivel.update(v => !v); }
  toggleSenhaConfVisivel(): void { this.senhaConfVisivel.update(v => !v); }

  async fazerLogin(): Promise<void> {
    this.loginErro = '';
    const r = await this.clienteAuth.login(this.loginEmail, this.loginSenha);
    if (r.success) this.fecharModal();
    else this.loginErro = r.error ?? 'Erro ao fazer login.';
  }

  async fazerCadastro(): Promise<void> {
    this.loginErro = '';
    if (!this.cadastroNome.trim())                  { this.loginErro = 'Informe seu nome.'; return; }
    if (!this.loginEmail.trim())                    { this.loginErro = 'Informe seu email.'; return; }
    if (!this.cadastroTelefone.trim())              { this.loginErro = 'Informe seu telefone.'; return; }
    if (!this.cadastroEndereco.trim())              { this.loginErro = 'Informe seu endereço de entrega.'; return; }
    if (this.loginSenha.length < 6)                 { this.loginErro = 'Senha deve ter mínimo 6 caracteres.'; return; }
    if (this.loginSenha !== this.cadastroSenhaConf) { this.loginErro = 'As senhas não coincidem.'; return; }
    const r = await this.clienteAuth.cadastrar(
      this.cadastroNome, this.loginEmail, this.loginSenha, this.cadastroTelefone, this.cadastroEndereco
    );
    if (r.success) this.fecharModal();
    else this.loginErro = r.error ?? 'Erro ao cadastrar.';
  }
}
