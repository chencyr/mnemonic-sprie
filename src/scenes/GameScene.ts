import Phaser from "phaser";
import {
  autoWinCombat,
  buyShopItem,
  canMutate,
  chooseCardReward,
  chooseEventOption,
  completeCurrentCombat,
  createRun,
  effectiveCardCost,
  endRunTurn,
  isEnemyAlive,
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
  type CombatEvent,
  type GameData,
  type RunEngine
} from "../core";
import { cameraHit, fadeOutOnDeath, flashTarget, floatText, shakeTarget, type FxTarget } from "../phaser/fx/combatFx";
import { consumeNewCombatEvents, type CombatEventCursor } from "../phaser/fx/combatEventDiff";
import { activeFeedbackItems, mapCombatEventsToFeedback, tickerItems, type CombatFeedbackItem } from "../phaser/fx/combatFeedback";
import {
  createEnemyPresentationSnapshot,
  enemyPresentationState,
  hasPendingEnemyDeathTransitions,
  reconcileEnemyPresentationStates,
  resolveEnemyPresentationTransitions,
  type EnemyPresentationStateMap
} from "../phaser/combat/enemyPresentationState";
import { createCombatPlayerStatusUiState, type CombatPlayerStatusUiState } from "../phaser/ui/combatPlayerStatusUi";
import { canAnyHandCardPlay, playabilityReason, resolveDraggedCardPlay, type CardDropResult, type DropZoneKind } from "../phaser/input/cardPlayRules";
import { CARD_HEIGHT, CARD_WIDTH, renderCardView } from "../phaser/ui/CardView";
import {
  combatLayout,
  enemyPose,
  handCardPose,
  renderCombatBackground,
  renderCombatHandTray,
  renderCombatPlayerPanel,
  renderCombatTickerSurface,
  renderCombatTopResource,
  renderCombatTurnDevice
} from "../phaser/ui/CombatSceneView";
import { renderEnemyView } from "../phaser/ui/EnemyView";
import { renderEventView } from "../phaser/ui/EventView";
import { HUD_FONT, renderHudShell } from "../phaser/ui/HudView";
import { renderMapView } from "../phaser/ui/MapView";
import { renderRewardView } from "../phaser/ui/RewardView";
import { renderShopView } from "../phaser/ui/ShopView";
import { label, panel } from "../phaser/ui/uiPrimitives";
import { layout } from "../phaser/ui/uiTheme";
import type { ButtonDescriptor, UiRenderContext, VisibleAssetDescriptor } from "../phaser/ui/uiTypes";

const WIDTH = 1280;
const HEIGHT = 720;

type Selection = { cardInstanceId: string } | undefined;
type MusicKey = "audio:bgm" | "audio:combatBgm";

interface DragCardState {
  active: boolean;
  cardInstanceId?: string;
  originX?: number;
  originY?: number;
  currentX?: number;
  currentY?: number;
  validDropZone?: DropZoneKind;
  hoverEnemyId?: string;
  reasonIfBlocked?: string;
}

interface DropRect {
  id?: string;
  x: number;
  y: number;
  w: number;
  h: number;
}

interface TurnTransitionState {
  kind: "manual" | "autoNoPlayableCards";
  message: string;
  dueAt: number;
  timer?: Phaser.Time.TimerEvent;
}

interface VictoryTransitionState {
  message: string;
  dueAt: number;
  timer?: Phaser.Time.TimerEvent;
}

interface RenderAnchor {
  x: number;
  y: number;
  target: FxTarget;
}

interface CombatRenderAnchors {
  player?: RenderAnchor;
  enemies: Map<string, RenderAnchor>;
}

interface CombatPlayerStatusUiSnapshot extends CombatPlayerStatusUiState {
  visible: boolean;
  reference: "battle-design-proposal-1";
  assetRoles: string[];
}

