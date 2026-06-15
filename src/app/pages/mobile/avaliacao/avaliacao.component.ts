import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';

export interface AvaliacaoDetalhada {
  nome: string;
  nota: number;
  data: string;
  texto: string;
}

@Component({
  selector: 'app-avaliacao',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './avaliacao.component.html',
  styleUrls: ['./avaliacao.component.scss'],
})
export class AvaliacaoComponent {

  mediaAvaliacoes = 4.7;

  // TODO: substituir por dados reais (ex: vindos de um AvaliacaoService)
  avaliacoes: AvaliacaoDetalhada[] = [
    { nome: 'Maria Silva',    nota: 5, data: '18 Mar 2026', texto: 'Comida excelente e entrega rápida! O acarajé estava perfeito.' },
    { nome: 'João Santos',    nota: 5, data: '17 Mar 2026', texto: 'Muito saboroso, recomendo! A moqueca de peixe é espetacular.' },
    { nome: 'Ana Oliveira',   nota: 4, data: '16 Mar 2026', texto: 'Ótima qualidade e bem servido. Preço justo pelo que oferece.' },
    { nome: 'Carlos Pereira', nota: 5, data: '15 Mar 2026', texto: 'Melhor comida baiana da região! Sempre peço aqui.' },
    { nome: 'Fernanda Costa', nota: 5, data: '14 Mar 2026', texto: 'Simplesmente perfeito! O bobó de camarão é divino.' },
    { nome: 'Roberto Lima',   nota: 4, data: '13 Mar 2026', texto: 'Comida boa e chegou no prazo certo.' },
  ];

  constructor(private router: Router) {}

  voltar(): void {
    this.router.navigate(['/mobile/cardapio']);
  }
}