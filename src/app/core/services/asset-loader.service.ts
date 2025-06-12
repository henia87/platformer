import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class AssetLoaderService {
  private imageCache = new Map<string, HTMLImageElement>();
  private pendingPromises = new Map<string, Promise<void>>();

  async loadImage(key: string, src: string): Promise<void> {
    if (this.imageCache.has(key)) {
      console.warn(`Image with key "${key}" is already loaded.`);
      return;
    }

    if (this.pendingPromises.has(key)) {
      return this.pendingPromises.get(key)!;
    }

    const promise = new Promise<void>((resolve, reject) => {
      const img = new Image();
      img.src = src;

      img.onload = () => {
        this.imageCache.set(key, img);
        this.pendingPromises.delete(key);
        resolve();
      };

      img.onerror = (error) => {
        this.pendingPromises.delete(key);
        console.error(`Failed to load image "${src}":`, error);
        reject(error);
      };
    });
    this.pendingPromises.set(key, promise);
    return promise;
  }

  getImage(key: string): HTMLImageElement | undefined {
    return this.imageCache.get(key);
  }
}
