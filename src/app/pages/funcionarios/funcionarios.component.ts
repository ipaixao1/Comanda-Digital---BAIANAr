import { Component, signal, inject, ElementRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../services/auth.service';

export type StatusFuncionario = 'Ativo' | 'Afastado' | 'De férias' | 'Inativo';

export interface HistoricoBH {
  data: string; descricao: string; horas: string; positivo: boolean;
}
export interface HistoricoFerias {
  inicio: string; fim: string; dias: number;
}
export interface Funcionario {
  id: number; foto: string; nomeCompleto: string; cpf: string; carteira: string;
  funcao: string; horario: string; salario: string; ferias: boolean; atestado: boolean;
  bancoHoras: string; bancoHorasPositivo: boolean; status: StatusFuncionario;
  telefone: string; email: string; endereco: string; dataAdmissao: string;
  observacoes: string; historicoBH: HistoricoBH[]; historicoFerias: HistoricoFerias[];
}

@Component({
  selector: 'app-funcionarios', standalone: true, imports: [CommonModule],
  templateUrl: './funcionarios.component.html', styleUrls: ['./funcionarios.component.scss']
})
export class FuncionariosComponent {
  @ViewChild('fileInput') fileInputRef!: ElementRef<HTMLInputElement>;
  private authService = inject(AuthService);

  funcionarioAberto = signal<number | null>(null);
  showModal  = signal(false);
  editando   = signal<Funcionario | null>(null);
  isSaving   = signal(false);
  showModalExclusao   = signal(false);
  funcParaExcluir     = signal<Funcionario | null>(null);

  // Signals do modal
  mNome      = signal('');
  mCpf       = signal('');
  mCarteira  = signal('');
  mFuncao    = signal('');
  mHorario   = signal('');
  mSalario   = signal('');
  mTelefone  = signal('');
  mEmail     = signal('');
  mEndereco  = signal('');
  mAdmissao  = signal('');
  mObs       = signal('');
  mStatus    = signal<StatusFuncionario>('Ativo');
  mFoto      = signal('');
  mSenha     = signal('');
  mFerias    = signal(false);
  mAtestado  = signal(false);

  statusOpcoes: StatusFuncionario[] = ['Ativo', 'Afastado', 'De férias', 'Inativo'];

  // Converte DD/MM/AAAA → YYYY-MM-DD para input[type=date]
  mAdmissaoISO(): string {
    const v = this.mAdmissao();
    if (!v) return '';
    const parts = v.split('/');
    if (parts.length === 3) {
      return parts[2] + '-' + parts[1] + '-' + parts[0];
    }
    return v;
  }

  funcionarios = signal<Funcionario[]>([
    { id:1, foto:'', nomeCompleto:'Carlos Eduardo Santos', cpf:'123.456.789-00', carteira:'CT 12345-67', funcao:'Chef de Cozinha', horario:'10:00 - 18:00', salario:'R$ 8500,00', ferias:false, atestado:false, bancoHoras:'+12h', bancoHorasPositivo:true, status:'Ativo', telefone:'(71) 99876-5432', email:'carlos.santos@baianar.com.br', endereco:'Rua das Palmeiras, 123 - Salvador/BA', dataAdmissao:'15/01/2020', observacoes:'Funcionário exemplar, especializado em culinária baiana', historicoBH:[{data:'01/03/2026',descricao:'Crédito - Hora extra',horas:'+4h',positivo:true},{data:'25/02/2026',descricao:'Crédito - Hora extra',horas:'+3h',positivo:true},{data:'20/02/2026',descricao:'Crédito - Hora extra',horas:'+5h',positivo:true}], historicoFerias:[{inicio:'01/12/2025',fim:'30/12/2025',dias:30},{inicio:'01/07/2024',fim:'30/07/2024',dias:30}] },
    { id:2, foto:'', nomeCompleto:'João Pedro Lima',      cpf:'234.567.890-11', carteira:'CT 23456-78', funcao:'Garçom',          horario:'14:00 - 22:00', salario:'R$ 2800,00', ferias:false, atestado:false, bancoHoras:'-3h',  bancoHorasPositivo:false, status:'Ativo', telefone:'(71) 98765-4321', email:'joao.lima@baianar.com.br',     endereco:'Av. Sete de Setembro, 456 - Salvador/BA',    dataAdmissao:'03/06/2021', observacoes:'Ótimo atendimento ao cliente, pontual',                         historicoBH:[{data:'28/02/2026',descricao:'Débito - Saída antecipada',horas:'-2h',positivo:false},{data:'15/02/2026',descricao:'Débito - Falta parcial',horas:'-1h',positivo:false}], historicoFerias:[{inicio:'01/02/2025',fim:'28/02/2025',dias:28}] },
    { id:3, foto:'', nomeCompleto:'Mariana Costa Oliveira', cpf:'345.678.901-22', carteira:'CT 34567-89', funcao:'Gerente',        horario:'09:00 - 17:00', salario:'R$ 6500,00', ferias:false, atestado:false, bancoHoras:'+8h',  bancoHorasPositivo:true,  status:'Ativo', telefone:'(71) 97654-3210', email:'mariana.oliveira@baianar.com.br', endereco:'Rua do Comércio, 789 - Salvador/BA',          dataAdmissao:'10/03/2019', observacoes:'Liderança exemplar, coordena equipe com excelência',             historicoBH:[{data:'02/03/2026',descricao:'Crédito - Hora extra',horas:'+4h',positivo:true},{data:'22/02/2026',descricao:'Crédito - Reunião extra',horas:'+4h',positivo:true}], historicoFerias:[{inicio:'01/11/2025',fim:'30/11/2025',dias:30},{inicio:'01/05/2024',fim:'30/05/2024',dias:30}] },
    { id:4, foto:'', nomeCompleto:'Rafael Souza Almeida', cpf:'456.789.012-33', carteira:'CT 45678-90', funcao:'Auxiliar de Cozinha', horario:'08:00 - 16:00', salario:'R$ 2200,00', ferias:false, atestado:true, bancoHoras:'0h', bancoHorasPositivo:true, status:'Afastado', telefone:'(71) 96543-2109', email:'rafael.almeida@baianar.com.br', endereco:'Travessa das Flores, 321 - Lauro de Freitas/BA', dataAdmissao:'20/08/2022', observacoes:'Afastado por atestado médico desde 01/03/2026', historicoBH:[], historicoFerias:[{inicio:'01/08/2025',fim:'30/08/2025',dias:30}] },
    { id:5, foto:'', nomeCompleto:'Juliana Ferreira Rocha', cpf:'567.890.123-44', carteira:'CT 56789-01', funcao:'Caixa',           horario:'12:00 - 20:00', salario:'R$ 2600,00', ferias:false, atestado:false, bancoHoras:'+6h', bancoHorasPositivo:true, status:'Ativo', telefone:'(71) 95432-1098', email:'juliana.rocha@baianar.com.br', endereco:'Rua Nova, 654 - Camaçari/BA', dataAdmissao:'05/01/2023', observacoes:'Precisa e organizada no controle do caixa', historicoBH:[{data:'03/03/2026',descricao:'Crédito - Hora extra',horas:'+3h',positivo:true},{data:'18/02/2026',descricao:'Crédito - Hora extra',horas:'+3h',positivo:true}], historicoFerias:[] },
    { id:6, foto:'', nomeCompleto:'Amanda Silva Pereira',  cpf:'678.901.234-55', carteira:'CT 67890-12', funcao:'Garçonete',        horario:'18:00 - 02:00', salario:'R$ 2700,00', ferias:true,  atestado:false, bancoHoras:'0h', bancoHorasPositivo:true, status:'De férias', telefone:'(71) 94321-0987', email:'amanda.pereira@baianar.com.br', endereco:'Alameda dos Ipês, 987 - Salvador/BA', dataAdmissao:'14/04/2021', observacoes:'Em período de férias até 20/06/2026', historicoBH:[{data:'10/02/2026',descricao:'Crédito - Hora extra',horas:'+2h',positivo:true}], historicoFerias:[{inicio:'21/05/2026',fim:'20/06/2026',dias:30},{inicio:'01/04/2025',fim:'30/04/2025',dias:30}] },
    { id:7, foto:'', nomeCompleto:'Felipe Rodrigues Neto', cpf:'789.012.345-66', carteira:'CT 78901-23', funcao:'Motoboy',          horario:'11:00 - 19:00', salario:'R$ 2400,00', ferias:false, atestado:false, bancoHoras:'+2h', bancoHorasPositivo:true, status:'Ativo', telefone:'(71) 93210-9876', email:'felipe.neto@baianar.com.br', endereco:'Rua das Acácias, 112 - Salvador/BA', dataAdmissao:'10/09/2023', observacoes:'Entregador ágil, conhece bem as rotas de Salvador', historicoBH:[{data:'01/03/2026',descricao:'Crédito - Hora extra',horas:'+2h',positivo:true}], historicoFerias:[] },
    { id:8, foto:'', nomeCompleto:'Bruno Mendes Carvalho', cpf:'890.123.456-77', carteira:'CT 89012-34', funcao:'Motoboy',          horario:'17:00 - 01:00', salario:'R$ 2400,00', ferias:false, atestado:false, bancoHoras:'+5h', bancoHorasPositivo:true, status:'Ativo', telefone:'(71) 92109-8765', email:'bruno.carvalho@baianar.com.br', endereco:'Rua da Paz, 234 - Simões Filho/BA', dataAdmissao:'22/02/2024', observacoes:'Cobre turno noturno, ótima avaliação pelos clientes', historicoBH:[{data:'27/02/2026',descricao:'Crédito - Hora extra',horas:'+3h',positivo:true},{data:'14/02/2026',descricao:'Crédito - Hora extra',horas:'+2h',positivo:true}], historicoFerias:[] },
    { id:9, foto:'', nomeCompleto:'Diego Teixeira Santos', cpf:'901.234.567-88', carteira:'CT 90123-45', funcao:'Motoboy',          horario:'14:00 - 22:00', salario:'R$ 2400,00', ferias:false, atestado:true,  bancoHoras:'0h', bancoHorasPositivo:true, status:'Afastado', telefone:'(71) 91098-7654', email:'diego.santos@baianar.com.br', endereco:'Av. Brasil, 567 - Feira de Santana/BA', dataAdmissao:'05/07/2024', observacoes:'Afastado por acidente de trânsito, retorno previsto para 15/06/2026', historicoBH:[], historicoFerias:[] },
  ]);

  // ── Helpers ───────────────────────────────────────────────────
  getPrimeiroNome(): string {
    const u = this.authService.getCurrentUser();
    return u?.nomeCompleto?.split(' ')[0] || u?.matricula || '';
  }

  getStatusClass(s: StatusFuncionario): string {
    const m: Record<StatusFuncionario, string> = {
      'Ativo':'badge--ativo','Afastado':'badge--afastado',
      'De férias':'badge--ferias','Inativo':'badge--inativo'
    };
    return m[s] ?? '';
  }

  getBoolClass(v: boolean): string { return v ? 'badge--sim' : 'badge--nao'; }

  getInitials(nome: string): string {
    return nome.split(' ').slice(0, 2).map(n => n[0]).join('').toUpperCase();
  }

  toggleFuncionario(id: number): void {
    this.funcionarioAberto.set(this.funcionarioAberto() === id ? null : id);
  }

  // ── Modal ─────────────────────────────────────────────────────
  abrirModalNovo(): void {
    this.editando.set(null);
    this.mNome.set(''); this.mCpf.set(''); this.mCarteira.set('');
    this.mFuncao.set(''); this.mHorario.set(''); this.mSalario.set('');
    this.mTelefone.set(''); this.mEmail.set(''); this.mEndereco.set('');
    this.mAdmissao.set(''); this.mObs.set(''); this.mStatus.set('Ativo');
    this.mFoto.set(''); this.mSenha.set('');
    this.mFerias.set(false); this.mAtestado.set(false);
    this.showModal.set(true);
  }

  abrirModalEditar(f: Funcionario, e: Event): void {
    e.stopPropagation();
    this.editando.set(f);
    this.mNome.set(f.nomeCompleto); this.mCpf.set(f.cpf); this.mCarteira.set(f.carteira);
    this.mFuncao.set(f.funcao); this.mHorario.set(f.horario); this.mSalario.set(f.salario);
    this.mTelefone.set(f.telefone); this.mEmail.set(f.email); this.mEndereco.set(f.endereco);
    this.mAdmissao.set(f.dataAdmissao); this.mObs.set(f.observacoes);
    this.mStatus.set(f.status); this.mFoto.set(f.foto ?? '');
    this.mSenha.set(''); this.mFerias.set(f.ferias); this.mAtestado.set(f.atestado);
    this.showModal.set(true);
  }

  fecharModal(): void { if (!this.isSaving()) this.showModal.set(false); }

  abrirFoto(): void { this.fileInputRef?.nativeElement.click(); }

  onFotoSelecionada(e: Event): void {
    const file = (e.target as HTMLInputElement).files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => this.mFoto.set(ev.target?.result as string);
    reader.readAsDataURL(file);
  }

  salvar(): void {
    if (!this.mNome().trim()) return;
    this.isSaving.set(true);
    const dados: Partial<Funcionario> = {
      nomeCompleto: this.mNome(), cpf: this.mCpf(), carteira: this.mCarteira(),
      funcao: this.mFuncao(), horario: this.mHorario(), salario: this.mSalario(),
      telefone: this.mTelefone(), email: this.mEmail(), endereco: this.mEndereco(),
      dataAdmissao: this.mAdmissao(), observacoes: this.mObs(),
      status: this.mStatus(), foto: this.mFoto(),
      ferias: this.mFerias(), atestado: this.mAtestado(),
    };
    const ed = this.editando();
    if (ed) {
      this.funcionarios.update(l => l.map(f => f.id === ed.id ? { ...f, ...dados } : f));
    } else {
      this.funcionarios.update(l => [...l, {
        id: Date.now(), bancoHoras: '0h', bancoHorasPositivo: true,
        historicoBH: [], historicoFerias: [], ...dados
      } as Funcionario]);
    }
    this.isSaving.set(false);
    this.fecharModal();
  }

  confirmarExclusao(f: Funcionario, e: Event): void {
    e.stopPropagation();
    this.funcParaExcluir.set(f);
    this.showModalExclusao.set(true);
  }

  cancelarExclusao(): void {
    this.showModalExclusao.set(false);
    this.funcParaExcluir.set(null);
  }

  confirmarExclusaoFinal(): void {
    const f = this.funcParaExcluir();
    if (f) {
      this.funcionarios.update(l => l.filter(x => x.id !== f.id));
      if (this.funcionarioAberto() === f.id) this.funcionarioAberto.set(null);
    }
    this.cancelarExclusao();
  }

  excluir(id: number, e: Event): void {
    e.stopPropagation();
    this.funcionarios.update(l => l.filter(f => f.id !== id));
  }

  onInput(field: string, e: Event): void {
    const v = (e.target as HTMLInputElement | HTMLTextAreaElement).value;
    const m: Record<string, (v: string) => void> = {
      nome:      v => this.mNome.set(v),
      cpf:       v => this.mCpf.set(v),
      carteira:  v => this.mCarteira.set(v),
      funcao:    v => this.mFuncao.set(v),
      horario:   v => this.mHorario.set(v),
      salario:   v => this.mSalario.set(v),
      telefone:  v => this.mTelefone.set(v),
      email:     v => this.mEmail.set(v),
      endereco:  v => this.mEndereco.set(v),
      obs:       v => this.mObs.set(v),
      senha:     v => this.mSenha.set(v),
      foto:      v => this.mFoto.set(v),
      admissao:  v => {
        // input[type=date] retorna YYYY-MM-DD → converte para DD/MM/AAAA
        if (v.length === 10 && v.includes('-')) {
          const [y, mo, d] = v.split('-');
          this.mAdmissao.set(d + '/' + mo + '/' + y);
        } else {
          this.mAdmissao.set(v);
        }
      },
    };
    m[field]?.(v);
  }

  onSelectStatus(e: Event): void {
    this.mStatus.set((e.target as HTMLSelectElement).value as StatusFuncionario);
  }
}
