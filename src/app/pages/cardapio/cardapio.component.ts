import { Component, signal, computed, inject, ElementRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../services/auth.service';
import { CardapioStatusService } from '../../services/cardapio-status.service';
import { AdminDataService, Prato, Categoria } from '../../services/admin-data.service';
import { PratoAdminApiService } from '../../services/api/prato-admin-api.service';
import { CategoriaAdminApiService } from '../../services/api/categoria-admin-api.service';
import { CategoriaApi, PratoAdminApi, IngredienteApi, FichaTecnicaItemRequest, CustoApi, FichaTecnicaItemApi } from '../../services/api/api-types';
import { IngredienteAdminApiService } from '../../services/api/ingrediente-admin-api.service';

@Component({
  selector: 'app-cardapio', standalone: true, imports: [CommonModule],
  templateUrl: './cardapio.component.html', styleUrls: ['./cardapio.component.scss']
})
export class CardapioComponent {
  @ViewChild('fileInput') fileInputRef!: ElementRef<HTMLInputElement>;

  private authService       = inject(AuthService);
  private cardapioStatusSvc = inject(CardapioStatusService);
  private adminData         = inject(AdminDataService);
  private pratoAdminApi = inject(PratoAdminApiService);
  private categoriaAdminApi = inject(CategoriaAdminApiService);
  private ingredienteAdminApi = inject(IngredienteAdminApiService);

  // Dados vivos do Firestore
  pratos = this.adminData.pratos;
  pratosApi = signal<PratoAdminApi[]>([]);
  pratosConvertidos = computed<Prato[]>(() =>
  this.pratosApi().map(prato => ({
    id: prato.id,
    nome: prato.nome,
    categoria: this.converterCategoria(prato.categoriaNome),
    preco: prato.precoVenda,
    descricao: prato.descricao ?? '',
    destaques: [],
    imagem: prato.fotoUrl ?? ''
  }))
);

  // Modal
  showModal            = signal(false);
  editingPrato         = signal<Prato | null>(null);
  editingPratoApi = signal<PratoAdminApi | null>(null);
  isSaving             = signal(false);
  showModalExclusao    = signal(false);
  desativandoPrato = signal(false);
  pratoParaExcluir     = signal<Prato | null>(null);
  modalNome            = signal('');
  modalCategoria       = signal<Categoria | ''>('');
  modalTempoPreparo = signal<number>(0);
  modalPreco           = signal('');
  modalDescricao       = signal('');
  modalAcompanhamentos = signal('');
  modalDisponivel      = signal(true);
  modalImagemFile      = signal<File | null>(null);
  modalImagemPreview   = signal('');
  descCount            = computed(() => this.modalDescricao().length);

  categorias: Categoria[] = ['Principal', 'Entrada', 'Sobremesa', 'Bebidas', 'Drinks'];
  categoriasApi = signal<CategoriaApi[]>([]);
  categoriasOrdenadas = computed(() =>
  [...this.categoriasApi()].sort((a, b) => a.ordem - b.ordem)
);
  showModalCategoria = signal<boolean>(false);
  categoriaNome = signal<string>('');
  categoriaDescricao = signal<string>('');
  categoriaOrdem = signal<number>(1);
  categoriaStatus = signal<string>('ATIVO');
  categoriaEmEdicao = signal<CategoriaApi | null>(null);

  abrirModalNovaCategoria(): void {
  this.categoriaEmEdicao.set(null);
  this.categoriaNome.set('');
  this.categoriaDescricao.set('');
  this.categoriaOrdem.set(1);
  this.categoriaStatus.set('ATIVO');
  this.showModalCategoria.set(true);
}

abrirModalEditarCategoria(categoria: CategoriaApi): void {
  this.categoriaEmEdicao.set(categoria);
  this.categoriaNome.set(categoria.nome);
  this.categoriaDescricao.set(categoria.descricao ?? '');
  this.categoriaOrdem.set(categoria.ordem);
  this.categoriaStatus.set(categoria.status);
  this.showModalCategoria.set(true);
}

fecharModalCategoria(): void {
  this.showModalCategoria.set(false);
  this.categoriaEmEdicao.set(null);
}

async salvarCategoria(): Promise<void> {
  if (this.categoriaSalvando()) {
    return;
  }

  this.mensagemValidacaoCategoria.set(null);

  const nome = this.categoriaNome().trim();
  const descricao = this.categoriaDescricao().trim();

  if (!nome) {
    this.mensagemValidacaoCategoria.set('Informe o nome da categoria.');
    return;
  }

  if (!descricao) {
    this.mensagemValidacaoCategoria.set('Informe a descrição da categoria.');
    return;
  }

  if (!Number.isInteger(this.categoriaOrdem()) || this.categoriaOrdem() < 1) {
    this.mensagemValidacaoCategoria.set(
      'Informe uma ordem válida, com número inteiro maior que zero.'
    );
    return;
  }

  if (!['ATIVO', 'INATIVO'].includes(this.categoriaStatus())) {
    this.mensagemValidacaoCategoria.set(
      'Selecione um status válido para a categoria.'
    );
    return;
  }

  const dados = {
    nome,
    descricao,
    ordem: this.categoriaOrdem(),
    status: this.categoriaStatus()
  };

  this.categoriaSalvando.set(true);

  try {
        const categoria = this.categoriaEmEdicao();

    let mensagemSucesso: string;

    if (categoria) {
      const estavaInativa = categoria.status === 'INATIVO';
      const seraAtiva = dados.status === 'ATIVO';

      await this.categoriaAdminApi.atualizar(categoria.id, dados);

      mensagemSucesso =
        estavaInativa && seraAtiva
          ? 'Categoria ativada com sucesso!'
          : 'Categoria atualizada com sucesso!';
    } else {
      await this.categoriaAdminApi.cadastrar(dados);

      mensagemSucesso = 'Categoria cadastrada com sucesso!';
    }

    await this.carregarCategoriasApi();
this.fecharModalCategoria();
this.mensagemResultadoCategoria.set(mensagemSucesso);

setTimeout(() => {
  if (this.mensagemResultadoCategoria() === mensagemSucesso) {
    this.mensagemResultadoCategoria.set(null);
  }
}, 2000);

    } catch (erro) {
    console.error('Erro ao salvar categoria:', erro);
    this.mensagemValidacaoCategoria.set(
      'Não foi possível salvar a categoria. Verifique os dados e tente novamente.'
    );
  } finally {
    this.categoriaSalvando.set(false);
  }
}

solicitarDesativacaoCategoria(categoria: CategoriaApi): void {
  this.categoriaAguardandoDesativacao.set(categoria);
}

cancelarDesativacaoCategoria(): void {
  this.categoriaAguardandoDesativacao.set(null);
}

async desativarCategoria(categoria: CategoriaApi): Promise<void> {
  const categoriaConfirmada = this.categoriaAguardandoDesativacao();

  if (!categoriaConfirmada || categoriaConfirmada.id !== categoria.id) {
  return;
  }

  this.categoriaAguardandoDesativacao.set(null);

  try {
    await this.categoriaAdminApi.desativar(categoria.id);
await this.carregarCategoriasApi();

this.mensagemResultadoCategoria.set('Categoria desativada com sucesso!');

setTimeout(() => {
  if (this.mensagemResultadoCategoria() === 'Categoria desativada com sucesso!') {
    this.mensagemResultadoCategoria.set(null);
  }
}, 2000);
  } catch (erro) {
    console.error('Erro ao desativar categoria:', erro);
    this.mensagemResultadoCategoria.set('Não foi possível desativar a categoria. Tente novamente.');
  }
}

  ingredientesApi = signal<IngredienteApi[]>([]);
  ingredientesAtivos = computed(() =>
  this.ingredientesApi().filter(
    ingrediente => ingrediente.status === 'ATIVO'
  )
);
  fichaPratoId = signal<number | null>(null);
  fichaPratoNome = computed(() =>
  this.pratosApi().find(prato => prato.id === this.fichaPratoId())?.nome ?? ''
);
  fichaRendimento = signal<number>(1);
  fichaModoPreparo = signal<string>('');
  fichaItens = signal<FichaTecnicaItemRequest[]>([]);
  fichaCusto = signal<CustoApi | null>(null);
  fichaItensCustos = signal<FichaTecnicaItemApi[]>([]);
  fichaIngredienteSelecionado = signal<number | null>(null);
  fichaQuantidade = signal<number>(1);
  fichaUnidade = signal<string>('g');
  fichaFatorCorrecao = signal<number>(1);
  abaCardapio = signal<'pratos' | 'categorias'>('pratos');
  abaFormularioPrato = signal<'dados' | 'ficha'>('dados');
  nomesCategoriasApi = computed(() =>
  this.categoriasApi().map(categoria => categoria.nome)
);

  // ── Disponibilidade (CardapioStatusService) ───────────────────
  isPratoInativo(prato: Prato): boolean {
  const pratoApi = this.pratosApi().find(item => item.id === prato.id);

  return pratoApi?.status === 'INATIVO';
}

isPratoIndisponivel(prato: Prato): boolean {
  const pratoApi = this.pratosApi().find(item => item.id === prato.id);

  return pratoApi?.status === 'PAUSADO';
}

  // ── Helpers ───────────────────────────────────────────────────
  getPrimeiroNome(): string {
    const u = this.authService.getCurrentUser();
    return u?.nomeCompleto?.split(' ')[0] || u?.matricula || '';
  }

  formatPreco(preco: number): string {
    return preco.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

getCategoriaClass(cat: Categoria): string {
  const classes: Record<string, string> = {
    'Principal': 'cat--principal',
    'Entrada': 'cat--entrada',
    'Sobremesa': 'cat--sobremesa',
    'Bebidas': 'cat--bebidas',
    'Drinks': 'cat--drinks'
  };

  if (classes[cat]) {
    return classes[cat];
  }

  const cores = [
    'cat--principal',
    'cat--entrada',
    'cat--sobremesa',
    'cat--bebidas',
    'cat--drinks'
  ];

  const indice = Array.from(cat).reduce(
    (total, caractere) => total + caractere.charCodeAt(0),
    0
  ) % cores.length;

  return cores[indice];
}

  // ── Modal ─────────────────────────────────────────────────────
  abrirModalNovo(): void {
    this.mensagemValidacaoPrato.set(null);
    this.editingPrato.set(null);
    this.editingPratoApi.set(null);
    this.modalNome.set(''); this.modalCategoria.set(''); this.modalPreco.set('');
    this.modalTempoPreparo.set(0);
    this.modalDescricao.set(''); this.modalAcompanhamentos.set('');
    this.modalDisponivel.set(false);
    this.modalImagemFile.set(null);
    this.modalImagemPreview.set('');
    this.abaFormularioPrato.set('dados');

    this.simulacaoCustoVersao++;
    this.fichaPratoId.set(null);
    this.fichaRendimento.set(1);
    this.fichaModoPreparo.set('');
    this.fichaItens.set([]);
    this.fichaIngredienteSelecionado.set(null);
    this.fichaQuantidade.set(1);
    this.fichaUnidade.set('g');
    this.fichaFatorCorrecao.set(1);
    this.fichaCusto.set(null);
    this.fichaItensCustos.set([]);

    this.showModal.set(true);
}

  abrirModalEditar(prato: Prato): void {
    this.mensagemValidacaoPrato.set(null);
    this.editingPrato.set(prato);
    this.editingPratoApi.set(
      this.pratosApi().find(p => p.id === prato.id) ?? null
    );
    this.modalTempoPreparo.set(this.editingPratoApi()?.tempoPreparoMin ?? 0);
    this.modalNome.set(prato.nome); this.modalCategoria.set(prato.categoria);
    this.modalPreco.set(Number(prato.preco).toFixed(2).replace('.', ','));
    this.modalDescricao.set(prato.descricao);
    this.modalAcompanhamentos.set('');
    this.modalDisponivel.set(this.editingPratoApi()?.status === 'ATIVO');
    this.abaFormularioPrato.set('dados');
    this.modalImagemFile.set(null);
    this.modalImagemPreview.set(prato.imagem ?? '');

    this.simulacaoCustoVersao++;
    this.fichaPratoId.set(prato.id);
    this.fichaRendimento.set(1);
    this.fichaModoPreparo.set('');
    this.fichaItens.set([]);
    this.fichaIngredienteSelecionado.set(null);
    this.fichaQuantidade.set(1);
    this.fichaUnidade.set('g');
    this.fichaFatorCorrecao.set(1);
    this.fichaCusto.set(null);
    this.fichaItensCustos.set([]);

    this.showModal.set(true);

    if (this.editingPratoApi()?.temFichaTecnica) {
      void this.carregarFichaTecnica(prato.id);
    }
}

  fecharModal(): void {
  if (!this.isSaving()) {
    this.showModal.set(false);
    this.editingPratoApi.set(null);
  }
}

async carregarFichaTecnica(pratoId: number): Promise<void> {
  try {
    const ficha = await this.pratoAdminApi.buscarFicha(pratoId);

    this.fichaRendimento.set(ficha.rendimento);
    this.fichaModoPreparo.set(ficha.modoPreparo ?? '');

    this.fichaItens.set(
      ficha.itens.map(item => ({
        ingredienteId: item.ingredienteId,
        quantidade: item.quantidade,
        unidade: item.unidade.toLowerCase(),
        fatorCorrecao: item.fatorCorrecao
      }))
    );
    this.fichaItensCustos.set(ficha.itens);
    this.fichaCusto.set(ficha.custo);
  } catch (erro) {
    console.error('Não foi possível carregar a ficha técnica:', erro);
  }
}

fichaIngredienteEditando = signal<number | null>(null);

editarIngredienteFicha(indice: number): void {
  const item = this.fichaItens()[indice];

  if (!item) {
    return;
  }

  this.fichaIngredienteEditando.set(indice);
  this.fichaIngredienteSelecionado.set(item.ingredienteId);
  this.fichaQuantidade.set(item.quantidade);
  this.fichaUnidade.set(item.unidade.toLowerCase());
  this.fichaFatorCorrecao.set(item.fatorCorrecao);

  document
    .getElementById('ficha-formulario-ingrediente')
    ?.scrollIntoView({
      behavior: 'smooth',
      block: 'start'
    });
}

cancelarEdicaoIngredienteFicha(): void {
  this.fichaIngredienteEditando.set(null);
  this.fichaIngredienteSelecionado.set(null);
  this.fichaQuantidade.set(1);
  this.fichaUnidade.set('g');
  this.fichaFatorCorrecao.set(1);
}

adicionarIngredienteFicha(): void {
  this.mensagemValidacaoPrato.set(null);
  const ingredienteId = this.fichaIngredienteSelecionado();

  if (ingredienteId === null) {
    this.mensagemValidacaoPrato.set('Selecione um ingrediente antes de adicionar.');
    return;
  }

  const ingredienteSelecionado = this.ingredientesApi().find(
  ingrediente => ingrediente.id === ingredienteId
);

if (!ingredienteSelecionado) {
  this.mensagemValidacaoPrato.set('Ingrediente não encontrado na lista do Back-end.');
  return;
}

if (ingredienteSelecionado.status !== 'ATIVO') {
  this.mensagemValidacaoPrato.set('Este ingrediente está inativo e não pode ser adicionado.');
  return;
}

  const indiceEditando = this.fichaIngredienteEditando();

if (
  this.fichaItens().some(
    (item, indice) =>
      item.ingredienteId === ingredienteId &&
      indice !== indiceEditando
  )
) {
  this.mensagemValidacaoPrato.set('Este ingrediente já foi adicionado à Ficha Técnica.');
  return;
}

  if (!Number.isFinite(this.fichaQuantidade()) ||
      !Number.isFinite(this.fichaFatorCorrecao()) ||
      this.fichaQuantidade() <= 0 ||
      this.fichaFatorCorrecao() < 1) {
      this.mensagemValidacaoPrato.set('Informe uma quantidade maior que zero e um fator de correção maior ou igual a 1.');
    return;
  }

  if (!['g', 'ml', 'un'].includes(this.fichaUnidade())) {
    this.mensagemValidacaoPrato.set('Selecione uma unidade de medida válida.');
    return;
  }

  const itemAtualizado = {
  ingredienteId,
  quantidade: this.fichaQuantidade(),
  unidade: this.fichaUnidade(),
  fatorCorrecao: this.fichaFatorCorrecao()
};

if (indiceEditando !== null) {
  this.fichaItens.update(itens =>
    itens.map((item, indice) =>
      indice === indiceEditando ? itemAtualizado : item
    )
  );
} else {
  this.fichaItens.update(itens => [
    ...itens,
    itemAtualizado
  ]);
}

this.cancelarEdicaoIngredienteFicha();
void this.recalcularCustoFicha();
}

obterNomeIngrediente(id: number): string {
  const ingrediente = this.ingredientesApi()
    .find(item => item.id === id);

  return ingrediente?.nome ?? 'Ingrediente não encontrado';
}

obterCustoIngrediente(ingredienteId: number): FichaTecnicaItemApi | undefined {
  return this.fichaItensCustos().find(
    item => item.ingredienteId === ingredienteId
  );
}

selecionarIngredienteFicha(id: number | null): void {
  this.fichaIngredienteSelecionado.set(id);

  const ingrediente = this.ingredientesAtivos().find(item => item.id === id);

  if (ingrediente) {
  const unidade = ingrediente.unidadePadrao.toLowerCase();

  if (['g', 'ml', 'un'].includes(unidade)) {
    this.fichaUnidade.set(unidade);
  }
}
}

removerIngredienteFicha(indice: number): void {
  const indiceEditando = this.fichaIngredienteEditando();

  this.fichaItens.update(itens =>
    itens.filter((_, i) => i !== indice)
  );

  if (indiceEditando !== null) {
    if (indiceEditando === indice) {
      this.cancelarEdicaoIngredienteFicha();
    } else if (indiceEditando > indice) {
      this.fichaIngredienteEditando.set(indiceEditando - 1);
    }
  }

  void this.recalcularCustoFicha();
}

private simulacaoCustoVersao = 0;

async recalcularCustoFicha(): Promise<void> {
  const versao = ++this.simulacaoCustoVersao;
  const pratoId = this.fichaPratoId();
  const rendimento = this.fichaRendimento();
  const itens = this.fichaItens();

  const precoVenda = Number(
    this.modalPreco().replace(',', '.')
  );

  const precoValido =
  Number.isFinite(precoVenda) && precoVenda > 0;

if (
  !Number.isInteger(rendimento) ||
  rendimento < 1 ||
  itens.length === 0
) {
  this.fichaCusto.set(null);
  this.fichaItensCustos.set([]);
  return;
}

  const dadosFicha = {
    rendimento,
    modoPreparo: this.fichaModoPreparo(),
    itens: itens.map(item => ({
      ...item,
      unidade: item.unidade.toUpperCase()
    }))
  };

  try {
    const fichaSimulada = this.showModal()
      ? await this.pratoAdminApi.simularCustoNovoPrato(
    precoValido ? precoVenda : 0,
    dadosFicha
  )
      : await this.pratoAdminApi.simularCusto(
          pratoId!,
          dadosFicha
        );

    // Ignora respostas antigas e formulários que já foram fechados.
    if (
      versao === this.simulacaoCustoVersao &&
      this.showModal() &&
      this.fichaPratoId() === pratoId
    ) {
      this.fichaCusto.set(fichaSimulada.custo);
      this.fichaItensCustos.set(fichaSimulada.itens);
    }
  } catch (erro) {
    if (versao === this.simulacaoCustoVersao) {
      console.error('Erro ao simular custo da ficha técnica:', erro);
      this.fichaCusto.set(null);
      this.fichaItensCustos.set([]);
    }
  }
}


  abrirSeletorImagem(): void { this.fileInputRef?.nativeElement.click(); }

  onImagemSelecionada(event: Event): void {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) return;
    this.modalImagemFile.set(file);
    const reader = new FileReader();
    reader.onload = e => this.modalImagemPreview.set(e.target?.result as string);
    reader.readAsDataURL(file);
  }

  mensagemValidacaoPrato = signal<string | null>(null);
  mensagemValidacaoCategoria = signal<string | null>(null);
  mensagemResultadoCategoria = signal<string | null>(null);
  mensagemResultadoPrato = signal<string | null>(null);

mostrarResultadoPrato(mensagem: string): void {
  this.mensagemResultadoPrato.set(mensagem);

  setTimeout(() => {
    if (this.mensagemResultadoPrato() === mensagem) {
      this.mensagemResultadoPrato.set(null);
    }
  }, 2000);
}

  categoriaSalvando = signal<boolean>(false);
  categoriaAguardandoDesativacao = signal<CategoriaApi | null>(null);

  async salvar(): Promise<void> {
    if (this.isSaving()) {
      return;
    }

    this.mensagemValidacaoPrato.set(null);

    if (!this.modalNome().trim()) {
      this.abaFormularioPrato.set('dados');
      this.mensagemValidacaoPrato.set('Informe o nome do prato.');
      return;
    }

    if (!this.modalCategoria()) {
      this.abaFormularioPrato.set('dados');
      this.mensagemValidacaoPrato.set('Selecione uma categoria para o prato.');
      return;
    }

    const precoVenda = Number(this.modalPreco().replace(',', '.'));

    if (!Number.isFinite(precoVenda) || precoVenda <= 0) {
      this.abaFormularioPrato.set('dados');
      this.mensagemValidacaoPrato.set('Informe um preço de venda válido e maior que zero.');
      return;
}

    if (!Number.isInteger(this.modalTempoPreparo()) || this.modalTempoPreparo() <= 0) {
  this.mensagemValidacaoPrato.set(
    'Informe um tempo de preparo maior que zero, em minutos.'
  );
  this.abaFormularioPrato.set('dados');
  return;
}

    const categoriaId = this.obterIdCategoria(this.modalCategoria());

    if (categoriaId === undefined) {
      this.abaFormularioPrato.set('dados');
      this.mensagemValidacaoPrato.set('A categoria selecionada não foi encontrada. Selecione outra categoria.');
      return;
    }

    try {
      const imagemFinal = this.modalImagemFile()
        ? this.modalImagemPreview()
        : (this.editingPrato()?.imagem ?? '');

      const nomePrato = this.modalNome().trim();

      const pratoEmEdicao = this.editingPratoApi();

const statusDesejado = pratoEmEdicao?.status === 'INATIVO'
  ? 'INATIVO'
  : this.modalDisponivel() ? 'ATIVO' : 'PAUSADO';

const dadosApi = {
  categoriaId,
  nome: nomePrato,
  descricao: this.modalDescricao(),
  fotoUrl: imagemFinal,
  precoVenda,
  tempoPreparoMin: this.modalTempoPreparo(),
  status: statusDesejado
};

      const dados = {
        nome: nomePrato,
        categoria: this.modalCategoria() as Categoria,
        preco: parseFloat(this.modalPreco().replace(',', '.')),
        descricao: this.modalDescricao(),
        destaques: [],
        imagem: imagemFinal,
      };

      const desejaAtivar = statusDesejado === 'ATIVO';
      const itensFicha = this.fichaItens();
      const possuiFicha = itensFicha.length > 0;

// RN01: um prato ativo precisa ter pelo menos um ingrediente.
if (desejaAtivar && !possuiFicha) {
  this.abaFormularioPrato.set('ficha');
  this.mensagemValidacaoPrato.set(
    'Para ativar o prato, adicione pelo menos um ingrediente à Ficha Técnica.'
  );
  return;
}

// Valida a ficha antes de iniciar qualquer gravação.
if (possuiFicha) {
  if (!Number.isInteger(this.fichaRendimento()) || this.fichaRendimento() < 1) {
  this.abaFormularioPrato.set('ficha');
  this.mensagemValidacaoPrato.set(
    'Informe um rendimento inteiro maior que zero.'
  );
  return;
}

  if (!this.fichaModoPreparo().trim()) {
  this.abaFormularioPrato.set('ficha');
  this.mensagemValidacaoPrato.set(
    'Informe o modo de preparo do prato.'
  );
  return;
}
}

this.isSaving.set(true);
// Na criação, o prato precisa existir antes de receber a ficha técnica.
// Na edição, também salvamos primeiro como INATIVO para evitar
// que uma ficha ainda não gravada impeça a operação.
const dadosTemporarios = {
  ...dadosApi,
  status: possuiFicha ? 'INATIVO' : dadosApi.status
};

const pratoSalvoApi = pratoEmEdicao
  ? await this.pratoAdminApi.atualizar(pratoEmEdicao.id, dadosTemporarios)
  : await this.pratoAdminApi.cadastrar(dadosTemporarios);

// Salva a ficha técnica usando o ID retornado pelo Back-end.
if (possuiFicha) {
  const fichaSalva = await this.pratoAdminApi.salvarFicha(pratoSalvoApi.id, {
    rendimento: this.fichaRendimento(),
    modoPreparo: this.fichaModoPreparo().trim(),
    itens: itensFicha.map(item => ({
      ...item,
      unidade: item.unidade.toUpperCase()
    }))
  });

  this.fichaCusto.set(fichaSalva.custo);
}

// Restaura o status escolhido pelo administrador somente depois
// que a ficha técnica estiver gravada.
if (possuiFicha && statusDesejado !== 'INATIVO') {
  await this.pratoAdminApi.atualizar(pratoSalvoApi.id, dadosApi);
}

console.log('Prato e Ficha Técnica salvos no Back-end:', pratoSalvoApi);
await this.carregarPratosApi();

      const pratoNumId = pratoSalvoApi.id;

      // Persiste disponibilidade
      const indisponivel = !this.modalDisponivel();
      await this.cardapioStatusSvc.setDisponibilidadeAdmin(`admin_${pratoNumId}`, nomePrato, indisponivel);

    this.showModal.set(false);
this.editingPratoApi.set(null);

this.mostrarResultadoPrato(
  pratoEmEdicao
    ? 'Prato atualizado com sucesso!'
    : 'Prato cadastrado com sucesso!'
);

    } catch (err) {
  console.error('[Cardapio] salvar erro:', err);

  this.mensagemValidacaoPrato.set(
    'Não foi possível salvar o prato. Verifique os dados informados e tente novamente.'
  );
} finally {
  this.isSaving.set(false);
}
  }

    async reativarPrato(prato: Prato): Promise<void> {
    const pratoApi = this.pratosApi().find(item => item.id === prato.id);

    if (!pratoApi || pratoApi.status !== 'INATIVO') {
      return;
    }

    if (!pratoApi.temFichaTecnica) {
      console.error(
        'Não é possível reativar o prato sem ficha técnica.'
      );
      return;
    }

    try {
      await this.pratoAdminApi.atualizar(pratoApi.id, {
        categoriaId: pratoApi.categoriaId,
        nome: pratoApi.nome,
        descricao: pratoApi.descricao ?? '',
        fotoUrl: pratoApi.fotoUrl ?? '',
        precoVenda: pratoApi.precoVenda,
        tempoPreparoMin: pratoApi.tempoPreparoMin ?? 0,
        status: 'ATIVO'
      });

      await this.carregarPratosApi();
this.mostrarResultadoPrato('Prato reativado com sucesso!');
} catch (erro) {
  console.error('Erro ao reativar prato no Back-end:', erro);
  this.mostrarResultadoPrato(
    'Não foi possível reativar o prato. Tente novamente.'
  );
}
  }

  confirmarExclusao(prato: Prato): void {
    this.pratoParaExcluir.set(prato);
    this.showModalExclusao.set(true);
  }

  cancelarExclusao(): void {
    if (this.desativandoPrato()) return;
    this.showModalExclusao.set(false);
    this.pratoParaExcluir.set(null);
  }

  async confirmarExclusaoFinal(): Promise<void> {
  const prato = this.pratoParaExcluir();

  if (!prato || this.desativandoPrato()) {
    return;
  }

  this.desativandoPrato.set(true);

  try {
    await this.pratoAdminApi.desativar(prato.id);
    await this.carregarPratosApi();

this.showModalExclusao.set(false);
this.pratoParaExcluir.set(null);

this.mostrarResultadoPrato('Prato desativado com sucesso!');
  } catch (erro) {
  console.error('Erro ao desativar prato no Back-end:', erro);
  this.mostrarResultadoPrato(
    'Não foi possível desativar o prato. Tente novamente.'
  );
} finally {
    this.desativandoPrato.set(false);
  }
}

  onInput(
  field: 'nome' | 'preco' | 'descricao' | 'acompanhamentos',
  event: Event
): void {
  const val = (event.target as HTMLInputElement | HTMLTextAreaElement).value;

  if (field === 'nome') {
    this.modalNome.set(val);
  }

  if (field === 'preco') {
  const digitos = val.replace(/\D/g, '');
  const centavos = Number(digitos);
  const precoFormatado = (centavos / 100).toFixed(2).replace('.', ',');

  this.modalPreco.set(precoFormatado);
  (event.target as HTMLInputElement).value = precoFormatado;

  if (this.fichaItens().length > 0) {
    void this.recalcularCustoFicha();
  }
}

  if (field === 'descricao') {
    this.modalDescricao.set(val);
  }

  if (field === 'acompanhamentos') {
    this.modalAcompanhamentos.set(val);
  }
}

  onSelectCategoria(event: Event): void {
    this.modalCategoria.set((event.target as HTMLSelectElement).value as Categoria);
  }

  ngOnInit(): void {
    void this.carregarCategoriasApi();
    void this.carregarPratosApi();
    void this.carregarIngredientesApi();
  }

  async carregarCategoriasApi(): Promise<void> {
  try {
    const categorias = await this.categoriaAdminApi.listar();
    this.categoriasApi.set(categorias);
  } catch (erro) {
    console.error('Erro ao carregar categorias do Back-end:', erro);
  }
}

  async carregarPratosApi(): Promise<void> {
  try {
    const pratos = await this.pratoAdminApi.listar();
    this.pratosApi.set(pratos);
  } catch (erro) {
    console.error('Erro ao carregar pratos do Back-end:', erro);
  }
}

async carregarIngredientesApi(): Promise<void> {
  try {
    const ingredientes = await this.ingredienteAdminApi.listar();
    this.ingredientesApi.set(ingredientes);
  } catch (erro) {
    console.error('Erro ao carregar ingredientes do Back-end:', erro);
  }
}

private obterIdCategoria(nome: string): number | undefined {
  const equivalencias: Record<string, string> = {
    'Principal': 'Pratos Principais',
    'Entrada': 'Entradas',
    'Sobremesa': 'Sobremesas'
  };

  const nomeBackend = equivalencias[nome] ?? nome;

  return this.categoriasApi().find(
    categoria => categoria.nome === nomeBackend && categoria.status === 'ATIVO'
  )?.id;
}

public converterCategoria(nomeBackend: string): Categoria {
  const equivalencias: Record<string, string> = {
    'Pratos Principais': 'Principal',
    'Entradas': 'Entrada',
    'Sobremesas': 'Sobremesa'
  };

  return (equivalencias[nomeBackend] ?? nomeBackend) as Categoria;
}
}
