import Phaser from "phaser";
import type { AssetRegistry, EventDefinition, GameData } from "../../core";
import { button, image, label, panel } from "./uiPrimitives";
import { colors } from "./uiTheme";
import type { UiRenderContext } from "./uiTypes";
import { contractOptionLabel } from "./ContractView";

export const EVENT_PANEL_WIDTH = 720;

export function renderEventView(
  scene: Phaser.Scene,
  context: UiRenderContext,
  data: GameData,
  assets: AssetRegistry,
  event: EventDefinition,
  onChoose: (optionId: string) => void
) {
  const root = scene.add.container(0, 0);
  root.add(panel(scene, 58, 102, 1128, 524, event.name));
  const eventImage = image(scene, context, 296, 348, assets.getEventImage(event.id).key, 420, 280, `event:${event.id}`);
  if (eventImage) root.add(eventImage);
  root.add(label(scene, 540, 150, event.body, 18, colors.ink, 560));
  event.options.forEach((option, index) => {
    const y = 242 + index * 128;
    root.add(panel(scene, 540, y, 560, 96, option.label));
    if (option.contractId) {
      const contractIcon = image(scene, context, 570, y + 54, assets.getContractIcon(option.contractId).key, 44, 44, `contract:${option.contractId}`);
      if (contractIcon) root.add(contractIcon);
    }
    root.add(label(scene, 626, y + 38, contractOptionLabel(data, option.contractId) ?? option.description, 13, "#d1d5db", 334));
    root.add(button(scene, context, `event:${option.id}`, "選擇", 982, y + 28, 92, 42, () => onChoose(option.id), true, option.contractId ? colors.red : colors.cyan));
  });
  return root;
}
