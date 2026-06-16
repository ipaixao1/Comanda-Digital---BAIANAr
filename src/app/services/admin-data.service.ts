/**
 * AdminDataService
 * Persiste no Firestore todos os dados que o admin edita:
 *  - pratos do cardápio       → coleção "cardapio"
 *  - itens do estoque         → coleção "estoque_itens"
 *  - funcionários             → coleção "funcionarios"
 *  - administradores          → coleção "administradores"
 *  - fornecedores             → coleção "fornecedores"
 *
 * Cada coleção usa onSnapshot → signal reativo, sem polling.
 */
import { Injectable, signal, inject } from '@angular/core';
import {
  Firestore,
  collection, doc,
  addDoc, setDoc, updateDoc, deleteDoc,
  onSnapshot, query, orderBy,
  Unsubscribe, Timestamp,
} from '@angular/fire/firestore';

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
// Só são usados se a coleção estiver vazia no Firestore.

const PRATOS_INICIAIS: Omit<Prato, 'firestoreId'>[] = [
  { id:1,  nome:'Moqueca de Peixe',                      categoria:'Principal', preco:75.90, descricao:'Tradicional moqueca baiana preparada com peixe fresco cozido lentamente no leite de coco e azeite de dendê.', destaques:[{label:'Prato da Casa'},{label:'Sugestão do Chef'}], imagem:'assets/images/Moqueca de Peixe.jpg' },
  { id:2,  nome:'Bobó de Camarão',                       categoria:'Principal', preco:82.90, descricao:'Camarões selecionados envolvidos em um creme aveludado de mandioca com leite de coco e azeite de dendê.',     destaques:[{label:'Sugestão do Chef'}],                          imagem:'assets/images/Bobo de Camarao.jpg' },
  { id:3,  nome:'Carne do Sol com Purê de Mandioca',     categoria:'Principal', preco:68.90, descricao:'Carne do sol macia e suculenta, grelhada no ponto ideal, acompanhada de purê de mandioca cremoso.',           destaques:[],                                                    imagem:'assets/images/Carne do Sol.jpg' },
  { id:4,  nome:'Baião de Dois',                         categoria:'Principal', preco:58.90, descricao:'Clássico nordestino preparado com arroz e feijão verde, queijo coalho, carne seca desfiada e coentro.',       destaques:[{label:'Prato da Casa'}],                             imagem:'assets/images/Baiao de Dois.jpg' },
  { id:5,  nome:'Arroz de Polvo',                        categoria:'Principal', preco:89.90, descricao:'Arroz cremoso preparado com polvo macio e bem temperado, cozido lentamente.',                                  destaques:[{label:'Sugestão do Chef'}],                          imagem:'assets/images/Arroz de Polvo.jpg' },
  { id:6,  nome:'Camarão à Baiana',                      categoria:'Principal', preco:78.90, descricao:'Camarões salteados no azeite de dendê com leite de coco e temperos típicos.',                                 destaques:[{label:'Prato da Casa'}],                             imagem:'assets/images/Camarao a Baiana.jpg' },
  { id:7,  nome:'Casquinhas de Siri',                    categoria:'Entrada',   preco:32.90, descricao:'Carne de siri refogada com temperos frescos, servida na própria casquinha e gratinada ao forno.',             destaques:[{label:'Sugestão do Chef'}],                          imagem:'assets/images/Casquinhas de Siri.jpg' },
  { id:8,  nome:'Caldo de Sururu',                       categoria:'Entrada',   preco:28.90, descricao:'Caldo cremoso feito com sururu fresco, leite de coco e temperos regionais.',                                  destaques:[],                                                    imagem:'assets/images/Caldo de Sururu.jpg' },
  { id:9,  nome:'Mini Acarajés',                         categoria:'Entrada',   preco:24.90, descricao:'Bolinhos de feijão-fradinho fritos no azeite de dendê, recheados com vatapá. Porção com 4 unidades.',         destaques:[{label:'Prato da Casa'}],                             imagem:'assets/images/Mini acarajé.jpg' },
  { id:10, nome:'Mini Abarás',                           categoria:'Entrada',   preco:26.90, descricao:'Massa de feijão-fradinho cozida no vapor em folha de bananeira, recheada com vatapá.',                        destaques:[],                                                    imagem:'assets/images/Mini Abara.jpg' },
  { id:11, nome:'Mini Pastel de Camarão',                categoria:'Entrada',   preco:22.90, descricao:'Pastéis crocantes recheados com camarão bem temperado.',                                                      destaques:[],                                                    imagem:'assets/images/Pastel de camarao.jpg' },
  { id:12, nome:'Porção de Pititinga (Manjubinha)',       categoria:'Entrada',   preco:29.90, descricao:'Peixinhos fritos inteiros, crocantes e levemente temperados.',                                                destaques:[],                                                    imagem:'assets/images/Porcao de Pititinga.jpg' },
  { id:13, nome:'Torta de Cocada',                       categoria:'Sobremesa', preco:18.90, descricao:'Sobremesa cremosa à base de coco com textura macia e sabor marcante.',                                        destaques:[{label:'Sugestão do Chef'}],                          imagem:'assets/images/Torta de Cocada.jpg' },
  { id:14, nome:'Pudim de Tapioca',                      categoria:'Sobremesa', preco:16.90, descricao:'Pudim delicado preparado com tapioca granulada e leite de coco.',                                             destaques:[],                                                    imagem:'assets/images/Pudim de Tapioca.jpg' },
  { id:15, nome:'Bolinho de Estudante',                  categoria:'Sobremesa', preco:14.90, descricao:'Bolinho frito de massa de tapioca com coco, crocante por fora e macio por dentro. 4 unidades.',              destaques:[],                                                    imagem:'assets/images/Bolinho de Estudante.jpg' },
  { id:16, nome:'Bala Baiana na Travessa',               categoria:'Sobremesa', preco:22.90, descricao:'Versão em travessa da tradicional bala baiana, com creme doce e cobertura caramelizada.',                    destaques:[{label:'Prato da Casa'}],                             imagem:'assets/images/Bala baiana.jpg' },
  { id:17, nome:'Queijadinha',                           categoria:'Sobremesa', preco:12.90, descricao:'Doce assado à base de coco e queijo, com textura úmida e sabor equilibrado.',                                 destaques:[],                                                    imagem:'assets/images/Queijadinha.jpg' },
  { id:18, nome:'Doce de Leite Talhado',                 categoria:'Sobremesa', preco:15.90, descricao:'Sobremesa tradicional feita com leite talhado, açúcar e especiarias.',                                        destaques:[],                                                    imagem:'assets/images/Doce de Leite.jpg' },
  { id:19, nome:'Pudim de Tapioca com Leite Condensado', categoria:'Sobremesa', preco:18.90, descricao:'Versão mais cremosa do pudim de tapioca, enriquecida com leite condensado.',                                  destaques:[{label:'Sugestão do Chef'}],                          imagem:'assets/images/Pudim.jpg' },
  { id:20, nome:'Água',                  categoria:'Bebidas', preco:5.00,  descricao:'Água mineral gelada.', destaques:[], imagem:'assets/images/Agua.jpg' },
  { id:21, nome:'Água com Gás',          categoria:'Bebidas', preco:6.00,  descricao:'Água mineral com gás.', destaques:[], imagem:'assets/images/Agua com gas.jpg' },
  { id:22, nome:'Refrigerante',          categoria:'Bebidas', preco:8.00,  descricao:'Bebidas gaseificadas em diferentes sabores.', destaques:[], imagem:'assets/images/refrigerante.jpg' },
  { id:23, nome:'Sucos Naturais',        categoria:'Bebidas', preco:12.00, descricao:'Sucos preparados com frutas frescas da estação.', destaques:[], imagem:'assets/images/Sucos.jpg' },
  { id:24, nome:'Caipirinhas e Caipiroskas', categoria:'Drinks', preco:22.00, descricao:'Clássico brasileiro com frutas frescas, açúcar e gelo.', destaques:[{label:'Prato da Casa'}], imagem:'assets/images/Caipirnha e Caipiroska.jpg' },
  { id:25, nome:'Cravinho',              categoria:'Drinks', preco:24.00, descricao:'Drink tradicional com cachaça, especiarias e toque adocicado.', destaques:[{label:'Sugestão do Chef'}], imagem:'assets/images/Cravinho.jpg' },
  { id:26, nome:'Coice de Mula (Moscow Mule)', categoria:'Drinks', preco:26.00, descricao:'Drink refrescante à base de vodka, limão e espuma de gengibre.', destaques:[], imagem:'assets/images/Moscow Mule.jpg' },
  { id:27, nome:'Drinks Tropicais',      categoria:'Drinks', preco:28.00, descricao:'Combinações especiais com frutas tropicais e destilados selecionados.', destaques:[{label:'Sugestão do Chef'}], imagem:'assets/images/Drinks tropicais.jpg' },
  { id:28, nome:'Gin Tônica',            categoria:'Drinks', preco:30.00, descricao:'Clássico sofisticado com gin, água tônica e especiarias.', destaques:[], imagem:'assets/images/Gin tonica.jpg' },
];

