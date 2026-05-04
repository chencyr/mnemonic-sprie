import Phaser from "phaser";
import { BootScene } from "./scenes/BootScene";
import { GameScene } from "./scenes/GameScene";
import "./style.css";

new Phaser.Game({
  type: Phaser.CANVAS,
  parent: "app",
  width: 1280,
  height: 720,
  backgroundColor: "#15171f",
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH
  },
  scene: [BootScene, GameScene],
  audio: {
    disableWebAudio: false
  }
});
