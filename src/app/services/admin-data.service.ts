/**
 * AdminDataService
 *
 * Antes persistia tudo no Firestore (coleções "cardapio", "estoque_itens", "funcionarios",
 * "administradores", "fornecedores"). Removemos qualquer conexão com o Firebase — agora os
 * dados ficam em localStorage (mesmo contrato público, nenhum componente precisou mudar).
 *
 * Nota (RF-009 a RF-033): Cardápio, Estoque e Fornecedores já têm endpoints reais no backend
 * Spring Boot (ver `controller/admin/*` no backend) — ligar esta tela neles é o próximo passo
 * natural. Funcionários e Administradores-por-cargo (Dono/Gerente/Supervisor) não fazem parte
 * do SRS v3.2 (que define só ADMIN/GERENTE/COZINHEIRO/CLIENTE), então ficam como estão aqui
 * até a equipe decidir se adaptam ou removem essas telas.
 */
import { Injectable, signal } from '@angular/core';
import { loadCollection, saveCollection, nextId } from './local-store.util';

// ─── Tipos re-exportados (os componentes importam daqui) ────────

export type Categoria        = 'Principal' | 'Entrada' | 'Sobremesa' | 'Bebidas' | 'Drinks';
export type StatusEstoque    = 'Normal' | 'Baixo' | 'Crítico';
export type StatusFuncionario = 'Ativo' | 'Afastado' | 'De férias' | 'Inativo';
export type CargoAdmin       = 'Dono' | 'Gerente' | 'Supervisor';
export type StatusAdmin      = 'Ativo' | 'Inativo';

export interface Destaque { label: 'Prato da Casa' | 'Sugestão do Chef'; }

export interface Prato {
  firestoreId?: string;
  id: number;
  nome: string;
  categoria: Categoria;
  preco: number;
  descricao: string;
  destaques: Destaque[];
  imagem?: string;
}