const FORNECEDORES_INICIAIS: Omit<Fornecedor, 'firestoreId'>[] = [
  { id:1, nome:'Mar & Sabor LTDA',       cnpj:'12.345.678/0001-90', produtos:'Frutos do mar (Peixe, Camarão, Polvo, Siri, Sururu)', endereco:'Rua das Ondas, 245 - Salvador/BA', telefone:'(71) 3333-4444', email:'contato@maresabor.com.br',                valorMedio:18500, status:'Ativo', observacoes:'' },
  { id:2, nome:'Distribuidora Nordeste', cnpj:'23.456.789/0001-12', produtos:'Grãos, Farinhas, Temperos, Bebidas',                  endereco:'Av. Principal, 1500 - Feira de Santana/BA', telefone:'(75) 3222-5555', email:'vendas@distribuidoranordeste.com.br', valorMedio:12000, status:'Ativo', observacoes:'' },
  { id:3, nome:'Hortifruti Regional',    cnpj:'34.567.890/0001-34', produtos:'Frutas, Verduras, Legumes',                           endereco:'Mercado Municipal, Box 15 - Salvador/BA', telefone:'(71) 3111-2222', email:'hortifrutiregional@email.com',            valorMedio:8500,  status:'Ativo', observacoes:'' },
  { id:4, nome:'Carnes Nordeste Premium',cnpj:'45.678.901/0001-56', produtos:'Carne do sol, Carnes bovinas',                        endereco:'Rua do Comércio, 890 - Salvador/BA',       telefone:'(71) 3444-6666', email:'carnesnordeste@gmail.com',                valorMedio:6800,  status:'Ativo', observacoes:'' },
  { id:5, nome:'Laticínios Santa Clara', cnpj:'56.789.012/0001-78', produtos:'Leite, Queijo coalho, Laticínios em geral',           endereco:'Fazenda Santa Clara - Alagoinhas/BA',      telefone:'(75) 3555-7777', email:'santaclara@laticinios.com.br',            valorMedio:4200,  status:'Ativo', observacoes:'' },
  { id:6, nome:'Sabores da Bahia',       cnpj:'67.890.123/0001-90', produtos:'Azeite de dendê, Temperos típicos',                   endereco:'Rua da Alegria, 123 - Salvador/BA',        telefone:'(71) 3666-8888', email:'saboresba@yahoo.com.br',                  valorMedio:3500,  status:'Ativo', observacoes:'' },
  { id:7, nome:'Bebidas & Cia',          cnpj:'78.901.234/0001-01', produtos:'Água, Refrigerantes, Cervejas, Destilados',           endereco:'Av. das Bebidas, 2000 - Salvador/BA',      telefone:'(71) 3777-9999', email:'bebidas.cia@outlook.com',                 valorMedio:9800,  status:'Ativo', observacoes:'' },
  { id:8, nome:'Gelo Norte',             cnpj:'89.012.345/0001-23', produtos:'Gelo em cubos, Gelo em barra',                        endereco:'Rua Fria, 567 - Salvador/BA',              telefone:'(71) 3888-0000', email:'gelonorte@email.com',                     valorMedio:1500,  status:'Ativo', observacoes:'' },
  { id:9, nome:'Água Pura',              cnpj:'90.123.456/0001-45', produtos:'Água filtrada, Tratamento de água',                   endereco:'Rua das Águas, 789 - Salvador/BA',         telefone:'(71) 3999-1111', email:'aguapura@hotmail.com',                    valorMedio:800,   status:'Ativo', observacoes:'' },
];

