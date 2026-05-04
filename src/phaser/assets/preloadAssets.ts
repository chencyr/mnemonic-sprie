import type Phaser from "phaser";
import type { AssetRegistry } from "../../core";

export function preloadAssets(scene: Phaser.Scene, registry: AssetRegistry) {
  for (const entry of registry.listPreloadEntries()) {
    if (entry.key.startsWith("audio:")) {
      scene.load.audio(entry.key, entry.path);
    } else {
      scene.load.image(entry.key, entry.path);
    }
  }
}
