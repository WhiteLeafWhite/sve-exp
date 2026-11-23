// Only the active seat's hand, public cards and candidates revealed for this decision are used.
function first(answers, test) {
  const index = answers.findIndex(test);
  return index < 0 ? null : index;
}

function destructionRune({ me, enemy, decision, resolution, answers }) {
  const available = [...me.hand, ...me.ex];
  const field = me.field.filter(card => !card.hidden);
  const source = [...field, ...resolution].find(card => card.id === decision.source);
  const has = (cards, def) => cards.some(card => card.def === def);

  if (decision.type === "selectCards") {
    const candidate = def => first(answers, answer => answer.cards?.length === 1 &&
      decision.candidateDefs[decision.candidates.indexOf(answer.cards[0])] === def);

    if (source?.def === "BP20-055" && decision.reason === "effect" &&
        me.maxPlayPoints === 1 && me.playPoints === 0 && has(me.hand, "BP20-055")) {
      // A spare Wasteland turns a zero-cost Joy into another pair of cards to inspect.
      // Take a castable body directly when it is already visible.
      const follower = candidate("BP15-054");
      return follower ?? candidate("BP08-051");
    }

    if (source?.def === "BP20-040" && decision.reason === "search" &&
        me.maxPlayPoints === 2 && me.evolutionPoints > 0 && !has(available, "BP15-039")) {
      return candidate("BP15-039");
    }

    if (source?.def === "BP15-PR12" && decision.reason === "pick") {
      const targets = enemy.field.filter(card => !card.hidden && card.type === "follower");
      if (targets.length !== 1) return null;
      const required = Math.ceil((targets[0].defense - targets[0].damage) / 2);
      const fieldById = new Map(field.map(card => [card.id, card]));
      // A single damage effect. First tap amulets, then expose the least attack among followers.
      let best = null;
      let price = Infinity;
      for (const [index, answer] of answers.entries()) {
        if (answer.cards?.length !== required) continue;
        const cards = answer.cards.map(id => fieldById.get(id));
        if (cards.some(card => !card)) continue;
        const cost = cards.reduce((sum, card) => sum + (card.type === "follower" ? 8 + card.attack : 0), 0);
        if (cost < price) { best = index; price = cost; }
      }
      return best;
    }
  }

  if (decision.type === "mainPhase" && me.maxPlayPoints === 1 && field.length > 0 &&
      field.every(card => card.def === "BP20-055")) {
    const play = def => first(answers, answer => answer.action?.type === "play" &&
      available.some(card => card.id === answer.action.card && card.def === def));
    if (has(me.hand, "BP20-055")) {
      const land = play("BP20-055");
      if (land !== null) return land;
      if (me.playPoints === 0) return play("BP08-051");
    }
    // No follower, usable one-drop, or one-point response. Save Joy for a later turn.
    if (me.playPoints === 0 && available.every(card => card.cost > 1 || card.def === "BP08-051")) {
      return first(answers, answer => answer.action?.type === "endMainPhase");
    }
  }
  return null;
}

export function choose({ seat, key, view, answers }) {
  const context = { me: view.players[seat], enemy: view.players[1 - seat],
    decision: view.decision, resolution: view.resolution, answers };
  if (key === "cQZr8Z") return destructionRune(context);
  return null;
}