export interface ProdutoEstoque {
  firestoreId?: string;
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

export interface HistoricoBH    { data: string; descricao: string; horas: string; positivo: boolean; }
export interface HistoricoFerias { inicio: string; fim: string; dias: number; }
export interface Funcionario {
  firestoreId?: string;
  id: number; foto: string; nomeCompleto: string; cpf: string; carteira: string;
  funcao: string; horario: string; salario: string; ferias: boolean; atestado: boolean;
  bancoHoras: string; bancoHorasPositivo: boolean; status: StatusFuncionario;
  telefone: string; email: string; endereco: string; dataAdmissao: string;
  observacoes: string; historicoBH: HistoricoBH[]; historicoFerias: HistoricoFerias[];
}

export interface Administrador {
  firestoreId?: string;
  id: number; matricula: string; nome: string; senha: string;
  cargo: CargoAdmin; telefone: string; email: string;
  status: StatusAdmin; foto: string; senhaVisivel: boolean;
}

export interface Fornecedor {
  firestoreId?: string;
  id: number; nome: string; cnpj: string; produtos: string;
  endereco: string; telefone: string; email: string;
  valorMedio: number; status: 'Ativo' | 'Inativo'; observacoes: string;
}

// ─── Dados iniciais (seed) ──────────────────────────────────────
// Só são usados se ainda não houver nada salvo no localStorage.

const PRATOS_INICIAIS: Prato[] = [
  { firestoreId:'1', id:1,  nome:'Moqueca de Peixe',                      categoria:'Principal', preco:75.90, descricao:'Tradicional moqueca baiana preparada com peixe fresco cozido lentamente no leite de coco e azeite de dendê.', destaques:[{label:'Prato da Casa'},{label:'Sugestão do Chef'}], imagem:'assets/images/Moqueca de Peixe.jpg' },
  { firestoreId:'2', id:2,  nome:'Bobó de Camarão',                       categoria:'Principal', preco:82.90, descricao:'Camarões selecionados envolvidos em um creme aveludado de mandioca com leite de coco e azeite de dendê.',     destaques:[{label:'Sugestão do Chef'}],                          imagem:'assets/images/Bobo de Camarao.jpg' },
  { firestoreId:'3', id:3,  nome:'Carne do Sol com Purê de Mandioca',     categoria:'Principal', preco:68.90, descricao:'Carne do sol macia e suculenta, grelhada no ponto ideal, acompanhada de purê de mandioca cremoso.',           destaques:[],                                                    imagem:'assets/images/Carne do Sol.jpg' },
  { firestoreId:'4', id:4,  nome:'Baião de Dois',                         categoria:'Principal', preco:58.90, descricao:'Clássico nordestino preparado com arroz e feijão verde, queijo coalho, carne seca desfiada e coentro.',       destaques:[{label:'Prato da Casa'}],                             imagem:'assets/images/Baiao de Dois.jpg' },
  { firestoreId:'5', id:5,  nome:'Arroz de Polvo',                        categoria:'Principal', preco:89.90, descricao:'Arroz cremoso preparado com polvo macio e bem temperado, cozido lentamente.',                                  destaques:[{label:'Sugestão do Chef'}],                          imagem:'assets/images/Arroz de Polvo.jpg' },
  { firestoreId:'6', id:6,  nome:'Camarão à Baiana',                      categoria:'Principal', preco:78.90, descricao:'Camarões salteados no azeite de dendê com leite de coco e temperos típicos.',                                 destaques:[{label:'Prato da Casa'}],                             imagem:'assets/images/Camarao a Baiana.jpg' },
  { firestoreId:'7', id:7,  nome:'Casquinhas de Siri',                    categoria:'Entrada',   preco:32.90, descricao:'Carne de siri refogada com temperos frescos, servida na própria casquinha e gratinada ao forno.',             destaques:[{label:'Sugestão do Chef'}],                          imagem:'assets/images/Casquinhas de Siri.jpg' },
  { firestoreId:'8', id:8,  nome:'Caldo de Sururu',                       categoria:'Entrada',   preco:28.90, descricao:'Caldo cremoso feito com sururu fresco, leite de coco e temperos regionais.',                                  destaques:[],                                                    imagem:'assets/images/Caldo de Sururu.jpg' },
  { firestoreId:'9', id:9,  nome:'Mini Acarajés',                         categoria:'Entrada',   preco:24.90, descricao:'Bolinhos de feijão-fradinho fritos no azeite de dendê, recheados com vatapá. Porção com 4 unidades.',         destaques:[{label:'Prato da Casa'}],                             imagem:'assets/images/Mini acarajé.jpg' },
  { firestoreId:'10', id:10, nome:'Mini Abarás',                           categoria:'Entrada',   preco:26.90, descricao:'Massa de feijão-fradinho cozida no vapor em folha de bananeira, recheada com vatapá.',                        destaques:[],                                                    imagem:'assets/images/Mini Abara.jpg' },
  { firestoreId:'11', id:11, nome:'Mini Pastel de Camarão',                categoria:'Entrada',   preco:22.90, descricao:'Pastéis crocantes recheados com camarão bem temperado.',                                                      destaques:[],                                                    imagem:'assets/images/Pastel de camarao.jpg' },
  { firestoreId:'12', id:12, nome:'Porção de Pititinga (Manjubinha)',       categoria:'Entrada',   preco:29.90, descricao:'Peixinhos fritos inteiros, crocantes e levemente temperados.',                                                destaques:[],                                                    imagem:'assets/images/Porcao de Pititinga.jpg' },
  { firestoreId:'13', id:13, nome:'Torta de Cocada',                       categoria:'Sobremesa', preco:18.90, descricao:'Sobremesa cremosa à base de coco com textura macia e sabor marcante.',                                        destaques:[{label:'Sugestão do Chef'}],                          imagem:'assets/images/Torta de Cocada.jpg' },
  { firestoreId:'14', id:14, nome:'Pudim de Tapioca',                      categoria:'Sobremesa', preco:16.90, descricao:'Pudim delicado preparado com tapioca granulada e leite de coco.',                                             destaques:[],                                                    imagem:'assets/images/Pudim de Tapioca.jpg' },
  { firestoreId:'15', id:15, nome:'Bolinho de Estudante',                  categoria:'Sobremesa', preco:14.90, descricao:'Bolinho frito de massa de tapioca com coco, crocante por fora e macio por dentro. 4 unidades.',              destaques:[],                                                    imagem:'assets/images/Bolinho de Estudante.jpg' },
  { firestoreId:'16', id:16, nome:'Bala Baiana na Travessa',               categoria:'Sobremesa', preco:22.90, descricao:'Versão em travessa da tradicional bala baiana, com creme doce e cobertura caramelizada.',                    destaques:[{label:'Prato da Casa'}],                             imagem:'assets/images/Bala baiana.jpg' },
  { firestoreId:'17', id:17, nome:'Queijadinha',                           categoria:'Sobremesa', preco:12.90, descricao:'Doce assado à base de coco e queijo, com textura úmida e sabor equilibrado.',                                 destaques:[],                                                    imagem:'assets/images/Queijadinha.jpg' },
  { firestoreId:'18', id:18, nome:'Doce de Leite Talhado',                 categoria:'Sobremesa', preco:15.90, descricao:'Sobremesa tradicional feita com leite talhado, açúcar e especiarias.',                                        destaques:[],                                                    imagem:'assets/images/Doce de Leite.jpg' },
  { firestoreId:'19', id:19, nome:'Pudim de Tapioca com Leite Condensado', categoria:'Sobremesa', preco:18.90, descricao:'Versão mais cremosa do pudim de tapioca, enriquecida com leite condensado.',                                  destaques:[{label:'Sugestão do Chef'}],                          imagem:'assets/images/Pudim.jpg' },
  { firestoreId:'20', id:20, nome:'Água',                  categoria:'Bebidas', preco:5.00,  descricao:'Água mineral gelada.', destaques:[], imagem:'assets/images/Agua.jpg' },
  { firestoreId:'21', id:21, nome:'Água com Gás',          categoria:'Bebidas', preco:6.00,  descricao:'Água mineral com gás.', destaques:[], imagem:'assets/images/Agua com gas.jpg' },
  { firestoreId:'22', id:22, nome:'Refrigerante',          categoria:'Bebidas', preco:8.00,  descricao:'Bebidas gaseificadas em diferentes sabores.', destaques:[], imagem:'assets/images/refrigerante.jpg' },
  { firestoreId:'23', id:23, nome:'Sucos Naturais',        categoria:'Bebidas', preco:12.00, descricao:'Sucos preparados com frutas frescas da estação.', destaques:[], imagem:'assets/images/Sucos.jpg' },
  { firestoreId:'24', id:24, nome:'Caipirinhas e Caipiroskas', categoria:'Drinks', preco:22.00, descricao:'Clássico brasileiro com frutas frescas, açúcar e gelo.', destaques:[{label:'Prato da Casa'}], imagem:'assets/images/Caipirnha e Caipiroska.jpg' },
  { firestoreId:'25', id:25, nome:'Cravinho',              categoria:'Drinks', preco:24.00, descricao:'Drink tradicional com cachaça, especiarias e toque adocicado.', destaques:[{label:'Sugestão do Chef'}], imagem:'assets/images/Cravinho.jpg' },
  { firestoreId:'26', id:26, nome:'Coice de Mula (Moscow Mule)', categoria:'Drinks', preco:26.00, descricao:'Drink refrescante à base de vodka, limão e espuma de gengibre.', destaques:[], imagem:'assets/images/Moscow Mule.jpg' },
  { firestoreId:'27', id:27, nome:'Drinks Tropicais',      categoria:'Drinks', preco:28.00, descricao:'Combinações especiais com frutas tropicais e destilados selecionados.', destaques:[{label:'Sugestão do Chef'}], imagem:'assets/images/Drinks tropicais.jpg' },
  { firestoreId:'28', id:28, nome:'Gin Tônica',            categoria:'Drinks', preco:30.00, descricao:'Clássico sofisticado com gin, água tônica e especiarias.', destaques:[], imagem:'assets/images/Gin tonica.jpg' },
];

const FORNECEDORES_INICIAIS: Fornecedor[] = [
  { firestoreId:'1', id:1, nome:'Mar & Sabor LTDA',       cnpj:'12.345.678/0001-90', produtos:'Frutos do mar (Peixe, Camarão, Polvo, Siri, Sururu)', endereco:'Rua das Ondas, 245 - Salvador/BA', telefone:'(71) 3333-4444', email:'contato@maresabor.com.br',                valorMedio:18500, status:'Ativo', observacoes:'' },
  { firestoreId:'2', id:2, nome:'Distribuidora Nordeste', cnpj:'23.456.789/0001-12', produtos:'Grãos, Farinhas, Temperos, Bebidas',                  endereco:'Av. Principal, 1500 - Feira de Santana/BA', telefone:'(75) 3222-5555', email:'vendas@distribuidoranordeste.com.br', valorMedio:12000, status:'Ativo', observacoes:'' },
  { firestoreId:'3', id:3, nome:'Hortifruti Regional',    cnpj:'34.567.890/0001-34', produtos:'Frutas, Verduras, Legumes',                           endereco:'Mercado Municipal, Box 15 - Salvador/BA', telefone:'(71) 3111-2222', email:'hortifrutiregional@email.com',            valorMedio:8500,  status:'Ativo', observacoes:'' },
  { firestoreId:'4', id:4, nome:'Carnes Nordeste Premium',cnpj:'45.678.901/0001-56', produtos:'Carne do sol, Carnes bovinas',                        endereco:'Rua do Comércio, 890 - Salvador/BA',       telefone:'(71) 3444-6666', email:'carnesnordeste@gmail.com',                valorMedio:6800,  status:'Ativo', observacoes:'' },
  { firestoreId:'5', id:5, nome:'Laticínios Santa Clara', cnpj:'56.789.012/0001-78', produtos:'Leite, Queijo coalho, Laticínios em geral',           endereco:'Fazenda Santa Clara - Alagoinhas/BA',      telefone:'(75) 3555-7777', email:'santaclara@laticinios.com.br',            valorMedio:4200,  status:'Ativo', observacoes:'' },
  { firestoreId:'6', id:6, nome:'Sabores da Bahia',       cnpj:'67.890.123/0001-90', produtos:'Azeite de dendê, Temperos típicos',                   endereco:'Rua da Alegria, 123 - Salvador/BA',        telefone:'(71) 3666-8888', email:'saboresba@yahoo.com.br',                  valorMedio:3500,  status:'Ativo', observacoes:'' },
  { firestoreId:'7', id:7, nome:'Bebidas & Cia',          cnpj:'78.901.234/0001-01', produtos:'Água, Refrigerantes, Cervejas, Destilados',           endereco:'Av. das Bebidas, 2000 - Salvador/BA',      telefone:'(71) 3777-9999', email:'bebidas.cia@outlook.com',                 valorMedio:9800,  status:'Ativo', observacoes:'' },
  { firestoreId:'8', id:8, nome:'Gelo Norte',             cnpj:'89.012.345/0001-23', produtos:'Gelo em cubos, Gelo em barra',                        endereco:'Rua Fria, 567 - Salvador/BA',              telefone:'(71) 3888-0000', email:'gelonorte@email.com',                     valorMedio:1500,  status:'Ativo', observacoes:'' },
  { firestoreId:'9', id:9, nome:'Água Pura',              cnpj:'90.123.456/0001-45', produtos:'Água filtrada, Tratamento de água',                   endereco:'Rua das Águas, 789 - Salvador/BA',         telefone:'(71) 3999-1111', email:'aguapura@hotmail.com',                    valorMedio:800,   status:'Ativo', observacoes:'' },
];

const ADMINISTRADORES_INICIAIS: Administrador[] = [
  { firestoreId:'1', id:1, matricula:'ADM001', nome:'Eliacira Santos', senha:'123456', cargo:'Dono',       telefone:'11979745714', email:'santos.eli@baianar.com',   status:'Ativo', foto:'', senhaVisivel:false },
  { firestoreId:'2', id:2, matricula:'ADM002', nome:'Isabel Paixão',   senha:'12345',  cargo:'Gerente',    telefone:'11979907856', email:'paixao.bel@baianar.com',   status:'Ativo', foto:'', senhaVisivel:false },
  { firestoreId:'3', id:3, matricula:'ADM003', nome:'Eliza Moreira',   senha:'1234',   cargo:'Gerente',    telefone:'11979896257', email:'moreira.liz@baianar.com',  status:'Ativo', foto:'', senhaVisivel:false },
  { firestoreId:'4', id:4, matricula:'ADM004', nome:'Evellyn Reis',    senha:'123',    cargo:'Gerente',    telefone:'11966714161', email:'reis.eve@baianar.com',     status:'Ativo', foto:'', senhaVisivel:false },
  { firestoreId:'5', id:5, matricula:'ADM005', nome:'Lucas Oliveira',  senha:'12',     cargo:'Supervisor', telefone:'11987654321', email:'oliveira.luc@baianar.com', status:'Ativo', foto:'', senhaVisivel:false },
];

const FUNCIONARIOS_INICIAIS: Funcionario[] = [
  { firestoreId:'1', id:1, foto:'', nomeCompleto:'Carlos Eduardo Santos',   cpf:'123.456.789-00', carteira:'CT 12345-67', funcao:'Chef de Cozinha',     horario:'10:00 - 18:00', salario:'R$ 8500,00', ferias:false, atestado:false, bancoHoras:'+12h', bancoHorasPositivo:true,  status:'Ativo',     telefone:'(71) 99876-5432', email:'carlos.santos@baianar.com.br',    endereco:'Rua das Palmeiras, 123 - Salvador/BA',          dataAdmissao:'15/01/2020', observacoes:'Funcionário exemplar, especializado em culinária baiana',                    historicoBH:[], historicoFerias:[] },
  { firestoreId:'2', id:2, foto:'', nomeCompleto:'João Pedro Lima',         cpf:'234.567.890-11', carteira:'CT 23456-78', funcao:'Garçom',            horario:'14:00 - 22:00', salario:'R$ 2800,00', ferias:false, atestado:false, bancoHoras:'-3h',  bancoHorasPositivo:false, status:'Ativo',     telefone:'(71) 98765-4321', email:'joao.lima@baianar.com.br',         endereco:'Av. Sete de Setembro, 456 - Salvador/BA',       dataAdmissao:'03/06/2021', observacoes:'Ótimo atendimento ao cliente, pontual',                                          historicoBH:[], historicoFerias:[] },
  { firestoreId:'3', id:3, foto:'', nomeCompleto:'Mariana Costa Oliveira', cpf:'345.678.901-22', carteira:'CT 34567-89', funcao:'Gerente',            horario:'09:00 - 17:00', salario:'R$ 6500,00', ferias:false, atestado:false, bancoHoras:'+8h',  bancoHorasPositivo:true,  status:'Ativo',     telefone:'(71) 97654-3210', email:'mariana.oliveira@baianar.com.br',  endereco:'Rua do Comércio, 789 - Salvador/BA',               dataAdmissao:'10/03/2019', observacoes:'Liderança exemplar, coordena equipe com excelência',                       historicoBH:[], historicoFerias:[] },
];

// ─── Serviço ────────────────────────────────────────────────────
@Injectable({ providedIn: 'root' })
export class AdminDataService {

