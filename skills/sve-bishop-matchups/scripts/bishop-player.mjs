// SVE NEXT 0.4.3. Pass the simulator's PlannerBot and MEDIUM_V2 exports.
// The referee supplies the session. This seat's custom evaluation reads PlayerView.
const priority = {
  zQrwne: {'BP15-057':5.5,'BP05-052':3,'BP15-066':2.7,'BP20-062':2.2,'BP05-055':2.5},
  cQZr8Z: {'BP20-048':3,'BP20-040':2.4,'BP05-T02':3,'BP05-040':2.7,'BP20-T04':1},
  t7B32v: {'BP19-019':5,'BP15-020':4,'BP05-018':3,'BP20-019':2.4,'BP19-026':2.6}
};
const bodies = new Set(['BP18-097','BP18-099','BP18-101','BP18-105','BP18-110','BP18-116','BP18-T10','BP18-117']);
const contains=(cards,def)=>cards.some(c=>c.def===def);

function matchupValue(view, seat, opponentKey) {
  const mine=view.players[seat], foe=view.players[1-seat];
  const field=mine.field.filter(c=>!c.hidden), enemy=foe.field.filter(c=>!c.hidden);
  const units=field.filter(c=>c.type==='follower'), attackers=enemy.filter(c=>c.type==='follower');
  const shions=units.filter(c=>c.def==='BP14-090').length;
  const damageEngines=units.filter(c=>c.def==='BP18-097'||c.def==='BP18-099').length;
  const prayers=field.filter(c=>c.def==='BP02-095').length;
  let score=2*damageEngines+shions*(opponentKey==='t7B32v'?3:4.2);
  for(const c of units){
    if(c.def==='BP18-099')score+=1.1+.45*units.filter(x=>bodies.has(x.def)).length;
    if(c.def==='BP15-094')score+=1.3+.55*damageEngines;
    if(c.def==='BP18-100'&&prayers)score+=2.3+.65*damageEngines;
  }
  score+=Math.min(2,units.length)*Math.min(2,prayers)*.65;
  score-=Math.max(0,field.length-units.length-2)*2.8;
  for(const c of enemy)score-=priority[opponentKey]?.[c.def]||0;
  const attack=attackers.reduce((n,c)=>n+Math.max(0,c.attack-shions),0);
  const block=units.filter(c=>c.keywords.includes('ward')).length;
  const reach=foe.maxPlayPoints<4?1:opponentKey==='zQrwne'?6:opponentKey==='t7B32v'?5:4;
  score-=.6*Math.max(0,attack+reach-block*2-mine.leaderDefense);
  score-=.30*Math.max(0,mine.leaderDefense-20);
  if(opponentKey==='t7B32v'&&mine.deckCount<9)score-=.85*(9-mine.deckCount);
  return score;
}