// ─── Helper ─────────────────────────────────────────────────────
function limpar(obj: any): any {
  return JSON.parse(JSON.stringify(obj, (_, v) => v === undefined ? null : v));
}

// ─── Seeds ───────────────────────────────────────────────────────

const ADMINISTRADORES_INICIAIS: Omit<Administrador, 'firestoreId'>[] = [
  { id:1, matricula:'ADM001', nome:'Eliacira Santos', senha:'123456', cargo:'Dono',       telefone:'11979745714', email:'santos.eli@baianar.com',   status:'Ativo', foto:'', senhaVisivel:false },
  { id:2, matricula:'ADM002', nome:'Isabel Paix\u00e3o',   senha:'12345',  cargo:'Gerente',    telefone:'11979907856', email:'paixao.bel@baianar.com',   status:'Ativo', foto:'', senhaVisivel:false },
  { id:3, matricula:'ADM003', nome:'Eliza Moreira',   senha:'1234',   cargo:'Gerente',    telefone:'11979896257', email:'moreira.liz@baianar.com',  status:'Ativo', foto:'', senhaVisivel:false },
  { id:4, matricula:'ADM004', nome:'Evellyn Reis',    senha:'123',    cargo:'Gerente',    telefone:'11966714161', email:'reis.eve@baianar.com',     status:'Ativo', foto:'', senhaVisivel:false },
  { id:5, matricula:'ADM005', nome:'Lucas Oliveira',  senha:'12',     cargo:'Supervisor', telefone:'11987654321', email:'oliveira.luc@baianar.com', status:'Ativo', foto:'', senhaVisivel:false },
];

