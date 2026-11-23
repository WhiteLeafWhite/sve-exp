export const baseRevision = 3;
let doubleHit = null;
let exchange = null;

// 巫师第四局 T6。两发炎术各解一个小从者，进化灾藤与第三名横置从者交换。
function clearThreeWithSaito({seat, view, own, foe, enemies, answers}) {
  if (exchange?.turn !== view.turn || exchange?.seat !== seat) exchange = null;
  const decision = view.decision;
  const available = [...own.hand, ...own.ex].filter(card => !card.hidden);
  const pyro = available.find(card => card.def === 'BP18-123');
  const play = card => answers.findIndex(answer => card && answer.action?.type === 'play' && answer.action.card === card.id);
  if (!exchange) {
    if (decision?.type !== 'mainPhase' || own.maxPlayPoints !== 3 || own.playPoints !== 3 ||
        own.evolutionPoints < 1 || own.leaderDefense > 16 || own.field.length >= 5 || !pyro ||
        own.field.some(card => !card.hidden && card.type === 'follower') ||
        enemies.length !== 3 || foe.leaderDefense <= 8) return null;
    const trade = enemies.find(card => card.engaged && card.attack === 3 && card.defense === 3);
    const small = enemies.filter(card => card.defense >= 1 && card.defense <= 2 && card.attack >= 2);
    const canEvolve = own.evolveDeck.some(card => !card.hidden && !card.faceUp && card.def === 'BP18-118');
    const officer = available.find(card => card.def === 'BP18-117');
    const index = play(officer);
    if (!trade || small.length !== 2 || !canEvolve || index < 0) return null;
    small.sort((a, b) => Number(b.def === 'BP20-040') - Number(a.def === 'BP20-040') || b.attack - a.attack);
    exchange = {seat, turn: view.turn, small: small.map(card => card.id), trade: trade.id};
    return index;
  }
  const small = exchange.small.find(id => enemies.some(card => card.id === id));
  const officer = own.field.find(card => !card.hidden && card.def === 'BP18-117');
  if (!officer) return null;
  let index = -1;
  if (decision?.type === 'choose' && decision.source === officer.id) {
    index = answers.findIndex(answer => answer.ids?.includes('pyromancy'));
  } else if (decision?.type === 'selectCards' && decision.reason === 'target' && small &&
      view.resolution.some(card => card.id === decision.source && card.def === 'BP18-123')) {
    index = answers.findIndex(answer => answer.cards?.length === 1 && answer.cards[0] === small);
  } else if (decision?.type === 'mainPhase') {
    if (small && pyro) index = play(pyro);
    if (small && index < 0 && own.cemetery.some(card => card.def === 'BP18-123')) {
      index = answers.findIndex(answer => answer.action?.type === 'evolve' &&
        answer.action.card === officer.id && !answer.action.superEvolve);
    }
    if (!small) index = answers.findIndex(answer => answer.action?.type === 'attack' &&
      answer.action.attacker === officer.id && answer.action.target === exchange.trade);
  }
  return index >= 0 ? index : null;
}

