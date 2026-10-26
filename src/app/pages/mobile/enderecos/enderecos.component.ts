import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CepService, formatarCep, somenteDigitosCep } from '../../../services/cep.service';
import { ClienteAuthService } from '../../../services/cliente-auth.service';
import { EnderecoApiService } from '../../../services/api/endereco-api.service';
import { EnderecoApi, EnderecoPayload } from '../../../services/api/api-types';
import { mensagemDeErro } from '../../../services/api/api-error';

/** Endereço como a API devolve (id numérico, padrão primeiro). */
export type Endereco = EnderecoApi;
type FormEndereco = Omit<EnderecoPayload, 'padrao' | 'complemento'> & { complemento: string };

@Component({
  selector: 'app-enderecos',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './enderecos.component.html',
  styleUrls: ['./enderecos.component.scss'],
})
export class EnderecosComponent implements OnInit {

  private api         = inject(EnderecoApiService);
  private clienteAuth = inject(ClienteAuthService);
  private router      = inject(Router);

  enderecos  = signal<Endereco[]>([]);
  carregando = signal<boolean>(true);
  salvando   = signal<boolean>(false);
  erroLista  = signal<string>('');

  private cepService = inject(CepService);

  // Busca de CEP: preenche rua, bairro, cidade e UF sozinha
  buscandoCep = signal<boolean>(false);
  cepMsg = signal<{ tipo: 'ok' | 'erro'; texto: string } | null>(null);
  cepPreenchido = signal<boolean>(false);

  modalAberto = signal<boolean>(false);
  enderecoEditando: Endereco | null = null;
  erro = '';
  formPadrao = false;

  form: FormEndereco = {
    nome: '', rua: '', numero: '', complemento: '',
    bairro: '', cidade: '', estado: '', cep: ''
  };

  async ngOnInit(): Promise<void> {
    // Endereços pertencem à conta: sem login, vai para o login e volta para cá.
    if (!this.clienteAuth.isAuthenticated()) {
      this.router.navigate(['/mobile/perfil'], { queryParams: { login: '1', redirect: '/mobile/enderecos' } });
      return;
    }
    await this.carregar();
  }

  async carregar(): Promise<void> {
    this.carregando.set(true);
    this.erroLista.set('');
    try {
      this.enderecos.set(await this.api.listar());
    } catch (e) {
      this.erroLista.set(mensagemDeErro(e, 'Não foi possível carregar seus endereços.'));
    } finally {
      this.carregando.set(false);
    }
  }

  abrirModal(): void {
    this.enderecoEditando = null;
    this.form = { nome: '', rua: '', numero: '', complemento: '', bairro: '', cidade: '', estado: '', cep: '' };
    this.formPadrao = this.enderecos().length === 0;
    this.erro = '';
    this.limparStatusCep();
    this.modalAberto.set(true);
  }

  editarEndereco(endereco: Endereco): void {
    this.enderecoEditando = endereco;
    this.form = {
      nome: endereco.nome,
      rua: endereco.rua,
      numero: endereco.numero,
      complemento: endereco.complemento ?? '',
      bairro: endereco.bairro,
      cidade: endereco.cidade,
      estado: endereco.estado,
      cep: endereco.cep,
    };
    this.formPadrao = endereco.padrao;
    this.erro = '';
    this.limparStatusCep();
    this.modalAberto.set(true);
  }

  // ── CEP ───────────────────────────────────────────────────────
  private limparStatusCep(): void {
    this.buscandoCep.set(false);
    this.cepMsg.set(null);
    this.cepPreenchido.set(false);
  }

  /** Chamado a cada digitação no campo CEP: aplica a máscara e, com 8 dígitos, busca o endereço. */
  aoDigitarCep(valor: string): void {
    this.form.cep = formatarCep(valor);
    this.erro = '';
    const digitos = somenteDigitosCep(valor);
    if (digitos.length < 8) {
      this.limparStatusCep();
      return;
    }
    void this.buscarCep(digitos);
  }

