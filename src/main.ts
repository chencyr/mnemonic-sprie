import Phaser from "phaser";
import "./style.css";

type Mode = "title" | "playing" | "complete";

type RuneState = {
  id: number;
  x: number;
  y: number;
  collected: boolean;
  circle?: Phaser.GameObjects.Arc;
  label?: Phaser.GameObjects.Text;
};

type KeyMap = {
  up: Phaser.Input.Keyboard.Key;
  down: Phaser.Input.Keyboard.Key;
  left: Phaser.Input.Keyboard.Key;
  right: Phaser.Input.Keyboard.Key;
  w: Phaser.Input.Keyboard.Key;
  a: Phaser.Input.Keyboard.Key;
  s: Phaser.Input.Keyboard.Key;
  d: Phaser.Input.Keyboard.Key;
};

declare global {
  interface Window {
    advanceTime?: (ms: number) => void;
    render_game_to_text?: () => string;
  }
}

const GAME_WIDTH = 960;
const GAME_HEIGHT = 540;

let activeScene: MainScene | undefined;

class MainScene extends Phaser.Scene {
  private mode: Mode = "title";
  private elapsed = 0;
  private score = 0;
  private keys?: KeyMap;
  private player?: Phaser.GameObjects.Arc;
  private hud?: Phaser.GameObjects.Text;
  private titleGroup?: Phaser.GameObjects.Container;
  private completeGroup?: Phaser.GameObjects.Container;

  private readonly playerState = {
    x: GAME_WIDTH / 2,
    y: GAME_HEIGHT - 88,
    radius: 16,
    speed: 220,
  };

  private readonly runes: RuneState[] = [
    { id: 1, x: 210, y: 390, collected: false },
    { id: 2, x: 480, y: 278, collected: false },
    { id: 3, x: 735, y: 164, collected: false },
  ];

  constructor() {
    super("MainScene");
  }

  create() {
    activeScene = this;
    this.createBackground();
    this.createRunes();
    this.createPlayer();
    this.createHud();
    this.createOverlays();
    this.bindInput();
    this.syncView();
  }

  update(_time: number, delta: number) {
    this.advance(delta);
  }

  advance(ms: number) {
    if (this.mode !== "playing") {
      return;
    }

    const dt = ms / 1000;
    this.elapsed += dt;
    this.movePlayer(dt);
    this.collectRunes();
    this.syncView();
  }

  getTextState() {
    return JSON.stringify({
      note: "Coordinates use Phaser canvas pixels with origin at top-left, x increases right, y increases down.",
      engine: "Phaser 3",
      mode: this.mode,
      player: {
        x: Math.round(this.playerState.x),
        y: Math.round(this.playerState.y),
        radius: this.playerState.radius,
      },
      runes: this.runes.map((rune) => ({
        id: rune.id,
        x: rune.x,
        y: rune.y,
        collected: rune.collected,
      })),
      score: this.score,
      elapsed: Number(this.elapsed.toFixed(2)),
    });
  }

  private createBackground() {
    const background = this.add.graphics();
    background.fillGradientStyle(0x28313f, 0x28313f, 0x101318, 0x101318, 1);
    background.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

    background.lineStyle(2, 0xf6f1df, 0.11);
    for (let y = 118; y < GAME_HEIGHT; y += 78) {
      background.beginPath();
      background.moveTo(110, y);
      background.lineTo(GAME_WIDTH - 110, y - 34);
      background.strokePath();
    }

    background.fillStyle(0x5fb7a6, 0.18);
    background.beginPath();
    background.moveTo(480, 74);
    background.lineTo(260, 486);
    background.lineTo(700, 486);
    background.closePath();
    background.fillPath();
  }

  private createRunes() {
    for (const rune of this.runes) {
      rune.circle = this.add.circle(rune.x, rune.y, 18, 0xf1c65b).setStrokeStyle(3, 0xfff3bd);
      rune.label = this.add
        .text(rune.x, rune.y + 1, String(rune.id), {
          color: "#27303a",
          fontFamily: "Inter, sans-serif",
          fontSize: "18px",
          fontStyle: "700",
        })
        .setOrigin(0.5);
    }
  }

  private createPlayer() {
    this.player = this.add
      .circle(this.playerState.x, this.playerState.y, this.playerState.radius, 0x5fb7a6)
      .setStrokeStyle(3, 0xc6fff1);
  }

  private createHud() {
    this.hud = this.add.text(28, 24, "", {
      color: "#f6f1df",
      fontFamily: "Inter, sans-serif",
      fontSize: "18px",
      fontStyle: "600",
    });
  }

