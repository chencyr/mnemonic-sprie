import { knownCardEffectIds } from "../data/validate";

export interface EffectResult {
  events: readonly { type: string; payload?: unknown }[];
}

export type EffectHandler = () => EffectResult;

export interface EffectRegistry {
  register(effectId: string, handler: EffectHandler): void;
  has(effectId: string): boolean;
  resolve(effectId: string): EffectHandler;
  ids(): string[];
}

export function createEffectRegistry(): EffectRegistry {
  const handlers = new Map<string, EffectHandler>();

  return {
    register(effectId, handler) {
      if (handlers.has(effectId)) {
        throw new Error(`Effect already registered: ${effectId}`);
      }
      handlers.set(effectId, handler);
    },
    has(effectId) {
      return handlers.has(effectId);
    },
    resolve(effectId) {
      const handler = handlers.get(effectId);
      if (!handler) {
        throw new Error(`Unknown effect id: ${effectId}`);
      }
      return handler;
    },
    ids() {
      return [...handlers.keys()].sort();
    }
  };
}

export function registerMvpEffectPlaceholders(registry: EffectRegistry): EffectRegistry {
  for (const effectId of knownCardEffectIds) {
    registry.register(effectId, () => ({
      events: [{ type: "EFFECT_PLACEHOLDER_RESOLVED", payload: { effectId } }]
    }));
  }
  return registry;
}
