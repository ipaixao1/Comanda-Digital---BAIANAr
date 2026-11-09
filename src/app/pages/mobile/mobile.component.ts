import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';

/**
 * Casca de todas as telas mobile (/mobile/...).
 * - Celular: ocupa 100% da largura e da altura da tela (320 px em diante), como um app.
 * - Telas maiores (tablet/desktop): coluna centralizada de até 430 px, com contorno de "aparelho".
 * A casca não rola: cada tela rola por dentro (barra inferior fixa).
 * O transform cria o contexto para os elementos position: fixed (barra inferior, rodapé, modais)
 * ficarem presos a esta coluna e não à janela inteira.
 */
@Component({
  selector: 'app-mobile',
  standalone: true,
  imports: [RouterOutlet],
  template: `<router-outlet />`,
  styles: [`
  :host {
    display: block;
    position: relative;
    width: 100%;
    max-width: 430px;
    height: 100vh;
    height: 100dvh;
    margin: 0 auto;
    overflow: hidden;
    overflow: clip; /* nem por código (foco em campo) a casca desliza */
    background: #2d2b3d;
    transform: translateZ(0);
    scrollbar-width: none;
    padding-left: env(safe-area-inset-left, 0px);
    padding-right: env(safe-area-inset-right, 0px);
  }

  /* A casca NÃO rola. Quem rola é a tela (o componente da rota). Assim a barra inferior e os
     rodapés ficam presos na casca, igual a um app, e o conteúdo nunca passa por baixo/ao lado deles. */
  :host ::ng-deep router-outlet + * {
    display: block !important;
    height: 100% !important;
    min-height: 0 !important;
    overflow-x: hidden !important;
    overflow-y: auto !important;
    overscroll-behavior: contain;
    -webkit-overflow-scrolling: touch;
    scrollbar-width: none;
  }
  :host ::ng-deep router-outlet + *::-webkit-scrollbar { display: none; }

  @media (min-width: 431px) {
    :host {
      box-shadow: 0 0 0 1px rgba(255, 255, 255, 0.07), 0 0 70px rgba(0, 0, 0, 0.55);
    }
  }
`]
})
export class MobileComponent {}