interface TextSnapshot {
  note: string;
  mode: string;
  run: ReturnType<typeof snapshotRun>;
  selectedCard?: string;
  buttons: ButtonDescriptor[];
  drag: DragCardState;
  turnTransition?: {
    kind: TurnTransitionState["kind"];
    message: string;
  };
  victoryTransition?: {
    message: string;
  };
  combatEnemyArena?: ReturnType<typeof createEnemyPresentationSnapshot>;
  feedback: {
    active: CombatFeedbackItem[];
    ticker: CombatFeedbackItem[];
    center: CombatFeedbackItem[];
  };
  combatUi?: {
    reference: "battle-design-proposal-3";
    assetRoles: string[];
  };
  playerStatusUi?: CombatPlayerStatusUiSnapshot;
  audio: {
    muted: boolean;
    started: boolean;
    currentMusic?: MusicKey;
  };
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
  private combatEventCursor: CombatEventCursor = { eventCount: 0 };
  private readonly quick = new URLSearchParams(window.location.search).has("e2e");
  private muted = true;
  private audioStarted = false;
  private activeMusic?: MusicKey;
  private dragCard: DragCardState = { active: false };
  private cardPointerDown?: { cardInstanceId: string; x: number; y: number };
  private enemyDropZones = new Map<string, DropRect>();
  private battlefieldDropZone?: DropRect;
  private playerDropZone?: DropRect;
  private handDropZone?: DropRect;
  private dragFeedback?: Phaser.GameObjects.Graphics;
  private turnTransition?: TurnTransitionState;
  private victoryTransition?: VictoryTransitionState;
  private enemyPresentationStates: EnemyPresentationStateMap = new Map();
  private enemyPresentationTimer?: Phaser.Time.TimerEvent;
  private feedbackItems: CombatFeedbackItem[] = [];
  private feedbackSequence = 0;
  private virtualNow = 0;

  constructor() {
    super("GameScene");
  }

  create() {
    this.dataModel = this.registry.get("gameData") as GameData;
    this.assets = this.registry.get("assetRegistry") as AssetRegistry;
    this.engine = createRun(this.dataModel, { seed: 20260505, quick: this.quick });
    window.mnemonicSpireScene = this;
    window.render_game_to_text = () => JSON.stringify(this.snapshot());
    window.advanceTime = (ms: number) => {
      this.virtualNow += ms;
      this.resolvePendingTurnTransition();
      this.resolvePendingEnemyPresentationTransitions();
      this.resolvePendingVictoryTransition();
      this.render();
    };
    this.input.keyboard?.on("keydown-F", () => {
      if (this.scale.isFullscreen) this.scale.stopFullscreen();
      else this.scale.startFullscreen();
    });
    this.render();
  }

