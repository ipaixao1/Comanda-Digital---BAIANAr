import { Component, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../services/auth.service';

export type StatusEstoque = 'Normal' | 'Baixo' | 'Crítico';

export interface Produto {
  id: number;
  nome: string;
  categoria: string;
  fornecedor: string;
  qtdAtual: number;
  unidade: string;
  nivelMinimo: number;
  preco: number;
  descricao: string;
  status: StatusEstoque;
  ultimaAtualizacao: string;
}

@Component({
  selector: 'app-estoque', standalone: true, imports: [CommonModule],
  templateUrl: './estoque.component.html', styleUrls: ['./estoque.component.scss']
})
export class EstoqueComponent {
  private authService = inject(AuthService);

  showModal         = signal(false);
  editando          = signal<Produto | null>(null);
  isSaving          = signal(false);
  showModalExclusao = signal(false);
  prodParaExcluir   = signal<Produto | null>(null);

  // Modal signals
  mNome      = signal('');
  mCategoria = signal('');
  mFornecedor= signal('');
  mQtd       = signal('0');
  mUnidade   = signal('kg');
  mMinimo    = signal('0');
  mPreco     = signal('0');
  mDescricao = signal('');
  mEmoji     = signal('📦');

  unidades = ['kg', 'g', 'litro', 'ml', 'unidade'];

  private calcStatus(qtd: number, min: number): StatusEstoque {
    if (qtd <= min * 0.5) return 'Crítico';
    if (qtd < min)        return 'Baixo';
    return 'Normal';
  }

  private hoje(): string {
    return new Date().toLocaleDateString('pt-BR');
  }

  produtos = signal<Produto[]>([
    { id:1,  nome:'Peixe branco',          categoria:'Frutos do Mar', fornecedor:'Mar & Sabor LTDA',        qtdAtual:25,  unidade:'kg',      nivelMinimo:15,  preco:0, descricao:'', status:'Normal',  ultimaAtualizacao:'07/03/2026' },
    { id:2,  nome:'Camarão',               categoria:'Frutos do Mar', fornecedor:'Mar & Sabor LTDA',        qtdAtual:8,   unidade:'kg',      nivelMinimo:10,  preco:0, descricao:'', status:'Baixo',   ultimaAtualizacao:'06/03/2026' },
    { id:3,  nome:'Polvo',                 categoria:'Frutos do Mar', fornecedor:'Mar & Sabor LTDA',        qtdAtual:4,   unidade:'kg',      nivelMinimo:8,   preco:0, descricao:'', status:'Crítico', ultimaAtualizacao:'04/03/2026' },
    { id:4,  nome:'Carne de siri',         categoria:'Frutos do Mar', fornecedor:'Mar & Sabor LTDA',        qtdAtual:12,  unidade:'kg',      nivelMinimo:8,   preco:0, descricao:'', status:'Normal',  ultimaAtualizacao:'07/03/2026' },
    { id:5,  nome:'Sururu',                categoria:'Frutos do Mar', fornecedor:'Mar & Sabor LTDA',        qtdAtual:15,  unidade:'kg',      nivelMinimo:10,  preco:0, descricao:'', status:'Normal',  ultimaAtualizacao:'05/03/2026' },
    { id:6,  nome:'Manjubinha (pititinga)', categoria:'Frutos do Mar', fornecedor:'Mar & Sabor LTDA',       qtdAtual:6,   unidade:'kg',      nivelMinimo:5,   preco:0, descricao:'', status:'Normal',  ultimaAtualizacao:'06/03/2026' },
    { id:7,  nome:'Camarão seco',          categoria:'Frutos do Mar', fornecedor:'Distribuidora Nordeste',  qtdAtual:20,  unidade:'kg',      nivelMinimo:12,  preco:0, descricao:'', status:'Normal',  ultimaAtualizacao:'28/02/2026' },
    { id:8,  nome:'Carne do sol',          categoria:'Carnes',        fornecedor:'Carnes Nordeste Premium', qtdAtual:18,  unidade:'kg',      nivelMinimo:15,  preco:0, descricao:'', status:'Normal',  ultimaAtualizacao:'07/03/2026' },
    { id:9,  nome:'Feijão fradinho',       categoria:'Grãos',         fornecedor:'Distribuidora Nordeste',  qtdAtual:35,  unidade:'kg',      nivelMinimo:20,  preco:0, descricao:'', status:'Normal',  ultimaAtualizacao:'04/03/2026' },
    { id:10, nome:'Feijão verde',          categoria:'Grãos',         fornecedor:'Distribuidora Nordeste',  qtdAtual:28,  unidade:'kg',      nivelMinimo:20,  preco:0, descricao:'', status:'Normal',  ultimaAtualizacao:'04/03/2026' },
    { id:11, nome:'Arroz branco',          categoria:'Grãos',         fornecedor:'Distribuidora Nordeste',  qtdAtual:45,  unidade:'kg',      nivelMinimo:30,  preco:0, descricao:'', status:'Normal',  ultimaAtualizacao:'05/03/2026' },
    { id:12, nome:'Mandioca',              categoria:'Raízes',        fornecedor:'Hortifruti Regional',     qtdAtual:22,  unidade:'kg',      nivelMinimo:15,  preco:0, descricao:'', status:'Normal',  ultimaAtualizacao:'07/03/2026' },
    { id:13, nome:'Tapioca granulada',     categoria:'Raízes',        fornecedor:'Distribuidora Nordeste',  qtdAtual:18,  unidade:'kg',      nivelMinimo:12,  preco:0, descricao:'', status:'Normal',  ultimaAtualizacao:'03/03/2026' },
    { id:14, nome:'Leite',                 categoria:'Laticínios',    fornecedor:'Laticínios Santa Clara',  qtdAtual:30,  unidade:'litro',   nivelMinimo:25,  preco:0, descricao:'', status:'Normal',  ultimaAtualizacao:'07/03/2026' },
    { id:15, nome:'Leite condensado',      categoria:'Laticínios',    fornecedor:'Distribuidora Nordeste',  qtdAtual:12,  unidade:'unidade', nivelMinimo:10,  preco:0, descricao:'', status:'Normal',  ultimaAtualizacao:'06/03/2026' },
    { id:16, nome:'Queijo coalho',         categoria:'Laticínios',    fornecedor:'Laticínios Santa Clara',  qtdAtual:8,   unidade:'kg',      nivelMinimo:10,  preco:0, descricao:'', status:'Baixo',   ultimaAtualizacao:'05/03/2026' },
    { id:17, nome:'Limão',                 categoria:'Frutas',        fornecedor:'Hortifruti Regional',     qtdAtual:15,  unidade:'kg',      nivelMinimo:10,  preco:0, descricao:'', status:'Normal',  ultimaAtualizacao:'07/03/2026' },
    { id:18, nome:'Laranja',               categoria:'Frutas',        fornecedor:'Hortifruti Regional',     qtdAtual:18,  unidade:'kg',      nivelMinimo:12,  preco:0, descricao:'', status:'Normal',  ultimaAtualizacao:'07/03/2026' },
    { id:19, nome:'Abacaxi',               categoria:'Frutas',        fornecedor:'Hortifruti Regional',     qtdAtual:25,  unidade:'unidade', nivelMinimo:15,  preco:0, descricao:'', status:'Normal',  ultimaAtualizacao:'06/03/2026' },
    { id:20, nome:'Maracujá',              categoria:'Frutas',        fornecedor:'Hortifruti Regional',     qtdAtual:12,  unidade:'kg',      nivelMinimo:10,  preco:0, descricao:'', status:'Normal',  ultimaAtualizacao:'07/03/2026' },
    { id:21, nome:'Morango',               categoria:'Frutas',        fornecedor:'Hortifruti Regional',     qtdAtual:5,   unidade:'kg',      nivelMinimo:8,   preco:0, descricao:'', status:'Baixo',   ultimaAtualizacao:'05/03/2026' },
    { id:22, nome:'Manga',                 categoria:'Frutas',        fornecedor:'Hortifruti Regional',     qtdAtual:20,  unidade:'kg',      nivelMinimo:12,  preco:0, descricao:'', status:'Normal',  ultimaAtualizacao:'07/03/2026' },
    { id:23, nome:'Acerola',               categoria:'Frutas',        fornecedor:'Hortifruti Regional',     qtdAtual:8,   unidade:'kg',      nivelMinimo:6,   preco:0, descricao:'', status:'Normal',  ultimaAtualizacao:'06/03/2026' },
    { id:24, nome:'Cajá',                  categoria:'Frutas',        fornecedor:'Hortifruti Regional',     qtdAtual:10,  unidade:'kg',      nivelMinimo:8,   preco:0, descricao:'', status:'Normal',  ultimaAtualizacao:'06/03/2026' },
    { id:25, nome:'Caju',                  categoria:'Frutas',        fornecedor:'Hortifruti Regional',     qtdAtual:6,   unidade:'kg',      nivelMinimo:5,   preco:0, descricao:'', status:'Normal',  ultimaAtualizacao:'07/03/2026' },
    { id:26, nome:'Cebola',                categoria:'Hortaliças',    fornecedor:'Hortifruti Regional',     qtdAtual:25,  unidade:'kg',      nivelMinimo:15,  preco:0, descricao:'', status:'Normal',  ultimaAtualizacao:'07/03/2026' },
    { id:27, nome:'Alho',                  categoria:'Hortaliças',    fornecedor:'Hortifruti Regional',     qtdAtual:8,   unidade:'kg',      nivelMinimo:6,   preco:0, descricao:'', status:'Normal',  ultimaAtualizacao:'06/03/2026' },
    { id:28, nome:'Tomate',                categoria:'Hortaliças',    fornecedor:'Hortifruti Regional',     qtdAtual:18,  unidade:'kg',      nivelMinimo:15,  preco:0, descricao:'', status:'Normal',  ultimaAtualizacao:'07/03/2026' },
    { id:29, nome:'Pimentão vermelho',     categoria:'Hortaliças',    fornecedor:'Hortifruti Regional',     qtdAtual:12,  unidade:'kg',      nivelMinimo:10,  preco:0, descricao:'', status:'Normal',  ultimaAtualizacao:'07/03/2026' },
    { id:30, nome:'Pimentão amarelo',      categoria:'Hortaliças',    fornecedor:'Hortifruti Regional',     qtdAtual:10,  unidade:'kg',      nivelMinimo:8,   preco:0, descricao:'', status:'Normal',  ultimaAtualizacao:'07/03/2026' },
    { id:31, nome:'Pimentão verde',        categoria:'Hortaliças',    fornecedor:'Hortifruti Regional',     qtdAtual:14,  unidade:'kg',      nivelMinimo:10,  preco:0, descricao:'', status:'Normal',  ultimaAtualizacao:'07/03/2026' },
    { id:32, nome:'Coentro',               categoria:'Hortaliças',    fornecedor:'Hortifruti Regional',     qtdAtual:4,   unidade:'kg',      nivelMinimo:3,   preco:0, descricao:'', status:'Normal',  ultimaAtualizacao:'08/03/2026' },
    { id:33, nome:'Cebolinha',             categoria:'Hortaliças',    fornecedor:'Hortifruti Regional',     qtdAtual:3,   unidade:'kg',      nivelMinimo:3,   preco:0, descricao:'', status:'Normal',  ultimaAtualizacao:'08/03/2026' },
    { id:34, nome:'Gengibre',              categoria:'Hortaliças',    fornecedor:'Hortifruti Regional',     qtdAtual:5,   unidade:'kg',      nivelMinimo:4,   preco:0, descricao:'', status:'Normal',  ultimaAtualizacao:'06/03/2026' },
    { id:35, nome:'Leite de coco',         categoria:'Coco',          fornecedor:'Distribuidora Nordeste',  qtdAtual:22,  unidade:'litro',   nivelMinimo:18,  preco:0, descricao:'', status:'Normal',  ultimaAtualizacao:'05/03/2026' },
    { id:36, nome:'Coco ralado',           categoria:'Coco',          fornecedor:'Distribuidora Nordeste',  qtdAtual:8,   unidade:'kg',      nivelMinimo:6,   preco:0, descricao:'', status:'Normal',  ultimaAtualizacao:'04/03/2026' },
    { id:37, nome:'Azeite de dendê',       categoria:'Temperos',      fornecedor:'Sabores da Bahia',        qtdAtual:12,  unidade:'litro',   nivelMinimo:10,  preco:0, descricao:'', status:'Normal',  ultimaAtualizacao:'03/03/2026' },
    { id:38, nome:'Azeite de oliva',       categoria:'Temperos',      fornecedor:'Distribuidora Nordeste',  qtdAtual:8,   unidade:'litro',   nivelMinimo:8,   preco:0, descricao:'', status:'Normal',  ultimaAtualizacao:'04/03/2026' },
    { id:39, nome:'Sal',                   categoria:'Temperos',      fornecedor:'Distribuidora Nordeste',  qtdAtual:40,  unidade:'kg',      nivelMinimo:20,  preco:0, descricao:'', status:'Normal',  ultimaAtualizacao:'28/02/2026' },
    { id:40, nome:'Pimenta-do-reino',      categoria:'Temperos',      fornecedor:'Sabores da Bahia',        qtdAtual:3,   unidade:'kg',      nivelMinimo:2,   preco:0, descricao:'', status:'Normal',  ultimaAtualizacao:'02/03/2026' },
    { id:41, nome:'Pimenta dedo-de-moça',  categoria:'Temperos',      fornecedor:'Hortifruti Regional',     qtdAtual:2,   unidade:'kg',      nivelMinimo:2,   preco:0, descricao:'', status:'Normal',  ultimaAtualizacao:'07/03/2026' },
    { id:42, nome:'Cominho',               categoria:'Temperos',      fornecedor:'Sabores da Bahia',        qtdAtual:1.5, unidade:'kg',      nivelMinimo:1,   preco:0, descricao:'', status:'Normal',  ultimaAtualizacao:'01/03/2026' },
    { id:43, nome:'Colorau',               categoria:'Temperos',      fornecedor:'Sabores da Bahia',        qtdAtual:4,   unidade:'kg',      nivelMinimo:3,   preco:0, descricao:'', status:'Normal',  ultimaAtualizacao:'03/03/2026' },
    { id:44, nome:'Canela',                categoria:'Temperos',      fornecedor:'Sabores da Bahia',        qtdAtual:1,   unidade:'kg',      nivelMinimo:0.8, preco:0, descricao:'', status:'Normal',  ultimaAtualizacao:'28/02/2026' },
    { id:45, nome:'Açúcar',                categoria:'Temperos',      fornecedor:'Distribuidora Nordeste',  qtdAtual:35,  unidade:'kg',      nivelMinimo:25,  preco:0, descricao:'', status:'Normal',  ultimaAtualizacao:'05/03/2026' },
    { id:46, nome:'Farinha de mandioca',   categoria:'Farinhas',      fornecedor:'Distribuidora Nordeste',  qtdAtual:30,  unidade:'kg',      nivelMinimo:20,  preco:0, descricao:'', status:'Normal',  ultimaAtualizacao:'04/03/2026' },
    { id:47, nome:'Farinha de trigo',      categoria:'Farinhas',      fornecedor:'Distribuidora Nordeste',  qtdAtual:25,  unidade:'kg',      nivelMinimo:18,  preco:0, descricao:'', status:'Normal',  ultimaAtualizacao:'05/03/2026' },
    { id:48, nome:'Óleo vegetal',          categoria:'Óleos',         fornecedor:'Distribuidora Nordeste',  qtdAtual:28,  unidade:'litro',   nivelMinimo:20,  preco:0, descricao:'', status:'Normal',  ultimaAtualizacao:'05/03/2026' },
    { id:49, nome:'Água mineral',          categoria:'Bebidas',       fornecedor:'Bebidas & Cia',           qtdAtual:120, unidade:'unidade', nivelMinimo:100, preco:0, descricao:'', status:'Normal',  ultimaAtualizacao:'07/03/2026' },
    { id:50, nome:'Água com gás',          categoria:'Bebidas',       fornecedor:'Bebidas & Cia',           qtdAtual:85,  unidade:'unidade', nivelMinimo:60,  preco:0, descricao:'', status:'Normal',  ultimaAtualizacao:'07/03/2026' },
    { id:51, nome:'Refrigerantes',         categoria:'Bebidas',       fornecedor:'Bebidas & Cia',           qtdAtual:95,  unidade:'unidade', nivelMinimo:80,  preco:0, descricao:'', status:'Normal',  ultimaAtualizacao:'07/03/2026' },
    { id:52, nome:'Cachaça',               categoria:'Bebidas',       fornecedor:'Bebidas & Cia',           qtdAtual:28,  unidade:'unidade', nivelMinimo:20,  preco:0, descricao:'', status:'Normal',  ultimaAtualizacao:'06/03/2026' },
    { id:53, nome:'Vodka',                 categoria:'Bebidas',       fornecedor:'Bebidas & Cia',           qtdAtual:18,  unidade:'unidade', nivelMinimo:15,  preco:0, descricao:'', status:'Normal',  ultimaAtualizacao:'06/03/2026' },
    { id:54, nome:'Gin',                   categoria:'Bebidas',       fornecedor:'Bebidas & Cia',           qtdAtual:12,  unidade:'unidade', nivelMinimo:10,  preco:0, descricao:'', status:'Normal',  ultimaAtualizacao:'05/03/2026' },
    { id:55, nome:'Cerveja',               categoria:'Bebidas',       fornecedor:'Bebidas & Cia',           qtdAtual:145, unidade:'unidade', nivelMinimo:120, preco:0, descricao:'', status:'Normal',  ultimaAtualizacao:'07/03/2026' },
    { id:56, nome:'Gelo',                  categoria:'Outros',        fornecedor:'Gelo Norte',              qtdAtual:50,  unidade:'kg',      nivelMinimo:40,  preco:0, descricao:'', status:'Normal',  ultimaAtualizacao:'08/03/2026' },
    { id:57, nome:'Água filtrada',         categoria:'Outros',        fornecedor:'Água Pura',               qtdAtual:200, unidade:'litro',   nivelMinimo:150, preco:0, descricao:'', status:'Normal',  ultimaAtualizacao:'08/03/2026' },
  ]);

  totalItens     = computed(() => this.produtos().length);
  estoqueBaixo   = computed(() => this.produtos().filter(p => p.status === 'Baixo').length);
  estoqueCritico = computed(() => this.produtos().filter(p => p.status === 'Crítico').length);

  getPrimeiroNome(): string {
    const u = this.authService.getCurrentUser();
    return u?.nomeCompleto?.split(' ')[0] || u?.matricula || '';
  }

  getStatusClass(s: StatusEstoque): string {
    return { 'Normal':'badge--normal', 'Baixo':'badge--baixo', 'Crítico':'badge--critico' }[s] ?? '';
  }

  // ── Modal Adicionar/Editar ────────────────────────────────────
  abrirModalNovo(): void {
    this.editando.set(null);
    this.mNome.set(''); this.mCategoria.set(''); this.mFornecedor.set('');
    this.mQtd.set('0'); this.mUnidade.set('kg');
    this.mMinimo.set('0'); this.mPreco.set('0');
    this.mDescricao.set(''); this.mEmoji.set('📦');
    this.showModal.set(true);
  }

  abrirModalEditar(p: Produto, e: Event): void {
    e.stopPropagation();
    this.editando.set(p);
    this.mNome.set(p.nome); this.mCategoria.set(p.categoria);
    this.mFornecedor.set(p.fornecedor); this.mQtd.set(String(p.qtdAtual));
    this.mUnidade.set(p.unidade); this.mMinimo.set(String(p.nivelMinimo));
    this.mPreco.set(String(p.preco)); this.mDescricao.set(p.descricao);
    this.mEmoji.set('📦');
    this.showModal.set(true);
  }

  fecharModal(): void { if (!this.isSaving()) this.showModal.set(false); }

  salvar(): void {
    if (!this.mNome().trim()) return;
    this.isSaving.set(true);
    const qtd = parseFloat(this.mQtd()) || 0;
    const min = parseFloat(this.mMinimo()) || 0;
    const dados: Partial<Produto> = {
      nome: this.mNome(), categoria: this.mCategoria(),
      fornecedor: this.mFornecedor(), qtdAtual: qtd,
      unidade: this.mUnidade(), nivelMinimo: min,
      preco: parseFloat(this.mPreco()) || 0,
      descricao: this.mDescricao(),
      status: this.calcStatus(qtd, min),
      ultimaAtualizacao: this.hoje(),
    };
    const ed = this.editando();
    if (ed) {
      this.produtos.update(l => l.map(p => p.id === ed.id ? { ...p, ...dados } : p));
    } else {
      this.produtos.update(l => [...l, { id: Date.now(), ...dados } as Produto]);
    }
    this.isSaving.set(false);
    this.fecharModal();
  }

  // ── Modal Exclusão ────────────────────────────────────────────
  confirmarExclusao(p: Produto, e: Event): void {
    e.stopPropagation();
    this.prodParaExcluir.set(p);
    this.showModalExclusao.set(true);
  }

  cancelarExclusao(): void {
    this.showModalExclusao.set(false);
    this.prodParaExcluir.set(null);
  }

  confirmarExclusaoFinal(): void {
    const p = this.prodParaExcluir();
    if (p) this.produtos.update(l => l.filter(x => x.id !== p.id));
    this.cancelarExclusao();
  }

  onInput(field: string, e: Event): void {
    const v = (e.target as HTMLInputElement | HTMLTextAreaElement).value;
    if (field === 'nome')       this.mNome.set(v);
    if (field === 'categoria')  this.mCategoria.set(v);
    if (field === 'fornecedor') this.mFornecedor.set(v);
    if (field === 'qtd')        this.mQtd.set(v);
    if (field === 'minimo')     this.mMinimo.set(v);
    if (field === 'preco')      this.mPreco.set(v);
    if (field === 'descricao')  this.mDescricao.set(v);
    if (field === 'emoji')      this.mEmoji.set(v);
  }

  onSelectUnidade(e: Event): void {
    this.mUnidade.set((e.target as HTMLSelectElement).value);
  }
}
