import { Injectable, OnDestroy } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

/**
 * InputService handles keyboard input and exposes the current input state as an observable.
 * It tracks pressed keys and updates the state for left, right, jump and shoot actions.
 *
 * @file InputService provides keyboard input management for the game.
 */
interface KeyState {
  left: boolean;
  right: boolean;
  jump: boolean;
  shoot: boolean;
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
    shoot: false,
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

  /**
   * Sets up event listeners for keyboard input.
   */
  constructor() {
    window.addEventListener('keydown', this.handleKeyDown);
    window.addEventListener('keyup', this.handleKeyUp);
  }

  /**
   * Updates the input state observable based on currently pressed keys.
   */
  private updateInputState(): void {
    const newState: KeyState = {
      left: this.keysPressed.has('a') || this.keysPressed.has('arrowleft'),
      right: this.keysPressed.has('d') || this.keysPressed.has('arrowright'),
      jump: this.keysPressed.has(' ') || this.keysPressed.has('arrowup'),
      shoot: this.keysPressed.has('x') || this.keysPressed.has('enter'),
    };
    this.inputState$.next(newState);
  }

  /**
   * Cleans up event listeners when the service is destroyed.
   */
  ngOnDestroy(): void {
    window.removeEventListener('keydown', this.handleKeyDown);
    window.removeEventListener('keyup', this.handleKeyUp);
  }
}