  private render() {
    if (this.engine?.run.mode !== "combat") {
      this.turnTransition = undefined;
      this.victoryTransition = undefined;
      this.feedbackItems = [];
      this.enemyPresentationStates.clear();
      this.enemyPresentationTimer?.remove(false);
      this.enemyPresentationTimer = undefined;
    }
    this.clearDragFeedback();
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
    this.syncMusicForMode();
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
    if (this.engine.run.mode === "combat") return;
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
      this.combatEventCursor = { eventCount: 0 };
      this.turnTransition = undefined;
      this.victoryTransition = undefined;
      this.feedbackItems = [];
      this.feedbackSequence = 0;
      this.dragCard = { active: false };
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
    resolveEnemyPresentationTransitions(this.enemyPresentationStates, this.virtualNow);
    const presentationUpdate = reconcileEnemyPresentationStates(this.enemyPresentationStates, combat.enemies, this.virtualNow, this.quick);
    if (presentationUpdate.newlyDyingEnemyIds.length > 0) {
      this.turnTransition = undefined;
      this.selected = undefined;
      if (this.dragCard.active) this.dragCard = { active: false, reasonIfBlocked: "目標已倒下。" };
      this.clearDragFeedback();
    }
    this.schedulePendingEnemyPresentationTransition();
    this.enemyDropZones = new Map();
    this.root?.add(renderCombatBackground(this, this.uiContext(), this.assets));
    this.root?.add(renderCombatTopResource(this, this.engine.run));
    this.battlefieldDropZone = { x: combatLayout.battlefield.x, y: combatLayout.battlefield.y, w: combatLayout.battlefield.w, h: combatLayout.battlefield.h };
    this.playerDropZone = { x: combatLayout.playerPanel.x, y: combatLayout.playerPanel.y, w: combatLayout.playerPanel.w, h: combatLayout.playerPanel.h };
    this.handDropZone = { x: combatLayout.handTray.x, y: combatLayout.handTray.y, w: combatLayout.handTray.w, h: combatLayout.handTray.h };
    const anchors: CombatRenderAnchors = { enemies: new Map() };
    const playerStatusUi = createCombatPlayerStatusUiState(combat);
    const playerPanel = renderCombatPlayerPanel(this, this.uiContext(), this.assets, playerStatusUi);
    this.root?.add(playerPanel);
    anchors.player = {
      x: combatLayout.playerPanel.x + combatLayout.playerPanel.w / 2,
      y: combatLayout.playerPanel.y + 110,
      target: playerPanel as FxTarget
    };
    combat.enemies.forEach((enemy, index) => {
      const pose = enemyPose(index, combat.enemies.length);
      const x = pose.x;
      const y = pose.y;
      const enemyView = renderEnemyView({
        scene: this,
        context: this.uiContext(),
        data: this.dataModel,
        assets: this.assets,
        enemy,
        presentationState: enemyPresentationState(this.enemyPresentationStates, enemy),
        x,
        y,
        selectedTargetEnabled: Boolean(this.selected),
        platformKey: this.assets.getCombatUiAsset("enemyPlatform").key,
        targetRingKey: this.assets.getCombatUiAsset("targetRing").key,
        onTarget: () => this.playSelectedOnEnemy(enemy.instanceId)
      });
      this.root?.add(enemyView);
      anchors.enemies.set(enemy.instanceId, {
        x,
        y,
        target: enemyView as FxTarget
      });
      if (isEnemyAlive(enemy) && enemyPresentationState(this.enemyPresentationStates, enemy) === "alive") {
        this.enemyDropZones.set(enemy.instanceId, { id: enemy.instanceId, x: x - 110, y: y - 122, w: 220, h: 260 });
      }
    });
    const diff = consumeNewCombatEvents(this.combatEventCursor, combat.id, combat.events);
    this.combatEventCursor = diff.cursor;
    this.ingestCombatFeedback(diff.events);
    const hand = combat.hand.map((id) => combat.cards.find((card) => card.instanceId === id)).filter(Boolean) as CardInstance[];
    const logPanel = renderCombatTickerSurface(this);
    this.renderCombatTicker(logPanel);
    this.root?.add(logPanel);
    const handPanel = renderCombatHandTray(this);
    this.root?.add(handPanel);
    hand.forEach((card, index) => {
      const cardDef = this.dataModel.cards.find((item) => item.id === card.cardId)!;
      const pose = handCardPose(index, hand.length);
      const selected = this.selected?.cardInstanceId === card.instanceId;
      const cardView = renderCardView({
        scene: this,
        context: this.uiContext(),
        data: this.dataModel,
        assets: this.assets,
        x: pose.x,
        y: pose.y,
        card: cardDef,
        instance: card,
        selected,
        playable: effectiveCardCost(this.dataModel, card) <= combat.player.energy && !this.victoryTransition,
        mode: "hand"
      });
      cardView.setRotation(pose.rotation);
      this.root?.add(cardView);
      this.registerCardInput(cardView, card.instanceId, pose.x, pose.y, effectiveCardCost(this.dataModel, card) <= combat.player.energy && !this.turnTransition && !this.victoryTransition);
    });
    const turnDevice = renderCombatTurnDevice(this, combat.turn, combat.player.energy);
    this.root?.add(turnDevice);
    this.button("end-turn", "結束回合", combatLayout.turnDevice.x + 48, combatLayout.turnDevice.y + 92, 142, 54, () => {
      this.beginTurnTransition("manual");
    }, !this.turnTransition && !this.victoryTransition);
    if (this.quick) {
      this.button("auto-win", "測試勝利", 24, 656, 132, 40, () => {
        autoWinCombat(this.engine);
        this.render();
      }, !this.victoryTransition, 0x39d98a);
    }
    this.renderCenterFeedback();
    this.playCombatFx(diff.events, anchors);
  }

  private ingestCombatFeedback(events: readonly CombatEvent[]) {
    const now = this.feedbackNow();
    const mapped = mapCombatEventsToFeedback(events, { now, sequenceStart: this.feedbackSequence });
    this.feedbackSequence += events.length;
    this.feedbackItems = activeFeedbackItems([...this.feedbackItems, ...mapped], now);
  }

