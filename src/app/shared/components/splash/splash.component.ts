import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';

const CHAVE = 'baianar_splash_visto';

/**
 * Tela de abertura do app (estilo iFood): fundo na cor do site, logo BAIANAr e as duas
 * ondas da logo "desenhando" e depois balançando de leve. Aparece uma vez por sessão,
 * só nas telas do cliente (/ e /mobile/...).
 */
@Component({
  selector: 'app-splash',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="splash" *ngIf="visivel()" [class.saindo]="saindo()" role="presentation">
      <div class="logo" aria-label="BAIANAr">
        <img class="camada onda cima"  src="assets/images/splash/onda-cima.png"  alt="" />
        <img class="camada texto"      src="assets/images/splash/texto.png"      alt="BAIANAr" />
        <img class="camada onda baixo" src="assets/images/splash/onda-baixo.png" alt="" />
      </div>
    </div>
  `,
  styles: [`
    .splash {
      position: fixed;
      inset: 0;
      z-index: 99999;
      display: flex;
      align-items: center;
      justify-content: center;
      background: #2d2b3d;
      opacity: 1;
      transition: opacity 0.45s ease;
    }
    .splash.saindo { opacity: 0; pointer-events: none; }

    /* proporção da logo original (688 x 397) */
    .logo {
      position: relative;
      width: min(62vw, 270px);
      aspect-ratio: 688 / 397;
    }
    .camada { position: absolute; left: 0; width: 100%; display: block; }

    /* alturas das 3 fatias dentro de 397 px: 0-104, 104-280, 280-397 */
    .cima  { top: 0;       height: 26.2%; }
    .texto { top: 26.2%;   height: 44.3%; }
    .baixo { top: 70.5%;   height: 29.5%; }

    /* ondas: pincelada que se desenha + balanço contínuo */
    .onda { will-change: transform, clip-path; }
    .cima  {
      clip-path: inset(0 100% 0 0);
      animation: desenha-esq 0.9s 0.15s cubic-bezier(.4,0,.2,1) forwards,
                 balanca 1.8s 1.05s ease-in-out infinite alternate;
    }
    .baixo {
      clip-path: inset(0 0 0 100%);
      animation: desenha-dir 0.9s 0.35s cubic-bezier(.4,0,.2,1) forwards,
                 balanca-inv 1.8s 1.25s ease-in-out infinite alternate;
    }
    .texto {
      opacity: 0;
      transform: scale(0.88);
      animation: texto-entra 0.6s 0.55s cubic-bezier(.2,.8,.2,1) forwards;
    }

    @keyframes desenha-esq { to { clip-path: inset(0 0 0 0); } }
    @keyframes desenha-dir { to { clip-path: inset(0 0 0 0); } }
    @keyframes texto-entra { to { opacity: 1; transform: scale(1); } }
    @keyframes balanca     { from { transform: translate(-3%,  4%); } to { transform: translate(3%, -4%); } }
    @keyframes balanca-inv { from { transform: translate( 3%, -4%); } to { transform: translate(-3%, 4%); } }

    @media (prefers-reduced-motion: reduce) {
      .cima, .baixo { animation: none; clip-path: none; }
      .texto { animation: none; opacity: 1; transform: none; }
    }
  `]
})
export class SplashComponent implements OnInit {
  visivel = signal(false);
  saindo  = signal(false);

  ngOnInit(): void {
    if (typeof window === 'undefined') return;
    const rota = window.location.pathname;
    const telaDoCliente = rota === '/' || rota.startsWith('/mobile');
    if (!telaDoCliente || this.jaViu()) return;

    this.visivel.set(true);
    const reduzido = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    setTimeout(() => this.saindo.set(true), reduzido ? 700 : 2600);
    setTimeout(() => this.visivel.set(false), reduzido ? 1100 : 3050);
  }

  private jaViu(): boolean {
    try {
      if (sessionStorage.getItem(CHAVE)) return true;
      sessionStorage.setItem(CHAVE, '1');
    } catch { /* sem sessionStorage: mostra normalmente */ }
    return false;
  }
}
