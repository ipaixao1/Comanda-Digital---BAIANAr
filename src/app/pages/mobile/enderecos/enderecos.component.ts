import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';

export interface Endereco {
  id: number;
  nome: string;
  rua: string;
  numero: string;
  complemento?: string;
  bairro: string;
  cidade: string;
  estado: string;
  cep: string;
  padrao: boolean;
}

@Component({
  selector: 'app-enderecos',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './enderecos.component.html',
  styleUrls: ['./enderecos.component.scss'],
})
export class EnderecosComponent {

  enderecos = signal<Endereco[]>([
    { id: 1, nome: 'Casa',     rua: 'Rua da Alegria',           numero: '123', complemento: 'Apto 201', bairro: 'Pelourinho', cidade: 'Salvador', estado: 'BA', cep: '40026-155', padrao: true  },
    { id: 2, nome: 'Trabalho', rua: 'Avenida Sete de Setembro', numero: '456', complemento: '',         bairro: 'Centro',     cidade: 'Salvador', estado: 'BA', cep: '40060-000', padrao: false },
  ]);

  modalAberto = signal<boolean>(false);
  enderecoEditando: Endereco | null = null;
  erro = '';
  formPadrao = false;

  form: Omit<Endereco, 'id' | 'padrao'> = {
    nome: '', rua: '', numero: '', complemento: '',
    bairro: '', cidade: '', estado: '', cep: ''
  };

  abrirModal(): void {
    this.enderecoEditando = null;
    this.form = { nome: '', rua: '', numero: '', complemento: '', bairro: '', cidade: '', estado: '', cep: '' };
    this.formPadrao = this.enderecos().length === 0;
    this.erro = '';
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
    this.modalAberto.set(true);
  }

  fecharModal(): void {
    this.modalAberto.set(false);
    this.enderecoEditando = null;
    this.erro = '';
  }

  salvarEndereco(): void {
    if (!this.form.nome.trim())   { this.erro = 'Informe o nome do endereço.'; return; }
    if (!this.form.rua.trim())    { this.erro = 'Informe a rua.'; return; }
    if (!this.form.numero.trim()) { this.erro = 'Informe o número.'; return; }
    if (!this.form.bairro.trim()) { this.erro = 'Informe o bairro.'; return; }
    if (!this.form.cidade.trim()) { this.erro = 'Informe a cidade.'; return; }
    if (!this.form.cep.trim())    { this.erro = 'Informe o CEP.'; return; }

    if (this.enderecoEditando) {
      this.enderecos.update(list =>
        list.map(e => ({
          ...e,
          padrao: this.formPadrao ? e.id === this.enderecoEditando!.id : e.padrao,
          ...(e.id === this.enderecoEditando!.id ? { ...this.form } : {})
        }))
      );
    } else {
      if (this.formPadrao) {
        this.enderecos.update(list => list.map(e => ({ ...e, padrao: false })));
      }
      const novo: Endereco = {
        id: Date.now(),
        ...this.form,
        padrao: this.formPadrao,
      };
      this.enderecos.update(list => [...list, novo]);
    }
    this.fecharModal();
  }

  deletarEndereco(id: number): void {
    this.enderecos.update(list => {
      const nova = list.filter(e => e.id !== id);
      if (nova.length > 0 && !nova.some(e => e.padrao)) {
        nova[0] = { ...nova[0], padrao: true };
      }
      return nova;
    });
  }

  definirPadrao(id: number): void {
    this.enderecos.update(list =>
      list.map(e => ({ ...e, padrao: e.id === id }))
    );
  }
}