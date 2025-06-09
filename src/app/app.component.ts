import { Component } from '@angular/core';
import { InputService } from './core/services/input.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  standalone: false,
  styleUrl: './app.component.scss',
})
export class AppComponent {
  title = 'platformer';

  constructor(input: InputService) {
    input.inputState.subscribe((state) => console.log('🕹️ Input:', state));
  }
}
