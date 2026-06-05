import { Component, signal, computed, inject, ElementRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../services/auth.service';
import { User } from '../../services/auth.service';

export type Categoria = 'Principal' | 'Entrada' | 'Sobremesa' | 'Bebidas' | 'Drinks';
export interface Destaque { label: 'Prato da Casa' | 'Sugestão do Chef'; }
export interface Prato {
  id: number; nome: string; categoria: Categoria; preco: number;
  descricao: string; destaques: Destaque[]; imagem?: string;
}

@Component({
  selector: 'app-cardapio', standalone: true, imports: [CommonModule],
  templateUrl: './cardapio.component.html', styleUrls: ['./cardapio.component.scss']
})
export class CardapioComponent {
  @ViewChild('fileInput') fileInputRef!: ElementRef<HTMLInputElement>;
  private authService = inject(AuthService);
  currentUser = signal<User | null>(null);

  // ── Signals do modal ──────────────────────────────────────────
  showModal            = signal(false);
  editingPrato         = signal<Prato | null>(null);
  isSaving             = signal(false);
  showModalExclusao    = signal(false);
  pratoParaExcluir     = signal<Prato | null>(null);
  modalNome            = signal('');
  modalCategoria       = signal<Categoria | ''>('');
  modalPreco           = signal('');
  modalDescricao       = signal('');
  modalAcompanhamentos = signal('');
  modalPratoDaCasa     = signal(false);
  modalSugestaoChef    = signal(false);
  modalDisponivel      = signal(true);
  modalImagemFile      = signal<File | null>(null);
  modalImagemPreview   = signal('');
  descCount            = computed(() => this.modalDescricao().length);

  categorias: Categoria[] = ['Principal', 'Entrada', 'Sobremesa', 'Bebidas', 'Drinks'];

  pratos = signal<Prato[]>([
    { id:1,  nome:'Moqueca de Peixe',                      categoria:'Principal', preco:75.90, descricao:'Tradicional moqueca baiana preparada com peixe fresco cozido lentamente no leite de coco e azeite de dendê, temperada com pimentões coloridos, coentro e tomate.',          destaques:[{label:'Prato da Casa'},{label:'Sugestão do Chef'}], imagem:'assets/images/Moqueca de Peixe.jpg' },
    { id:2,  nome:'Bobó de Camarão',                       categoria:'Principal', preco:82.90, descricao:'Camarões selecionados envolvidos em um creme aveludado de mandioca com leite de coco, azeite de dendê e temperos baianos que encantam o paladar.',                         destaques:[{label:'Sugestão do Chef'}],                          imagem:'assets/images/Bobo de Camarao.jpg' },
    { id:3,  nome:'Carne do Sol com Purê de Mandioca',     categoria:'Principal', preco:68.90, descricao:'Carne do sol macia e suculenta, grelhada no ponto ideal, acompanhada de purê de mandioca cremoso feito na hora e manteiga de garrafa.',                                   destaques:[],                                                    imagem:'assets/images/Carne do Sol.jpg' },
    { id:4,  nome:'Baião de Dois',                         categoria:'Principal', preco:58.90, descricao:'Clássico nordestino preparado com arroz e feijão verde ou fradinho, queijo coalho, carne seca desfiada, coentro e manteiga de garrafa.',                                  destaques:[{label:'Prato da Casa'}],                             imagem:'assets/images/Baiao de Dois.jpg' },
    { id:5,  nome:'Arroz de Polvo',                        categoria:'Principal', preco:89.90, descricao:'Arroz cremoso preparado com polvo macio e bem temperado, cozido lentamente para absorver todos os sabores do caldo de frutos do mar.',                                    destaques:[{label:'Sugestão do Chef'}],                          imagem:'assets/images/Arroz de Polvo.jpg' },
    { id:6,  nome:'Camarão à Baiana',                      categoria:'Principal', preco:78.90, descricao:'Camarões salteados no azeite de dendê com leite de coco e temperos típicos. Acompanha arroz branco e farofa de dendê.',                                                   destaques:[{label:'Prato da Casa'}],                             imagem:'assets/images/Camarao a Baiana.jpg' },
    { id:7,  nome:'Casquinhas de Siri',                    categoria:'Entrada',   preco:32.90, descricao:'Carne de siri refogada com temperos frescos, leite de coco e toque especial da casa, servida na própria casquinha e gratinada ao forno.',                                 destaques:[{label:'Sugestão do Chef'}],                          imagem:'assets/images/Casquinhas de Siri.jpg' },
    { id:8,  nome:'Caldo de Sururu',                       categoria:'Entrada',   preco:28.90, descricao:'Caldo cremoso e aromático feito com sururu fresco, leite de coco e temperos regionais. Servido quente com torradinhas crocantes.',                                        destaques:[],                                                    imagem:'assets/images/Caldo de Sururu.jpg' },
    { id:9,  nome:'Mini Acarajés',                         categoria:'Entrada',   preco:24.90, descricao:'Bolinhos de feijão-fradinho fritos no azeite de dendê, recheados com vatapá e camarão seco. Porção com 4 unidades.',                                                      destaques:[{label:'Prato da Casa'}],                             imagem:'assets/images/Mini acarajé.jpg' },
    { id:10, nome:'Mini Abarás',                           categoria:'Entrada',   preco:26.90, descricao:'Massa de feijão-fradinho cozida no vapor em folha de bananeira, recheada com vatapá e camarão seco. Porção com 4 unidades.',                                              destaques:[],                                                    imagem:'assets/images/Mini Abara.jpg' },
    { id:11, nome:'Mini Pastel de Camarão',                categoria:'Entrada',   preco:22.90, descricao:'Pastéis crocantes recheados com camarão bem temperado, dourados até ficarem sequinhos. Acompanha molho especial da casa.',                                                 destaques:[],                                                    imagem:'assets/images/Pastel de camarao.jpg' },
    { id:12, nome:'Porção de Pititinga (Manjubinha)',       categoria:'Entrada',   preco:29.90, descricao:'Peixinhos fritos inteiros, crocantes e levemente temperados, perfeitos para acompanhar uma cerveja gelada ou como entrada leve.',                                         destaques:[],                                                    imagem:'assets/images/Porcao de Pititinga.jpg' },
    { id:13, nome:'Torta de Cocada',                       categoria:'Sobremesa', preco:18.90, descricao:'Sobremesa cremosa à base de coco, com textura macia e sabor marcante, equilibrando o doce da cocada com uma massa crocante.',                                             destaques:[{label:'Sugestão do Chef'}],                          imagem:'assets/images/Torta de Cocada.jpg' },
    { id:14, nome:'Pudim de Tapioca',                      categoria:'Sobremesa', preco:16.90, descricao:'Pudim delicado preparado com tapioca granulada e leite de coco, com textura firme e sabor suave. Servido com calda de caramelo.',                                         destaques:[],                                                    imagem:'assets/images/Pudim de Tapioca.jpg' },
    { id:15, nome:'Bolinho de Estudante',                  categoria:'Sobremesa', preco:14.90, descricao:'Bolinho frito de massa de tapioca com coco, finalizado com açúcar e canela, crocante por fora e macio por dentro. Porção com 4 unidades.',                                destaques:[],                                                    imagem:'assets/images/Bolinho de Estudante.jpg' },
    { id:16, nome:'Bala Baiana na Travessa',               categoria:'Sobremesa', preco:22.90, descricao:'Versão em travessa da tradicional bala baiana, com creme doce e cobertura caramelizada. Servida quente para compartilhar.',                                               destaques:[{label:'Prato da Casa'}],                             imagem:'assets/images/Bala baiana.jpg' },
    { id:17, nome:'Queijadinha',                           categoria:'Sobremesa', preco:12.90, descricao:'Doce assado à base de coco e queijo, com textura úmida e sabor equilibrado entre o salgado do queijo e o doce do coco.',                                                  destaques:[],                                                    imagem:'assets/images/Queijadinha.jpg' },
    { id:18, nome:'Doce de Leite Talhado',                 categoria:'Sobremesa', preco:15.90, descricao:'Sobremesa tradicional feita com leite talhado, açúcar e especiarias, com textura rústica e sabor profundo do interior nordestino.',                                       destaques:[],                                                    imagem:'assets/images/Doce de Leite.jpg' },
    { id:19, nome:'Pudim de Tapioca com Leite Condensado', categoria:'Sobremesa', preco:18.90, descricao:'Versão mais cremosa e intensa do pudim de tapioca, enriquecida com leite condensado para um sabor ainda mais marcante e aveludado.',                                      destaques:[{label:'Sugestão do Chef'}],                          imagem:'assets/images/Pudim.jpg' },
    { id:20, nome:'Água',                                  categoria:'Bebidas',   preco:5.00,  descricao:'Água mineral gelada para refrescar e acompanhar qualquer prato.',                                                                                                         destaques:[],                                                    imagem:'assets/images/Agua.jpg' },
    { id:21, nome:'Água com Gás',                          categoria:'Bebidas',   preco:6.00,  descricao:'Água mineral com gás, leve e refrescante.',                                                                                                                                destaques:[],                                                    imagem:'assets/images/Agua com gas.jpg' },
    { id:27, nome:'Refrigerante',                          categoria:'Bebidas',   preco:8.00,  descricao:'Bebidas gaseificadas em diferentes sabores, servidas bem geladas.',                                                                                                        destaques:[],                                                    imagem:'assets/images/refrigerante.jpg' },
    { id:28, nome:'Sucos Naturais',                        categoria:'Bebidas',   preco:12.00, descricao:'Sucos preparados com frutas frescas da estação, sem conservantes, trazendo sabor e frescor naturais.',                                                                    destaques:[],                                                    imagem:'assets/images/Sucos.jpg' },
    { id:22, nome:'Caipirinhas e Caipiroskas',             categoria:'Drinks',    preco:22.00, descricao:'Clássico brasileiro preparado com frutas frescas maceradas, açúcar e gelo. Versão com cachaça (caipirinha) ou vodka (caipiroska).',                                       destaques:[{label:'Prato da Casa'}],                             imagem:'assets/images/Caipirnha e Caipiroska.jpg' },
    { id:23, nome:'Cravinho',                              categoria:'Drinks',    preco:24.00, descricao:'Drink tradicional e marcante, preparado com cachaça, especiarias e toque adocicado. Clássico dos botecos baianos.',                                                       destaques:[{label:'Sugestão do Chef'}],                          imagem:'assets/images/Cravinho.jpg' },
    { id:24, nome:'Coice de Mula (Moscow Mule)',           categoria:'Drinks',    preco:26.00, descricao:'Drink refrescante à base de vodka, limão e espuma de gengibre, com sabor cítrico e levemente picante. Servido em copo de cobre.',                                         destaques:[],                                                    imagem:'assets/images/Moscow Mule.jpg' },
    { id:25, nome:'Drinks Tropicais',                      categoria:'Drinks',    preco:28.00, descricao:'Combinações especiais com frutas tropicais, destilados selecionados e apresentação caprichada. Consulte o cardápio do dia.',                                              destaques:[{label:'Sugestão do Chef'}],                          imagem:'assets/images/Drinks tropicais.jpg' },
    { id:26, nome:'Gin Tônica',                            categoria:'Drinks',    preco:30.00, descricao:'Clássico sofisticado preparado com gin, água tônica e especiarias ou frutas aromáticas. Refrescante e elegante.',                                                         destaques:[],                                                    imagem:'assets/images/Gin tonica.jpg' },
  ]);

  private nextId = computed(() => Math.max(...this.pratos().map(p => p.id)) + 1);

  // ── Helpers ────────────────────────────────────────────────────
  getPrimeiroNome(): string {
    const u = this.authService.getCurrentUser();
    return u?.nomeCompleto?.split(' ')[0] || u?.matricula || '';
  }

  formatPreco(v: number): string {
    return v.toLocaleString('pt-BR', { minimumFractionDigits: 2 });
  }

  getCategoriaClass(cat: Categoria): string {
    const m: Record<Categoria, string> = {
      'Principal':'cat--principal','Entrada':'cat--entrada',
      'Sobremesa':'cat--sobremesa','Bebidas':'cat--bebidas','Drinks':'cat--drinks'
    };
    return m[cat] ?? '';
  }

  getDestaqueClass(label: string): string {
    return label === 'Prato da Casa' ? 'dest--casa' : 'dest--chef';
  }

  // ── Modal ──────────────────────────────────────────────────────
  abrirModalNovo(): void {
    this.editingPrato.set(null);
    this.modalNome.set(''); this.modalCategoria.set(''); this.modalPreco.set('');
    this.modalDescricao.set(''); this.modalAcompanhamentos.set('');
    this.modalPratoDaCasa.set(false); this.modalSugestaoChef.set(false);
    this.modalDisponivel.set(true); this.modalImagemFile.set(null); this.modalImagemPreview.set('');
    this.showModal.set(true);
  }

  abrirModalEditar(prato: Prato): void {
    this.editingPrato.set(prato);
    this.modalNome.set(prato.nome); this.modalCategoria.set(prato.categoria);
    this.modalPreco.set(String(prato.preco)); this.modalDescricao.set(prato.descricao);
    this.modalAcompanhamentos.set('');
    this.modalPratoDaCasa.set(prato.destaques.some(d => d.label === 'Prato da Casa'));
    this.modalSugestaoChef.set(prato.destaques.some(d => d.label === 'Sugestão do Chef'));
    this.modalDisponivel.set(true); this.modalImagemFile.set(null);
    this.modalImagemPreview.set(prato.imagem ?? '');
    this.showModal.set(true);
  }

  fecharModal(): void { if (!this.isSaving()) this.showModal.set(false); }

  // ── Imagem ─────────────────────────────────────────────────────
  abrirSeletorImagem(): void { this.fileInputRef?.nativeElement.click(); }

  onImagemSelecionada(event: Event): void {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) return;
    this.modalImagemFile.set(file);
    const reader = new FileReader();
    reader.onload = e => this.modalImagemPreview.set(e.target?.result as string);
    reader.readAsDataURL(file);
  }

  // ── Salvar ─────────────────────────────────────────────────────
  salvar(): void {
    if (!this.modalNome().trim() || !this.modalCategoria()) return;
    this.isSaving.set(true);

    const destaques: Destaque[] = [];
    if (this.modalPratoDaCasa())  destaques.push({ label: 'Prato da Casa' });
    if (this.modalSugestaoChef()) destaques.push({ label: 'Sugestão do Chef' });

    const imagemFinal = this.modalImagemFile()
      ? this.modalImagemPreview()
      : (this.editingPrato()?.imagem ?? '');

    const editing = this.editingPrato();
    if (editing) {
      this.pratos.update(l => l.map(p => p.id === editing.id
        ? { ...p, nome: this.modalNome(), categoria: this.modalCategoria() as Categoria,
            preco: parseFloat(this.modalPreco().replace(',','.')),
            descricao: this.modalDescricao(), destaques, imagem: imagemFinal }
        : p
      ));
    } else {
      this.pratos.update(l => [...l, {
        id: this.nextId(),
        nome: this.modalNome(), categoria: this.modalCategoria() as Categoria,
        preco: parseFloat(this.modalPreco().replace(',','.')),
        descricao: this.modalDescricao(), destaques, imagem: imagemFinal
      }]);
    }

    this.isSaving.set(false);
    this.fecharModal();
  }

  confirmarExclusao(prato: Prato): void {
    this.pratoParaExcluir.set(prato);
    this.showModalExclusao.set(true);
  }

  cancelarExclusao(): void {
    this.showModalExclusao.set(false);
    this.pratoParaExcluir.set(null);
  }

  confirmarExclusaoFinal(): void {
    const prato = this.pratoParaExcluir();
    if (prato) {
      this.pratos.update(l => l.filter(p => p.id !== prato.id));
      // Se o modal de edição estiver aberto para este prato, fecha também
      if (this.editingPrato()?.id === prato.id) this.fecharModal();
    }
    this.cancelarExclusao();
  }

  excluir(id: number): void {
    this.pratos.update(l => l.filter(p => p.id !== id));
  }

  onInput(field: 'nome' | 'preco' | 'descricao' | 'acompanhamentos', event: Event): void {
    const val = (event.target as HTMLInputElement | HTMLTextAreaElement).value;
    if (field === 'nome')            this.modalNome.set(val);
    if (field === 'preco')           this.modalPreco.set(val);
    if (field === 'descricao')       this.modalDescricao.set(val);
    if (field === 'acompanhamentos') this.modalAcompanhamentos.set(val);
  }

  onSelectCategoria(event: Event): void {
    this.modalCategoria.set((event.target as HTMLSelectElement).value as Categoria);
  }
}
