import { Component, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, ActivatedRoute, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ClienteAuthService } from '../../../services/cliente-auth.service';

export interface MetodoPagamento {
  id: number;
  tipo: 'credito' | 'debito' | 'pix' | 'dinheiro';
  nome: string;
  detalhe: string;
  selecionado: boolean;
}

@Component({
  selector: 'app-configuracao',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './configuracao.component.html',
  styleUrls: ['./configuracao.component.scss'],
})
export class ConfiguracoesComponent implements OnInit {

  tela = signal<'menu' | 'ajuda' | 'termos' | 'privacidade' | 'editar-perfil' | 'alterar-senha' | 'pagamentos' | 'adicionar-cartao'>('menu');
  faqAberto = signal<number | null>(null);

  // Editar perfil
  editNome = '';
  editEmail = '';
  editTelefone = '';
  editErro = '';
  editSucesso = false;

  // Alterar senha
  senhaAtual = '';
  novaSenha = '';
  confirmarSenha = '';
  senhaErro = '';
  senhaSucesso = false;
  senhaAtualVisivel = signal(false);
  novaSenhaVisivel = signal(false);
  confirmarSenhaVisivel = signal(false);

  // Pagamentos
  metodosPagamento = signal<MetodoPagamento[]>([
    { id: 1, tipo: 'credito',  nome: 'Cartão de Crédito', detalhe: '•••• •••• •••• 1234', selecionado: true  },
    { id: 2, tipo: 'debito',   nome: 'Cartão de Débito',  detalhe: '•••• •••• •••• 5678', selecionado: false },
    { id: 3, tipo: 'pix',      nome: 'Pix',               detalhe: 'Pagamento instantâneo', selecionado: false },
    { id: 4, tipo: 'dinheiro', nome: 'Dinheiro',          detalhe: 'Pagamento na entrega', selecionado: false },
  ]);

  // Adicionar cartão
  cartaoTipo = signal<'credito' | 'debito'>('credito');
  cartaoNumero = '';
  cartaoNome = '';
  cartaoValidade = '';
  cartaoCvv = '';
  cartaoCpf = '';
  cartaoErro = '';

  // Indica se o usuário chegou aqui a partir do checkout (finalizar pedido)
  vindoDoCheckout = false;

  constructor(
    private clienteAuth: ClienteAuthService,
    private route: ActivatedRoute,
    private router: Router,
  ) {}

  ngOnInit(): void {
    const cliente = this.clienteAuth.getCurrentCliente();
    if (cliente) {
      this.editNome = cliente.nome;
      this.editEmail = cliente.email;
      this.editTelefone = cliente.telefone ?? '';
    }

    // Permite abrir direto em uma sub-tela via query param, ex: /mobile/configuracoes?tela=adicionar-cartao&origem=checkout
    const telaInicial = this.route.snapshot.queryParamMap.get('tela');
    const origem = this.route.snapshot.queryParamMap.get('origem');

    if (origem === 'checkout') {
      this.vindoDoCheckout = true;
    }

    if (telaInicial === 'pagamentos' || telaInicial === 'adicionar-cartao') {
      this.tela.set(telaInicial);
    }
  }

  faqs = [
    { pergunta: 'Como faço um pedido?', resposta: 'Para fazer um pedido, basta navegar pelo menu, escolher os pratos desejados e adicioná-los ao carrinho. Em seguida, finalize o pedido informando o endereço e forma de pagamento.' },
    { pergunta: 'Como acompanhar meu pedido?', resposta: 'Após finalizar o pedido, você pode acompanhar o status em tempo real na aba "Pedidos".' },
    { pergunta: 'Posso cancelar um pedido?', resposta: 'Sim, você pode cancelar um pedido antes que ele entre em preparo. Após esse estágio, o cancelamento pode não estar disponível.' },
    { pergunta: 'Quais formas de pagamento são aceitas?', resposta: 'Aceitamos cartões de crédito, débito e, em alguns casos, pagamento na entrega.' },
    { pergunta: 'Meu pedido atrasou, o que faço?', resposta: 'Recomendamos verificar o status na aba "Pedidos". Caso o atraso persista, entre em contato com o suporte pelo app.' },
    { pergunta: 'Recebi um pedido errado, como proceder?', resposta: 'Pedimos desculpas pelo ocorrido. Entre em contato com o suporte para que possamos resolver o problema o mais rápido possível.' },
    { pergunta: 'Como alterar meus dados pessoais?', resposta: 'Você pode editar suas informações na opção "Editar perfil" dentro de "Configurações".' },
    { pergunta: 'Como redefinir minha senha?', resposta: 'Acesse Perfil → Configurações → Alterar senha para redefinir sua senha.' },
  ];

