export interface CoverFrameOptions {
  sourceWidth: number;
  sourceHeight: number;
  frameX: number;
  frameY: number;
  frameWidth: number;
  frameHeight: number;
  focusX?: number;
  focusY?: number;
}

export interface CoverFramePlacement {
  x: number;
  y: number;
  displayWidth: number;
  displayHeight: number;
}

export interface CoverCropOptions {
  sourceWidth: number;
  sourceHeight: number;
  frameWidth: number;
  frameHeight: number;
  focusX?: number;
  focusY?: number;
}

export interface CoverCropRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export function coverCrop(options: CoverCropOptions): CoverCropRect {
  const focusX = clamp01(options.focusX ?? 0.5);
  const focusY = clamp01(options.focusY ?? 0.32);
  const sourceAspect = options.sourceWidth / options.sourceHeight;
  const frameAspect = options.frameWidth / options.frameHeight;
  if (sourceAspect > frameAspect) {
    const width = options.sourceHeight * frameAspect;
    const maxX = options.sourceWidth - width;
    return {
      x: maxX * focusX,
      y: 0,
      width,
      height: options.sourceHeight
    };
  }
  const height = options.sourceWidth / frameAspect;
  const maxY = options.sourceHeight - height;
  return {
    x: 0,
    y: maxY * focusY,
    width: options.sourceWidth,
    height
  };
}

export function coverFrame(options: CoverFrameOptions): CoverFramePlacement {
  const focusX = clamp01(options.focusX ?? 0.5);
  const focusY = clamp01(options.focusY ?? 0.32);
  const scale = Math.max(options.frameWidth / options.sourceWidth, options.frameHeight / options.sourceHeight);
  const displayWidth = options.sourceWidth * scale;
  const displayHeight = options.sourceHeight * scale;
  const minX = options.frameX + options.frameWidth - displayWidth;
  const maxX = options.frameX;
  const minY = options.frameY + options.frameHeight - displayHeight;
  const maxY = options.frameY;
  const left = clamp(options.frameX + options.frameWidth * focusX - displayWidth * focusX, minX, maxX);
  const top = clamp(options.frameY + options.frameHeight * focusY - displayHeight * focusY, minY, maxY);
  return {
    x: left + displayWidth / 2,
    y: top + displayHeight / 2,
    displayWidth,
    displayHeight
  };
}

function clamp01(value: number): number {
  return clamp(value, 0, 1);
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}
