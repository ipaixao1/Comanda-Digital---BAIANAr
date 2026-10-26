import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { SplashComponent } from './shared/components/splash/splash.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, SplashComponent],
  template: `<router-outlet /><app-splash />`
})
export class AppComponent {
  title = 'baianar';
}
