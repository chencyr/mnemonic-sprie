import Phaser from "phaser";
import {
  autoWinCombat,
  buyShopItem,
  canMutate,
  chooseCardReward,
  chooseEventOption,
  createRun,
  effectiveCardCost,
  endRunTurn,
  leaveShop,
  playRunCard,
  restHeal,
  restMutate,
  selectMapNode,
  skipCardReward,
  snapshotRun,
  startRun,
  type AssetRegistry,
  type CardInstance,
  type GameData,
  type RunEngine
} from "../core";
import { CARD_HEIGHT, CARD_WIDTH, renderCardView } from "../phaser/ui/CardView";
import { renderEnemyView } from "../phaser/ui/EnemyView";
import { renderEventView } from "../phaser/ui/EventView";
import { HUD_FONT, renderHudShell, renderPlayerPanel } from "../phaser/ui/HudView";
import { renderMapView } from "../phaser/ui/MapView";
import { renderRewardView } from "../phaser/ui/RewardView";
import { renderShopView } from "../phaser/ui/ShopView";
import { label, panel } from "../phaser/ui/uiPrimitives";
import { layout } from "../phaser/ui/uiTheme";
import type { ButtonDescriptor, UiRenderContext, VisibleAssetDescriptor } from "../phaser/ui/uiTypes";

const WIDTH = 1280;
const HEIGHT = 720;

type Selection = { cardInstanceId: string } | undefined;

interface TextSnapshot {
  note: string;
  mode: string;
  run: ReturnType<typeof snapshotRun>;
  selectedCard?: string;
  buttons: ButtonDescriptor[];
  combat?: unknown;
  map?: unknown;
  reward?: unknown;
  shop?: unknown;
  event?: unknown;
  visibleAssets: VisibleAssetDescriptor[];
  log: string[];
}

declare global {
  interface Window {
    advanceTime?: (ms: number) => void;
    render_game_to_text?: () => string;
    mnemonicSpireScene?: GameScene;
  }
}

export class GameScene extends Phaser.Scene {
  private dataModel!: GameData;
  private assets!: AssetRegistry;
  private engine!: RunEngine;
  private root?: Phaser.GameObjects.Container;
  private selected: Selection;
  private buttons: ButtonDescriptor[] = [];
  private visibleAssets: VisibleAssetDescriptor[] = [];
  private readonly quick = new URLSearchParams(window.location.search).has("e2e");
  private muted = true;

  constructor() {
    super("GameScene");
  }

  create() {
    this.dataModel = this.registry.get("gameData") as GameData;
    this.assets = this.registry.get("assetRegistry") as AssetRegistry;
    this.engine = createRun(this.dataModel, { seed: 20260505, quick: this.quick });
    window.mnemonicSpireScene = this;
    window.render_game_to_text = () => JSON.stringify(this.snapshot());
    window.advanceTime = (_ms: number) => {
      this.render();
    };
    this.input.keyboard?.on("keydown-F", () => {
      if (this.scale.isFullscreen) this.scale.stopFullscreen();
      else this.scale.startFullscreen();
    });
    this.render();
  }

  private render() {
    this.root?.destroy(true);
    this.buttons = [];
    this.visibleAssets = [];
    this.root = this.add.container(0, 0);
    this.drawBackground();
    this.drawHud();
    switch (this.engine.run.mode) {
      case "title":
        this.drawTitle();
        break;
      case "map":
        this.drawMap();
        break;
      case "combat":
        this.drawCombat();
        break;
      case "reward":
        this.drawReward();
        break;
      case "rest":
        this.drawRest();
        break;
      case "shop":
        this.drawShop();
        break;
      case "event":
        this.drawEvent();
        break;
      case "victory":
        this.drawEnd("通關成功", "牌塔心臟記住了你的名字。", 0x39d98a);
        break;
      case "defeat":
        this.drawEnd("挑戰失敗", "拾憶者倒在這一層。", 0xf45b69);
        break;
    }
  }

  private drawBackground() {
    const g = this.add.graphics();
    g.fillStyle(0x15171f, 1).fillRect(0, 0, WIDTH, HEIGHT);
    g.fillStyle(0x202833, 1).fillRect(0, 0, WIDTH, 76);
    g.lineStyle(2, 0xf4e04d, 0.32);
    for (let x = -120; x < WIDTH; x += 190) {
      g.lineBetween(x, 106, x + 430, HEIGHT - 32);
    }
    g.fillStyle(0xee4266, 0.14).fillRect(0, HEIGHT - 164, WIDTH, 164);
    this.root?.add(g);
  }

