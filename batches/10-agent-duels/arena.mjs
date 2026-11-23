// Referee for one game. Start from the simulator checkout; seat.mjs is the player interface.
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, renameSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { setTimeout as delay } from "node:timers/promises";
import { fileURLToPath, pathToFileURL } from "node:url";
import { makeBishopPlayer } from "../../skills/sve-bishop-matchups/scripts/bishop-player.mjs";

const root=dirname(fileURLToPath(import.meta.url));
const table=resolve("dist/agent-table");
const [key,numberText,bishopPath,opponentPath]=process.argv.slice(2);
const orig={cQZr8Z:"05-cQZr8Z",zQrwne:"06-zQrwne",t7B32v:"07-t7B32v"};
const n=Number(numberText);
assert(Object.hasOwn(orig,key) && Number.isSafeInteger(n) && n>=1);
const id=key+"-"+String(n).padStart(2,"0"), work=join(table,id);
const read=(path)=>JSON.parse(readFileSync(path,"utf8").replace(/^\uFEFF/,""));
const put=(path,obj)=>{
  mkdirSync(dirname(path),{recursive:true});
  const tmp=path+"."+process.pid+".new";
  writeFileSync(tmp,JSON.stringify(obj)+"\n");
  renameSync(tmp,path);
};
const hash=d=>createHash("sha256").update(JSON.stringify([d.leader,Object.entries(d.main).sort(),Object.entries(d.evolve).sort()])).digest("hex");
const rt=await import(pathToFileURL(resolve("dist/bp20-duel-engine.mjs")).href);
const engine=rt.createEngine({cards:rt.ALL_CARDS,scripts:rt.ALL_SCRIPTS});
const catalog=new rt.Catalog(rt.ALL_CARDS);
const list={...read("packages/gui/restrictions/10_26_JPN.json"),id:"10_26_JPN"};
const src=rt.parseDeckFile(read(join(root,"..",orig[key],"opponent.json")));
const b=rt.parseDeckFile(read(bishopPath||join(root,"../09-bp20-fixed-300/bishop.json")));
const m=opponentPath?rt.parseDeckFile(read(opponentPath)):src;
assert.equal(catalog.printing(b.leader).class,"Havencraft");
assert.equal(catalog.printing(m.leader).class,catalog.printing(src.leader).class);
for(const p of [b.leader,...Object.keys(b.main),...Object.keys(b.evolve)]) assert(/^BP(0[1-9]|1\d|20)-/.test(p),"Bishop pool: "+p);
function deckChanges(a,b) {
  let delta=Number(a.leader!==b.leader);
  for(const zone of ["main","evolve"]){
    let plus=0,minus=0;
    for(const p of new Set([...Object.keys(a[zone]),...Object.keys(b[zone])])){
      const diff=(b[zone][p]||0)-(a[zone][p]||0);
      plus+=Math.max(0,diff);minus+=Math.max(0,-diff);
    }
    delta+=Math.max(plus,minus);
  }
  return delta;
}
const changes=deckChanges(src,m);
assert(changes<=5,"Opponent exceeds five changes against the original fixed list");
const decks=[b,m].map(d=>rt.toDeckList(d));
assert.deepEqual(rt.formatProblems(b,"standard",list,catalog,engine.validateDeck(decks[0],{deckRestrictions:true})),[]);
assert.deepEqual(engine.validateDeck(decks[1],{deckRestrictions:true}),[]);
const out=join(root,key,"replays",String(n).padStart(2,"0")+".json");
assert(!existsSync(out),"Game already completed: "+id);
const options={seed:"sve-exp/agents/v1/"+key+"/"+n,decks,deckNames:[b.name,m.name],controllers:["human","human"],
  format:"standard",restrictionList:null,deckRestrictions:true,manualActions:false,showEveryMainPhase:true,askEveryQuickWindow:true,
  turnOrder:n%2?"player1":"player2"};
const fresh=()=>engine.newGame({seed:options.seed,players:decks,config:rt.configOf(options)});
const game=fresh(), inputs=[], notes=[], delegatedUntil=[-1,-1], explicit=[0,0], strategyMoves=[0,0];
const pilots=[makeBishopPlayer(engine,rt,{seat:0,opponentKey:key,seed:"agent-counsel/"+options.seed,revision:3}),
  rt.createPresetBot(engine,"medium-v2","agent-counsel/"+options.seed+"/meta",1)];
