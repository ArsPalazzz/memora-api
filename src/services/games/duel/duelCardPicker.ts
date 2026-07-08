import { DuelCardPick } from './duel.types';

export function createSeededRandom(seed: number): () => number {
  let state = seed >>> 0;

  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function shuffleWithSeed<T>(items: T[], seed: number): T[] {
  const random = createSeededRandom(seed);
  const copy = [...items];

  for (let index = copy.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(random() * (index + 1));
    [copy[index], copy[swapIndex]] = [copy[swapIndex], copy[index]];
  }

  return copy;
}

export function pickCardsForDuel(params: {
  allCardSubs: string[];
  cardCount: number;
  cardPick: DuelCardPick;
  seed: number;
}): string[] {
  const { allCardSubs, cardCount, cardPick, seed } = params;

  if (allCardSubs.length < cardCount) {
    throw new Error(`Desk has only ${allCardSubs.length} cards, need ${cardCount}`);
  }

  if (cardPick === 'newest') {
    return allCardSubs.slice(0, cardCount);
  }

  return shuffleWithSeed(allCardSubs, seed).slice(0, cardCount);
}
