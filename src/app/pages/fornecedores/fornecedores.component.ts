import { Component, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../services/auth.service';

export interface Fornecedor {
  id: number;
  nome: string;
  cnpj: string;
  produtos: string;
  endereco: string;
  telefone: string;
  email: string;
  valorMedio: number;
  status: 'Ativo' | 'Inativo';
  observacoes: string;
}

@Component({
  selector: 'app-fornecedores', standalone: true, imports: [CommonModule],
  templateUrl: './fornecedores.component.html', styleUrls: ['./fornecedores.component.scss']
})
export class FornecedoresComponent {
  private authService = inject(AuthService);

  showModal         = signal(false);
  editando          = signal<Fornecedor | null>(null);
  isSaving          = signal(false);
  showModalExclusao = signal(false);
  fornParaExcluir   = signal<Fornecedor | null>(null);

  mNome        = signal('');
  mCnpj        = signal('');
  mProdutos    = signal('');
  mEndereco    = signal('');
  mTelefone    = signal('');
  mEmail       = signal('');
  mValor       = signal('0');
  mStatus      = signal<'Ativo' | 'Inativo'>('Ativo');
  mObservacoes = signal('');

  fornecedores = signal<Fornecedor[]>([
    { id:1, nome:'Mar & Sabor LTDA',        cnpj:'12.345.678/0001-90', produtos:'Frutos do mar (Peixe, Camarão, Polvo, Siri, Sururu)', endereco:'Rua das Ondas, 245 - Salvador/BA - CEP: 40000-000', telefone:'(71) 3333-4444', email:'contato@maresabor.com.br',                valorMedio:18500, status:'Ativo', observacoes:'' },
    { id:2, nome:'Distribuidora Nordeste',   cnpj:'23.456.789/0001-12', produtos:'Grãos, Farinhas, Temperos, Bebidas',                  endereco:'Av. Principal, 1500 - Feira de Santana/BA - CEP: 44000-000', telefone:'(75) 3222-5555', email:'vendas@distribuidoranordeste.com.br', valorMedio:12000, status:'Ativo', observacoes:'' },
    { id:3, nome:'Hortifruti Regional',      cnpj:'34.567.890/0001-34', produtos:'Frutas, Verduras, Legumes',                           endereco:'Mercado Municipal, Box 15 - Salvador/BA - CEP: 40050-000', telefone:'(71) 3111-2222', email:'hortifrutiregional@email.com',            valorMedio:8500,  status:'Ativo', observacoes:'' },
    { id:4, nome:'Carnes Nordeste Premium',  cnpj:'45.678.901/0001-56', produtos:'Carne do sol, Carnes bovinas',                        endereco:'Rua do Comércio, 890 - Salvador/BA - CEP: 40100-000',       telefone:'(71) 3444-6666', email:'carnesnordeste@gmail.com',                valorMedio:6800,  status:'Ativo', observacoes:'' },
    { id:5, nome:'Laticínios Santa Clara',   cnpj:'56.789.012/0001-78', produtos:'Leite, Queijo coalho, Laticínios em geral',           endereco:'Fazenda Santa Clara - Alagoinhas/BA - CEP: 48000-000',      telefone:'(75) 3555-7777', email:'santaclara@laticinios.com.br',            valorMedio:4200,  status:'Ativo', observacoes:'' },
    { id:6, nome:'Sabores da Bahia',         cnpj:'67.890.123/0001-90', produtos:'Azeite de dendê, Temperos típicos',                   endereco:'Rua da Alegria, 123 - Salvador/BA - CEP: 40200-000',        telefone:'(71) 3666-8888', email:'saboresba@yahoo.com.br',                  valorMedio:3500,  status:'Ativo', observacoes:'' },
    { id:7, nome:'Bebidas & Cia',            cnpj:'78.901.234/0001-01', produtos:'Água, Refrigerantes, Cervejas, Destilados',           endereco:'Av. das Bebidas, 2000 - Salvador/BA - CEP: 40300-000',      telefone:'(71) 3777-9999', email:'bebidas.cia@outlook.com',                 valorMedio:9800,  status:'Ativo', observacoes:'' },
    { id:8, nome:'Gelo Norte',               cnpj:'89.012.345/0001-23', produtos:'Gelo em cubos, Gelo em barra',                        endereco:'Rua Fria, 567 - Salvador/BA - CEP: 40400-000',              telefone:'(71) 3888-0000', email:'gelonorte@email.com',                     valorMedio:1500,  status:'Ativo', observacoes:'' },
    { id:9, nome:'Água Pura',                cnpj:'90.123.456/0001-45', produtos:'Água filtrada, Tratamento de água',                   endereco:'Rua das Águas, 789 - Salvador/BA - CEP: 40500-000',         telefone:'(71) 3999-1111', email:'aguapura@hotmail.com',                    valorMedio:800,   status:'Ativo', observacoes:'' },
  ]);

  getPrimeiroNome(): string {
    const u = this.authService.getCurrentUser();
    return u?.nomeCompleto?.split(' ')[0] || u?.matricula || '';
  }

  formatValor(v: number): string {
    return v.toLocaleString('pt-BR', { minimumFractionDigits: 2 });
  }

  // ── Modal Adicionar/Editar ────────────────────────────────────
  abrirModalNovo(): void {
    this.editando.set(null);
    this.mNome.set(''); this.mCnpj.set(''); this.mProdutos.set('');
    this.mEndereco.set(''); this.mTelefone.set(''); this.mEmail.set('');
    this.mValor.set('0'); this.mStatus.set('Ativo'); this.mObservacoes.set('');
    this.showModal.set(true);
  }

  abrirModalEditar(f: Fornecedor, e: Event): void {
    e.stopPropagation();
    this.editando.set(f);
    this.mNome.set(f.nome); this.mCnpj.set(f.cnpj); this.mProdutos.set(f.produtos);
    this.mEndereco.set(f.endereco); this.mTelefone.set(f.telefone); this.mEmail.set(f.email);
    this.mValor.set(String(f.valorMedio)); this.mStatus.set(f.status);
    this.mObservacoes.set(f.observacoes ?? '');
    this.showModal.set(true);
  }

  fecharModal(): void { if (!this.isSaving()) this.showModal.set(false); }

  salvar(): void {
    if (!this.mNome().trim()) return;
    this.isSaving.set(true);
    const dados: Partial<Fornecedor> = {
      nome: this.mNome(), cnpj: this.mCnpj(), produtos: this.mProdutos(),
      endereco: this.mEndereco(), telefone: this.mTelefone(), email: this.mEmail(),
      valorMedio: parseFloat(this.mValor().replace(',', '.')) || 0,
      status: this.mStatus(), observacoes: this.mObservacoes(),
    };
    const ed = this.editando();
    if (ed) {
      this.fornecedores.update(l => l.map(f => f.id === ed.id ? { ...f, ...dados } : f));
    } else {
      this.fornecedores.update(l => [...l, { id: Date.now(), ...dados } as Fornecedor]);
    }
    this.isSaving.set(false);
    this.fecharModal();
  }

  // ── Modal Exclusão ────────────────────────────────────────────
  confirmarExclusao(f: Fornecedor, e: Event): void {
    e.stopPropagation();
    this.fornParaExcluir.set(f);
    this.showModalExclusao.set(true);
  }

  cancelarExclusao(): void {
    this.showModalExclusao.set(false);
    this.fornParaExcluir.set(null);
  }

  confirmarExclusaoFinal(): void {
    const f = this.fornParaExcluir();
    if (f) this.fornecedores.update(l => l.filter(x => x.id !== f.id));
    this.cancelarExclusao();
  }

  onInput(field: string, e: Event): void {
    const v = (e.target as HTMLInputElement | HTMLTextAreaElement).value;
    if (field === 'nome')        this.mNome.set(v);
    if (field === 'cnpj')        this.mCnpj.set(v);
    if (field === 'produtos')    this.mProdutos.set(v);
    if (field === 'endereco')    this.mEndereco.set(v);
    if (field === 'telefone')    this.mTelefone.set(v);
    if (field === 'email')       this.mEmail.set(v);
    if (field === 'valor')       this.mValor.set(v);
    if (field === 'observacoes') this.mObservacoes.set(v);
  }

  onSelectStatus(e: Event): void {
    this.mStatus.set((e.target as HTMLSelectElement).value as 'Ativo' | 'Inativo');
  }
}
