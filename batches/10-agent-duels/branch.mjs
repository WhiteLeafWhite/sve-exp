// node branch.mjs <finished replay> <first differing input> [--picks 64=3,65=2] [--inspect 65] [--out new.json]
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { basename,dirname,join,resolve } from "node:path";
import { fileURLToPath,pathToFileURL } from "node:url";
import { parseArgs } from "node:util";
import { makeBishopPlayer } from "../../skills/sve-bishop-matchups/scripts/bishop-player.mjs";
import { seatStrategy } from "./seat-strategy.mjs";
import { replayEvolvePrefix } from "./evolve-prefix.mjs";

const {positionals:[source,boundary],values:arg}=parseArgs({allowPositionals:true,options:{picks:{type:"string",default:""},plan:{type:"string"},inspect:{type:"string"},out:{type:"string"},
  "after-check":{type:"string"},"seat-policy":{type:"string",default:"both"},"evolve-deck":{type:"string"},"recorded-restarts":{type:"string"}}});
const cut=Number(boundary),inspect=arg.inspect===undefined?null:Number(arg.inspect);
const original=JSON.parse(readFileSync(source,"utf8")),{duel,training}=original;
let options=original.options;
assert(duel&&original.info.result&&Number.isSafeInteger(cut)&&cut>=0&&cut<original.inputs.length);
assert(inspect!==null||arg.out);
let restartInputs=duel.restartInputs??[];
if(arg["recorded-restarts"]!==undefined){
  assert(duel.resumes && !duel.restartInputs && /^\d+(,\d+)*$/.test(arg["recorded-restarts"]));
  restartInputs=arg["recorded-restarts"].split(",").map(Number);
}
assert.equal(restartInputs.length,duel.resumes??0,"Supply documented search restart positions for a legacy resumed game.");
assert(restartInputs.every((p,i)=>Number.isSafeInteger(p)&&p>=0&&p<=original.inputs.length&&(!i||p>=restartInputs[i-1])));
const picks=new Map();
for(const entry of arg.picks.split(",").filter(Boolean)){
  const parts=entry.match(/^(\d+)=(\d+)$/);assert(parts);
  const from=Number(parts[1]);assert(from>=cut&&!picks.has(from));picks.set(from,Number(parts[2]));
}
const rt=await import(pathToFileURL(resolve("dist/bp20-duel-engine.mjs")).href);
const engine=rt.createEngine({cards:rt.ALL_CARDS,scripts:rt.ALL_SCRIPTS});
let alternatePrefix;
if(arg["evolve-deck"]){
  assert(inspect===null||inspect>=cut);
  const deck=rt.parseDeckFile(JSON.parse(readFileSync(arg["evolve-deck"],"utf8").replace(/^\uFEFF/,"")));
  const alternate=rt.toDeckList(deck);
  alternatePrefix=replayEvolvePrefix(engine,rt,original,alternate,cut);
  options={...options,decks:[alternate,options.decks[1]],deckNames:[deck.name,options.deckNames[1]]};
}
const root=dirname(fileURLToPath(import.meta.url));
const planned=arg.plan?await import(pathToFileURL(resolve(arg.plan)).href):null, conditional=[];
if(planned)assert(typeof planned.choose==="function");
async function archivedCoach(sha){
  if(!sha)return null;assert(/^[a-f0-9]{64}$/.test(sha));
  const path=join(root,"pilots/history",sha+".mjs");
  assert.equal(createHash("sha256").update(readFileSync(path)).digest("hex"),sha);
  return import(pathToFileURL(path).href);
}
const coaches=await Promise.all(duel.authors.map(archivedCoach));
const afterIds=[...duel.authors];
assert(["bishop","meta","both"].includes(arg["seat-policy"]));
if(arg["after-check"]){
  assert(/^\d+$/.test(arg["after-check"]));
  const file=String(Number(arg["after-check"])).padStart(3,"0")+".json";
  const checked=JSON.parse(readFileSync(join(root,"checks",file),"utf8"));
  for(const [seat,role] of ["bishop","meta"].entries()){
    if(arg["seat-policy"]==="both" || arg["seat-policy"]===role){
      assert(checked.nextPolicies?.[role],"The checkpoint needs a saved strategy for "+role);
      afterIds[seat]=checked.nextPolicies[role];
    }
  }
}
const afterCoaches=await Promise.all(afterIds.map(archivedCoach));
assert.equal(afterCoaches[0]?.baseRevision??3,coaches[0]?.baseRevision??3,"The two branches need the same cached base planner.");
const makePilots=()=>[makeBishopPlayer(engine,rt,{seat:0,opponentKey:training.key,seed:"agent-counsel/"+options.seed,revision:coaches[0]?.baseRevision??3}),rt.createPresetBot(engine,"medium-v2","agent-counsel/"+options.seed+"/meta",1)];
let pilots=makePilots();
const fresh=()=>engine.newGame({seed:options.seed,players:options.decks,config:rt.configOf(options)});
const game=alternatePrefix?.game??fresh(),inputs=alternatePrefix?.inputs??[],manual=new Map(duel.notes.map(m=>[m.index,m])),applied=[];
const label=def=>engine.db.has(def)?engine.db.get(def).names.cn||def:def;
while(game.decision){
  const i=inputs.length,d=game.decision,s=d.player,v=game.view(s),legal=rt.enumerateAnswers(d,180);
  if(i>0 && i<=cut && restartInputs.includes(i))pilots=makePilots();
  if(i===inspect){
    const names=new Map();
    for(const p of v.players)for(const c of [p.leader,...p.field,...p.hand,...p.ex,...p.cemetery,...p.evolveZone,...p.evolveDeck])if(c&&!c.hidden)names.set(c.id,label(c.def)+"#"+c.id);
    if(d.type==='selectCards')d.candidates.forEach((id,j)=>names.set(id,label(d.candidateDefs[j])+"#"+id));
    const choices=legal.answers.map((a,j)=>[j,JSON.stringify(a,(k,x)=>typeof x==='string'&&names.has(x)?names.get(x):x)]);
    console.log(JSON.stringify({i,turn:v.turn,seat:s,decision:d.type,reason:d.reason,hp:v.players.map(p=>p.leaderDefense),choices}));process.exit(0);
  }
  const forcedPass=d.type==="quick"&&d.actions.every(a=>a.type==="pass");
  const by=forcedPass?null:s, before=i<cut, recorded=original.inputs[i];
  const next=before||!planned||picks.has(i)?null:planned.choose({index:i,seat:s,view:v,answers:legal.answers});
  let choice;
  if(picks.has(i)){
    const pick=picks.get(i);choice=legal.answers[pick];assert(choice,"Unavailable branch choice");applied.push([i,pick]);
    // A direct choice replaces the call to the seat policy at that point.
  }else if(next!==null && next!==undefined){
    assert(Number.isInteger(next)&&legal.answers[next],"Unavailable planned choice");
    choice=legal.answers[next];conditional.push([i,next]);
  }else if(forcedPass)choice={type:"quick",action:{type:"pass"}};
  else if(legal.complete&&legal.answers.length===1)choice=legal.answers[0];
  else if(before&&manual.has(i)&&manual.get(i).pick!=="pilot")choice=recorded.input;
  else choice=seatStrategy(game,s,training.key,legal.answers,before?coaches[s]:afterCoaches[s],pilots[s],duel.viewVersion??1).input;
  if(before){assert.equal(by,recorded.by);assert.deepEqual(choice,recorded.input,"Historical seat choice diverged at "+i);}
  assert.equal(rt.validateAnswer(d,choice),null);game.act(choice,by??undefined);inputs.push({input:choice,by});
}
assert.equal(applied.length,picks.size);const verify=fresh();for(const {input,by} of inputs)verify.act(input,by??undefined);assert.deepEqual(verify.state,game.state);
const same=JSON.stringify(inputs)===JSON.stringify(original.inputs);
const report={source:basename(source),fromInput:cut,picks:applied,sameInputsAsOriginal:same,authors:duel.authors,terminalHP:game.state.players.map(p=>p.leaderDefense)};
if(restartInputs.length)report.originalRestartInputs=restartInputs;
if(alternatePrefix)Object.assign(report,{evolveSlots:alternatePrefix.slots,verifiedPositions:alternatePrefix.verifiedPositions,plannersRestartedAt:cut});
if(arg["after-check"])Object.assign(report,{afterCheckpoint:Number(arg["after-check"]),afterAuthors:afterIds,updatedSeat:arg["seat-policy"]});
if(arg.plan){report.conditionalPicks=conditional;report.plan=basename(arg.plan);report.planSha256=createHash("sha256").update(readFileSync(arg.plan)).digest("hex");}
const result={format:"sve-replay",version:1,options,inputs,info:{result:game.result,turn:game.state.turn},practice:report};
mkdirSync(dirname(resolve(arg.out)),{recursive:true});writeFileSync(arg.out,JSON.stringify(result)+"\n",{flag:"wx"});
console.log(JSON.stringify({...result.info,...report}));