  private drawHud() {
    this.root?.add(renderHudShell(this, this.uiContext(), this.dataModel, this.assets, this.engine.run, this.muted, () => this.toggleMute()));
  }

  private drawTitle() {
    const hero = this.assets.getPlaceholder("character");
    this.root?.add(panel(this, 72, 104, 1136, 512));
    this.image(410, 360, hero.key, 330, 330, 0.96, "title:seeker");
    this.text(670, 190, "記憶牌塔", 64, "#fff8d8");
    this.text(674, 270, "爬上 12 層牌塔，讓每一張牌記住它的戰鬥方式。", 22, "#d1d5db", 0, 0, 440);
    const notebook = this.assets.getRelicIcon("broken_notes");
    this.image(700, 390, notebook.key, 70, 70, 1, "title:starter-relic");
    this.text(748, 364, "起始遺物：破碎筆記", 18, "#c4b5fd", 0, 0, 300);
    this.text(748, 394, "戰鬥後，使用最多的牌獲得記憶進度。", 14, "#d1d5db", 0, 0, 300);
    this.button("start", "開始一局", 704, 506, 220, 56, () => {
      this.startAudio();
      startRun(this.engine);
      this.render();
    }, true, 0x39d98a);
  }

  private drawMap() {
    this.root?.add(
      renderMapView({
        scene: this,
        context: this.uiContext(),
        assets: this.assets,
        nodes: this.engine.run.map,
        reachableNodeIds: this.engine.run.reachableNodeIds,
        currentNodeId: this.engine.run.currentNodeId,
        onSelectNode: (nodeId) => {
          selectMapNode(this.engine, nodeId);
          this.selected = undefined;
          this.render();
        }
      })
    );
  }

  private drawCombat() {
    const combat = this.engine.run.currentCombat;
    if (!combat) return;
    this.root?.add(renderPlayerPanel(this, this.engine.run, combat.player.energy, combat.player.block));
    this.root?.add(panel(this, layout.battlefield.x, layout.battlefield.y, layout.battlefield.w, layout.battlefield.h, `戰鬥場域 T${combat.turn}`));
    combat.enemies.forEach((enemy, index) => {
      const x = layout.battlefield.x + 180 + index * 230;
      const y = layout.battlefield.y + 150;
      this.root?.add(
        renderEnemyView({
          scene: this,
          context: this.uiContext(),
          data: this.dataModel,
          assets: this.assets,
          enemy,
          x,
          y,
          selectedTargetEnabled: Boolean(this.selected),
          onTarget: () => this.playSelectedOnEnemy(enemy.instanceId)
        })
      );
    });
    const hand = combat.hand.map((id) => combat.cards.find((card) => card.instanceId === id)).filter(Boolean) as CardInstance[];
    const logPanel = panel(this, layout.rightPanel.x, layout.rightPanel.y, layout.rightPanel.w, layout.rightPanel.h, "戰況");
    logPanel.add(label(this, 14, 48, combat.events.map((event) => event.message).slice(-8).join("\n"), 13, "#d1d5db", layout.rightPanel.w - 28));
    this.root?.add(logPanel);
    const handPanel = panel(this, layout.hand.x, layout.hand.y, layout.hand.w, layout.hand.h, "手牌");
    this.root?.add(handPanel);
    const startX = layout.hand.x + 18;
    const y = layout.hand.y + 28;
    hand.forEach((card, index) => {
      const cardDef = this.dataModel.cards.find((item) => item.id === card.cardId)!;
      const x = startX + index * 138;
      const selected = this.selected?.cardInstanceId === card.instanceId;
      const cardView = renderCardView({
        scene: this,
        context: this.uiContext(),
        data: this.dataModel,
        assets: this.assets,
        x,
        y,
        card: cardDef,
        instance: card,
        selected,
        playable: effectiveCardCost(this.dataModel, card) <= combat.player.energy,
        mode: "hand"
      });
      this.root?.add(cardView);
      this.button(`card:${card.instanceId}`, "", x, y, CARD_WIDTH, CARD_HEIGHT, () => this.selectOrPlayCard(card.instanceId), true, selected ? 0xf4e04d : 0x2b3340, 0.02);
    });
    this.button("end-turn", "結束回合", layout.endTurn.x, layout.endTurn.y, layout.endTurn.w, layout.endTurn.h, () => {
      endRunTurn(this.engine);
      this.selected = undefined;
      this.render();
    });
    if (this.quick) {
      this.button("auto-win", "測試勝利", layout.endTurn.x, layout.endTurn.y - 56, layout.endTurn.w, 42, () => {
        autoWinCombat(this.engine);
        this.render();
      }, true, 0x39d98a);
    }
  }

