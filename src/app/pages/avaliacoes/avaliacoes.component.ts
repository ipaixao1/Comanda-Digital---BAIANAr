import { Component, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../services/auth.service';

export interface Avaliacao {
  id: number;
  cliente: string;
  prato: string;
  nota: number;
  data: string;
  comentario: string;
  resposta?: string;
  respondendoAgora?: boolean;
  textoResposta?: string;
}

@Component({
  selector: 'app-avaliacoes',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './avaliacoes.component.html',
  styleUrls: ['./avaliacoes.component.scss']
})
export class AvaliacoesComponent {
  private authService = inject(AuthService);

  avaliacoes = signal<Avaliacao[]>([
    { id:1,  cliente:'Daniel Oliveira',  prato:'Arroz de polvo',               nota:5, data:'04/06/2026, 18:08', comentario:'Recomendo muito este prato!' },
    { id:2,  cliente:'Maria Silva',      prato:'Moqueca de peixe',              nota:5, data:'05/03/2026, 14:30', comentario:'Melhor moqueca que já comi! O tempero está perfeito e os ingredientes são fresquíssimos. Voltarei com certeza!', resposta:'Muito obrigado pelo feedback! Ficamos muito felizes que tenha apreciado nossa moqueca. Esperamos vê-la novamente em breve!' },
    { id:3,  cliente:'João Santos',      prato:'Bobó de camarão',               nota:4, data:'04/03/2026, 19:20', comentario:'Muito saboroso, porém achei a porção um pouco pequena para o preço. Mas a qualidade é indiscutível!' },
    { id:4,  cliente:'Ana Paula',        prato:'Carne do sol com purê de mandioca', nota:5, data:'04/03/2026, 13:15', comentario:'Simplesmente maravilhoso! A carne estava no ponto perfeito e o purê de mandioca é divino. Recomendo muito!', resposta:'Que alegria ler seu comentário! Nosso chef ficará muito feliz com seu elogio. Volte sempre!' },
    { id:5,  cliente:'Carlos Eduardo',   prato:'Baião de dois',                 nota:5, data:'03/03/2026, 12:45', comentario:'Autêntico sabor baiano! Me lembrou a comida da minha avó. Ambiente acolhedor e atendimento excelente.' },
    { id:6,  cliente:'Fernanda Lima',    prato:'Arroz de polvo',                nota:4, data:'02/03/2026, 20:10', comentario:'Delicioso! O arroz estava bem temperado e o polvo macio. Apenas achei que poderia vir mais polvo.' },
    { id:7,  cliente:'Roberto Alves',    prato:'Camarão à baiana',              nota:5, data:'02/03/2026, 18:30', comentario:'Que camarão maravilhoso! O molho à baiana está perfeito, equilibrado e saboroso. Impecável!', resposta:'Gratidão pelo carinho! Nosso molho é feito com muito amor e ingredientes selecionados. Seja sempre bem-vindo!' },
    { id:8,  cliente:'Juliana Costa',    prato:'Casquinha de siri',             nota:5, data:'01/03/2026, 19:50', comentario:'A casquinha de siri é sensacional! Crocante por fora e cremosa por dentro. Perfeita como entrada!' },
    { id:9,  cliente:'Paulo Ricardo',    prato:'Mini acarajé',                  nota:3, data:'01/03/2026, 14:20', comentario:'Estava bom, mas esperava algo mais próximo do acarajé tradicional. O recheio poderia ser mais generoso.' },
    { id:10, cliente:'Beatriz Souza',    prato:'Torta de cocada',               nota:5, data:'28/02/2026, 21:00', comentario:'Que sobremesa deliciosa! A torta de cocada derrete na boca. Doce na medida certa!', resposta:'Muito obrigado! Nossa confeiteira fica radiante com elogios como o seu. Volte para experimentar outras sobremesas!' },
    { id:11, cliente:'Ricardo Mendes',   prato:'Pudim de tapioca',              nota:5, data:'28/02/2026, 15:40', comentario:'Pudim de tapioca maravilhoso! Textura única e sabor incrível. Já virou minha sobremesa favorita!' },
  ]);

  totalAvaliacoes = computed(() => this.avaliacoes().length);
  mediaGeral = computed(() => {
    const l = this.avaliacoes();
    return (l.reduce((s, a) => s + a.nota, 0) / l.length).toFixed(1);
  });

  getPrimeiroNome(): string {
    const u = this.authService.getCurrentUser();
    return u?.nomeCompleto?.split(' ')[0] || u?.matricula || '';
  }

  getStars(nota: number): boolean[] {
    return Array.from({ length: 5 }, (_, i) => i < nota);
  }

  abrirResposta(id: number): void {
    this.avaliacoes.update(l => l.map(a =>
      a.id === id
        ? { ...a, respondendoAgora: true, textoResposta: a.textoResposta ?? '' }
        : { ...a, respondendoAgora: false }
    ));
  }

  cancelarResposta(id: number): void {
    this.avaliacoes.update(l => l.map(a =>
      a.id === id ? { ...a, respondendoAgora: false } : a
    ));
  }

  onTextoResposta(id: number, e: Event): void {
    const v = (e.target as HTMLTextAreaElement).value;
    this.avaliacoes.update(l => l.map(a =>
      a.id === id ? { ...a, textoResposta: v } : a
    ));
  }

  enviarResposta(id: number): void {
    this.avaliacoes.update(l => l.map(a => {
      if (a.id !== id) return a;
      const texto = (a.textoResposta ?? '').trim();
      if (!texto) return a;
      return { ...a, resposta: texto, respondendoAgora: false, textoResposta: '' };
    }));
  }
}
