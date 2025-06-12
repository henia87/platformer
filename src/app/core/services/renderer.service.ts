import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class RendererService {
  drawRect(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    width: number,
    height: number,
    color: string
  ): void {
    ctx.fillStyle = color;
    ctx.fillRect(x, y, width, height);
  }

  drawImage(
    ctx: CanvasRenderingContext2D,
    image: HTMLImageElement | undefined,
    x: number,
    y: number,
    width: number,
    height: number
  ): void {
    if (image) {
      ctx.drawImage(image, x, y, width, height);
    } else {
      // fallback if image is not loaded
      ctx.fillStyle = 'deepskyblue';
      ctx.fillRect(x, y, width, height);
    }
  }

  drawSpriteFrame(
    ctx: CanvasRenderingContext2D,
    image: HTMLImageElement,
    frameX: number,
    frameY: number,
    frameWidth: number,
    frameHeight: number,
    destX: number,
    destY: number,
    destWidth: number,
    destHeight: number
  ) {
    ctx.drawImage(
      image,
      frameX,
      frameY,
      frameWidth,
      frameHeight, // sprite sheet cut
      destX,
      destY,
      destWidth,
      destHeight // canvas draw area
    );
  }

  clear(ctx: CanvasRenderingContext2D, width: number, height: number): void {
    ctx.clearRect(0, 0, width, height);
  }
}