// An estimate for comparing nonterminal positions. Only face-up cards and public
// resource counts go into it. The search still resolves actual responses normally.
function nextTurnPressure(view, seat, opponentKey, hasTrait) {
  const me = view.players[seat], foe = view.players[1-seat];
  const field = foe.field.filter(c=>!c.hidden && !c.boxed);
  const units = me.field.filter(c=>!c.hidden && c.type==='follower');
  const shields = units.filter(c=>c.def==='BP14-090' && !c.abilitiesLost).length;
  const wards = units.filter(c=>c.keywords.includes('ward'));
  const count = (zone,def) => zone.filter(c=>c.def===def).length;
  const hits = n => Math.max(0,n-shields);
  const pp = Math.min(10,foe.maxPlayPoints+1);
  let direct = 0, reserve = 0;
  if(opponentKey==='cQZr8Z'){
    const idols = field.filter(c=>hasTrait(c,'アイドル')).length;
    const axia = [...field,...foe.ex].some(c=>c.def==='BP20-040' && c.evolvedWith==null);
    if(axia && foe.superEvolutionPoints>0 && pp>=5) direct+=hits(idols);
    direct+=count(field,'BP05-T02')*hits(2);
    if(idols>=2) direct+=count(field,'BP20-048')*hits(2);
    reserve=pp>=5?2:0;
  } else if(opponentKey==='t7B32v'){
    const flagTarget = field.some(c=>hasTrait(c,'八獄') && hasTrait(c,'盗賊'));
    if(flagTarget) direct+=count(foe.ex,'BP19-T01')*hits(1);
    if(me.cemetery.length>=10 && units.length) direct+=count(foe.ex,'BP15-T01')*hits(2);
    reserve=pp>=4?3:1;
  } else {
    const torch=count(foe.ex,'BP15-064'), fangs=count(foe.ex,'BP15-PR13');
    const galm=field.some(c=>c.def==='BP05-052') || (pp>=5 && contains(foe.ex,'BP05-052'));
    if(galm) direct+=hits(3)*Math.min(3,1+torch+fangs);
    if(field.length || galm) direct+=torch*hits(1);
    if(pp>=7 && fangs && contains(foe.ex,'BP15-057')) reserve+=hits(5);
    reserve+=pp>=7?5:pp>=5?3:1;
  }
  const strikes=field.filter(c=>c.type==='follower').map(c=>hits(c.attack)).sort((a,b)=>b-a);
  // A Ward can absorb one attack in this estimate. Removal and further attacks
  // from hidden hands are compared by the sampled engine search.
  const unblocked=strikes.slice(wards.length).reduce((sum,n)=>sum+n,0);
  const cushion=me.leaderDefense-unblocked-direct-reserve;
  let value=-1.3*Math.max(0,3-cushion);
  if(foe.leaderDefense<=12 && units.length) value+=.28*Math.min(10,units.reduce((s,c)=>s+c.attack,0));
  if(opponentKey==='t7B32v' && me.deckCount<=6) value-=1.25*(7-me.deckCount);
  return value;
}

// BP20 extension. All inputs are already filtered to the evaluating player's information.
function prayerValue(view, seat) {
  const me = view.players[seat], foe = view.players[1-seat];
  const live = me.field.filter(c => !c.hidden && !c.boxed && !c.abilitiesLost);
  let value = 0;
  for (const c of live) {
    const counters = c.counters.prayer || 0;
    if (c.def === 'BP16-093') value += 1 + .85 * Math.min(4, counters);
    if (c.def === 'BP02-091') value += 1 + 1.4 * Math.min(3, counters);
    if (c.def === 'BP09-095') value += 1.5 + .6 * Math.min(2, counters);
  }
  // There are only five field slots. Keep the last slot usable for healing or removal.
  const amulets = live.filter(c => c.type === 'amulet').length;
  if (amulets >= 3 && foe.field.some(c => !c.hidden && c.type === 'follower')) value -= (amulets - 2) * 2.3;
  // An upright Ward on the non-active side does not restrict an attack.
  if (view.activePlayer !== seat) {
    const standing = live.filter(c => !c.engaged && c.keywords.includes('ward')).length;
    if (me.leaderDefense <= 12 && standing) value -= 1.5 * standing;
  }
  return value;
}

// A single Ward can be removed before later attacks. Evaluate the publicly
// visible Disdain engine again with that line open, especially after a tap-out.
function disdainExposure(view, seat) {
  const me = view.players[seat], foe = view.players[1 - seat];
  const field = foe.field.filter(c => !c.hidden && !c.abilitiesLost);
  const galm = field.find(c => c.def === 'BP05-052' && c.evolvedWith);
  if (!galm) return 0;
  const visibleHits = foe.ex.filter(c => ['BP15-064','BP15-PR13','BP20-T05','BP20-063'].includes(c.def)).length;
  const haveQuick = me.playPoints >= 1 && me.ex.some(c => c.def === 'BP14-T07');
  const sion = me.field.some(c => !c.hidden && !c.abilitiesLost && c.def === 'BP14-090');
  const bodyDamage = field.filter(c => c.type === 'follower').reduce((s,c) => s + Math.max(0,c.attack),0);
  const damage = bodyDamage + 3 * Math.min(4, 1 + visibleHits) + (foe.maxPlayPoints >= 5 ? 3 : 0);
  const margin = me.leaderDefense - damage;
  let exposure = 3 + Math.min(3,visibleHits);
  if (margin <= 3) exposure += Math.min(7, 4 - margin);
  if (haveQuick) exposure *= .65;
  if (sion && haveQuick) exposure *= .75;
  return -exposure;
}

