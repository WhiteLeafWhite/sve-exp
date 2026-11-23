import {defend} from "./rune-06-hold.mjs";

// A one-cost City can fund both Punisher's two-cost evolution and a
// Quicksilver on the following turn. Choose search results in the seat view.
export function cityTrade(superEvolve,context) {
  const {seat,view,answers}=context;
  if(view.turn!==14 || seat!==0)return defend(false,context);
  const [own,opp]=view.players,d=view.decision;
  const card=(zone,def)=>zone.find(c=>!c.hidden && c.def===def);
  const use=(type,c)=>answers.findIndex(a=>c && a.action?.type===type && a.action.card===c.id);
  const city=card(own.field,'BP18-120'),punisher=card(own.field,'BP18-105');
  const zealots=opp.field.filter(c=>c.def==='BP08-050').sort((a,b)=>b.damage-a.damage);
  if(d.type==='selectCards'){
    if(d.source===city?.id && punisher && d.candidates.includes(punisher.id))
      return answers.findIndex(a=>a.cards?.length===1 && a.cards[0]===punisher.id);
    if(zealots[0] && d.candidates.includes(zealots[0].id))
      return answers.findIndex(a=>a.cards?.length===1 && a.cards[0]===zealots[0].id);
    return null;
  }
  if(d.type!=='mainPhase')return null;
  if(!city && card(own.hand,'BP18-120') && own.playPoints===7)return use('play',card(own.hand,'BP18-120'));
  if(card(own.hand,'BP18-105') && !punisher)return use('play',card(own.hand,'BP18-105'));
  if(zealots.length===3 && punisher) {
    const pyro=card(own.hand,'BP18-123');
    if(pyro && own.playPoints>=4)return use('play',pyro);
    const evo=answers.findIndex(a=>a.action?.type==='evolve' && a.action.card===punisher.id && a.action.superEvolve===superEvolve);
    if(evo>=0 && own.playPoints>=3)return evo;
    const grow=use('activate',city);
    if(grow>=0 && own.playPoints>=2)return grow;
    const attack=answers.findIndex(a=>a.action?.type==='attack' && a.action.attacker===punisher.id && a.action.target===zealots[0].id);
    if(attack>=0)return attack;
  }
  return answers.findIndex(a=>a.action?.type==='endMainPhase');
}
export const choose=context=>cityTrade(false,context);
