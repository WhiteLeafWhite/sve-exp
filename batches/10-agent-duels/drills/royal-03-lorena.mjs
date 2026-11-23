import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { isDeepStrictEqual } from 'node:util';

// Reproduce the full observed T21 for both evolve decks. This is a postgame
// exercise. The two saved seat strategies resume on T22.
const source = JSON.parse(readFileSync(new URL('../t7B32v/replays/03.json', import.meta.url)));
export function choose({index, view, answers}) {
  if (index < 191 || view.turn !== 21) return null;
  assert(index <= 206);
  const pick = answers.findIndex(input => isDeepStrictEqual(input, source.inputs[index].input));
  assert(pick >= 0, 'The original T21 action must still be available');
  return pick;
}
