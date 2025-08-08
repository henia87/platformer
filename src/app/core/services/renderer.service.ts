/**
 * RendererService is responsible for drawing shapes and images on a canvas.
 * It provides methods to draw rectangles, images, sprite frames, and clear the canvas.
 * This service is used in the game engine to render graphics efficiently.
 * @file RendererService provides methods for rendering graphics on a canvas.
 */
import { Injectable } from '@angular/core';
import { PLAYER_FALLBACK_COLOR } from '../game.config';

@Injectable({
  providedIn: 'root',
})
export class RendererService {
  /**
   * Draws a filled rectangle on the canvas.
   * @param ctx - The canvas rendering context.
   * @param x - The x position.
   * @param y - The y position.
   * @param width - The width of the rectangle.
   * @param height - The height of the rectangle.
   * @param color - The fill color.
   */
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

  /**
   * Draws an image on the canvas, or a fallback rectangle if the image is not loaded.
   * @param ctx - The canvas rendering context.
   * @param image - The image to draw (can be undefined).
   * @param x - The x position.
   * @param y - The y position.
   * @param width - The width to draw.
   * @param height - The height to draw.
   */
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
      ctx.fillStyle = PLAYER_FALLBACK_COLOR;
      ctx.fillRect(x, y, width, height);
    }
  }

  /**
   * Draws a specific frame from a sprite sheet image onto the canvas.
   * @param ctx - The canvas rendering context.
   * @param image - The sprite sheet image.
   * @param frameX - The x position of the frame in the sprite sheet.
   * @param frameY - The y position of the frame in the sprite sheet.
   * @param frameWidth - The width of the frame.
   * @param frameHeight - The height of the frame.
   * @param destX - The x position to draw on the canvas.
   * @param destY - The y position to draw on the canvas.
   * @param destWidth - The width to draw on the canvas.
   * @param destHeight - The height to draw on the canvas.
   */
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

  /**
   * Clears the entire canvas.
   * @param ctx - The canvas rendering context.
   * @param width - The width of the canvas.
   * @param height - The height of the canvas.
   */
  clear(ctx: CanvasRenderingContext2D, width: number, height: number): void {
    ctx.clearRect(0, 0, width, height);
  }

  /**
   * Draws a parallax layer, tiling the image horizontally.
   * @param ctx - The canvas rendering context.
   * @param img - The image to draw (can be undefined).
   * @param canvasWidth - The width of the canvas.
   * @param canvasHeight - The height of the canvas.
   * @param offsetX - The x offset for the tiling.
   * @param yFromBottom - The y position from the bottom of the canvas.
   * @param height - The height of the layer.
   * @param fallbackColor - An optional fallback color if the image is not loaded.
   */
  drawParallaxLayer(
    ctx: CanvasRenderingContext2D,
    img: HTMLImageElement | undefined,
    canvasWidth: number,
    canvasHeight: number,
    offsetX: number,
    yFromBottom: number,
    height: number,
    fallbackColor?: string
  ): void {
    const y = canvasHeight - yFromBottom - height;

    if (!img) {
      if (fallbackColor) {
        ctx.fillStyle = fallbackColor;
        ctx.fillRect(0, y, canvasWidth, height);
      }
      return;
    }

    const iw = img.width;
    const ih = img.height;
    const scale = height / ih; // Scale the image to fit the specified height
    const scaledWidth = iw * scale;

    const start = -((offsetX % scaledWidth) + scaledWidth) % scaledWidth; // Normalize start into [-scaledWidth, 0)
    for (let x = start; x < canvasWidth; x += scaledWidth) {
      ctx.drawImage(img, 0, 0, iw, ih, x, y, scaledWidth, height);
    }
  }
}