const FUNCIONARIOS_INICIAIS: Omit<Funcionario, 'firestoreId'>[] = [
  { id:1, foto:'', nomeCompleto:'Carlos Eduardo Santos',   cpf:'123.456.789-00', carteira:'CT 12345-67', funcao:'Chef de Cozinha',     horario:'10:00 - 18:00', salario:'R$ 8500,00', ferias:false, atestado:false, bancoHoras:'+12h', bancoHorasPositivo:true,  status:'Ativo',     telefone:'(71) 99876-5432', email:'carlos.santos@baianar.com.br',    endereco:'Rua das Palmeiras, 123 - Salvador/BA',          dataAdmissao:'15/01/2020', observacoes:'Funcion\u00e1rio exemplar, especializado em culin\u00e1ria baiana',                    historicoBH:[{data:'01/03/2026',descricao:'Cr\u00e9dito - Hora extra',horas:'+4h',positivo:true},{data:'25/02/2026',descricao:'Cr\u00e9dito - Hora extra',horas:'+3h',positivo:true},{data:'20/02/2026',descricao:'Cr\u00e9dito - Hora extra',horas:'+5h',positivo:true}], historicoFerias:[{inicio:'01/12/2025',fim:'30/12/2025',dias:30},{inicio:'01/07/2024',fim:'30/07/2024',dias:30}] },
  { id:2, foto:'', nomeCompleto:'Jo\u00e3o Pedro Lima',         cpf:'234.567.890-11', carteira:'CT 23456-78', funcao:'Gar\u00e7om',            horario:'14:00 - 22:00', salario:'R$ 2800,00', ferias:false, atestado:false, bancoHoras:'-3h',  bancoHorasPositivo:false, status:'Ativo',     telefone:'(71) 98765-4321', email:'joao.lima@baianar.com.br',         endereco:'Av. Sete de Setembro, 456 - Salvador/BA',       dataAdmissao:'03/06/2021', observacoes:'\u00d3timo atendimento ao cliente, pontual',                                          historicoBH:[{data:'28/02/2026',descricao:'D\u00e9bito - Sa\u00edda antecipada',horas:'-2h',positivo:false},{data:'15/02/2026',descricao:'D\u00e9bito - Falta parcial',horas:'-1h',positivo:false}], historicoFerias:[{inicio:'01/02/2025',fim:'28/02/2025',dias:28}] },
  { id:3, foto:'', nomeCompleto:'Mariana Costa Oliveira', cpf:'345.678.901-22', carteira:'CT 34567-89', funcao:'Gerente',            horario:'09:00 - 17:00', salario:'R$ 6500,00', ferias:false, atestado:false, bancoHoras:'+8h',  bancoHorasPositivo:true,  status:'Ativo',     telefone:'(71) 97654-3210', email:'mariana.oliveira@baianar.com.br',  endereco:'Rua do Com\u00e9rcio, 789 - Salvador/BA',               dataAdmissao:'10/03/2019', observacoes:'Lideran\u00e7a exemplar, coordena equipe com excel\u00eancia',                       historicoBH:[{data:'02/03/2026',descricao:'Cr\u00e9dito - Hora extra',horas:'+4h',positivo:true},{data:'22/02/2026',descricao:'Cr\u00e9dito - Reuni\u00e3o extra',horas:'+4h',positivo:true}], historicoFerias:[{inicio:'01/11/2025',fim:'30/11/2025',dias:30},{inicio:'01/05/2024',fim:'30/05/2024',dias:30}] },
  { id:4, foto:'', nomeCompleto:'Rafael Souza Almeida',   cpf:'456.789.012-33', carteira:'CT 45678-90', funcao:'Auxiliar de Cozinha', horario:'08:00 - 16:00', salario:'R$ 2200,00', ferias:false, atestado:true,  bancoHoras:'0h',   bancoHorasPositivo:true,  status:'Afastado',  telefone:'(71) 96543-2109', email:'rafael.almeida@baianar.com.br',   endereco:'Travessa das Flores, 321 - Lauro de Freitas/BA', dataAdmissao:'20/08/2022', observacoes:'Afastado por atestado m\u00e9dico desde 01/03/2026',                                 historicoBH:[], historicoFerias:[{inicio:'01/08/2025',fim:'30/08/2025',dias:30}] },
  { id:5, foto:'', nomeCompleto:'Juliana Ferreira Rocha', cpf:'567.890.123-44', carteira:'CT 56789-01', funcao:'Caixa',              horario:'12:00 - 20:00', salario:'R$ 2600,00', ferias:false, atestado:false, bancoHoras:'+6h',  bancoHorasPositivo:true,  status:'Ativo',     telefone:'(71) 95432-1098', email:'juliana.rocha@baianar.com.br',    endereco:'Rua Nova, 654 - Cama\u00e7ari/BA',                      dataAdmissao:'05/01/2023', observacoes:'Precisa e organizada no controle do caixa',                                       historicoBH:[{data:'03/03/2026',descricao:'Cr\u00e9dito - Hora extra',horas:'+3h',positivo:true},{data:'18/02/2026',descricao:'Cr\u00e9dito - Hora extra',horas:'+3h',positivo:true}], historicoFerias:[] },
  { id:6, foto:'', nomeCompleto:'Amanda Silva Pereira',   cpf:'678.901.234-55', carteira:'CT 67890-12', funcao:'Gar\u00e7onete',        horario:'18:00 - 02:00', salario:'R$ 2700,00', ferias:true,  atestado:false, bancoHoras:'0h',   bancoHorasPositivo:true,  status:'De f\u00e9rias', telefone:'(71) 94321-0987', email:'amanda.pereira@baianar.com.br',  endereco:'Alameda dos Ip\u00eas, 987 - Salvador/BA',             dataAdmissao:'14/04/2021', observacoes:'Em per\u00edodo de f\u00e9rias at\u00e9 20/06/2026',                                  historicoBH:[{data:'10/02/2026',descricao:'Cr\u00e9dito - Hora extra',horas:'+2h',positivo:true}], historicoFerias:[{inicio:'21/05/2026',fim:'20/06/2026',dias:30},{inicio:'01/04/2025',fim:'30/04/2025',dias:30}] },
  { id:7, foto:'', nomeCompleto:'Felipe Rodrigues Neto',  cpf:'789.012.345-66', carteira:'CT 78901-23', funcao:'Motoboy',            horario:'11:00 - 19:00', salario:'R$ 2400,00', ferias:false, atestado:false, bancoHoras:'+2h',  bancoHorasPositivo:true,  status:'Ativo',     telefone:'(71) 93210-9876', email:'felipe.neto@baianar.com.br',      endereco:'Rua das Ac\u00e1cias, 112 - Salvador/BA',              dataAdmissao:'10/09/2023', observacoes:'Entregador \u00e1gil, conhece bem as rotas de Salvador',                            historicoBH:[{data:'01/03/2026',descricao:'Cr\u00e9dito - Hora extra',horas:'+2h',positivo:true}], historicoFerias:[] },
  { id:8, foto:'', nomeCompleto:'Bruno Mendes Carvalho',  cpf:'890.123.456-77', carteira:'CT 89012-34', funcao:'Motoboy',            horario:'17:00 - 01:00', salario:'R$ 2400,00', ferias:false, atestado:false, bancoHoras:'+5h',  bancoHorasPositivo:true,  status:'Ativo',     telefone:'(71) 92109-8765', email:'bruno.carvalho@baianar.com.br',   endereco:'Rua da Paz, 234 - Sim\u00f5es Filho/BA',               dataAdmissao:'22/02/2024', observacoes:'Cobre turno noturno, \u00f3tima avalia\u00e7\u00e3o pelos clientes',                  historicoBH:[{data:'27/02/2026',descricao:'Cr\u00e9dito - Hora extra',horas:'+3h',positivo:true},{data:'14/02/2026',descricao:'Cr\u00e9dito - Hora extra',horas:'+2h',positivo:true}], historicoFerias:[] },
  { id:9, foto:'', nomeCompleto:'Diego Teixeira Santos',  cpf:'901.234.567-88', carteira:'CT 90123-45', funcao:'Motoboy',            horario:'14:00 - 22:00', salario:'R$ 2400,00', ferias:false, atestado:true,  bancoHoras:'0h',   bancoHorasPositivo:true,  status:'Afastado',  telefone:'(71) 91098-7654', email:'diego.santos@baianar.com.br',     endereco:'Av. Brasil, 567 - Feira de Santana/BA',         dataAdmissao:'05/07/2024', observacoes:'Afastado por acidente de tr\u00e2nsito, retorno previsto para 15/06/2026',          historicoBH:[], historicoFerias:[] },
];