const coaches=[];
for(const role of ["bishop","meta"]){
  const file=join(root,"pilots",role+".mjs");
  if(!existsSync(file)){coaches.push(null);continue}
  const code=readFileSync(file);
  const sha=createHash("sha256").update(code).digest("hex");
  const snapshot=join(root,"pilots","history",sha+".mjs");
  if(!existsSync(snapshot)){mkdirSync(dirname(snapshot),{recursive:true});writeFileSync(snapshot,code,{flag:"wx"})}
  const policy=await import(pathToFileURL(snapshot).href);
  assert.equal(typeof policy.choose,"function");
  coaches.push({sha,choose:policy.choose});
}
const name=def=>catalog.printing(def)?.names.cn||catalog.printing(def)?.names.ja||def;
function present(v,answers) {
  const names=new Map();
  function card(c){
    if(c.hidden){
      if(c.remembered) return {remembered:c.remembered};
      return null;
    }
    const tag=name(c.def)+"("+c.printing+")";
    names.set(c.id,tag);
    return {id:c.id,card:tag,cost:c.cost,...(c.type==="follower"?{attack:c.attack,defense:c.defense,damage:c.damage,engaged:c.engaged}:{}),
      ...(c.keywords.length?{keywords:c.keywords}:{}),...(Object.keys(c.counters).length?{counters:c.counters}:{})};
  }
  const sides=v.players.map(p=>({
    hp:p.leaderDefense,pp:p.playPoints,maxPP:p.maxPlayPoints,ep:p.evolutionPoints,sep:p.superEvolutionPoints,
    leader:p.leader?card(p.leader):null,deckLeft:p.deckCount,handCount:p.hand.length,hand:p.hand.map(card).filter(Boolean),
    board:p.field.map(card).filter(Boolean),ex:p.ex.map(card),grave:p.cemetery.map(c=>name(c.def)),graveSize:p.cemetery.length,
    banished:p.banished.map(card).filter(Boolean),evolves:p.id===v.viewer?p.evolveDeck.map(card).filter(Boolean):[],
    spentEvolves:p.evolveZone.map(card)}));
  const d=v.decision;
  if(d.type==="selectCards") d.candidates.forEach((c,i)=>names.set(c,name(d.candidateDefs[i])||names.get(c)||"未公开卡"));
  const label=(value)=>JSON.stringify(value,(k,x)=>typeof x==="string"&&names.has(x)?names.get(x)+"#"+x:x);
  return {turn:v.turn,active:v.activePlayer,phase:v.phase,attack:v.attack,decision:d.type,reason:d.reason||d.timing,
    source:d.source?names.get(d.source):undefined, sides,choices:answers.map(label)};
}
const stop=resolve("dist/quota-checkpoints/stop");
const stopped=()=>{if(existsSync(stop))throw Error("Weekly stop. Unfinished game kept locally: "+id)};
const prefix=join(work,"progress.json");
const authors=coaches.map(x=>x?.sha??null), auto=[0,0];
if(existsSync(prefix)){
  const old=read(prefix);
  assert.deepEqual(old.options,options);
  assert.deepEqual(old.authors,authors);
  for(const v of old.inputs) game.act(v.input,v.by??undefined);
  inputs.push(...old.inputs);notes.push(...old.notes);
  for(const seat of [0,1]) {explicit[seat]=old.explicit[seat];strategyMoves[seat]=old.strategyMoves[seat];delegatedUntil[seat]=old.delegatedUntil[seat];auto[seat]=old.auto[seat]}
}
while(game.decision){
  stopped();
  const d=game.decision,seat=d.player,v=game.view(seat),index=inputs.length;
  const permitted=rt.enumerateAnswers(d,180);
  const onlyPass=d.type==="quick"&&d.actions.every(a=>a.type==="pass");
  const by=onlyPass?null:seat;
  const assisted=()=>{
    if(coaches[seat]){
      const choice=coaches[seat].choose({seat,key,view:v,answers:permitted.answers});
      if(Number.isInteger(choice)&&permitted.answers[choice]){auto[seat]++;return permitted.answers[choice]}
    }
    return pilots[seat].decide(game);
  };
  let input;
  if(onlyPass) input={type:"quick",action:{type:"pass"}};
  else if(permitted.complete&&permitted.answers.length===1) input=permitted.answers[0];
  else if(delegatedUntil[seat]>=v.turn) input=assisted();
  else{
    const ticket=id+"-"+index;
    const view={id,key,n,ticket,index,seat,earlierMainPicks:strategyMoves[seat],...present(v,permitted.answers),truncated:!permitted.complete};
    put(join(work,"seat-"+seat+".json"),view);
    put(join(table,"current.json"),{id,key,n,ticket,seat,index,turn:v.turn,status:"waiting"});
    const answer=join(work,"answers",ticket+".json");
    let reply;
    for(;;){
      stopped();
      if(existsSync(answer)){reply=read(answer);break}
      await delay(220);
    }
    assert.equal(reply.ticket,ticket);assert.equal(reply.seat,seat);
    assert(["step","turn","game"].includes(reply.delegate));
    if(reply.pick==="pilot") input=assisted();
    else{
      input=typeof reply.pick==="number"?permitted.answers[reply.pick]:reply.pick;
      assert(input && rt.validateAnswer(d,input)===null);
      explicit[seat]++;
      if(d.type==="mainPhase"&&input.action.type!=="endMainPhase")strategyMoves[seat]++;
    }
    if(reply.delegate==="turn")delegatedUntil[seat]=v.turn;
    if(reply.delegate==="game"){
      assert(strategyMoves[seat]>=1,"Play one own main-phase action before handing in a game plan.");
      delegatedUntil[seat]=100000;
    }
    notes.push({index,turn:v.turn,seat,decision:d.type,pick:reply.pick==="pilot"?"pilot":input,delegate:reply.delegate,reason:reply.reason});
  }
  assert.equal(rt.validateAnswer(d,input),null);
  game.act(input,by??undefined);
  inputs.push({input,by});
  put(prefix,{options,inputs,notes,explicit,strategyMoves,delegatedUntil,authors,auto});
}
const verify=fresh();
for(const {input,by} of inputs)verify.act(input,by??undefined);
assert.deepEqual(verify.state,game.state);
const fingerprint=rt.engineFingerprint(resolve("packages/gui"));
const replay={format:"sve-replay",version:1,options,inputs,info:{result:game.result,turn:game.state.turn},
  training:{key,number:n,engine:fingerprint,policy:"agent",deckVersion:b.name,hp:game.state.players.map(p=>p.leaderDefense),
    bishopHash:hash(b),opponentHash:hash(m),originalOpponentHash:hash(src),opponentChanges:changes},
  duel:{explicit,strategyMoves,notes,authors,policyChoices:auto,delegatedPilots:["fair Bishop r3","fair medium-v2"]}};
put(out,replay);
put(join(table,"current.json"),{id,key,n,status:"complete",winner:game.result.winner,turn:game.state.turn,explicit,strategyMoves,changes});
console.log(JSON.stringify({id,result:game.result,explicit,strategyMoves,changes}));