  private drawReward() {
    const reward = this.engine.run.reward;
    if (!reward) return;
    this.root?.add(
      renderRewardView(
        this,
        this.uiContext(),
        this.dataModel,
        this.assets,
        reward,
        (cardId) => {
          chooseCardReward(this.engine, cardId);
          this.render();
        },
        () => {
          skipCardReward(this.engine);
          this.render();
        }
      )
    );
  }

  private drawRest() {
    this.root?.add(panel(this, 82, 112, 1100, 500, "休息點"));
    const restIcon = this.assets.getNodeIcon("rest");
    this.image(208, 286, restIcon.key, 150, 150, 1, "rest:icon");
    this.text(324, 170, "整理記憶，或先保住性命。", 24, "#fff8d8", 0, 0, 520);
    this.button("rest:heal", "回血 30%", 330, 298, 220, 64, () => {
      restHeal(this.engine);
      this.render();
    }, true, 0x39d98a);
    const mutable = this.engine.run.deck.find((card) => canMutate(card));
    if (mutable) {
      const cardDef = this.dataModel.cards.find((card) => card.id === mutable.cardId);
      if (cardDef) {
        this.root?.add(
          renderCardView({
            scene: this,
            context: this.uiContext(),
            data: this.dataModel,
            assets: this.assets,
            x: 704,
            y: 204,
            w: 160,
            h: 222,
            card: cardDef,
            instance: mutable,
            mode: "preview"
          })
        );
      }
    }
    this.button("rest:mutate", mutable ? "變異記憶牌" : "沒有可變異的牌", 682, 456, 220, 56, () => {
      restMutate(this.engine, mutable?.instanceId);
      this.render();
    }, Boolean(mutable), 0xf4e04d);
  }

  private drawShop() {
    if (!this.engine.run.shop) return;
    this.root?.add(
      renderShopView(
        this,
        this.uiContext(),
        this.dataModel,
        this.assets,
        this.engine.run.shop,
        this.engine.run.gold,
        (itemId) => {
          buyShopItem(this.engine, itemId);
          this.render();
        },
        () => {
          leaveShop(this.engine);
          this.render();
        }
      )
    );
  }

  private drawEvent() {
    const event = this.engine.run.activeEvent;
    if (!event) return;
    this.root?.add(
      renderEventView(this, this.uiContext(), this.dataModel, this.assets, event, (optionId) => {
        chooseEventOption(this.engine, optionId);
        this.render();
      })
    );
  }

  private drawEnd(title: string, subtitle: string, color: number) {
    this.root?.add(panel(this, 112, 112, 1056, 480));
    const visualKey = this.engine.run.mode === "victory" ? this.assets.getEnemySprite("tower_heart").key : this.assets.getPlaceholder("character").key;
    this.image(402, 346, visualKey, this.engine.run.mode === "victory" ? 300 : 260, 240, 0.9, `end:${this.engine.run.mode}`);
    this.text(650, 232, title, 54, "#fff8d8");
    this.text(654, 306, subtitle, 22, "#d1d5db", 0, 0, 360);
    this.text(654, 358, `抵達樓層：${this.engine.run.floor}/12\n金幣：${this.engine.run.gold}\n牌組：${this.engine.run.deck.length}`, 16, "#ffffff", 0, 0, 320);
    this.button("restart", "重新開始", 654, 486, 184, 54, () => {
      this.engine = createRun(this.dataModel, { seed: 20260505, quick: this.quick });
      this.selected = undefined;
      this.render();
    }, true, color);
  }

  private selectOrPlayCard(cardInstanceId: string) {
    const combat = this.engine.run.currentCombat;
    const card = combat?.cards.find((item) => item.instanceId === cardInstanceId);
    const definition = card ? this.dataModel.cards.find((item) => item.id === card.cardId) : undefined;
    if (!combat || !card || !definition) return;
    if (definition.target === "singleEnemy" || definition.target === "allEnemies") {
      this.selected = { cardInstanceId };
      this.render();
      return;
    }
    const targetCardId = definition.target === "handCard" ? combat.hand.find((id) => id !== cardInstanceId) : undefined;
    playRunCard(this.engine, cardInstanceId, undefined, targetCardId);
    this.selected = undefined;
    this.render();
  }

  private playSelectedOnEnemy(enemyId: string) {
    if (!this.selected) return;
    const combat = this.engine.run.currentCombat;
    const selectedCard = combat?.cards.find((card) => card.instanceId === this.selected?.cardInstanceId);
    const definition = selectedCard ? this.dataModel.cards.find((card) => card.id === selectedCard.cardId) : undefined;
    const targetCardId = definition?.target === "handCard" ? combat?.hand.find((id) => id !== selectedCard?.instanceId) : undefined;
    playRunCard(this.engine, this.selected.cardInstanceId, enemyId, targetCardId);
    this.selected = undefined;
    this.render();
  }

