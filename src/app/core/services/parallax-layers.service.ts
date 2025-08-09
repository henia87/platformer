import { Injectable } from '@angular/core';
import { Y_FROM_BOTTOM_GRASS } from '../game.config';

@Injectable({ providedIn: 'root' })
export class ParallaxLayersService {
  layers = [
    { key: 'bg-sky', speed: 0.1, color: '#0b1526', height: 800 },
    { key: 'bg-hills', speed: 0.3, color: '#12233d', height: 600 },
    { key: 'bg-buildings', speed: 0.6, color: '#1a355b', height: 600 },
    {
      key: 'bg-near',
      speed: 0.9,
      color: '#294c84',
      height: 80,
      yFromBottom: Y_FROM_BOTTOM_GRASS,
    },
  ];

  getLayers() {
    return this.layers;
  }
}
