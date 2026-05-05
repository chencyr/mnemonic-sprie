export interface ButtonDescriptor {
  id: string;
  label: string;
  x: number;
  y: number;
  w: number;
  h: number;
  enabled: boolean;
}

export interface VisibleAssetDescriptor {
  key: string;
  role: string;
}

export type ScreenKey = "title" | "map" | "combat" | "reward" | "rest" | "shop" | "event" | "victory" | "defeat";

export interface UiRenderContext {
  buttons: ButtonDescriptor[];
  visibleAssets: VisibleAssetDescriptor[];
}