const ESTOQUE_INICIAIS: Omit<ProdutoEstoque, 'firestoreId'>[] = [
  { id:1,  nome:'Peixe branco',          categoria:'Frutos do Mar', fornecedor:'Mar & Sabor LTDA',        qtdAtual:25,  unidade:'kg',      nivelMinimo:15,  preco:0, descricao:'', status:'Normal',  ultimaAtualizacao:'07/03/2026' },
  { id:2,  nome:'Camar\u00e3o',               categoria:'Frutos do Mar', fornecedor:'Mar & Sabor LTDA',        qtdAtual:8,   unidade:'kg',      nivelMinimo:10,  preco:0, descricao:'', status:'Baixo',   ultimaAtualizacao:'06/03/2026' },
  { id:3,  nome:'Polvo',                 categoria:'Frutos do Mar', fornecedor:'Mar & Sabor LTDA',        qtdAtual:4,   unidade:'kg',      nivelMinimo:8,   preco:0, descricao:'', status:'Cr\u00edtico', ultimaAtualizacao:'04/03/2026' },
  { id:4,  nome:'Carne de siri',         categoria:'Frutos do Mar', fornecedor:'Mar & Sabor LTDA',        qtdAtual:12,  unidade:'kg',      nivelMinimo:8,   preco:0, descricao:'', status:'Normal',  ultimaAtualizacao:'07/03/2026' },
  { id:5,  nome:'Sururu',                categoria:'Frutos do Mar', fornecedor:'Mar & Sabor LTDA',        qtdAtual:15,  unidade:'kg',      nivelMinimo:10,  preco:0, descricao:'', status:'Normal',  ultimaAtualizacao:'05/03/2026' },
  { id:6,  nome:'Manjubinha (pititinga)', categoria:'Frutos do Mar', fornecedor:'Mar & Sabor LTDA',       qtdAtual:6,   unidade:'kg',      nivelMinimo:5,   preco:0, descricao:'', status:'Normal',  ultimaAtualizacao:'06/03/2026' },
  { id:7,  nome:'Camar\u00e3o seco',          categoria:'Frutos do Mar', fornecedor:'Distribuidora Nordeste',  qtdAtual:20,  unidade:'kg',      nivelMinimo:12,  preco:0, descricao:'', status:'Normal',  ultimaAtualizacao:'28/02/2026' },
  { id:8,  nome:'Carne do sol',          categoria:'Carnes',        fornecedor:'Carnes Nordeste Premium', qtdAtual:18,  unidade:'kg',      nivelMinimo:15,  preco:0, descricao:'', status:'Normal',  ultimaAtualizacao:'07/03/2026' },
  { id:9,  nome:'Feij\u00e3o fradinho',       categoria:'Gr\u00e3os',         fornecedor:'Distribuidora Nordeste',  qtdAtual:35,  unidade:'kg',      nivelMinimo:20,  preco:0, descricao:'', status:'Normal',  ultimaAtualizacao:'04/03/2026' },
  { id:10, nome:'Feij\u00e3o verde',          categoria:'Gr\u00e3os',         fornecedor:'Distribuidora Nordeste',  qtdAtual:28,  unidade:'kg',      nivelMinimo:20,  preco:0, descricao:'', status:'Normal',  ultimaAtualizacao:'04/03/2026' },
  { id:11, nome:'Arroz branco',          categoria:'Gr\u00e3os',         fornecedor:'Distribuidora Nordeste',  qtdAtual:45,  unidade:'kg',      nivelMinimo:30,  preco:0, descricao:'', status:'Normal',  ultimaAtualizacao:'05/03/2026' },
  { id:12, nome:'Mandioca',              categoria:'Ra\u00edzes',        fornecedor:'Hortifruti Regional',     qtdAtual:22,  unidade:'kg',      nivelMinimo:15,  preco:0, descricao:'', status:'Normal',  ultimaAtualizacao:'07/03/2026' },
  { id:13, nome:'Tapioca granulada',     categoria:'Ra\u00edzes',        fornecedor:'Distribuidora Nordeste',  qtdAtual:18,  unidade:'kg',      nivelMinimo:12,  preco:0, descricao:'', status:'Normal',  ultimaAtualizacao:'03/03/2026' },
  { id:14, nome:'Leite',                 categoria:'Latic\u00ednios',    fornecedor:'Latic\u00ednios Santa Clara',  qtdAtual:30,  unidade:'litro',   nivelMinimo:25,  preco:0, descricao:'', status:'Normal',  ultimaAtualizacao:'07/03/2026' },
  { id:15, nome:'Leite condensado',      categoria:'Latic\u00ednios',    fornecedor:'Distribuidora Nordeste',  qtdAtual:12,  unidade:'unidade', nivelMinimo:10,  preco:0, descricao:'', status:'Normal',  ultimaAtualizacao:'06/03/2026' },
  { id:16, nome:'Queijo coalho',         categoria:'Latic\u00ednios',    fornecedor:'Latic\u00ednios Santa Clara',  qtdAtual:8,   unidade:'kg',      nivelMinimo:10,  preco:0, descricao:'', status:'Baixo',   ultimaAtualizacao:'05/03/2026' },
  { id:17, nome:'Lim\u00e3o',                 categoria:'Frutas',        fornecedor:'Hortifruti Regional',     qtdAtual:15,  unidade:'kg',      nivelMinimo:10,  preco:0, descricao:'', status:'Normal',  ultimaAtualizacao:'07/03/2026' },
  { id:18, nome:'Laranja',               categoria:'Frutas',        fornecedor:'Hortifruti Regional',     qtdAtual:18,  unidade:'kg',      nivelMinimo:12,  preco:0, descricao:'', status:'Normal',  ultimaAtualizacao:'07/03/2026' },
  { id:19, nome:'Abacaxi',               categoria:'Frutas',        fornecedor:'Hortifruti Regional',     qtdAtual:25,  unidade:'unidade', nivelMinimo:15,  preco:0, descricao:'', status:'Normal',  ultimaAtualizacao:'06/03/2026' },
  { id:20, nome:'Maracuj\u00e1',              categoria:'Frutas',        fornecedor:'Hortifruti Regional',     qtdAtual:12,  unidade:'kg',      nivelMinimo:10,  preco:0, descricao:'', status:'Normal',  ultimaAtualizacao:'07/03/2026' },
  { id:21, nome:'Morango',               categoria:'Frutas',        fornecedor:'Hortifruti Regional',     qtdAtual:5,   unidade:'kg',      nivelMinimo:8,   preco:0, descricao:'', status:'Baixo',   ultimaAtualizacao:'05/03/2026' },
  { id:22, nome:'Manga',                 categoria:'Frutas',        fornecedor:'Hortifruti Regional',     qtdAtual:20,  unidade:'kg',      nivelMinimo:12,  preco:0, descricao:'', status:'Normal',  ultimaAtualizacao:'07/03/2026' },
  { id:23, nome:'Acerola',               categoria:'Frutas',        fornecedor:'Hortifruti Regional',     qtdAtual:8,   unidade:'kg',      nivelMinimo:6,   preco:0, descricao:'', status:'Normal',  ultimaAtualizacao:'06/03/2026' },
  { id:24, nome:'Caj\u00e1',                  categoria:'Frutas',        fornecedor:'Hortifruti Regional',     qtdAtual:10,  unidade:'kg',      nivelMinimo:8,   preco:0, descricao:'', status:'Normal',  ultimaAtualizacao:'06/03/2026' },
  { id:25, nome:'Caju',                  categoria:'Frutas',        fornecedor:'Hortifruti Regional',     qtdAtual:6,   unidade:'kg',      nivelMinimo:5,   preco:0, descricao:'', status:'Normal',  ultimaAtualizacao:'07/03/2026' },
  { id:26, nome:'Cebola',                categoria:'Hortali\u00e7as',    fornecedor:'Hortifruti Regional',     qtdAtual:25,  unidade:'kg',      nivelMinimo:15,  preco:0, descricao:'', status:'Normal',  ultimaAtualizacao:'07/03/2026' },
  { id:27, nome:'Alho',                  categoria:'Hortali\u00e7as',    fornecedor:'Hortifruti Regional',     qtdAtual:8,   unidade:'kg',      nivelMinimo:6,   preco:0, descricao:'', status:'Normal',  ultimaAtualizacao:'06/03/2026' },
  { id:28, nome:'Tomate',                categoria:'Hortali\u00e7as',    fornecedor:'Hortifruti Regional',     qtdAtual:18,  unidade:'kg',      nivelMinimo:15,  preco:0, descricao:'', status:'Normal',  ultimaAtualizacao:'07/03/2026' },
  { id:29, nome:'Piment\u00e3o vermelho',     categoria:'Hortali\u00e7as',    fornecedor:'Hortifruti Regional',     qtdAtual:12,  unidade:'kg',      nivelMinimo:10,  preco:0, descricao:'', status:'Normal',  ultimaAtualizacao:'07/03/2026' },
  { id:30, nome:'Piment\u00e3o amarelo',      categoria:'Hortali\u00e7as',    fornecedor:'Hortifruti Regional',     qtdAtual:10,  unidade:'kg',      nivelMinimo:8,   preco:0, descricao:'', status:'Normal',  ultimaAtualizacao:'07/03/2026' },
  { id:31, nome:'Piment\u00e3o verde',        categoria:'Hortali\u00e7as',    fornecedor:'Hortifruti Regional',     qtdAtual:14,  unidade:'kg',      nivelMinimo:10,  preco:0, descricao:'', status:'Normal',  ultimaAtualizacao:'07/03/2026' },
  { id:32, nome:'Coentro',               categoria:'Hortali\u00e7as',    fornecedor:'Hortifruti Regional',     qtdAtual:4,   unidade:'kg',      nivelMinimo:3,   preco:0, descricao:'', status:'Normal',  ultimaAtualizacao:'08/03/2026' },
  { id:33, nome:'Cebolinha',             categoria:'Hortali\u00e7as',    fornecedor:'Hortifruti Regional',     qtdAtual:3,   unidade:'kg',      nivelMinimo:3,   preco:0, descricao:'', status:'Normal',  ultimaAtualizacao:'08/03/2026' },
  { id:34, nome:'Gengibre',              categoria:'Hortali\u00e7as',    fornecedor:'Hortifruti Regional',     qtdAtual:5,   unidade:'kg',      nivelMinimo:4,   preco:0, descricao:'', status:'Normal',  ultimaAtualizacao:'06/03/2026' },
  { id:35, nome:'Leite de coco',         categoria:'Coco',          fornecedor:'Distribuidora Nordeste',  qtdAtual:22,  unidade:'litro',   nivelMinimo:18,  preco:0, descricao:'', status:'Normal',  ultimaAtualizacao:'05/03/2026' },
  { id:36, nome:'Coco ralado',           categoria:'Coco',          fornecedor:'Distribuidora Nordeste',  qtdAtual:8,   unidade:'kg',      nivelMinimo:6,   preco:0, descricao:'', status:'Normal',  ultimaAtualizacao:'04/03/2026' },
  { id:37, nome:'Azeite de dend\u00ea',       categoria:'Temperos',      fornecedor:'Sabores da Bahia',        qtdAtual:12,  unidade:'litro',   nivelMinimo:10,  preco:0, descricao:'', status:'Normal',  ultimaAtualizacao:'03/03/2026' },
  { id:38, nome:'Azeite de oliva',       categoria:'Temperos',      fornecedor:'Distribuidora Nordeste',  qtdAtual:8,   unidade:'litro',   nivelMinimo:8,   preco:0, descricao:'', status:'Normal',  ultimaAtualizacao:'04/03/2026' },
  { id:39, nome:'Sal',                   categoria:'Temperos',      fornecedor:'Distribuidora Nordeste',  qtdAtual:40,  unidade:'kg',      nivelMinimo:20,  preco:0, descricao:'', status:'Normal',  ultimaAtualizacao:'28/02/2026' },
  { id:40, nome:'Pimenta-do-reino',      categoria:'Temperos',      fornecedor:'Sabores da Bahia',        qtdAtual:3,   unidade:'kg',      nivelMinimo:2,   preco:0, descricao:'', status:'Normal',  ultimaAtualizacao:'02/03/2026' },
  { id:41, nome:'Pimenta dedo-de-mo\u00e7a',  categoria:'Temperos',      fornecedor:'Hortifruti Regional',     qtdAtual:2,   unidade:'kg',      nivelMinimo:2,   preco:0, descricao:'', status:'Normal',  ultimaAtualizacao:'07/03/2026' },
  { id:42, nome:'Cominho',               categoria:'Temperos',      fornecedor:'Sabores da Bahia',        qtdAtual:1.5, unidade:'kg',      nivelMinimo:1,   preco:0, descricao:'', status:'Normal',  ultimaAtualizacao:'01/03/2026' },
  { id:43, nome:'Colorau',               categoria:'Temperos',      fornecedor:'Sabores da Bahia',        qtdAtual:4,   unidade:'kg',      nivelMinimo:3,   preco:0, descricao:'', status:'Normal',  ultimaAtualizacao:'03/03/2026' },
  { id:44, nome:'Canela',                categoria:'Temperos',      fornecedor:'Sabores da Bahia',        qtdAtual:1,   unidade:'kg',      nivelMinimo:0.8, preco:0, descricao:'', status:'Normal',  ultimaAtualizacao:'28/02/2026' },
  { id:45, nome:'A\u00e7\u00facar',                categoria:'Temperos',      fornecedor:'Distribuidora Nordeste',  qtdAtual:35,  unidade:'kg',      nivelMinimo:25,  preco:0, descricao:'', status:'Normal',  ultimaAtualizacao:'05/03/2026' },
  { id:46, nome:'Farinha de mandioca',   categoria:'Farinhas',      fornecedor:'Distribuidora Nordeste',  qtdAtual:30,  unidade:'kg',      nivelMinimo:20,  preco:0, descricao:'', status:'Normal',  ultimaAtualizacao:'04/03/2026' },
  { id:47, nome:'Farinha de trigo',      categoria:'Farinhas',      fornecedor:'Distribuidora Nordeste',  qtdAtual:25,  unidade:'kg',      nivelMinimo:18,  preco:0, descricao:'', status:'Normal',  ultimaAtualizacao:'05/03/2026' },
  { id:48, nome:'\u00d3leo vegetal',          categoria:'\u00d3leos',         fornecedor:'Distribuidora Nordeste',  qtdAtual:28,  unidade:'litro',   nivelMinimo:20,  preco:0, descricao:'', status:'Normal',  ultimaAtualizacao:'05/03/2026' },
  { id:49, nome:'\u00c1gua mineral',          categoria:'Bebidas',       fornecedor:'Bebidas & Cia',           qtdAtual:120, unidade:'unidade', nivelMinimo:100, preco:0, descricao:'', status:'Normal',  ultimaAtualizacao:'07/03/2026' },
  { id:50, nome:'\u00c1gua com g\u00e1s',          categoria:'Bebidas',       fornecedor:'Bebidas & Cia',           qtdAtual:85,  unidade:'unidade', nivelMinimo:60,  preco:0, descricao:'', status:'Normal',  ultimaAtualizacao:'07/03/2026' },
  { id:51, nome:'Refrigerantes',         categoria:'Bebidas',       fornecedor:'Bebidas & Cia',           qtdAtual:95,  unidade:'unidade', nivelMinimo:80,  preco:0, descricao:'', status:'Normal',  ultimaAtualizacao:'07/03/2026' },
  { id:52, nome:'Cacha\u00e7a',               categoria:'Bebidas',       fornecedor:'Bebidas & Cia',           qtdAtual:28,  unidade:'unidade', nivelMinimo:20,  preco:0, descricao:'', status:'Normal',  ultimaAtualizacao:'06/03/2026' },
  { id:53, nome:'Vodka',                 categoria:'Bebidas',       fornecedor:'Bebidas & Cia',           qtdAtual:18,  unidade:'unidade', nivelMinimo:15,  preco:0, descricao:'', status:'Normal',  ultimaAtualizacao:'06/03/2026' },
  { id:54, nome:'Gin',                   categoria:'Bebidas',       fornecedor:'Bebidas & Cia',           qtdAtual:12,  unidade:'unidade', nivelMinimo:10,  preco:0, descricao:'', status:'Normal',  ultimaAtualizacao:'05/03/2026' },
  { id:55, nome:'Cerveja',               categoria:'Bebidas',       fornecedor:'Bebidas & Cia',           qtdAtual:145, unidade:'unidade', nivelMinimo:120, preco:0, descricao:'', status:'Normal',  ultimaAtualizacao:'07/03/2026' },
  { id:56, nome:'Gelo',                  categoria:'Outros',        fornecedor:'Gelo Norte',              qtdAtual:50,  unidade:'kg',      nivelMinimo:40,  preco:0, descricao:'', status:'Normal',  ultimaAtualizacao:'08/03/2026' },
  { id:57, nome:'\u00c1gua filtrada',         categoria:'Outros',        fornecedor:'\u00c1gua Pura',               qtdAtual:200, unidade:'litro',   nivelMinimo:150, preco:0, descricao:'', status:'Normal',  ultimaAtualizacao:'08/03/2026' },
];

