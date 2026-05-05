import Phaser from "phaser";
import type { ActiveContract, AssetRegistry, GameData } from "../../core";
import { image, label } from "./uiPrimitives";
import { colors } from "./uiTheme";
import type { UiRenderContext } from "./uiTypes";

export function renderContractRow(scene: Phaser.Scene, context: UiRenderContext, _data: GameData, assets: AssetRegistry, contracts: readonly ActiveContract[], x: number, y: number) {
  const container = scene.add.container(x, y);
  container.add(label(scene, 0, 0, "契約", 14, "#fecdd3"));
  if (contracts.length === 0) {
    container.add(label(scene, 48, 0, "無", 13, colors.muted));
    return container;
  }
  contracts.slice(0, 5).forEach((contract, index) => {
    const icon = image(scene, context, 54 + index * 40, 8, assets.getContractIcon(contract.id).key, 30, 30, `contract:${contract.id}`);
    if (icon) container.add(icon);
    container.add(label(scene, 64 + index * 40, 24, String(contract.remainingUses), 10, "#ffffff").setOrigin(0.5));
  });
  return container;
}

export function contractOptionLabel(data: GameData, contractId?: string) {
  if (!contractId) return undefined;
  const contract = data.contracts.find((item) => item.id === contractId);
  return contract ? `${contract.name}: ${contract.benefit} / ${contract.cost}` : undefined;
}
