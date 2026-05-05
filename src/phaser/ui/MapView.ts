import Phaser from "phaser";
import type { AssetRegistry, MapNode, NodeType } from "../../core";
import { button, image, label, panel } from "./uiPrimitives";
import { colors } from "./uiTheme";
import type { UiRenderContext } from "./uiTypes";

export const MAP_NODE_RADIUS = 34;

export interface MapViewOptions {
  scene: Phaser.Scene;
  context: UiRenderContext;
  assets: AssetRegistry;
  nodes: readonly MapNode[];
  reachableNodeIds: readonly string[];
  currentNodeId?: string;
  onSelectNode: (nodeId: string) => void;
}

export function renderMapView(options: MapViewOptions) {
  const { scene, context, assets, nodes, reachableNodeIds, currentNodeId, onSelectNode } = options;
  const root = scene.add.container(0, 0);
  root.add(panel(scene, 54, 96, 890, 560, "爬塔路線"));
  root.add(panel(scene, 972, 96, 250, 360, "路線提示"));
  for (const node of nodes) {
    for (const nextId of node.next) {
      const next = nodes.find((item) => item.id === nextId);
      if (!next) continue;
      const p1 = mapNodePoint(node);
      const p2 = mapNodePoint(next);
      root.add(scene.add.line(0, 0, p1.x, p1.y, p2.x, p2.y, 0xffffff, 0.16).setOrigin(0));
    }
  }
  for (const node of nodes) {
    const point = mapNodePoint(node);
    const reachable = reachableNodeIds.includes(node.id);
    const current = currentNodeId === node.id;
    const icon = image(scene, context, point.x, point.y, assets.getNodeIcon(node.type).key, reachable ? 58 : 46, reachable ? 58 : 46, `node:${node.type}`, reachable ? 1 : 0.38);
    if (icon) root.add(icon);
    root.add(
      button(scene, context, `map:${node.id}`, "", point.x - MAP_NODE_RADIUS, point.y - MAP_NODE_RADIUS, MAP_NODE_RADIUS * 2, MAP_NODE_RADIUS * 2, () => onSelectNode(node.id), reachable, reachable ? colors.cyan : colors.disabled, 0.02)
    );
    if (reachable) root.add(scene.add.circle(point.x, point.y, 38, 0xf4e04d, 0).setStrokeStyle(3, 0xf4e04d, 0.78));
    if (current) root.add(scene.add.circle(point.x, point.y, 43, 0x39d98a, 0).setStrokeStyle(3, 0x39d98a, 0.84));
    root.add(label(scene, point.x, point.y + 38, `F${node.floor}`, 12, colors.ink).setOrigin(0.5));
  }
  root.add(label(scene, 996, 146, "亮起的節點可以前往。\n圖示代表戰鬥、事件、休息、商店與 Boss。", 15, "#d1d5db", 210));
  return root;
}

export function mapNodePoint(node: MapNode) {
  return {
    x: 108 + (node.floor - 1) * 74,
    y: 190 + node.x * 300
  };
}

export function nodeTypeLabel(type: NodeType) {
  if (type === "normalCombat") return "戰鬥";
  if (type === "eliteCombat") return "精英";
  if (type === "event") return "事件";
  if (type === "rest") return "休息";
  if (type === "shop") return "商店";
  return "Boss";
}
