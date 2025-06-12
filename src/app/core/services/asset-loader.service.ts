import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class AssetLoaderService {
  private imageCache = new Map<string, HTMLImageElement>();

  async loadImage(key: string, src: string): Promise<void> {
    if (this.imageCache.has(key)) {
      console.warn(`Image with key "${key}" is already loaded.`);
      return;
    }

    return new Promise((resolve, reject) => {
      const img = new Image();
      img.src = src;

      img.onload = () => {
        this.imageCache.set(key, img);
        resolve();
      };

      img.onerror = (error) => {
        console.error(`Failed to load image "${src}":`, error);
        reject(error);
      };
    });
  }

  getImage(key: string): HTMLImageElement | undefined {
    return this.imageCache.get(key);
  }
}
