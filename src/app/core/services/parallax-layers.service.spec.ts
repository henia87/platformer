import { TestBed } from '@angular/core/testing';

import { ParallaxLayersService } from './parallax-layers.service';

describe('ParallaxLayersService', () => {
  let service: ParallaxLayersService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ParallaxLayersService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should return parallax layers', () => {
    const layers = service.getLayers();
    expect(layers.length).toBeGreaterThan(0);
    expect(layers[0].key).toBeDefined();
    expect(layers[0].speed).toBeDefined();
  });
});