function burnDisdainEngine(view, seat) {
  const own=view.players[seat], foe=view.players[1-seat], d=view.decision;
  if(d.type!=='mainPhase' || foe.playPoints>0 || foe.leaderDefense<=8) return null;
  const target=foe.field.find(c=>!c.hidden && !c.abilitiesLost && c.def==='BP05-052' && c.evolvedWith && c.defense<=4);
  if(!target) return null;
  const visible=[...own.hand.filter(c=>!c.hidden),...own.ex];
  const spells=visible.filter(c=>c.def==='BP18-123');
  const shot=d.actions.find(a=>a.type==='play' && spells.some(c=>c.id===a.card));
  if(!shot) return null;
  const faceAttackers=new Set(d.actions.filter(a=>a.type==='attack' && a.target===foe.leader.id).map(a=>a.attacker));
  const reach=own.field.filter(c=>!c.hidden && faceAttackers.has(c.id)).reduce((sum,c)=>sum+c.attack,0);
  if(reach>=foe.leaderDefense) return null;
  const saito=visible.some(c=>c.def==='BP18-117') && own.field.length<5 &&
    own.evolveDeck.some(c=>!c.hidden && !c.faceUp && c.def==='BP18-118') && own.playPoints>=(own.evolutionPoints?3:4);
  const twice=spells.length>=2 && own.playPoints>=2;
  return target.defense<=2 || twice || saito ? {action:shot,target:target.id} : null;
}