  private renderCombatTicker(logPanel: Phaser.GameObjects.Container) {
    const active = this.feedbackSnapshot();
    const rows = active.ticker.map((item) => ({ text: item.tickerText, color: this.feedbackColor(item.type) }));

    if (this.turnTransition) rows.push({ text: this.turnTransition.message, color: "#f4e04d" });
    if (this.victoryTransition) rows.push({ text: this.victoryTransition.message, color: "#c4b5fd" });
    if (this.dragCard.reasonIfBlocked) rows.push({ text: this.dragCard.reasonIfBlocked, color: "#ff9f6e" });

    const visibleRows = rows.slice(-6);
    if (visibleRows.length === 0) {
      logPanel.add(label(this, 20, 64, "等待行動", 13, "#d1d5db", combatLayout.ticker.w - 36));
      return;
    }

    visibleRows.forEach((row, index) => {
      const y = 62 + index * 42;
      const dot = this.add.circle(22, y + 7, 4, Phaser.Display.Color.HexStringToColor(row.color).color, 0.95);
      const text = label(this, 34, y, row.text, 12, row.color, combatLayout.ticker.w - 48);
      logPanel.add([dot, text]);
    });
  }

  private renderCenterFeedback() {
    const center = this.feedbackSnapshot().center.at(-1);
    if (!center) return;
    const box = this.add.container(WIDTH / 2, 128);
    const bg = this.add.rectangle(0, 0, 310, 48, 0x101318, 0.78).setStrokeStyle(2, 0xffffff, 0.22);
    const text = this.add
      .text(0, 0, center.text, {
        color: this.feedbackColor(center.type),
        fontFamily: HUD_FONT,
        fontSize: "22px",
        fontStyle: "900"
      })
      .setOrigin(0.5);
    box.add([bg, text]);
    box.setDepth(14);
    this.root?.add(box);
  }

  private feedbackSnapshot() {
    const active = activeFeedbackItems(this.feedbackItems, this.feedbackNow());
    const ticker = tickerItems(active);
    const center = active.filter((item) => item.center);
    return { active, ticker, center };
  }

  private feedbackNow() {
    return Math.max(this.virtualNow, Math.floor(this.time.now));
  }

