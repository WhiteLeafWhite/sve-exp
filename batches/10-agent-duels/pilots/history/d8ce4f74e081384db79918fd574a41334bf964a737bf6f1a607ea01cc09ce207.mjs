// Only the active seat's hand, public cards and candidates revealed for this decision are used.
function first(answers, test) {
  const index = answers.findIndex(test);
  return index < 0 ? null : index;
}

function selectOne(answers, decision, def) {
  return first(answers, answer => answer.cards?.length === 1 &&
    decision.candidateDefs[decision.candidates.indexOf(answer.cards[0])] === def);
}

const runeIdols = new Set([
  "BP05-037", "BP05-048", "BP05-T01", "BP05-T02", "BP08-050", "BP15-039", "BP15-049", "BP15-054",
  "BP20-037", "BP20-040", "BP20-048", "BP20-055", "BP20-T03", "BP20-T04",
]);

function destructionRune({ me, enemy, decision, resolution, answers }) {
  const available = [...me.hand, ...me.ex];
  const field = me.field.filter(card => !card.hidden);
  const source = [...field, ...resolution].find(card => card.id === decision.source) ??
    (decision.reason === "pick" && !decision.source ? resolution.at(-1) : undefined);
  const has = (cards, def) => cards.some(card => card.def === def);
  const play = def => first(answers, answer => answer.action?.type === "play" &&
    available.some(card => card.id === answer.action.card && card.def === def));
  const targets = enemy.field.filter(card => !card.hidden && card.type === "follower");
  const wasteland = field.find(card => card.def === "BP20-055");
  const supplicant = field.find(card => card.def === "BP20-048" && !card.abilitiesLost);

  if (decision.type === "mainPhase" && targets.length >= 3 && has(available, "BP06-047")) {
    const cleared = targets.filter(card => card.defense <= (card.def === "BP14-090" && !card.abilitiesLost ? 5 : 6));
    const threat = cleared.reduce((total, card) => total + card.attack, 0);
    const faceAttackers = new Set(answers.filter(answer => answer.action?.type === "attack" &&
      answer.action.target === enemy.leader.id).map(answer => answer.action.attacker));
    const faceDamage = field.filter(card => faceAttackers.has(card.id)).reduce((total, card) => total + card.attack, 0);
    if (cleared.length >= 3 && threat >= 9 && enemy.leaderDefense > faceDamage + 3) {
      const storm = play("BP06-047");
      if (storm !== null) return storm;
    }
  }

  if (decision.type === "mainPhase" && targets.length === 1 && !enemy.playPoints && enemy.ex.length === 0 &&
      has(available, "BP15-PR12") && play("BP15-PR12") !== null) {
    const swings = answers.filter(answer => answer.action?.type === "attack" && answer.action.target === enemy.leader.id);
    const attackers = new Set(swings.map(answer => answer.action.attacker));
    const reserve = field.filter(card => !card.engaged && !attackers.has(card.id) && runeIdols.has(card.def));
    const shion = targets[0].def === "BP14-090" && !targets[0].abilitiesLost ? 1 : 0;
    if (swings.length && reserve.length * 2 >= targets[0].defense + shion) {
      // The visible nonattackers alone can pay for Monody. Cash in an available attack before selecting its cost.
      return answers.indexOf(swings[0]);
    }
  }

  if (wasteland && enemy.leaderDefense > 8 && targets.length === 2 && targets.every(card => card.defense <= 2) &&
      targets.some(card => card.attack >= 4)) {
    if (decision.type === "mainPhase" && has(available, "BP05-045")) {
      if (field.length === 1 && me.playPoints >= 4) return play("BP20-048");
      if (field.length === 2 && supplicant && !supplicant.engaged) return play("BP05-045");
    }
    if (decision.type === "selectCards" && decision.reason === "target" && resolution.at(-1)?.def === "BP05-045") {
      const exact = targets.find(card => card.defense === 2 && !card.engaged);
      if (exact) return first(answers, answer => answer.cards?.[0] === exact.id);
    }
  }
  if (wasteland && supplicant && field.length === 2 && targets.length === 1 && enemy.leaderDefense > 2 &&
      targets[0].defense <= 2 && targets[0].attack >= 4) {
    if (decision.type === "mainPhase" && !me.playPoints) {
      return first(answers, answer => answer.action?.type === "activate" && answer.action.card === supplicant.id);
    }
    if (decision.type === "selectCards" && decision.reason === "target" && decision.source === supplicant.id) {
      return first(answers, answer => answer.cards?.[0] === targets[0].id);
    }
  }

  if (decision.type === "selectCards") {
    const candidate = def => selectOne(answers, decision, def);

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
      if (targets.length !== 1) return null;
      const target = targets[0];
      const reduction = target.def === "BP14-090" && !target.abilitiesLost ? 1 : 0;
      const required = Math.ceil((target.defense + reduction) / 2);
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

  if (decision.type === "mainPhase" && me.deckCount > 1 && has(available, "BP08-051")) {
    if (me.playPoints === 0 && has(field, "BP05-037")) return play("BP08-051");
    if (me.maxPlayPoints === 4 && me.playPoints === 4 && enemy.leaderDefense > 12 &&
        field.length < 5 && me.ex.length <= 3 && !enemy.field.some(card => !card.hidden && card.type === "follower")) {
      const lishenna = play("BP05-037");
      if (lishenna !== null) return lishenna;
    }
  }

  if (decision.type === "mainPhase" && me.maxPlayPoints === 1 && field.length > 0 &&
      field.every(card => card.def === "BP20-055")) {
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

function disdainDragon({ me, enemy, decision, resolution, answers }) {
  const field = me.field.filter(card => !card.hidden && card.type === "follower");
  const opposing = enemy.field.filter(card => !card.hidden && card.type === "follower");
  if (me.deckCount === 1 && opposing.length === 0 && me.leaderDefense >= 8) {
    // Keeping the last card with Hermit only helps if a later Oracle also leaves it in the deck.
    if (decision.type === "choose" && decision.reason === "mode" && enemy.leaderDefense > 4 &&
        resolution.some(card => card.id === decision.source && card.def === "SD04-002")) {
      return first(answers, answer => answer.ids?.includes("1"));
    }
    const revealed = decision.peek?.[0];
    const zealots = field.filter(card => card.def === "BP08-063" && !card.abilitiesLost);
    if (decision.type === "selectCards" && decision.min === 0 && decision.reason === "effect" &&
        !decision.source && revealed?.def === "BP20-056" && me.maxPlayPoints >= 7 && me.playPoints >= 3 &&
        field.every(card => card.engaged || (card.def === "BP08-063" && card.defense === 1)) &&
        zealots.length === 1 && me.cemetery.at(-1)?.def === "BP15-072" &&
        me.hand.every(card => ["SD04-002", "BP08-068", "BP20-063"].includes(card.def)) &&
        me.ex.every(card => card.def === "BP20-T05")) {
      // Here a newly played Zealot killed Hermit. Manifest Galmieux has three Storm damage;
      // the one-defense Zealot can deal one more before it dies. The enemy field is empty.
      const selfPing = me.ex.length > 0 || (me.playPoints > 3 && me.hand.some(card => card.def === "BP08-068"));
      if (enemy.leaderDefense > 3 + Number(selfPing)) return first(answers, answer => answer.cards?.length === 0);
      return first(answers, answer => answer.cards?.length === 1 && answer.cards[0] === revealed.id);
    }
  }
  const ardent = field.find(card => card.def === "BP15-057" && !card.abilitiesLost);
  const fragileGalmieux = field.find(card => card.def === "BP20-056" && card.defense === 1);
  const adherent = field.find(card => card.def === "BP15-066" && card.defense > 1 && !card.abilitiesLost);
  if (ardent && decision.type === "selectCards" && me.maxPlayPoints >= 7 && !me.playPoints &&
      me.leaderDefense >= 16 && enemy.leaderDefense > 8 && opposing.length <= 1) {
    if (decision.reason === "effect" && decision.source === ardent.id) {
      const congregant = selectOne(answers, decision, "BP20-062");
      const reserve = selectOne(answers, decision, "BP15-057");
      const fragile = field.filter(card => card.defense === 1);
      if (!opposing.length && congregant !== null && reserve !== null && fragile.length >= 2 && ardent.defense <= 2) {
        // A free Congregant would destroy our attackers and Ward with its own Fanfare.
        return reserve;
      }
      if (opposing[0]?.defense === 1 && me.field.length < 5 && !fragile.length && ardent.defense > 1) {
        if (congregant !== null) return congregant;
        const prayer = selectOne(answers, decision, "BP20-064");
        if (prayer !== null) return prayer;
      }
    }
    if (decision.reason === "target" && opposing[0]?.engaged && opposing[0].defense === 1 &&
        opposing[0].attack <= 2 && ardent.defense >= 3 &&
        field.some(card => card.id === decision.source && card.def === "BP20-064")) {
      return first(answers, answer => answer.cards?.length === 1 && answer.cards[0] === ardent.id);
    }
  }
  if (ardent && me.maxPlayPoints >= 7 && me.leaderDefense <= 15 && opposing.length >= 2 && decision.type === "selectCards") {
    if (decision.reason === "effect" && decision.source === ardent.id) {
      const pick = def => selectOne(answers, decision, def);
      // A four-defense upright follower cannot be traded into. Remove it with Flame while the discount lasts.
      if (opposing.some(card => !card.engaged && card.defense === 4)) {
        const flame = pick("BP20-063");
        if (flame !== null) return flame;
      }
      if (me.field.length < 5) {
        const ward = field.some(card => card.keywords?.includes("ward")) ? null : pick("BP20-064");
        const sweeper = pick("BP15-066");
        if (ward !== null || sweeper !== null) return ward ?? sweeper;
        if (ardent.defense > 1 && me.playPoints < 2 && pick("BP15-057") !== null) return pick("BP15-072");
      }
    }
    if (decision.reason === "target") {
      const source = field.find(card => card.id === decision.source) ?? resolution.at(-1);
      const selfPing = ["BP20-063", "BP20-064", "BP15-072"].includes(source?.def);
      if (selfPing && ardent.defense > 1) {
        const self = first(answers, answer => answer.cards?.length === 1 && answer.cards[0] === ardent.id);
        if (self !== null) return self;
      }
      if (source?.def === "BP20-063") {
        const upright = opposing.filter(card => !card.engaged && card.defense === 4)
          .sort((a,b) => b.attack - a.attack)[0];
        if (upright) return first(answers, answer => answer.cards?.[0] === upright.id);
      }
    }
  }
  if (decision.type === "selectCards" && decision.reason === "target" && fragileGalmieux &&
      adherent && opposing.length === 1 && opposing[0].defense <= 6) {
    const source = [...field, ...me.ex].find(card => card.id === decision.source);
    if (source?.def === "BP20-T05" || (source?.id === adherent.id && adherent.evolvedWith)) {
      return first(answers, answer => answer.cards?.length === 1 && answer.cards[0] === adherent.id);
    }
  }

  if (decision.type !== "mainPhase") return null;
  if (fragileGalmieux && !enemy.playPoints && me.hand.some(card => card.def === "BP08-063")) {
    const swings = answers.filter(answer => answer.action?.type === "attack" &&
      answer.action.attacker === fragileGalmieux.id);
    if (swings.length === 1 && swings[0].action.target === enemy.leader.id) return answers.indexOf(swings[0]);
  }
  const congregant = field.find(card => card.def === "BP20-062" && !card.abilitiesLost);
  const torch = me.hand.find(card => card.def === "BP15-064");
  if (me.maxPlayPoints === 6 && me.playPoints === 1 && field.length === 1 && congregant?.defense === 3 &&
      torch && me.hand.some(card => card.def === "BP15-057") && enemy.leaderDefense > 6 &&
      answers.every(answer => answer.action?.type === "endMainPhase" || answer.action?.card === torch.id)) {
    // The next turn starts at seven. Keep the Torch as a second Galmieux trigger after her Fangs.
    return first(answers, answer => answer.action?.type === "endMainPhase");
  }
  if (me.maxPlayPoints > 3) return null;
  const play = def => first(answers, answer => answer.action?.type === "play" &&
    me.hand.some(card => card.id === answer.action.card && card.def === def));
  const hermit = field.find(card => card.def === "BP15-072" && !card.abilitiesLost);
  const nation = me.field.find(card => !card.hidden && card.def === "BP20-067" && !card.engaged && !card.abilitiesLost);
  if (me.maxPlayPoints === 3 && nation && opposing.length <= 1 && opposing.every(card => card.attack <= 2)) {
    if (!field.length && me.playPoints === 3) {
      const body = play("BP20-062");
      if (body !== null) return body;
    }
    if (field.length === 1 && congregant?.defense >= 4 && me.playPoints === 0) {
      return first(answers, answer => answer.action?.type === "activate" && answer.action.card === nation.id);
    }
  }

  if (me.maxPlayPoints === 1 && opposing.length === 0 &&
      me.hand.some(card => card.def === "BP05-058")) return play("BP15-072");

  if (field.length === 1 && hermit && hermit.defense > 1 &&
      opposing.length === 1 && opposing[0].def === "BP18-100" &&
      opposing[0].defense <= 3) return play("BP05-058");

  if (me.maxPlayPoints === 3 && opposing.length === 0 && hermit &&
      hermit.defense === 1 && me.hand.some(card => card.def === "BP08-063")) {
    return play("BP20-056");
  }
  return null;
}

function lootSword({ me, enemy, decision, resolution, answers }) {
  const field = me.field.filter(card => !card.hidden);
  const octrice = field.find(card => card.def === "BP15-020" && !card.abilitiesLost);
  if (decision.type === "mainPhase" && octrice && me.playPoints < 2) {
    const discount = first(answers, answer => answer.action?.type === "activate" &&
      answer.action.card === octrice.id && answer.action.ability === 1);
    const use = def => first(answers, answer => answer.action?.type === "play" &&
      me.ex.some(card => card.id === answer.action.card && card.def === def));
    const targets = enemy.field.filter(card => !card.hidden && card.type === "follower");
    const target = targets[0];
    const daggers = me.ex.filter(card => card.def === "BP15-T01").length;
    if (targets.length === 1 && target.def === "BP18-097" && !target.engaged && target.defense <= 2 * daggers) {
      // When a two-cost dagger becomes legal, spend it before activating the second discount.
      return use("BP15-T01") ?? discount;
    }
    if (!targets.length && me.hand.length <= 3 && me.ex.some(card => card.def === "BP15-PR10")) {
      return use("BP15-PR10") ?? discount;
    }
  }
  const barbaros = field.find(card => card.def === "BP19-019" && card.evolvedWith && !card.abilitiesLost);
  const flags = me.ex.filter(card => card.def === "BP19-T01");
  const gunner = me.hand.find(card => card.def === "BP19-026");
  const replaceFlag = flags.length === 0 && field.length === 1 &&
    enemy.field.some(card => !card.hidden && card.def === "BP18-097" && !card.engaged);
  if (barbaros && (flags.length >= 2 || replaceFlag) && gunner && field.length < 5) {
    if (decision.type === "choose" && decision.source === barbaros.id && me.playPoints < 2 &&
        me.maxPlayPoints >= 2) {
      // Recover on the first flag so a Gunner can contribute to every remaining flag.
      return first(answers, answer => answer.ids?.includes("recover"));
    }
    if (decision.type === "mainPhase" && me.playPoints >= 2) {
      const ready = answers.some(answer => answer.action?.type === "attack" && answer.action.target === enemy.leader.id);
      if (ready || replaceFlag) return first(answers, answer => answer.action?.type === "play" && answer.action.card === gunner.id);
    }
  }

  if (decision.type !== "selectCards" || decision.reason !== "effect" ||
      resolution.at(-1)?.def !== "BP05-034" || me.maxPlayPoints > 2) return null;
  const chooseCard = def => selectOne(answers, decision, def);

  const originalOctrice = chooseCard("BP05-018");
  if (originalOctrice !== null) return originalOctrice;
  const holds = def => me.hand.some(card => card.def === def);
  if (holds("BP19-028") && holds("BP19-019") && !holds("BP19-030")) return chooseCard("BP19-030");
  return null;
}

export function choose({ seat, key, view, answers }) {
  const context = { me: view.players[seat], enemy: view.players[1 - seat],
    decision: view.decision, resolution: view.resolution, answers };
  if (key === "cQZr8Z") return destructionRune(context);
  if (key === "zQrwne") return disdainDragon(context);
  if (key === "t7B32v") return lootSword(context);
  return null;
}