export function choose({ seat, key, view, answers }) {
  const own = view.players[seat];
  const foe = view.players[1 - seat];
  const decision = view.decision;
  const enemies = foe.field.filter(card => !card.hidden && card.type === 'follower');
  if (doubleHit && (view.turn !== doubleHit.turn || seat !== doubleHit.seat)) doubleHit = null;
  if (view.activePlayer !== seat || foe.playPoints !== 0) return null;
  if (doubleHit && !enemies.some(card => card.id === doubleHit.target) &&
      (!doubleHit.gunner || decision?.type === 'mainPhase')) {
    const plan = doubleHit;
    doubleHit = null;
    // 皇室第四局 T6。直立的欧克托莉斯已被打掉，4/4 圣士郎能与横置炮手交换。
    if (plan.gunner) {
      const attack = answers.findIndex(answer => answer.action?.type === 'attack' &&
        answer.action.attacker === plan.source && answer.action.target === plan.gunner);
      if (attack >= 0) return attack;
    }
  }
  if (key === 'cQZr8Z') {
    const clear = clearThreeWithSaito({seat, view, own, foe, enemies, answers});
    if (clear !== null) return clear;
  }

  // 巫师第二局输入 36。即使坚定祈祷的检索没有命中，透京减费也已生效。
  if (decision?.type === 'mainPhase' && own.maxPlayPoints === 3 && own.playPoints === 0 &&
      own.leaderDefense >= 15 && own.deckCount > 5 && own.field.length === 1 && own.field[0].def === 'BP18-104') {
    const officers = own.hand.filter(card => !card.hidden && card.def === 'BP18-117');
    const index = answers.findIndex(answer => answer.action?.type === 'play' &&
      officers.some(card => card.id === answer.action.card));
    if (index >= 0) return index;
  }

  // 圣士郎从手中放承担者也会触发其入场。巫师首局输入 43 的配对分支验证了两段伤害。
  if (decision?.type === 'selectCards' && decision.reason === 'pick') {
    const seishiro = own.field.find(card => !card.hidden && card.id === decision.source &&
      card.def === 'BP18-097' && card.evolvedWith && !card.abilitiesLost);
    const deliverer = own.hand.find(card => !card.hidden && card.def === 'BP18-105');
    const canEvolve = own.evolveDeck.some(card => !card.hidden && !card.faceUp && card.def === 'BP18-106');
    const target = enemies.find(card => !card.engaged && card.defense >= 3 && card.defense <= 4 && card.attack >= 3);
    // 皇室第三局 T7。承担者进化后还能与另一名横置小从者交换。
    const gunner = key === 't7B32v' && target?.def === 'BP15-020' && enemies.find(card =>
      card.def === 'BP19-026' && card.engaged && card.defense === 3 && card.attack === 4 && seishiro?.attack >= 3);
    const canTrade = enemies.length === 2 && (gunner || enemies.some(card => card.engaged && card.defense <= 2));
    if (seishiro && deliverer && canEvolve && own.field.length < 5 &&
        target && (enemies.length === 1 || canTrade)) {
      const index = answers.findIndex(answer => answer.cards?.length === 1 && answer.cards[0] === deliverer.id);
      if (index >= 0) {
        doubleHit = {turn: view.turn, seat, source: seishiro.id, target: target.id, gunner: gunner?.id};
        return index;
      }
    }
  }

  if (doubleHit && decision?.type === 'confirm' && own.field.some(card =>
    !card.hidden && card.id === decision.source && card.def === 'BP18-105')) {
    const index = answers.findIndex(answer => answer.yes === true);
    if (index >= 0) return index;
  }
  if (doubleHit && decision?.type === 'selectCards' && decision.reason === 'target' && decision.source === doubleHit.source) {
    const index = answers.findIndex(answer => answer.cards?.length === 1 && answer.cards[0] === doubleHit.target);
    if (index >= 0) return index;
  }

  // 巫师首局输入 64 的同牌序分支。保住两费处理直立威胁，灾藤留给横置从者。
  const friendly = own.field.filter(card => !card.hidden && card.type === 'follower');
  if (key === 'cQZr8Z' && enemies.length >= 3 && foe.leaderDefense > 10 && own.leaderDefense <= 15 &&
      friendly.length === 1 && friendly[0].def === 'BP18-117' && friendly[0].evolvedWith && !friendly[0].engaged &&
      own.field.some(card => !card.hidden && card.def === 'BP02-095') && own.ex.some(card => card.def === 'BP18-123')) {
    const target = enemies.find(card => !card.engaged && card.attack >= 4 && card.defense <= 4);
    const battleTarget = enemies.find(card => card.engaged && card.defense <= friendly[0].attack + 1 &&
      card.attack < friendly[0].defense + 1);
    const discard = own.hand.find(card => !card.hidden && card.def === 'BP18-105');
    const cards = [...own.hand, ...own.ex, ...view.resolution].filter(card => !card.hidden);
    const spell = cards.find(card => card.def === 'BP18-119' && (decision?.type === 'mainPhase' || card.id === decision?.source));
    if (target && battleTarget && discard && spell) {
      let choice = -1;
      if (decision.type === 'mainPhase' && own.playPoints === 2) {
        choice = answers.findIndex(answer => answer.action?.type === 'play' && answer.action.card === spell.id);
      } else if (decision.type === 'selectCards' && ['target', 'cost'].includes(decision.reason)) {
        const selected = decision.reason === 'target' ? target.id : discard.id;
        choice = answers.findIndex(answer => answer.cards?.length === 1 && answer.cards[0] === selected);
      }
      if (choice >= 0) return choice;
    }
  }

  // 龙族首局 T9。用回复伤害拆直立从者，进化从者再免费击破横置目标。
  if (decision?.type === 'selectCards' && decision.reason === 'target') {
    const source = own.field.find(card => !card.hidden && card.id === decision.source);
    if (!['BP18-097', 'BP18-099'].includes(source?.def)) return null;
    const attackers = own.field.filter(card => !card.hidden && card.evolvedWith && !card.engaged && !card.boxed);
    const combat = enemies.some(enemy => enemy.engaged && attackers.some(attacker =>
      attacker.attack >= enemy.defense && attacker.defense > enemy.attack));
    const target = enemies.filter(card => !card.engaged && card.defense <= 2 && card.attack >= 3)
      .sort((a, b) => b.attack - a.attack)[0];
    if (!combat || !target || enemies.length !== 2) return null;
    const index = answers.findIndex(answer => answer.cards?.length === 1 && answer.cards[0] === target.id);
    return index >= 0 ? index : null;
  }

  // 巫师首局 T5。灾藤先落地，让同一张炎术再对主战者打 1。
  if (key !== 'cQZr8Z' || decision?.type !== 'mainPhase' || own.maxPlayPoints !== 3 || foe.leaderDefense <= 8) return null;
  if (enemies.length !== 1 || enemies[0].def !== 'BP20-040' || enemies[0].defense > 2) return null;
  const available = [...own.hand, ...own.ex].filter(card => !card.hidden);
  const spell = available.find(card => card.def === 'BP18-123');
  if (!spell) return null;

  const onField = own.field.some(card => !card.hidden && card.def === 'BP18-117');
  let play = spell;
  if (!onField) {
    if (own.playPoints < 3 || own.field.length >= 5) return null;
    play = available.find(card => card.def === 'BP18-117');
  }
  const index = answers.findIndex(answer => answer.action?.type === 'play' && answer.action.card === play?.id);
  return index >= 0 ? index : null;
}