  // ── Sinais reativos ──────────────────────────────────────────
  readonly pratos          = signal<Prato[]>(loadCollection('baianar_cardapio', PRATOS_INICIAIS));
  readonly estoqueItens    = signal<ProdutoEstoque[]>(loadCollection('baianar_estoque_itens', []));
  readonly funcionarios    = signal<Funcionario[]>(loadCollection('baianar_funcionarios', FUNCIONARIOS_INICIAIS));
  readonly administradores = signal<Administrador[]>(loadCollection('baianar_administradores', ADMINISTRADORES_INICIAIS));
  readonly fornecedores    = signal<Fornecedor[]>(loadCollection('baianar_fornecedores', FORNECEDORES_INICIAIS));

  // ═══════════════════════════════════════════════════════════════
  // CARDÁPIO
  // ═══════════════════════════════════════════════════════════════
  async adicionarPrato(prato: Omit<Prato, 'firestoreId' | 'id'>): Promise<void> {
    const id = nextId(this.pratos());
    const novo: Prato = { ...prato, id, firestoreId: String(id) };
    this.pratos.update(lista => { const l = [...lista, novo]; saveCollection('baianar_cardapio', l); return l; });
  }

  async atualizarPrato(firestoreId: string, dados: Partial<Prato>): Promise<void> {
    this.pratos.update(lista => {
      const l = lista.map(p => p.firestoreId === firestoreId ? { ...p, ...dados } : p);
      saveCollection('baianar_cardapio', l);
      return l;
    });
  }

