import { Injectable, OnDestroy } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

interface KeyState {
  left: boolean;
  right: boolean;
  jump: boolean;
}

@Injectable({
  providedIn: 'root',
})
export class InputService implements OnDestroy {
  private readonly keysPressed = new Set<string>();
  private readonly inputState$ = new BehaviorSubject<KeyState>({
    left: false,
    right: false,
    jump: false,
  });

  public readonly inputState = this.inputState$.asObservable();

  private handleKeyDown = (event: KeyboardEvent): void => {
    this.keysPressed.add(event.key.toLowerCase());
    this.updateInputState();
  };

  private handleKeyUp = (event: KeyboardEvent): void => {
    this.keysPressed.delete(event.key.toLowerCase());
    this.updateInputState();
  };

  constructor() {
    window.addEventListener('keydown', this.handleKeyDown);
    window.addEventListener('keyup', this.handleKeyUp);
  }

  private updateInputState(): void {
    const newState: KeyState = {
      left: this.keysPressed.has('a') || this.keysPressed.has('arrowleft'),
      right: this.keysPressed.has('d') || this.keysPressed.has('arrowright'),
      jump: this.keysPressed.has(' ') || this.keysPressed.has('arrowup'),
    };
    this.inputState$.next(newState);
  }

  ngOnDestroy(): void {
    window.removeEventListener('keydown', this.handleKeyDown);
    window.removeEventListener('keyup', this.handleKeyUp);
  }
}