  async buscarCep(digitos: string): Promise<void> {
    this.buscandoCep.set(true);
    this.cepMsg.set(null);
    this.cepPreenchido.set(false);
    try {
      const r = await this.cepService.buscar(digitos);
      // o usuário pode ter mudado o CEP enquanto a consulta rodava: ignora resposta antiga
      if (somenteDigitosCep(this.form.cep) !== digitos) return;
      if (!r) {
        this.cepMsg.set({ tipo: 'erro', texto: 'CEP não encontrado. Confira o número ou preencha o endereço manualmente.' });
        return;
      }
      // só sobrescreve o que o CEP trouxe (CEP de cidade pequena vem sem rua/bairro)
      if (r.rua)    this.form.rua    = r.rua;
      if (r.bairro) this.form.bairro = r.bairro;
      if (r.cidade) this.form.cidade = r.cidade;
      if (r.estado) this.form.estado = r.estado;
      this.cepPreenchido.set(true);
      this.cepMsg.set({ tipo: 'ok', texto: 'Endereço encontrado! Agora é só informar o número.' });
      setTimeout(() => (document.getElementById('campo-numero') as HTMLInputElement | null)?.focus(), 50);
    } catch {
      if (somenteDigitosCep(this.form.cep) !== digitos) return;
      this.cepMsg.set({ tipo: 'erro', texto: 'Não foi possível buscar o CEP agora. Preencha o endereço manualmente.' });
    } finally {
      if (somenteDigitosCep(this.form.cep) === digitos) this.buscandoCep.set(false);
    }
  }

  fecharModal(): void {
    this.limparStatusCep();
    this.modalAberto.set(false);
    this.enderecoEditando = null;
    this.erro = '';
  }

  async salvarEndereco(): Promise<void> {
    if (this.salvando()) return;
    if (!this.form.nome.trim())   { this.erro = 'Informe o nome do endereço.'; return; }
    if (somenteDigitosCep(this.form.cep).length !== 8) { this.erro = 'Informe um CEP válido (8 dígitos).'; return; }
    if (!this.form.rua.trim())    { this.erro = 'Informe a rua.'; return; }
    if (!this.form.numero.trim()) { this.erro = 'Informe o número.'; return; }
    if (!this.form.bairro.trim()) { this.erro = 'Informe o bairro.'; return; }
    if (!this.form.cidade.trim()) { this.erro = 'Informe a cidade.'; return; }
    if (!/^[A-Za-z]{2}$/.test(this.form.estado.trim())) { this.erro = 'Informe a UF com 2 letras (ex.: BA).'; return; }

    const payload: EnderecoPayload = {
      ...this.form,
      complemento: this.form.complemento.trim() || undefined,
      estado: this.form.estado.trim().toUpperCase(),
      padrao: this.formPadrao,
    };

    this.salvando.set(true);
    this.erro = '';
    try {
      if (this.enderecoEditando) await this.api.atualizar(this.enderecoEditando.id, payload);
      else                       await this.api.criar(payload);
      this.fecharModal();
      await this.carregar();
      this.voltarAoCheckoutSeNecessario();
    } catch (e) {
      this.erro = mensagemDeErro(e, 'Não foi possível salvar o endereço.');
    } finally {
      this.salvando.set(false);
    }
  }

  async deletarEndereco(id: number): Promise<void> {
    if (!confirm('Excluir este endereço?')) return;
    try {
      await this.api.remover(id);
      await this.carregar();
    } catch (e) {
      this.erroLista.set(mensagemDeErro(e, 'Não foi possível excluir o endereço.'));
    }
  }

  async definirPadrao(id: number): Promise<void> {
    try {
      await this.api.definirPadrao(id);
      await this.carregar();
    } catch (e) {
      this.erroLista.set(mensagemDeErro(e, 'Não foi possível definir o endereço padrão.'));
    }
  }

  /** Quem veio do checkout ("Adicionar novo endereço") volta para ele depois de salvar. */
  private voltarAoCheckoutSeNecessario(): void {
    if (this.router.routerState.snapshot.root.queryParamMap.get('origem') === 'checkout') {
      this.router.navigate(['/mobile/finalizar-pedido']);
    }
  }
}
