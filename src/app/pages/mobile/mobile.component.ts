import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-mobile',
  standalone: true,
  imports: [RouterOutlet],
  template: `<router-outlet />`,
  styles: [`
  :host {
    display: block;
    width: 430px;
    height: 100dvh;
    margin: 0 auto;
    overflow-y: auto;
    overflow-x: hidden;
    background: #2d2b3d;
    transform: translateZ(0);
    position: relative;      // ← adiciona isso
    scrollbar-width: none;
    &::-webkit-scrollbar { display: none; }
  }
`]
})
export class MobileComponent {}