export function makeBishopPlayer(engine, {PlannerBot, MEDIUM_V2}, {seat=0, opponentKey, seed, revision=2}) {
  if(!Object.hasOwn(priority,opponentKey))throw Error('Unknown matchup: '+opponentKey);
  if(![1,2,3,4,5].includes(revision))throw Error('Unknown bishop revision');
  // Keep the r3 planner, including its RNG usage at the opening decision. Only
  // override an actual keep, and only for a first-player Haven against Dragon.
  if(revision===5){
    const base=makeBishopPlayer(engine,{PlannerBot,MEDIUM_V2},{seat,opponentKey,seed,revision:3});
    return {revision,get stats(){return base.stats;},decide(session){
      const old=base.decide(session);
      if(old.type!=='mulligan' || old.redraw || opponentKey!=='zQrwne')return old;
      const view=session.view(seat);
      if(view.firstPlayer!==seat)return old;
      const hand=view.players[seat].hand.filter(card=>!card.hidden);
      const engineStart=contains(hand,'BP18-097') && contains(hand,'BP18-105') &&
        (contains(hand,'BP18-120') || contains(hand,'BP18-117'));
      return contains(hand,'BP18-100') || engineStart ? old : {type:'mulligan',redraw:true,bottomOrder:[...view.decision.hand]};
    }};
  }
  const dragonRevision = revision === 4 && opponentKey === 'zQrwne';
  const hasTrait=(c,trait)=>engine.db.get(c.def).traits.includes(trait);
  const augment=base=>(v,p)=>base(v,p)+(v.result?0:(p===seat?1:-1)*(matchupValue(v,seat,opponentKey)
    +(revision>=2?nextTurnPressure(v,seat,opponentKey,hasTrait):0)
    +(revision>=3?prayerValue(v,seat):0)+(dragonRevision?disdainExposure(v,seat):0)));
  const refinement=revision>=2?{
    samples:3, beamWidth:16, maxSimulations:1900, maxDepth:16, replyPlans:5,
    innerPlans:[3,3], innerSimulations:440, innerBeam:6, replyLethal:260,
    lethalSearch:1400, commonRandom:true, drawFirst:true,
    lineSlots:{lines:3,margin:3,key:'set'}
  }:{};
  // R3 searches the current turn and scores the visible threat at its end. All
  // candidates use this budget; revision 2 keeps the original two-turn search.
  const focused = dragonRevision ? {
    lookahead:2, samples:3, beamWidth:14, maxSimulations:1500, replyPlans:5,
    innerPlans:[3,3], innerSimulations:340, innerBeam:6, replyLethal:230, lethalSearch:1400,
  } : revision >= 3 ? {
    lookahead:1, samples:2, beamWidth:10, maxSimulations:850, replyPlans:4,
    lethalSearch:1100, replyLethal:140,
  } : {};
  const search=new PlannerBot(engine,{
    ...MEDIUM_V2, cheat:false, seed, samples:2, choiceDedupe:true, ...refinement, ...focused,
    evaluator:augment(MEDIUM_V2.evaluator), replyEvaluator:augment(MEDIUM_V2.replyEvaluator),
    greedyEvaluator:augment(MEDIUM_V2.greedyEvaluator)
  });
  let myTurn=-1, startField=new Set(), finishTarget=null, burnTarget=null;
  return {
    revision,
    get stats(){return search.stats;},
    decide(session){
      const v=session.view(seat), me=v.players[seat], foe=v.players[1-seat], d=v.decision;
      if(!d)throw Error('Bishop is not the deciding seat');
      if(dragonRevision && burnTarget && d.type==='selectCards' && d.reason==='target'){
        const target=burnTarget;burnTarget=null;
        const source=[...me.hand,...me.ex,...v.resolution].find(c=>!c.hidden && c.id===d.source);
        if(source?.def==='BP18-123' && d.candidates.includes(target))return {type:'selectCards',cards:[target]};
      }
      if(dragonRevision && d.type==='mainPhase'){
        burnTarget=null;
        const burn=burnDisdainEngine(v,seat);
        if(burn){burnTarget=burn.target;return {type:'mainPhase',action:burn.action};}
      }
      if(v.activePlayer===seat && v.turn!==myTurn) {
        myTurn=v.turn;startField=new Set(me.field.filter(c=>!c.hidden).map(c=>c.id));finishTarget=null;
      }
      if(d.type==='mulligan'){
        const hand=me.hand.filter(c=>!c.hidden);
        if (revision >= 3) {
          const starts = hand.some(c => ['BP16-093','BP16-104','BP09-095'].includes(c.def));
          if (starts && hand.some(c => c.cost <= 2 && c.type !== 'amulet')) return {type:'mulligan',redraw:false};
        }
        const early=hand.some(c=>['BP18-120','BP18-117','BP18-100'].includes(c.def));
        const pair=contains(hand,'BP18-097')&&hand.some(c=>['BP18-104','BP02-095','BP18-105','BP18-110'].includes(c.def));
        if(revision===1)return {type:'mulligan',redraw:!early&&!pair};
        const starters=hand.filter(c=>['BP18-120','BP18-117','BP18-100'].includes(c.def));
        if(pair || starters.length>=2 || (early && contains(hand,'BP18-097')))return {type:'mulligan',redraw:false};
        if(hand.filter(c=>c.cost>=4).length>=3 || hand.every(c=>c.cost>=3))return {type:'mulligan',redraw:true};
        return search.decide(session);
      }
      if(finishTarget&&d.type==='selectCards'&&d.reason==='target'&&d.candidates.includes(finishTarget)){
        const id=finishTarget;finishTarget=null;return {type:'selectCards',cards:[id]};
      }
      if(d.type==='mainPhase'&&opponentKey==='zQrwne'&&revision<3){
        finishTarget=null;
        const field=me.field.filter(c=>!c.hidden), enemy=foe.field.filter(c=>!c.hidden);
        const ward=enemy.filter(c=>c.engaged&&c.keywords.includes('ward'));
        const total=ids=>[...ids].reduce((s,id)=>s+(field.find(c=>c.id===id)?.attack||0),0);
        const attacks=d.actions.filter(a=>a.type==='attack');
        const face=attacks.filter(a=>a.target===foe.leader.id);
        if(face.length&&total(new Set(face.map(a=>a.attacker)))>=foe.leaderDefense)return {type:d.type,action:face[0]};
        if(ward.length===1){
          const target=ward[0];
          const ready=attacks.filter(a=>a.target===target.id&&(startField.has(a.attacker)||field.find(c=>c.id===a.attacker)?.keywords.includes('storm')));
          if(total(new Set(ready.map(a=>a.attacker)))>=foe.leaderDefense){
            const cards=[...me.hand.filter(c=>!c.hidden),...me.ex];
            const answer=d.actions.find(a=>a.type==='play'&&cards.some(c=>c.id===a.card&&
              ((c.def==='BP18-123'&&target.defense<=2)||(c.def==='BP18-119'&&target.defense<=4))));
            if(answer){finishTarget=target.id;return {type:d.type,action:answer};}
          }
        }
      }
      return search.decide(session);
    }
  };
}
