import {choose as playTenmei} from './rune-05-tenmei.mjs';

// A second response to the SAME T15. Select the replacement follower only
// once Wasteland has shown it to the deciding player.
export function choose(context) {
  const {seat,view,answers}=context;
  if(view.turn!==16 || seat!==1)return playTenmei(context);
  const own=view.players[1], foe=view.players[0], d=view.decision;
  const field=(p,def)=>p.field.find(c=>!c.hidden && c.def===def)?.id;
  const card=def=>own.hand.find(c=>c.def===def)?.id;
  const use=(type,id)=>answers.findIndex(a=>a.action?.type===type && a.action.card===id);
  const pick=id=>answers.findIndex(a=>a.cards?.length===1 && a.cards[0]===id);
  const waste='BP20-055', zealot='BP08-050', mono='BP05-045';
  if(d.type==='selectCards') {
    if(Array.isArray(d.peek) && d.candidateDefs.includes(zealot))return pick(d.candidates[d.candidateDefs.indexOf(zealot)]);
    if(d.candidates.includes(field(own,'BP20-T03')))return pick(field(own,'BP20-T03'));
    for(const def of ['BP18-099','BP18-105'])if(d.candidates.includes(field(foe,def)))return pick(field(foe,def));
  }
  if(d.type==='mainPhase') {
    if(card(waste))return use('play',card(waste));
    if(field(own,waste))return use('activate',field(own,waste));
    if(card(zealot))return use('play',card(zealot));
    if(card(mono))return use('play',card(mono));
    const face=answers.findIndex(a=>a.action?.type==='attack' && a.action.target===foe.leader.id);
    if(face>=0)return face;
  }
  return null;
}