  async excluirPrato(firestoreId: string): Promise<void> {
    this.pratos.update(lista => {
      const l = lista.filter(p => p.firestoreId !== firestoreId);
      saveCollection('baianar_cardapio', l);
      return l;
    });
  }

  // ═══════════════════════════════════════════════════════════════
  // ESTOQUE
  // ═══════════════════════════════════════════════════════════════
  async adicionarProduto(prod: Omit<ProdutoEstoque, 'firestoreId' | 'id'>): Promise<void> {
    const id = nextId(this.estoqueItens());
    const novo: ProdutoEstoque = { ...prod, id, firestoreId: String(id) };
    this.estoqueItens.update(lista => { const l = [...lista, novo]; saveCollection('baianar_estoque_itens', l); return l; });
  }

  async atualizarProduto(firestoreId: string, dados: Partial<ProdutoEstoque>): Promise<void> {
    this.estoqueItens.update(lista => {
      const l = lista.map(p => p.firestoreId === firestoreId ? { ...p, ...dados } : p);
      saveCollection('baianar_estoque_itens', l);
      return l;
    });
  }

  async excluirProduto(firestoreId: string): Promise<void> {
    this.estoqueItens.update(lista => {
      const l = lista.filter(p => p.firestoreId !== firestoreId);
      saveCollection('baianar_estoque_itens', l);
      return l;
    });
  }