  private createOverlays() {
    const titleShade = this.add.rectangle(0, 0, GAME_WIDTH, GAME_HEIGHT, 0x101318, 0.72).setOrigin(0);
    const title = this.add
      .text(GAME_WIDTH / 2, 214, "Mnemonic Spire", {
        color: "#f6f1df",
        fontFamily: "Inter, sans-serif",
        fontSize: "52px",
        fontStyle: "700",
      })
      .setOrigin(0.5);
    const start = this.add
      .text(GAME_WIDTH / 2, 282, "Press Enter to begin", {
        color: "#f6f1df",
        fontFamily: "Inter, sans-serif",
        fontSize: "20px",
        fontStyle: "500",
      })
      .setOrigin(0.5);
    const controls = this.add
      .text(GAME_WIDTH / 2, 318, "Move with WASD or arrow keys", {
        color: "#f6f1df",
        fontFamily: "Inter, sans-serif",
        fontSize: "20px",
        fontStyle: "500",
      })
      .setOrigin(0.5);
    this.titleGroup = this.add.container(0, 0, [titleShade, title, start, controls]);

    const completeShade = this.add.rectangle(0, 0, GAME_WIDTH, GAME_HEIGHT, 0x101318, 0.72).setOrigin(0);
    const complete = this.add
      .text(GAME_WIDTH / 2, 238, "Spire Remembered", {
        color: "#f6f1df",
        fontFamily: "Inter, sans-serif",
        fontSize: "44px",
        fontStyle: "700",
      })
      .setOrigin(0.5);
    const restart = this.add
      .text(GAME_WIDTH / 2, 298, "Press Enter to restart", {
        color: "#f6f1df",
        fontFamily: "Inter, sans-serif",
        fontSize: "20px",
        fontStyle: "500",
      })
      .setOrigin(0.5);
    this.completeGroup = this.add.container(0, 0, [completeShade, complete, restart]).setVisible(false);
  }

  private bindInput() {
    this.keys = this.input.keyboard?.addKeys({
      up: Phaser.Input.Keyboard.KeyCodes.UP,
      down: Phaser.Input.Keyboard.KeyCodes.DOWN,
      left: Phaser.Input.Keyboard.KeyCodes.LEFT,
      right: Phaser.Input.Keyboard.KeyCodes.RIGHT,
      w: Phaser.Input.Keyboard.KeyCodes.W,
      a: Phaser.Input.Keyboard.KeyCodes.A,
      s: Phaser.Input.Keyboard.KeyCodes.S,
      d: Phaser.Input.Keyboard.KeyCodes.D,
    }) as KeyMap | undefined;

    this.input.keyboard?.on("keydown-ENTER", () => {
      if (this.mode !== "playing") {
        this.startGame();
      }
    });

    this.input.keyboard?.on("keydown-F", () => {
      if (this.scale.isFullscreen) {
        this.scale.stopFullscreen();
      } else {
        this.scale.startFullscreen();
      }
    });
  }

  private startGame() {
    this.mode = "playing";
    this.elapsed = 0;
    this.score = 0;
    this.playerState.x = GAME_WIDTH / 2;
    this.playerState.y = GAME_HEIGHT - 88;
    for (const rune of this.runes) {
      rune.collected = false;
    }
    this.syncView();
  }

  private movePlayer(dt: number) {
    if (!this.keys) {
      return;
    }

    const move = { x: 0, y: 0 };
    if (this.keys.left.isDown || this.keys.a.isDown) move.x -= 1;
    if (this.keys.right.isDown || this.keys.d.isDown) move.x += 1;
    if (this.keys.up.isDown || this.keys.w.isDown) move.y -= 1;
    if (this.keys.down.isDown || this.keys.s.isDown) move.y += 1;

    const length = Math.hypot(move.x, move.y);
    if (length === 0) {
      return;
    }

    this.playerState.x = Phaser.Math.Clamp(
      this.playerState.x + (move.x / length) * this.playerState.speed * dt,
      this.playerState.radius,
      GAME_WIDTH - this.playerState.radius,
    );
    this.playerState.y = Phaser.Math.Clamp(
      this.playerState.y + (move.y / length) * this.playerState.speed * dt,
      this.playerState.radius,
      GAME_HEIGHT - this.playerState.radius,
    );
  }

  private collectRunes() {
    for (const rune of this.runes) {
      const distance = Phaser.Math.Distance.Between(this.playerState.x, this.playerState.y, rune.x, rune.y);
      if (!rune.collected && distance < this.playerState.radius + 18) {
        rune.collected = true;
        this.score += 1;
      }
    }

    if (this.score === this.runes.length) {
      this.mode = "complete";
    }
  }

  private syncView() {
    this.player?.setPosition(this.playerState.x, this.playerState.y);
    this.hud?.setText(`Runes ${this.score}/${this.runes.length}`);
    this.titleGroup?.setVisible(this.mode === "title");
    this.completeGroup?.setVisible(this.mode === "complete");

    for (const rune of this.runes) {
      rune.circle?.setVisible(!rune.collected);
      rune.label?.setVisible(!rune.collected);
    }
  }
}

const config: Phaser.Types.Core.GameConfig = {
  type: Phaser.CANVAS,
  parent: "app",
  width: GAME_WIDTH,
  height: GAME_HEIGHT,
  backgroundColor: "#101318",
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
  scene: MainScene,
};

new Phaser.Game(config);

window.render_game_to_text = () => activeScene?.getTextState() ?? JSON.stringify({ mode: "booting" });
window.advanceTime = (ms: number) => {
  const steps = Math.max(1, Math.round(ms / (1000 / 60)));
  for (let i = 0; i < steps; i += 1) {
    activeScene?.advance(1000 / 60);
  }
};
