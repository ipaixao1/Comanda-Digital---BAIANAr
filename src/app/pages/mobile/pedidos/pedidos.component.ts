import { Component, computed, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ClienteAuthService } from '../../../services/cliente-auth.service';
import { CarrinhoService } from '../../../services/carrinho.service';
import { PedidoService, PedidoShared, StatusPedido } from '../../../services/pedido.service';

export interface EtapaStatus {
  label: string;
  estado: 'concluido' | 'atual' | 'pendente' | 'cancelado';
}

@Component({
  selector: 'app-pedidos-mobile',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './pedidos.component.html',
  styleUrls: ['./pedidos.component.scss'],
})
export class PedidosMobileComponent {

  private clienteAuth   = inject(ClienteAuthService);
  public  carrinho      = inject(CarrinhoService);
  private pedidoService = inject(PedidoService);
  private router        = inject(Router);

  isLogado = computed(() => this.clienteAuth.isAuthenticated());
  cliente  = computed(() => this.clienteAuth.getCurrentCliente());

  // ── Pedidos do cliente — reativos ao signal do serviço ────────
  private pedidosDoCliente = computed(() => {
    const cId = this.cliente()?.id;
    if (!cId) return [];
    return this.pedidoService.getPedidosCliente(cId);
  });

  pedidoAtivo = computed<PedidoShared | null>(() =>
    this.pedidosDoCliente().find(
      p => !['entregue', 'cancelado'].includes(p.status)
    ) ?? null
  );

  historico = computed<PedidoShared[]>(() =>
    this.pedidosDoCliente().filter(p =>
      ['entregue', 'cancelado'].includes(p.status)
    )
  );

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
  cadastroSenhaConf = '';
  loginErro         = '';

  tela = signal<'lista' | 'status' | 'historico'>('lista');
  pedidoVisualizado = signal<PedidoShared | null>(null);

  // ── Pedido visualizado na tela de status ─────────────────────
  // Se pedidoVisualizado === null → mostra o pedidoAtivo
  private pedidoParaExibir = computed<PedidoShared | null>(() => {
    const vis = this.pedidoVisualizado();
    if (vis) {
      // Re-busca no signal para receber atualizações em tempo real
      return this.pedidoService.getPedido(vis.id) ?? vis;
    }
    return this.pedidoAtivo();
  });

  ehPedidoAtual = computed(() => this.pedidoVisualizado() === null);

  numeroPedidoExibido = computed(() => this.pedidoParaExibir()?.numero ?? '');
  itensPedidoExibido  = computed(() => this.pedidoParaExibir()?.itens ?? []);
  totalPedidoExibido  = computed(() => this.pedidoParaExibir()?.total ?? 0);

  totalItensPedidoAtual = computed(() =>
    (this.pedidoAtivo()?.itens ?? []).reduce((s, i) => s + i.quantidade, 0)
  );
  totalValorPedidoAtual = computed(() => this.pedidoAtivo()?.total ?? 0);

  labelStatusAtual = computed(() => {
    const s = this.pedidoAtivo()?.status;
    return s ? this.pedidoService.labelStatus(s) : '';
  });

  // ── Timeline ──────────────────────────────────────────────────
  etapasStatus = computed<EtapaStatus[]>(() => {
    const p = this.pedidoParaExibir();
    if (!p) return [];
    return this.calcularEtapas(p.status);
  });

  private calcularEtapas(status: StatusPedido): EtapaStatus[] {
    const ordem: StatusPedido[] = ['recebido', 'em_preparo', 'pronto', 'a_caminho', 'entregue'];

    const defs = [
      { label: 'Pedido recebido',   ref: 'recebido'   },
      { label: 'Em preparo',        ref: 'em_preparo' },
      { label: 'Pronto',            ref: 'pronto'     },
      { label: 'Saiu para entrega', ref: 'a_caminho'  },
      { label: 'Entregue',          ref: 'entregue'   },
    ];

    return defs.map((d, i) => {
      let estado: EtapaStatus['estado'];
      if (status === 'enviado') {
        if (i < 3) estado = 'concluido';
        else if (i === 3) estado = 'atual';
        else estado = 'pendente';
      } else {
        const idx = ordem.indexOf(d.ref as StatusPedido);
        const idxAtual = ordem.indexOf(status);
        if (idx < idxAtual)       estado = 'concluido';
        else if (idx === idxAtual) estado = 'atual';
        else                       estado = 'pendente';
      }
      return { label: d.label, estado };
    });
  }

  // ── Navegação ─────────────────────────────────────────────────
  abrirStatus(): void {
    this.pedidoVisualizado.set(null);
    this.tela.set('status');
  }

  abrirStatusHistorico(pedido: PedidoShared): void {
    this.pedidoVisualizado.set(pedido);
    this.tela.set('status');
  }

  abrirHistorico(): void { this.tela.set('historico'); }

  voltarLista(): void {
    this.tela.set('lista');
    this.pedidoVisualizado.set(null);
  }

  voltarHistorico(): void {
    this.tela.set('historico');
    this.pedidoVisualizado.set(null);
  }

  avaliarPedido(pedidoId: string): void {
    this.router.navigate(['/mobile/avaliacao'], { queryParams: { pedidoId } });
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
    this.cadastroNome = ''; this.cadastroTelefone = ''; this.cadastroSenhaConf = '';
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
    if (this.loginSenha.length < 6)                 { this.loginErro = 'Senha deve ter mínimo 6 caracteres.'; return; }
    if (this.loginSenha !== this.cadastroSenhaConf) { this.loginErro = 'As senhas não coincidem.'; return; }
    const r = await this.clienteAuth.cadastrar(
      this.cadastroNome, this.loginEmail, this.loginSenha, this.cadastroTelefone
    );
    if (r.success) this.fecharModal();
    else this.loginErro = r.error ?? 'Erro ao cadastrar.';
  }
}