  private feedbackColor(type: CombatFeedbackItem["type"]) {
    switch (type) {
      case "damage":
        return "#ff6b6b";
      case "block":
        return "#8be9d1";
      case "memory":
        return "#c4b5fd";
      case "draw":
        return "#f4e04d";
      case "death":
        return "#ff9f6e";
      case "turn":
        return "#f4e04d";
      case "system":
        return "#d1d5db";
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
      this.combatEventCursor = { eventCount: 0 };
      this.turnTransition = undefined;
      this.victoryTransition = undefined;
      this.feedbackItems = [];
      this.feedbackSequence = 0;
      this.dragCard = { active: false };
      this.render();
    }, true, color);
  }

  private registerCardInput(cardView: Phaser.GameObjects.Container, cardInstanceId: string, x: number, y: number, enabled: boolean) {
    const hitRect = this.button(`card:${cardInstanceId}`, "", x, y, CARD_WIDTH, CARD_HEIGHT, () => undefined, enabled, 0x2b3340, 0.02);
    if (!enabled) return;
    this.input.setDraggable(hitRect);
    hitRect.on("pointerdown", (pointer: Phaser.Input.Pointer) => {
      this.cardPointerDown = { cardInstanceId, x: pointer.x, y: pointer.y };
    });
    hitRect.on("pointerup", (pointer: Phaser.Input.Pointer) => {
      const down = this.cardPointerDown;
      this.cardPointerDown = undefined;
      if (!down || down.cardInstanceId !== cardInstanceId) return;
      if (Phaser.Math.Distance.Between(down.x, down.y, pointer.x, pointer.y) <= 8) {
        this.dragCard = { active: false };
        this.clearDragFeedback();
        this.selectOrPlayCard(cardInstanceId);
      }
    });
    hitRect.on("dragstart", () => this.beginCardDrag(cardInstanceId, x, y));
    hitRect.on("drag", (_pointer: Phaser.Input.Pointer, dragX: number, dragY: number) => this.updateCardDrag(cardView, hitRect, cardInstanceId, dragX, dragY));
    hitRect.on("dragend", (pointer: Phaser.Input.Pointer) => this.finishCardDrag(cardInstanceId, pointer.x, pointer.y));
  }

  private beginCardDrag(cardInstanceId: string, originX: number, originY: number) {
    const combat = this.engine.run.currentCombat;
    this.dragCard = {
      active: true,
      cardInstanceId,
      originX,
      originY,
      currentX: originX,
      currentY: originY,
      reasonIfBlocked: combat ? playabilityReason(this.dataModel, combat, cardInstanceId) : "沒有戰鬥。"
    };
    this.playSfx("audio:cardDragStart", 0.42);
  }

  private updateCardDrag(cardView: Phaser.GameObjects.Container, hitRect: Phaser.GameObjects.Rectangle, cardInstanceId: string, dragX: number, dragY: number) {
    if (this.dragCard.cardInstanceId !== cardInstanceId) return;
    cardView.setPosition(dragX, dragY);
    hitRect.setPosition(dragX, dragY);
    cardView.setDepth(20);
    hitRect.setDepth(21);
    const drop = this.dropResultAt(dragX + CARD_WIDTH / 2, dragY + CARD_HEIGHT / 2);
    this.dragCard = {
      ...this.dragCard,
      currentX: dragX,
      currentY: dragY,
      validDropZone: drop.zone,
      hoverEnemyId: drop.enemyId
    };
    this.updateDragFeedback(drop);
  }

  private finishCardDrag(cardInstanceId: string, pointerX: number, pointerY: number) {
    if (this.dragCard.cardInstanceId !== cardInstanceId) return;
    const down = this.cardPointerDown;
    if (down?.cardInstanceId === cardInstanceId && Phaser.Math.Distance.Between(down.x, down.y, pointerX, pointerY) <= 8) {
      this.clearDragFeedback();
      this.cardPointerDown = undefined;
      this.dragCard = { active: false };
      this.selectOrPlayCard(cardInstanceId);
      return;
    }
    const combat = this.engine.run.currentCombat;
    const drop = this.dropResultAt(pointerX, pointerY);
    this.clearDragFeedback();
    this.cardPointerDown = undefined;
    this.dragCard = { active: false };
    if (!combat) {
      this.render();
      return;
    }
    const resolved = resolveDraggedCardPlay(this.dataModel, combat, cardInstanceId, drop);
    if (!resolved.ok) {
      this.playSfx("audio:cardDropCancel", 0.48);
      this.dragCard = { active: false, reasonIfBlocked: resolved.reason };
      this.render();
      return;
    }
    playRunCard(this.engine, cardInstanceId, resolved.targetEnemyId, resolved.targetCardId, { completeVictory: false });
    this.selected = undefined;
    this.playSfx("audio:cardDropPlay", 0.46);
    if (!this.maybeBeginVictoryTransition()) this.maybeBeginAutoEndTurn();
    this.render();
  }

  private dropResultAt(x: number, y: number): CardDropResult {
    for (const zone of this.enemyDropZones.values()) {
      if (pointInRect(x, y, zone)) return { zone: "enemy", enemyId: zone.id };
    }
    if (this.handDropZone && pointInRect(x, y, this.handDropZone)) return { zone: "hand" };
    if (this.playerDropZone && pointInRect(x, y, this.playerDropZone)) return { zone: "player" };
    if (this.battlefieldDropZone && pointInRect(x, y, this.battlefieldDropZone)) return { zone: "battlefield" };
    return { zone: "invalid" };
  }

  private updateDragFeedback(drop: CardDropResult) {
    if (!this.dragFeedback) {
      this.dragFeedback = this.add.graphics();
      this.root?.add(this.dragFeedback);
    }
    this.dragFeedback.clear();
    const color = drop.zone === "invalid" || drop.zone === "hand" ? 0xee4266 : 0x39d98a;
    const rect = drop.enemyId ? this.enemyDropZones.get(drop.enemyId) : drop.zone === "player" ? this.playerDropZone : drop.zone === "battlefield" ? this.battlefieldDropZone : undefined;
    if (!rect) return;
    this.dragFeedback.lineStyle(4, color, 0.78).strokeRect(rect.x, rect.y, rect.w, rect.h);
  }

  private clearDragFeedback() {
    this.dragFeedback?.destroy();
    this.dragFeedback = undefined;
  }

  private maybeBeginAutoEndTurn() {
    const combat = this.engine.run.currentCombat;
    if (!combat || this.engine.run.mode !== "combat" || combat.phase !== "player") return;
    if (canAnyHandCardPlay(this.dataModel, combat)) return;
    this.beginTurnTransition("autoNoPlayableCards");
  }

  private beginTurnTransition(kind: TurnTransitionState["kind"]) {
    if (this.turnTransition || this.victoryTransition || this.engine.run.mode !== "combat") return;
    const delayMs = kind === "manual" ? 240 : 650;
    const message = kind === "manual" ? "回合結束。" : "沒有可出的牌，自動結束回合。";
    this.playSfx(kind === "manual" ? "audio:cardDropPlay" : "audio:autoEndTurn", 0.5);
    const transition: TurnTransitionState = { kind, message, dueAt: this.virtualNow + delayMs };
    transition.timer = this.time.delayedCall(delayMs, () => {
      this.resolvePendingTurnTransition(true);
      this.render();
    });
    this.turnTransition = transition;
    this.selected = undefined;
    this.render();
  }

  private resolvePendingTurnTransition(force = false) {
    if (!this.turnTransition) return;
    if (!force && this.virtualNow < this.turnTransition.dueAt) return;
    this.turnTransition.timer?.remove(false);
    this.turnTransition = undefined;
    if (this.engine.run.mode !== "combat" || !this.engine.run.currentCombat) return;
    endRunTurn(this.engine, { completeVictory: false });
    this.selected = undefined;
    this.maybeBeginVictoryTransition();
  }

  private maybeBeginVictoryTransition(): boolean {
    const combat = this.engine.run.currentCombat;
    if (this.engine.run.mode !== "combat" || !combat || combat.phase !== "victory") return false;
    reconcileEnemyPresentationStates(this.enemyPresentationStates, combat.enemies, this.virtualNow, this.quick);
    this.beginVictoryTransition();
    return true;
  }

  private beginVictoryTransition() {
    if (this.victoryTransition || this.engine.run.mode !== "combat") return;
    const pendingDueAt = this.nextPendingEnemyDeathDueAt();
    const dueAt = pendingDueAt ?? this.virtualNow + (this.quick ? 50 : 1000);
    const delayMs = Math.max(0, dueAt - this.virtualNow);
    const transition: VictoryTransitionState = { message: "敵人倒下，記憶正在沉澱。", dueAt };
    transition.timer = this.time.delayedCall(delayMs, () => {
      this.virtualNow = Math.max(this.virtualNow, dueAt);
      this.resolvePendingEnemyPresentationTransitions();
      this.resolvePendingVictoryTransition(true);
      this.render();
    });
    this.victoryTransition = transition;
    this.turnTransition = undefined;
    this.selected = undefined;
  }

  private resolvePendingVictoryTransition(force = false) {
    if (!this.victoryTransition) return;
    if (!force && this.virtualNow < this.victoryTransition.dueAt) return;
    resolveEnemyPresentationTransitions(this.enemyPresentationStates, this.virtualNow);
    if (hasPendingEnemyDeathTransitions(this.enemyPresentationStates)) return;
    this.victoryTransition.timer?.remove(false);
    this.victoryTransition = undefined;
    if (this.engine.run.mode !== "combat" || this.engine.run.currentCombat?.phase !== "victory") return;
    completeCurrentCombat(this.engine);
    this.selected = undefined;
  }

  private resolvePendingEnemyPresentationTransitions() {
    const result = resolveEnemyPresentationTransitions(this.enemyPresentationStates, this.virtualNow);
    if (result.changed) this.resolvePendingVictoryTransition();
  }

  private schedulePendingEnemyPresentationTransition() {
    if (this.enemyPresentationTimer) return;
    const pendingEnemyDeathDueAt = this.nextPendingEnemyDeathDueAt();
    if (typeof pendingEnemyDeathDueAt !== "number") return;
    const delay = Math.max(0, pendingEnemyDeathDueAt - this.virtualNow);
    this.enemyPresentationTimer = this.time.delayedCall(delay, () => {
      this.enemyPresentationTimer = undefined;
      this.virtualNow = Math.max(this.virtualNow, pendingEnemyDeathDueAt);
      this.resolvePendingEnemyPresentationTransitions();
      this.render();
    });
  }

  private nextPendingEnemyDeathDueAt() {
    return Array.from(this.enemyPresentationStates.values())
      .filter((entry) => entry.state === "dying" && typeof entry.dueAt === "number")
      .map((entry) => entry.dueAt as number)
      .sort((a, b) => a - b)[0];
  }

  private playSfx(key: string, volume = 0.5) {
    if (this.muted || !this.audioStarted) return;
    if (this.cache.audio.exists(key)) this.sound.play(key, { volume });
  }

  private playCombatFx(events: readonly CombatEvent[], anchors: CombatRenderAnchors) {
    for (const event of events) {
      if (event.type === "DAMAGE_DEALT") {
        this.playSfx("audio:attackHit", 0.48);
        const payload = event.payload as { enemy?: string; damage?: number } | undefined;
        const anchor = payload?.enemy ? anchors.enemies.get(payload.enemy) : undefined;
        if (payload?.damage && payload.damage > 0) {
          shakeTarget(this, anchor?.target, 7, 160);
          flashTarget(this, anchor?.target, 0xffffff, 90);
          floatText(this, anchor?.x ?? 620, (anchor?.y ?? 240) - 86, `-${payload.damage}`, { color: "#ff6b6b" });
        }
        const enemy = payload?.enemy ? this.engine.run.currentCombat?.enemies.find((item) => item.instanceId === payload.enemy) : undefined;
        if (enemy?.state === "dead") fadeOutOnDeath(this, anchor?.target);
      }

      if (event.type === "PLAYER_DAMAGED") {
        this.playSfx("audio:enemyAttack", 0.48);
        const payload = event.payload as { damage?: number } | undefined;
        const damage = payload?.damage ?? 0;
        if (damage > 0) {
          shakeTarget(this, anchors.player?.target, 5, 140);
          flashTarget(this, anchors.player?.target, 0xee4266, 100);
          floatText(this, anchors.player?.x ?? 130, anchors.player?.y ?? 190, `-${damage} HP`, { color: "#ff6b6b" });
          cameraHit(this, 0.004, 120);
        } else {
          floatText(this, anchors.player?.x ?? 130, anchors.player?.y ?? 190, "格擋", { color: "#8be9d1", fontSize: 18 });
        }
      }

      if (event.type === "BLOCK_GAINED") {
        const payload = event.payload as { block?: number } | undefined;
        const block = payload?.block ?? 0;
        if (block > 0) {
          this.playSfx("audio:blockGain", 0.42);
          flashTarget(this, anchors.player?.target, 0x8be9d1, 90);
          floatText(this, anchors.player?.x ?? 130, (anchors.player?.y ?? 190) + 76, `+${block} 格擋`, { color: "#8be9d1", fontSize: 18, dy: 34 });
        }
      }

      if (event.type === "ENEMY_BLOCK_GAINED") {
        const payload = event.payload as { enemy?: string; block?: number } | undefined;
        const block = payload?.block ?? 0;
        const anchor = payload?.enemy ? anchors.enemies.get(payload.enemy) : undefined;
        if (block > 0) {
          flashTarget(this, anchor?.target, 0x8be9d1, 90);
          floatText(this, anchor?.x ?? 620, (anchor?.y ?? 240) - 52, `+${block} 格擋`, { color: "#8be9d1", fontSize: 18, dy: 34 });
        }
      }

      if (event.type === "MEMORY_PROGRESS_GAINED") {
        this.playSfx("audio:memoryGained", 0.42);
        floatText(this, layout.hand.x + layout.hand.w / 2, layout.hand.y + 30, "記憶 +1", { color: "#c4b5fd", fontSize: 20, dy: 30 });
      }

      if (event.type === "CARDS_DRAWN") {
        const payload = event.payload as { cards?: string[] } | undefined;
        const count = payload?.cards?.length ?? 0;
        if (count > 0) {
          floatText(this, layout.hand.x + layout.hand.w / 2, layout.hand.y + 48, `抽 ${count} 張`, { color: "#f4e04d", fontSize: 18, dy: 28 });
        }
      }

      if (event.type === "ENEMY_STATE_CHANGED") {
        const payload = event.payload as { enemy?: string; to?: string } | undefined;
        if (payload?.to === "dead") {
          this.playSfx("audio:enemyDefeat", 0.5);
          const anchor = payload.enemy ? anchors.enemies.get(payload.enemy) : undefined;
          fadeOutOnDeath(this, anchor?.target);
          floatText(this, anchor?.x ?? 620, (anchor?.y ?? 240) - 126, "擊倒", { color: "#ff6b6b", fontSize: 20, dy: 26, duration: 900 });
        }
      }
    }
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
    playRunCard(this.engine, cardInstanceId, undefined, targetCardId, { completeVictory: false });
    this.selected = undefined;
    this.playSfx("audio:cardDropPlay", 0.46);
    if (!this.maybeBeginVictoryTransition()) this.maybeBeginAutoEndTurn();
    this.render();
  }

  private playSelectedOnEnemy(enemyId: string) {
    if (!this.selected) return;
    const combat = this.engine.run.currentCombat;
    const selectedCard = combat?.cards.find((card) => card.instanceId === this.selected?.cardInstanceId);
    const definition = selectedCard ? this.dataModel.cards.find((card) => card.id === selectedCard.cardId) : undefined;
    const targetCardId = definition?.target === "handCard" ? combat?.hand.find((id) => id !== selectedCard?.instanceId) : undefined;
    playRunCard(this.engine, this.selected.cardInstanceId, enemyId, targetCardId, { completeVictory: false });
    this.selected = undefined;
    this.playSfx("audio:cardDropPlay", 0.46);
    if (!this.maybeBeginVictoryTransition()) this.maybeBeginAutoEndTurn();
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
    this.audioStarted = true;
    this.syncMusicForMode();
  }

  private syncMusicForMode() {
    if (!this.audioStarted) return;
    const nextMusic: MusicKey = this.engine.run.mode === "combat" ? "audio:combatBgm" : "audio:bgm";
    if (this.activeMusic === nextMusic) return;
    if (this.activeMusic) this.sound.stopByKey(this.activeMusic);
    this.sound.stopByKey(nextMusic);
    this.sound.play(nextMusic, { loop: true, volume: nextMusic === "audio:combatBgm" ? 0.34 : 0.28 });
    this.activeMusic = nextMusic;
  }

  private snapshot(): TextSnapshot {
    const run = this.engine.run;
    const combat = run.currentCombat;
    const playerStatusUi = combat ? createCombatPlayerStatusUiState(combat) : undefined;
    return {
      note: "座標使用 Phaser Canvas 像素，原點在左上，x 往右，y 往下。buttons 內提供目前可點擊元素中心與尺寸。",
      mode: run.mode,
      run: snapshotRun(run),
      selectedCard: this.selected?.cardInstanceId,
      buttons: this.buttons,
      drag: this.dragCard,
      turnTransition: this.turnTransition ? { kind: this.turnTransition.kind, message: this.turnTransition.message } : undefined,
      victoryTransition: this.victoryTransition ? { message: this.victoryTransition.message } : undefined,
      combatEnemyArena: combat ? createEnemyPresentationSnapshot(this.enemyPresentationStates, combat.enemies) : undefined,
      feedback: this.feedbackSnapshot(),
      combatUi:
        run.mode === "combat"
          ? {
              reference: "battle-design-proposal-3",
              assetRoles: this.visibleAssets.filter((asset) => asset.role.startsWith("combat-ui:")).map((asset) => asset.role)
            }
          : undefined,
      playerStatusUi:
        playerStatusUi && run.mode === "combat"
          ? {
              ...playerStatusUi,
              visible: this.visibleAssets.some((asset) => asset.role === "combat-ui:player-status-base"),
              reference: "battle-design-proposal-1",
              assetRoles: this.visibleAssets.filter((asset) => asset.role.startsWith("combat-ui:player-status")).map((asset) => asset.role)
            }
          : undefined,
      audio: {
        muted: this.muted,
        started: this.audioStarted,
        currentMusic: this.activeMusic
      },
      combat: combat
        ? {
            phase: combat.phase,
            turn: combat.turn,
            energy: combat.player.energy,
            block: combat.player.block,
            playerHp: combat.player.hp,
            playerMaxHp: combat.player.maxHp,
            playerBlock: combat.player.block,
            hand: combat.hand.map((id) => {
              const card = combat.cards.find((item) => item.instanceId === id)!;
              const def = this.dataModel.cards.find((item) => item.id === card.cardId)!;
              return { id, cardId: card.cardId, name: card.mutation?.name ?? def.name, cost: effectiveCardCost(this.dataModel, card), type: def.type };
            }),
            enemies: combat.enemies.map((enemy) => ({
              id: enemy.instanceId,
              enemyId: enemy.enemyId,
              state: enemy.state,
              gameplayState: enemy.state,
              presentationState: enemyPresentationState(this.enemyPresentationStates, enemy),
              hp: enemy.hp,
              maxHp: enemy.maxHp,
              intent: enemy.intent.type
            })),
            events: combat.events.slice(-8).map((event) => ({
              type: event.type,
              message: event.message,
              payload: event.payload
            }))
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

function pointInRect(x: number, y: number, rect: DropRect) {
  return x >= rect.x && x <= rect.x + rect.w && y >= rect.y && y <= rect.y + rect.h;
}
