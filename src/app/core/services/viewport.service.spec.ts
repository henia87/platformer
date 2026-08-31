import { TestBed } from '@angular/core/testing';

import { ViewportService } from './viewport.service';

describe('ViewportService', () => {
  let service: ViewportService;
  const originalInnerWidth = window.innerWidth;
  const originalInnerHeight = window.innerHeight;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ViewportService);
  });

  afterEach(() => {
    Object.defineProperty(window, 'innerWidth', {
      value: originalInnerWidth,
      configurable: true,
    });
    Object.defineProperty(window, 'innerHeight', {
      value: originalInnerHeight,
      configurable: true,
    });
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('getCanvasWidth', () => {
    it('caps at 800 when the window is wider', () => {
      Object.defineProperty(window, 'innerWidth', {
        value: 1920,
        configurable: true,
      });

      expect(service.getCanvasWidth()).toBe(800);
    });

    it('returns window.innerWidth when narrower than the cap', () => {
      Object.defineProperty(window, 'innerWidth', {
        value: 500,
        configurable: true,
      });

      expect(service.getCanvasWidth()).toBe(500);
    });
  });

  describe('getCanvasHeight', () => {
    it('caps at 600 when the window is taller', () => {
      Object.defineProperty(window, 'innerHeight', {
        value: 1080,
        configurable: true,
      });

      expect(service.getCanvasHeight()).toBe(600);
    });

    it('returns window.innerHeight when shorter than the cap', () => {
      Object.defineProperty(window, 'innerHeight', {
        value: 400,
        configurable: true,
      });

      expect(service.getCanvasHeight()).toBe(400);
    });
  });
});
