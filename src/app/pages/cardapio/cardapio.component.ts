import { Component, signal, computed, inject, ElementRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../services/auth.service';
import { CardapioStatusService } from '../../services/cardapio-status.service';
import { AdminDataService, Prato, Categoria, Destaque } from '../../services/admin-data.service';

@Component({
  selector: 'app-cardapio', standalone: true, imports: [CommonModule],
  templateUrl: './cardapio.component.html', styleUrls: ['./cardapio.component.scss']
})
export class CardapioComponent {
  @ViewChild('fileInput') fileInputRef!: ElementRef<HTMLInputElement>;

  private authService       = inject(AuthService);
  private cardapioStatusSvc = inject(CardapioStatusService);
  private adminData         = inject(AdminDataService);

  // Dados vivos do Firestore
  pratos = this.adminData.pratos;

  // Modal
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

  // ── Disponibilidade (CardapioStatusService) ───────────────────
  isPratoIndisponivel(prato: Prato): boolean {
    return this.cardapioStatusSvc.isIndisponivel(`admin_${prato.id}`);
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
    const m: Record<Categoria, string> = {
      'Principal':'cat--principal','Entrada':'cat--entrada',
      'Sobremesa':'cat--sobremesa','Bebidas':'cat--bebidas','Drinks':'cat--drinks'
    };
    return m[cat] ?? '';
  }

  getDestaqueClass(label: string): string {
    return label === 'Prato da Casa' ? 'dest--casa' : 'dest--chef';
  }

  // ── Modal ─────────────────────────────────────────────────────
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
    this.modalDisponivel.set(!this.cardapioStatusSvc.isIndisponivel(`admin_${prato.id}`));
    this.modalImagemFile.set(null);
    this.modalImagemPreview.set(prato.imagem ?? '');
    this.showModal.set(true);
  }

  fecharModal(): void { if (!this.isSaving()) this.showModal.set(false); }

  abrirSeletorImagem(): void { this.fileInputRef?.nativeElement.click(); }

  onImagemSelecionada(event: Event): void {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) return;
    this.modalImagemFile.set(file);
    const reader = new FileReader();
    reader.onload = e => this.modalImagemPreview.set(e.target?.result as string);
    reader.readAsDataURL(file);
  }

  async salvar(): Promise<void> {
    if (!this.modalNome().trim() || !this.modalCategoria()) return;
    this.isSaving.set(true);
    try {
      const destaques: Destaque[] = [];
      if (this.modalPratoDaCasa())  destaques.push({ label: 'Prato da Casa' });
      if (this.modalSugestaoChef()) destaques.push({ label: 'Sugestão do Chef' });

      const imagemFinal = this.modalImagemFile()
        ? this.modalImagemPreview()
        : (this.editingPrato()?.imagem ?? '');

      const nomePrato = this.modalNome();
      const dados = {
        nome: nomePrato,
        categoria: this.modalCategoria() as Categoria,
        preco: parseFloat(this.modalPreco().replace(',', '.')),
        descricao: this.modalDescricao(),
        destaques,
        imagem: imagemFinal,
      };

      const editing = this.editingPrato();
      let pratoNumId: number;

      if (editing?.firestoreId) {
        await this.adminData.atualizarPrato(editing.firestoreId, dados);
        pratoNumId = editing.id;
      } else {
        await this.adminData.adicionarPrato(dados);
        pratoNumId = Math.max(...this.pratos().map(p => p.id), 0) + 1;
      }

      // Persiste disponibilidade
      const indisponivel = !this.modalDisponivel();
      await this.cardapioStatusSvc.setDisponibilidadeAdmin(`admin_${pratoNumId}`, nomePrato, indisponivel);

      this.fecharModal();
    } catch (err) {
      console.error('[Cardapio] salvar erro:', err);
    } finally {
      this.isSaving.set(false);
    }
  }

  confirmarExclusao(prato: Prato): void {
    this.pratoParaExcluir.set(prato);
    this.showModalExclusao.set(true);
  }

  cancelarExclusao(): void {
    this.showModalExclusao.set(false);
    this.pratoParaExcluir.set(null);
  }

  async confirmarExclusaoFinal(): Promise<void> {
    const prato = this.pratoParaExcluir();
    if (prato?.firestoreId) {
      await this.adminData.excluirPrato(prato.firestoreId).catch(console.error);
    }
    this.cancelarExclusao();
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