  // ═══════════════════════════════════════════════════════════════
  // FUNCIONÁRIOS
  // ═══════════════════════════════════════════════════════════════
  async adicionarFuncionario(func: Omit<Funcionario, 'firestoreId' | 'id'>): Promise<void> {
    const id = nextId(this.funcionarios());
    const novo: Funcionario = { ...func, id, firestoreId: String(id) };
    this.funcionarios.update(lista => { const l = [...lista, novo]; saveCollection('baianar_funcionarios', l); return l; });
  }

  async atualizarFuncionario(firestoreId: string, dados: Partial<Funcionario>): Promise<void> {
    this.funcionarios.update(lista => {
      const l = lista.map(f => f.firestoreId === firestoreId ? { ...f, ...dados } : f);
      saveCollection('baianar_funcionarios', l);
      return l;
    });
  }

  async excluirFuncionario(firestoreId: string): Promise<void> {
    this.funcionarios.update(lista => {
      const l = lista.filter(f => f.firestoreId !== firestoreId);
      saveCollection('baianar_funcionarios', l);
      return l;
    });
  }

  // ═══════════════════════════════════════════════════════════════
  // ADMINISTRADORES
  // ═══════════════════════════════════════════════════════════════
  async adicionarAdmin(adm: Omit<Administrador, 'firestoreId' | 'id'>): Promise<void> {
    const id = nextId(this.administradores());
    const novo: Administrador = { ...adm, id, firestoreId: String(id) };
    this.administradores.update(lista => { const l = [...lista, novo]; saveCollection('baianar_administradores', l); return l; });
  }

