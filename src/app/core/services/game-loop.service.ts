import { inject, Injectable } from '@angular/core';
import { NgZone } from '@angular/core';
import { Observable, Subject } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class GameLoopService {
  private ngZone = inject(NgZone);
  private running = false;
  private previousTimestamp = 0;
  private frameSubject = new Subject<number>();

  public frame: Observable<number> = this.frameSubject.asObservable();

  start(): void {
    if (this.running) return;

    this.running = true;
    this.previousTimestamp = performance.now();

    this.ngZone.runOutsideAngular(() => {
      const loop = (currentTimestamp: number) => {
        if (!this.running) return;
        
        const deltaTime = (currentTimestamp - this.previousTimestamp) / 1000;
        this.previousTimestamp = currentTimestamp;

        this.frameSubject.next(deltaTime);

        requestAnimationFrame(loop);
      };

      loop(this.previousTimestamp);
    });
  }

  stop(): void {
    this.running = false;
  }
}