// ─── Serviço ────────────────────────────────────────────────────
@Injectable({ providedIn: 'root' })
export class AdminDataService {

  private fs = inject(Firestore);

  // ── Sinais reativos ──────────────────────────────────────────
  readonly pratos        = signal<Prato[]>([]);
  readonly estoqueItens  = signal<ProdutoEstoque[]>([]);
  readonly funcionarios  = signal<Funcionario[]>([]);
  readonly administradores = signal<Administrador[]>([]);
  readonly fornecedores  = signal<Fornecedor[]>([]);

  private _unsubs: Unsubscribe[] = [];

  constructor() {
    this.iniciarListeners();
  }

  ngOnDestroy(): void { this._unsubs.forEach(u => u()); }

  // ── Listeners onSnapshot ─────────────────────────────────────
  private iniciarListeners(): void {
    this.listen<Prato>('cardapio',               this.pratos,           'id', PRATOS_INICIAIS);
    this.listen<Fornecedor>('fornecedores',       this.fornecedores,     'id', FORNECEDORES_INICIAIS);
    this.listen<ProdutoEstoque>('estoque_itens',  this.estoqueItens,     'id', ESTOQUE_INICIAIS);
    this.listen<Funcionario>('funcionarios',      this.funcionarios,     'id', FUNCIONARIOS_INICIAIS);
    this.listen<Administrador>('administradores', this.administradores,  'id', ADMINISTRADORES_INICIAIS);
  }

