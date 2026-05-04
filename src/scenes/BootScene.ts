import Phaser from "phaser";
import { createAssetRegistry, loadGameData } from "../core";
import { preloadAssets } from "../phaser/assets/preloadAssets";

export class BootScene extends Phaser.Scene {
  constructor() {
    super("BootScene");
  }

  preload() {
    const data = loadGameData();
    const registry = createAssetRegistry(data);
    this.registry.set("gameData", data);
    this.registry.set("assetRegistry", registry);
    preloadAssets(this, registry);
  }

  create() {
    this.scene.start("GameScene");
  }
}
