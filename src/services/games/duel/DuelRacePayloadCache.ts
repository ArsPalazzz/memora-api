import { DuelRacePayload } from './duel.types';

export class DuelRacePayloadCache {
  private readonly memory = new Map<string, DuelRacePayload>();

  get(duelId: string): DuelRacePayload | null {
    return this.memory.get(duelId) ?? null;
  }

  set(duelId: string, payload: DuelRacePayload): void {
    this.memory.set(duelId, payload);
  }

  has(duelId: string): boolean {
    return this.memory.has(duelId);
  }

  delete(duelId: string): void {
    this.memory.delete(duelId);
  }
}

export default new DuelRacePayloadCache();