  toggleFaq(index: number): void {
    this.faqAberto.set(this.faqAberto() === index ? null : index);
  }

  voltar(): void {
    this.tela.set('menu');
    this.editErro = '';
    this.editSucesso = false;
    this.senhaErro = '';
    this.senhaSucesso = false;
  }

  salvarPerfil(): void {
    this.editErro = '';
    this.editSucesso = false;
    if (!this.editNome.trim()) { this.editErro = 'Informe seu nome.'; return; }
    if (!this.editEmail.trim()) { this.editErro = 'Informe seu email.'; return; }
    this.editSucesso = true;
    setTimeout(() => this.editSucesso = false, 3000);
  }

  atualizarSenha(): void {
    this.senhaErro = '';
    this.senhaSucesso = false;
    if (!this.senhaAtual) { this.senhaErro = 'Informe a senha atual.'; return; }
    if (this.novaSenha.length < 6) { this.senhaErro = 'A nova senha deve ter mínimo 6 caracteres.'; return; }
    if (this.novaSenha !== this.confirmarSenha) { this.senhaErro = 'As senhas não coincidem.'; return; }
    this.senhaSucesso = true;
    this.senhaAtual = '';
    this.novaSenha = '';
    this.confirmarSenha = '';
    setTimeout(() => this.senhaSucesso = false, 3000);
  }

  cartaoNumeroFormatado(): string {
    const digitos = this.cartaoNumero.replace(/\D/g, '').padEnd(16, '•');
    return digitos.slice(0, 16).replace(/(.{4})/g, '$1 ').trim();
  }

  onCartaoNumeroInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    const digitos = input.value.replace(/\D/g, '').slice(0, 16);
    const formatado = digitos.replace(/(.{4})/g, '$1 ').trim();
    this.cartaoNumero = digitos;
    input.value = formatado;
  }

  onCartaoValidadeInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    let digitos = input.value.replace(/\D/g, '').slice(0, 4);
    if (digitos.length >= 3) {
      digitos = digitos.slice(0, 2) + '/' + digitos.slice(2);
    }
    this.cartaoValidade = digitos;
    input.value = digitos;
  }

  selecionarTipoCartao(tipo: 'credito' | 'debito'): void {
    this.cartaoTipo.set(tipo);
  }

  salvarCartao(): void {
    this.cartaoErro = '';
    if (this.cartaoNumero.replace(/\D/g, '').length < 16) { this.cartaoErro = 'Informe um número de cartão válido.'; return; }
    if (!this.cartaoNome.trim()) { this.cartaoErro = 'Informe o nome impresso no cartão.'; return; }
    if (this.cartaoValidade.length < 5) { this.cartaoErro = 'Informe a validade no formato MM/AA.'; return; }
    if (this.cartaoCvv.length < 3) { this.cartaoErro = 'Informe o CVV.'; return; }

    const ultimos4 = this.cartaoNumero.replace(/\D/g, '').slice(-4);
    const novoId = Math.max(0, ...this.metodosPagamento().map(m => m.id)) + 1;

    this.metodosPagamento.update(lista => [
      ...lista,
      {
        id: novoId,
        tipo: this.cartaoTipo(),
        nome: this.cartaoTipo() === 'credito' ? 'Cartão de Crédito' : 'Cartão de Débito',
        detalhe: `•••• •••• •••• ${ultimos4}`,
        selecionado: false,
      }
    ]);

    this.cartaoNumero = '';
    this.cartaoNome = '';
    this.cartaoValidade = '';
    this.cartaoCvv = '';
    this.cartaoCpf = '';
    this.cartaoTipo.set('credito');

    if (this.vindoDoCheckout) {
      this.router.navigate(['/mobile/finalizar-pedido']);
      return;
    }

    this.tela.set('pagamentos');
  }

  voltarDeAdicionarCartao(): void {
    if (this.vindoDoCheckout) {
      this.router.navigate(['/mobile/finalizar-pedido']);
      return;
    }
    this.tela.set('pagamentos');
  }

  selecionarMetodo(id: number): void {
    this.metodosPagamento.update(lista =>
      lista.map(m => ({ ...m, selecionado: m.id === id }))
    );
  }

  removerMetodo(id: number): void {
    this.metodosPagamento.update(lista => {
      const nova = lista.filter(m => m.id !== id);
      if (nova.length > 0 && !nova.some(m => m.selecionado)) {
        nova[0].selecionado = true;
      }
      return nova;
    });
  }
}