  private toggleMute() {
    this.muted = !this.muted;
    this.sound.mute = this.muted;
    this.render();
  }

  private startAudio() {
    this.muted = false;
    this.sound.mute = false;
    if (!this.sound.get("audio:bgm")) {
      this.sound.play("audio:bgm", { loop: true, volume: 0.28 });
    }
  }

  private snapshot(): TextSnapshot {
    const run = this.engine.run;
    const combat = run.currentCombat;
    return {
      note: "座標使用 Phaser Canvas 像素，原點在左上，x 往右，y 往下。buttons 內提供目前可點擊元素中心與尺寸。",
      mode: run.mode,
      run: snapshotRun(run),
      selectedCard: this.selected?.cardInstanceId,
      buttons: this.buttons,
      combat: combat
        ? {
            phase: combat.phase,
            turn: combat.turn,
            energy: combat.player.energy,
            block: combat.player.block,
            hand: combat.hand.map((id) => {
              const card = combat.cards.find((item) => item.instanceId === id)!;
              const def = this.dataModel.cards.find((item) => item.id === card.cardId)!;
              return { id, cardId: card.cardId, name: card.mutation?.name ?? def.name, cost: effectiveCardCost(this.dataModel, card), type: def.type };
            }),
            enemies: combat.enemies.map((enemy) => ({ id: enemy.instanceId, enemyId: enemy.enemyId, hp: enemy.hp, maxHp: enemy.maxHp, intent: enemy.intent.type })),
            events: combat.events.slice(-5).map((event) => event.message)
          }
        : undefined,
      map: run.mode === "map" ? { reachable: run.reachableNodeIds, nodes: run.map.map((node) => ({ id: node.id, floor: node.floor, type: node.type })) } : undefined,
      reward: run.reward ? { cards: run.reward.cards.map((card) => card.id), gold: run.reward.gold, relic: run.reward.relic?.id } : undefined,
      shop: run.shop?.map((item) => ({ id: item.id, kind: item.kind, itemId: item.itemId, price: item.price, sold: item.sold })),
      event: run.activeEvent ? { id: run.activeEvent.id, options: run.activeEvent.options.map((option) => option.id) } : undefined,
      visibleAssets: this.visibleAssets,
      log: run.log.slice(-5)
    };
  }

  uiContext(): UiRenderContext {
    return {
      buttons: this.buttons,
      visibleAssets: this.visibleAssets
    };
  }

  private button(id: string, label: string, x: number, y: number, w: number, h: number, onClick: () => void, enabled = true, color = 0x2dd4bf, alpha?: number) {
    const rectAlpha = alpha ?? (label === "" ? 0.38 : enabled ? 0.92 : 0.45);
    const rect = this.add.rectangle(x, y, w, h, enabled ? color : 0x4b5563, rectAlpha).setOrigin(0);
    rect.setStrokeStyle(2, enabled ? 0xffffff : 0x6b7280, enabled ? 0.42 : 0.2);
    if (enabled) {
      rect.setInteractive({ useHandCursor: true });
      rect.on("pointerdown", onClick);
    }
    const text = this.add
      .text(x + w / 2, y + h / 2, label, {
        color: enabled ? "#101318" : "#fff8d8",
        fontFamily: HUD_FONT,
        fontSize: label.length > 10 ? "14px" : "17px",
        fontStyle: "700",
        align: "center",
        wordWrap: { width: Math.max(40, w - 14) }
      })
      .setOrigin(0.5);
    this.root?.add([rect, text]);
    this.buttons.push({ id, label, x: x + w / 2, y: y + h / 2, w, h, enabled });
    return rect;
  }

  private text(x: number, y: number, value: string, size: number, color: string, originX = 0, originY = 0, wrapWidth?: number) {
    const text = this.add
      .text(x, y, value, {
        color,
        fontFamily: HUD_FONT,
        fontSize: `${size}px`,
        fontStyle: size >= 28 ? "800" : "600",
        wordWrap: wrapWidth ? { width: wrapWidth } : undefined
      })
      .setOrigin(originX, originY);
    this.root?.add(text);
    return text;
  }

  private image(x: number, y: number, key: string, w: number, h: number, alpha = 1, role = "image") {
    if (!this.textures.exists(key)) return;
    const image = this.add.image(x, y, key).setDisplaySize(w, h).setAlpha(alpha);
    this.visibleAssets.push({ key, role });
    this.root?.add(image);
  }
}