  async atualizarAdmin(firestoreId: string, dados: Partial<Administrador>): Promise<void> {
    this.administradores.update(lista => {
      const l = lista.map(a => a.firestoreId === firestoreId ? { ...a, ...dados } : a);
      saveCollection('baianar_administradores', l);
      return l;
    });
  }

  async excluirAdmin(firestoreId: string): Promise<void> {
    this.administradores.update(lista => {
      const l = lista.filter(a => a.firestoreId !== firestoreId);
      saveCollection('baianar_administradores', l);
      return l;
    });
  }

  // ═══════════════════════════════════════════════════════════════
  // FORNECEDORES
  // ═══════════════════════════════════════════════════════════════
  async adicionarFornecedor(forn: Omit<Fornecedor, 'firestoreId' | 'id'>): Promise<void> {
    const id = nextId(this.fornecedores());
    const novo: Fornecedor = { ...forn, id, firestoreId: String(id) };
    this.fornecedores.update(lista => { const l = [...lista, novo]; saveCollection('baianar_fornecedores', l); return l; });
  }

  async atualizarFornecedor(firestoreId: string, dados: Partial<Fornecedor>): Promise<void> {
    this.fornecedores.update(lista => {
      const l = lista.map(f => f.firestoreId === firestoreId ? { ...f, ...dados } : f);
      saveCollection('baianar_fornecedores', l);
      return l;
    });
  }

  async excluirFornecedor(firestoreId: string): Promise<void> {
    this.fornecedores.update(lista => {
      const l = lista.filter(f => f.firestoreId !== firestoreId);
      saveCollection('baianar_fornecedores', l);
      return l;
    });
  }
}