  private listen<T extends { firestoreId?: string; id: number }>(
    colName: string,
    sig: ReturnType<typeof signal<T[]>>,
    orderField: string,
    seed: Omit<T, 'firestoreId'>[],
  ): void {
    const col = collection(this.fs, colName);
    const q   = query(col, orderBy(orderField, 'asc'));
    const unsub = onSnapshot(q, async snap => {
      if (snap.empty && seed.length > 0) {
        // Popula a coleção pela primeira vez
        for (const item of seed) {
          await addDoc(col, limpar(item)).catch(() => {});
        }
        return;
      }
      sig.set(snap.docs.map(d => ({ ...d.data(), firestoreId: d.id } as T)));
    }, err => console.error(`[AdminDataService] ${colName}:`, err));
    this._unsubs.push(unsub);
  }

  // ═══════════════════════════════════════════════════════════════
  // CARDÁPIO
  // ═══════════════════════════════════════════════════════════════
  async adicionarPrato(prato: Omit<Prato, 'firestoreId' | 'id'>): Promise<void> {
    const id = this.nextId(this.pratos());
    await addDoc(collection(this.fs, 'cardapio'), limpar({ ...prato, id }));
  }

  async atualizarPrato(firestoreId: string, dados: Partial<Prato>): Promise<void> {
    await updateDoc(doc(this.fs, 'cardapio', firestoreId), limpar(dados));
  }

