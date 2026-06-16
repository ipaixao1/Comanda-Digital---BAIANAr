import { Component, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../services/auth.service';
import { AvaliacaoService, AvaliacaoShared } from '../../services/avaliacao.service';

// Avaliações demo (mockadas) — permanecem para o admin ver histórico existente
const AVALIACOES_DEMO = [
  { id:'demo1',  pedidoId:'', clienteId:'', clienteNome:'Maria Silva',      numeroPedido:'#2044', nota:5, comentario:'Melhor moqueca que já comi! O tempero está perfeito e os ingredientes são fresquíssimos. Voltarei com certeza!', pratoResumo:'Moqueca de peixe', dataHora:'2026-03-05T14:30:00.000Z', resposta:'Muito obrigado pelo feedback! Ficamos muito felizes que tenha apreciado nossa moqueca. Esperamos vê-la novamente em breve!', dataResposta:'2026-03-05T16:00:00.000Z' },
  { id:'demo2',  pedidoId:'', clienteId:'', clienteNome:'João Santos',      numeroPedido:'#2043', nota:4, comentario:'Muito saboroso, porém achei a porção um pouco pequena para o preço. Mas a qualidade é indiscutível!', pratoResumo:'Bobó de camarão', dataHora:'2026-03-04T19:20:00.000Z' },
  { id:'demo3',  pedidoId:'', clienteId:'', clienteNome:'Ana Paula',        numeroPedido:'#2042', nota:5, comentario:'Simplesmente maravilhoso! A carne estava no ponto perfeito e o purê de mandioca é divino. Recomendo muito!', pratoResumo:'Carne do sol com purê de mandioca', dataHora:'2026-03-04T13:15:00.000Z', resposta:'Que alegria ler seu comentário! Nosso chef ficará muito feliz com seu elogio. Volte sempre!', dataResposta:'2026-03-04T14:00:00.000Z' },
  { id:'demo4',  pedidoId:'', clienteId:'', clienteNome:'Carlos Eduardo',   numeroPedido:'#2041', nota:5, comentario:'Autêntico sabor baiano! Me lembrou a comida da minha avó. Ambiente acolhedor e atendimento excelente.', pratoResumo:'Baião de dois', dataHora:'2026-03-03T12:45:00.000Z' },
  { id:'demo5',  pedidoId:'', clienteId:'', clienteNome:'Roberto Alves',    numeroPedido:'#2040', nota:5, comentario:'Que camarão maravilhoso! O molho à baiana está perfeito, equilibrado e saboroso. Impecável!', pratoResumo:'Camarão à baiana', dataHora:'2026-03-02T18:30:00.000Z', resposta:'Gratidão pelo carinho! Nosso molho é feito com muito amor e ingredientes selecionados. Seja sempre bem-vindo!', dataResposta:'2026-03-02T20:00:00.000Z' },
  { id:'demo6',  pedidoId:'', clienteId:'', clienteNome:'Beatriz Souza',    numeroPedido:'#2039', nota:5, comentario:'Que sobremesa deliciosa! A torta de cocada derrete na boca. Doce na medida certa!', pratoResumo:'Torta de cocada', dataHora:'2026-02-28T21:00:00.000Z', resposta:'Muito obrigado! Nossa confeiteira fica radiante com elogios como o seu. Volte para experimentar outras sobremesas!', dataResposta:'2026-03-01T09:00:00.000Z' },
  { id:'demo7',  pedidoId:'', clienteId:'', clienteNome:'Paulo Ricardo',    numeroPedido:'#2038', nota:3, comentario:'Estava bom, mas esperava algo mais próximo do acarajé tradicional. O recheio poderia ser mais generoso.', pratoResumo:'Mini acarajé', dataHora:'2026-02-28T14:20:00.000Z' },
] as AvaliacaoShared[];

@Component({
  selector: 'app-avaliacoes',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './avaliacoes.component.html',
  styleUrls: ['./avaliacoes.component.scss'],
})
export class AvaliacoesComponent {

  private authService     = inject(AuthService);
  private avaliacaoService = inject(AvaliacaoService);

  // Combina avaliações reais (Firestore) com as demos mockadas
  todasAvaliacoes = computed<AvaliacaoShared[]>(() => {
    const reais = this.avaliacaoService.avaliacoes();
    return [...reais, ...AVALIACOES_DEMO];
  });

  totalAvaliacoes = computed(() => this.todasAvaliacoes().length);

  mediaGeral = computed(() => {
    const l = this.todasAvaliacoes();
    if (!l.length) return '0.0';
    return (l.reduce((s, a) => s + a.nota, 0) / l.length).toFixed(1);
  });

  // Estado de resposta por avaliação (apenas na sessão atual, para demos)
  respondendoId = signal<string | null>(null);
  textoResposta = signal('');
  enviandoId    = signal<string | null>(null);

  getPrimeiroNome(): string {
    const u = this.authService.getCurrentUser();
    return u?.nomeCompleto?.split(' ')[0] || u?.matricula || '';
  }

  getStars(nota: number): boolean[] {
    return Array.from({ length: 5 }, (_, i) => i < nota);
  }

  formatarData(iso: string): string {
    return this.avaliacaoService.formatarData(iso);
  }

  abrirResposta(id: string): void {
    this.respondendoId.set(id);
    this.textoResposta.set('');
  }

  cancelarResposta(): void {
    this.respondendoId.set(null);
    this.textoResposta.set('');
  }

  async enviarResposta(av: AvaliacaoShared): Promise<void> {
    const texto = this.textoResposta().trim();
    if (!texto) return;
    if (this.enviandoId()) return;

    this.enviandoId.set(av.id);
    try {
      if (av.pedidoId) {
        // Avaliação real — persiste no Firestore
        await this.avaliacaoService.responder(av.id, texto);
      } else {
        // Avaliação demo — atualiza apenas localmente no array demo
        const demo = AVALIACOES_DEMO.find(d => d.id === av.id);
        if (demo) {
          demo.resposta = texto;
          demo.dataResposta = new Date().toISOString();
        }
      }
      this.respondendoId.set(null);
      this.textoResposta.set('');
    } catch (err) {
      console.error('[Avaliacoes] erro ao responder:', err);
      alert('Erro ao enviar resposta. Tente novamente.');
    } finally {
      this.enviandoId.set(null);
    }
  }

  isRespondendo(id: string): boolean { return this.respondendoId() === id; }
  isEnviando(id: string):    boolean { return this.enviandoId()    === id; }
}
