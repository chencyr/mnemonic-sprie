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
  type MapNode,
  type RunEngine
} from "../core";
import { CARD_HEIGHT, CARD_WIDTH, renderCardView } from "../phaser/ui/CardView";
import { ENEMY_SIZE } from "../phaser/ui/EnemyView";
import { HUD_FONT } from "../phaser/ui/HudView";
import { MAP_NODE_RADIUS } from "../phaser/ui/MapView";
import { REWARD_CARD_GAP } from "../phaser/ui/RewardView";
import { SHOP_ITEM_WIDTH } from "../phaser/ui/ShopView";
import { EVENT_PANEL_WIDTH } from "../phaser/ui/EventView";
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
    const run = this.engine.run;
    this.text(24, 18, `記憶牌塔  F${run.floor || 0}/12`, 24, "#fff8d8", 0, 0.5);
    this.text(290, 18, `HP ${run.playerHp}/${run.playerMaxHp}`, 19, "#ffffff", 0, 0.5);
    this.text(420, 18, `金幣 ${run.gold}`, 19, "#ffd166", 0, 0.5);
    this.text(530, 18, `牌組 ${run.deck.length}`, 19, "#a7f3d0", 0, 0.5);
    this.text(670, 18, `遺物 ${run.relics.length}`, 19, "#c4b5fd", 0, 0.5);
    this.button("mute", this.muted ? "音訊關" : "音訊開", 1130, 18, 110, 36, () => this.toggleMute(), true);
  }

  private drawTitle() {
    const art = this.assets.getPlaceholder("character");
    this.image(640, 330, art.key, 260, 260, 0.9);
    this.text(640, 112, "記憶牌塔", 64, "#fff8d8", 0.5, 0.5);
    this.text(640, 166, "Phaser 3 + TypeScript MVP", 22, "#8be9d1", 0.5, 0.5);
    this.button("start", "開始一局", 548, 548, 184, 54, () => {
      this.startAudio();
      startRun(this.engine);
      this.render();
    });
    this.text(640, 635, "每張牌會記住本局經驗，休息點可將有記憶的牌變異。", 20, "#ffffff", 0.5, 0.5);
  }

  private drawMap() {
    this.text(58, 110, "選擇下一層節點", 28, "#fff8d8");
    const nodesByFloor = new Map<number, MapNode[]>();
    for (const node of this.engine.run.map) {
      nodesByFloor.set(node.floor, [...(nodesByFloor.get(node.floor) ?? []), node]);
    }
    for (const node of this.engine.run.map) {
      for (const nextId of node.next) {
        const next = this.engine.run.map.find((item) => item.id === nextId);
        if (!next) continue;
        const p1 = this.mapNodePoint(node);
        const p2 = this.mapNodePoint(next);
        const line = this.add.line(0, 0, p1.x, p1.y, p2.x, p2.y, 0xffffff, 0.12).setOrigin(0);
        this.root?.add(line);
      }
    }
    for (const node of this.engine.run.map) {
      const point = this.mapNodePoint(node);
      const reachable = this.engine.run.reachableNodeIds.includes(node.id);
      this.button(
        `map:${node.id}`,
        nodeTypeLabel(node.type),
        point.x - MAP_NODE_RADIUS,
        point.y - MAP_NODE_RADIUS,
        MAP_NODE_RADIUS * 2,
        MAP_NODE_RADIUS * 2,
        () => {
          selectMapNode(this.engine, node.id);
          this.selected = undefined;
          this.render();
        },
        reachable,
        reachable ? 0x2dd4bf : 0x394150
      );
      this.text(point.x, point.y + 42, `F${node.floor}`, 13, "#ffffff", 0.5, 0.5);
    }
    this.drawLog();
  }

  private drawCombat() {
    const combat = this.engine.run.currentCombat;
    if (!combat) return;
    this.text(48, 104, `戰鬥 T${combat.turn}  能量 ${combat.player.energy}/3  格擋 ${combat.player.block}`, 24, "#fff8d8");
    combat.enemies.forEach((enemy, index) => {
      const enemyDef = this.dataModel.enemies.find((item) => item.id === enemy.enemyId)!;
      const x = 360 + index * 260;
      const y = 230;
      this.image(x, y, this.assets.getEnemySprite(enemy.enemyId).key, ENEMY_SIZE, ENEMY_SIZE);
      this.text(x, y + 96, `${enemyDef.name} ${enemy.hp}/${enemy.maxHp}`, 18, "#ffffff", 0.5, 0.5);
      this.text(x, y + 122, `意圖 ${intentLabel(enemy.intent.type)} ${enemy.intent.amount ?? ""}`, 15, "#ffd166", 0.5, 0.5);
      this.button(`enemy:${enemy.instanceId}`, "目標", x - 54, y + 146, 108, 34, () => this.playSelectedOnEnemy(enemy.instanceId), Boolean(this.selected) && enemy.hp > 0, 0xee4266);
    });
    const hand = combat.hand.map((id) => combat.cards.find((card) => card.instanceId === id)).filter(Boolean) as CardInstance[];
    hand.forEach((card, index) => {
      const cardDef = this.dataModel.cards.find((item) => item.id === card.cardId)!;
      const x = 88 + index * 144;
      const y = 492;
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
    this.button("end-turn", "結束回合", 1080, 544, 142, 48, () => {
      endRunTurn(this.engine);
      this.selected = undefined;
      this.render();
    });
    if (this.quick) {
      this.button("auto-win", "測試勝利", 1080, 602, 142, 42, () => {
        autoWinCombat(this.engine);
        this.render();
      }, true, 0x39d98a);
    }
    this.drawLog();
  }

  private drawReward() {
    const reward = this.engine.run.reward;
    if (!reward) return;
    this.text(58, 118, "戰鬥獎勵：選一張牌或跳過拿金幣", 28, "#fff8d8");
    reward.cards.forEach((card, index) => {
      const x = 230 + index * REWARD_CARD_GAP;
      const cardView = renderCardView({
        scene: this,
        context: this.uiContext(),
        data: this.dataModel,
        assets: this.assets,
        x,
        y: 188,
        w: 178,
        h: 248,
        card,
        mode: "reward"
      });
      this.root?.add(cardView);
      this.button(`reward:${card.id}`, card.name, x, 368, 180, 54, () => {
        chooseCardReward(this.engine, card.id);
        this.render();
      });
    });
    if (reward.relic) {
      this.text(850, 212, `精英遺物：${reward.relic.name}`, 20, "#c4b5fd");
    }
    this.button("reward:skip", `跳過 +${reward.gold} 金幣`, 520, 560, 240, 54, () => {
      skipCardReward(this.engine);
      this.render();
    }, true, 0x39d98a);
  }

  private drawRest() {
    this.text(64, 130, "休息點", 34, "#fff8d8");
    this.button("rest:heal", "回血 30%", 230, 300, 220, 64, () => {
      restHeal(this.engine);
      this.render();
    }, true, 0x39d98a);
    const mutable = this.engine.run.deck.find((card) => canMutate(card));
    this.button("rest:mutate", mutable ? "變異一張有記憶的牌" : "沒有可變異的牌", 520, 300, 300, 64, () => {
      restMutate(this.engine, mutable?.instanceId);
      this.render();
    }, Boolean(mutable), 0xf4e04d);
  }

  private drawShop() {
    this.text(64, 112, "商人", 34, "#fff8d8");
    this.engine.run.shop?.forEach((item, index) => {
      const x = 80 + index * (SHOP_ITEM_WIDTH + 18);
      const label = item.kind === "card" ? this.dataModel.cards.find((card) => card.id === item.itemId)?.name : item.kind === "relic" ? this.dataModel.relics.find((relic) => relic.id === item.itemId)?.name : "移除一張牌";
      this.button(`shop:${item.id}`, `${label} ${item.price}G`, x, 220, SHOP_ITEM_WIDTH, 70, () => {
        buyShopItem(this.engine, item.id);
        this.render();
      }, !item.sold && this.engine.run.gold >= item.price);
    });
    this.button("shop:leave", "離開商店", 520, 560, 220, 54, () => {
      leaveShop(this.engine);
      this.render();
    }, true, 0x39d98a);
  }

  private drawEvent() {
    const event = this.engine.run.activeEvent;
    if (!event) return;
    this.image(314, 306, this.assets.getEventImage(event.id).key, 320, 240);
    this.text(520, 148, event.name, 34, "#fff8d8");
    this.text(520, 198, event.body, 20, "#ffffff", 0, 0, EVENT_PANEL_WIDTH);
    event.options.forEach((option, index) => {
      this.button(`event:${option.id}`, option.label, 520, 294 + index * 92, 360, 54, () => {
        chooseEventOption(this.engine, option.id);
        this.render();
      });
      this.text(900, 300 + index * 92, option.description, 15, "#d1d5db", 0, 0, 290);
    });
  }

  private drawEnd(title: string, subtitle: string, color: number) {
    this.text(640, 250, title, 56, "#fff8d8", 0.5, 0.5);
    this.text(640, 310, subtitle, 22, "#ffffff", 0.5, 0.5);
    this.button("restart", "重新開始", 548, 420, 184, 54, () => {
      this.engine = createRun(this.dataModel, { seed: 20260505, quick: this.quick });
      this.selected = undefined;
      this.render();
    }, true, color);
  }

  private drawLog() {
    const lines = this.engine.run.currentCombat?.events.map((event) => event.message).slice(-5) ?? this.engine.run.log.slice(-5);
    this.text(944, 104, lines.join("\n"), 15, "#d1d5db", 0, 0, 294);
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

  private mapNodePoint(node: MapNode) {
    return {
      x: 126 + (node.floor - 1) * 96,
      y: 176 + node.x * 330
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

  private image(x: number, y: number, key: string, w: number, h: number, alpha = 1) {
    if (!this.textures.exists(key)) return;
    const image = this.add.image(x, y, key).setDisplaySize(w, h).setAlpha(alpha);
    this.visibleAssets.push({ key, role: "image" });
    this.root?.add(image);
  }
}

function nodeTypeLabel(type: string): string {
  switch (type) {
    case "normalCombat":
      return "戰";
    case "eliteCombat":
      return "菁";
    case "event":
      return "事";
    case "rest":
      return "息";
    case "shop":
      return "店";
    case "boss":
      return "王";
    default:
      return type;
  }
}

function intentLabel(type: string): string {
  switch (type) {
    case "attack":
      return "攻擊";
    case "block":
      return "格擋";
    case "debuff":
      return "狀態";
    case "mixed":
      return "混合";
    default:
      return type;
  }
}
