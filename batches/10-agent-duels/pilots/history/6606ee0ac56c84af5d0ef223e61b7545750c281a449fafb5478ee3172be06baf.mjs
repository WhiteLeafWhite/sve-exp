export const baseRevision = 3;

export function choose({ seat, key, view, answers }) {
  const own = view.players[seat];
  const foe = view.players[1 - seat];
  const decision = view.decision;
  const enemies = foe.field.filter(card => !card.hidden && card.type === 'follower');
  if (view.activePlayer !== seat || foe.playPoints !== 0) return null;

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