  async excluirPrato(firestoreId: string): Promise<void> {
    await deleteDoc(doc(this.fs, 'cardapio', firestoreId));
  }

  // ═══════════════════════════════════════════════════════════════
  // ESTOQUE
  // ═══════════════════════════════════════════════════════════════
  async adicionarProduto(prod: Omit<ProdutoEstoque, 'firestoreId' | 'id'>): Promise<void> {
    const id = this.nextId(this.estoqueItens());
    await addDoc(collection(this.fs, 'estoque_itens'), limpar({ ...prod, id }));
  }

  async atualizarProduto(firestoreId: string, dados: Partial<ProdutoEstoque>): Promise<void> {
    await updateDoc(doc(this.fs, 'estoque_itens', firestoreId), limpar(dados));
  }

  async excluirProduto(firestoreId: string): Promise<void> {
    await deleteDoc(doc(this.fs, 'estoque_itens', firestoreId));
  }

  // ═══════════════════════════════════════════════════════════════
  // FUNCIONÁRIOS
  // ═══════════════════════════════════════════════════════════════
  async adicionarFuncionario(func: Omit<Funcionario, 'firestoreId' | 'id'>): Promise<void> {
    const id = this.nextId(this.funcionarios());
    await addDoc(collection(this.fs, 'funcionarios'), limpar({ ...func, id }));
  }

  async atualizarFuncionario(firestoreId: string, dados: Partial<Funcionario>): Promise<void> {
    await updateDoc(doc(this.fs, 'funcionarios', firestoreId), limpar(dados));
  }

  async excluirFuncionario(firestoreId: string): Promise<void> {
    await deleteDoc(doc(this.fs, 'funcionarios', firestoreId));
  }

  // ═══════════════════════════════════════════════════════════════
  // ADMINISTRADORES
  // ═══════════════════════════════════════════════════════════════
  async adicionarAdmin(adm: Omit<Administrador, 'firestoreId' | 'id'>): Promise<void> {
    const id = this.nextId(this.administradores());
    await addDoc(collection(this.fs, 'administradores'), limpar({ ...adm, id }));
  }

  async atualizarAdmin(firestoreId: string, dados: Partial<Administrador>): Promise<void> {
    await updateDoc(doc(this.fs, 'administradores', firestoreId), limpar(dados));
  }

  async excluirAdmin(firestoreId: string): Promise<void> {
    await deleteDoc(doc(this.fs, 'administradores', firestoreId));
  }

  // ═══════════════════════════════════════════════════════════════
  // FORNECEDORES
  // ═══════════════════════════════════════════════════════════════
  async adicionarFornecedor(forn: Omit<Fornecedor, 'firestoreId' | 'id'>): Promise<void> {
    const id = this.nextId(this.fornecedores());
    await addDoc(collection(this.fs, 'fornecedores'), limpar({ ...forn, id }));
  }

  async atualizarFornecedor(firestoreId: string, dados: Partial<Fornecedor>): Promise<void> {
    await updateDoc(doc(this.fs, 'fornecedores', firestoreId), limpar(dados));
  }

  async excluirFornecedor(firestoreId: string): Promise<void> {
    await deleteDoc(doc(this.fs, 'fornecedores', firestoreId));
  }

  // ─── Util ────────────────────────────────────────────────────
  private nextId(lista: { id: number }[]): number {
    return lista.length > 0 ? Math.max(...lista.map(i => i.id)) + 1 : 1;
  }
}
