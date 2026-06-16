import { Component, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../services/auth.service';
import { MotoboyDataService, MotoboyCadastro, StatusMotoboy } from '../../services/motoboy-data.service';
import { PedidoService, PedidoShared } from '../../services/pedido.service';

@Component({
  selector: 'app-motoboys-admin',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './motoboys-admin.component.html',
  styleUrls: ['./motoboys-admin.component.scss'],
})
export class MotoboysAdminComponent {

  private authService = inject(AuthService);
  private motoboySvc  = inject(MotoboyDataService);
  private pedidoSvc   = inject(PedidoService);

  motoboys = this.motoboySvc.motoboys;

  showModal         = signal(false);
  editando          = signal<MotoboyCadastro | null>(null);
  isSaving          = signal(false);
  showModalExclusao = signal(false);
  motoboyParaExcluir = signal<MotoboyCadastro | null>(null);
  detalheAberto     = signal<number | null>(null);

  mNome      = signal('');
  mMatricula = signal('');
  mSenha     = signal('');
  mVeiculo   = signal('');
  mTelefone  = signal('');
  mStatus    = signal<StatusMotoboy>('Disponível');

  statusOpcoes: StatusMotoboy[] = ['Disponível', 'Em entrega', 'Offline'];

  // ── KPIs gerais ───────────────────────────────────────────────
  totalMotoboys      = computed(() => this.motoboys().length);
  totalEntregasGeral = this.motoboySvc.totalEntregasGeral;
  motoboysEmRota     = this.motoboySvc.motoboysEmRota;

  getPrimeiroNome(): string {
    const u = this.authService.getCurrentUser();
    return u?.nomeCompleto?.split(' ')[0] || u?.matricula || '';
  }

  getInitials(nome: string): string {
    return nome.split(' ').slice(0, 2).map(n => n[0]).join('').toUpperCase();
  }

  // Status calculado em tempo real (considera pedidos a_caminho)
  statusAtual(m: MotoboyCadastro): StatusMotoboy {
    return this.motoboySvc.statusCalculado(m);
  }

  getStatusClass(s: StatusMotoboy): string {
    const map: Record<StatusMotoboy, string> = {
      'Disponível': 'badge--disponivel',
      'Em entrega': 'badge--entrega',
      'Offline':    'badge--offline',
    };
    return map[s];
  }

  totalEntregas(m: MotoboyCadastro): number {
    return this.motoboySvc.totalEntregasPorNome(m.nome);
  }

  entregaAtual(m: MotoboyCadastro): PedidoShared | undefined {
    return this.motoboySvc.entregaAtualPorNome(m.nome);
  }

  // Histórico de entregas concluídas, mais recentes primeiro
  historicoEntregas(m: MotoboyCadastro): PedidoShared[] {
    return this.pedidoSvc.pedidos()
      .filter(p => p.motoboyNome === m.nome && p.status === 'entregue')
      .sort((a, b) => new Date(b.dataHora).getTime() - new Date(a.dataHora).getTime())
      .slice(0, 10);
  }

  formatarData(iso: string): string {
    if (!iso) return '';
    const d = new Date(iso);
    return d.toLocaleDateString('pt-BR') + ' ' + d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  }

  formatarPreco(v: number): string {
    return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  }

  toggleDetalhe(id: number): void {
    this.detalheAberto.set(this.detalheAberto() === id ? null : id);
  }

  // ── Modal CRUD ────────────────────────────────────────────────
  abrirModalNovo(): void {
    this.editando.set(null);
    this.mNome.set(''); this.mMatricula.set(''); this.mSenha.set('');
    this.mVeiculo.set(''); this.mTelefone.set(''); this.mStatus.set('Disponível');
    this.showModal.set(true);
  }

  abrirModalEditar(m: MotoboyCadastro, e?: Event): void {
    e?.stopPropagation();
    this.editando.set(m);
    this.mNome.set(m.nome); this.mMatricula.set(m.matricula); this.mSenha.set(m.senha);
    this.mVeiculo.set(m.veiculo); this.mTelefone.set(m.telefone); this.mStatus.set(m.status);
    this.showModal.set(true);
  }

  fecharModal(): void { if (!this.isSaving()) this.showModal.set(false); }

  async salvar(): Promise<void> {
    if (!this.mNome().trim() || !this.mMatricula().trim()) return;
    this.isSaving.set(true);
    try {
      const dados = {
        nome: this.mNome(), matricula: this.mMatricula().toUpperCase(),
        senha: this.mSenha(), veiculo: this.mVeiculo(),
        telefone: this.mTelefone(), status: this.mStatus(),
        dataAdmissao: this.editando()?.dataAdmissao ?? new Date().toLocaleDateString('pt-BR'),
      };
      const ed = this.editando();
      if (ed?.firestoreId) {
        await this.motoboySvc.atualizar(ed.firestoreId, dados);
      } else {
        await this.motoboySvc.adicionar(dados);
      }
      this.fecharModal();
    } catch (err) {
      console.error('[MotoboysAdmin] salvar erro:', err);
    } finally {
      this.isSaving.set(false);
    }
  }

  confirmarExclusao(m: MotoboyCadastro, e?: Event): void {
    e?.stopPropagation();
    this.motoboyParaExcluir.set(m);
    this.showModalExclusao.set(true);
  }

  cancelarExclusao(): void {
    this.showModalExclusao.set(false);
    this.motoboyParaExcluir.set(null);
  }

  async confirmarExclusaoFinal(): Promise<void> {
    const m = this.motoboyParaExcluir();
    if (m?.firestoreId) {
      await this.motoboySvc.excluir(m.firestoreId).catch(console.error);
    }
    this.cancelarExclusao();
  }

  onInput(field: string, e: Event): void {
    const v = (e.target as HTMLInputElement).value;
    if (field === 'nome')      this.mNome.set(v);
    if (field === 'matricula') this.mMatricula.set(v);
    if (field === 'senha')     this.mSenha.set(v);
    if (field === 'veiculo')   this.mVeiculo.set(v);
    if (field === 'telefone')  this.mTelefone.set(v);
  }

  onSelectStatus(e: Event): void {
    this.mStatus.set((e.target as HTMLSelectElement).value as StatusMotoboy);
  }
}
