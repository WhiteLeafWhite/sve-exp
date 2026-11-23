// From the simulator checkout: node <this file> full|target
import assert from "node:assert/strict";
import {createHash} from "node:crypto";
import {existsSync,mkdirSync,readFileSync,writeFileSync} from "node:fs";
import {dirname,join,resolve} from "node:path";
import {fileURLToPath,pathToFileURL} from "node:url";
import {makeBishopPlayer} from "../../skills/sve-bishop-matchups/scripts/bishop-player.mjs";
import {seatStrategy} from "../10-agent-duels/seat-strategy.mjs";

const mode=process.argv[2];
assert(["full","target"].includes(mode));
const folder=dirname(fileURLToPath(import.meta.url));
const duel=join(folder,"../10-agent-duels");
const read=p=>JSON.parse(readFileSync(p,"utf8"));
const old=read(join(folder,"zQrwne/replays/15.json"));
const baseline=read(join(folder,"../12-second-saito/candidate/zQrwne/replays/85.json"));
assert.deepEqual(old.options,baseline.options);
const destination=join(folder,"drills","dragon-85-check4-"+mode+".json");
if(existsSync(destination)){assert(read(destination).info.result);process.exit(0)}
const rt=await import(pathToFileURL(resolve("dist/bp20-duel-engine.mjs")).href);
assert.equal(rt.engineFingerprint(resolve("packages/gui")),old.training.engine);
const engine=rt.createEngine({cards:rt.ALL_CARDS,scripts:rt.ALL_SCRIPTS});
const key=old.training.key, seed=old.options.seed;
assert(key==="zQrwne" && old.training.opponentPreset==="hard-next" && old.training.opponentEffort===1);
const fresh=()=>engine.newGame({seed,players:old.options.decks,config:rt.configOf(old.options)});
const g=fresh(), inputs=[], policies={};
for(const n of [3,4]){
  const id=String(n).padStart(3,"0"),hash=read(join(duel,"checks",id+".json")).nextPolicies.bishop;
  const source=join(duel,"pilots/history",hash+".mjs");
  assert.equal(createHash("sha256").update(readFileSync(source)).digest("hex"),hash);
  policies[n]={hash,coach:await import(pathToFileURL(source).href)};
}
assert.equal(policies[3].hash,old.training.seatPilot.hash);
const players=[makeBishopPlayer(engine,rt,{seat:0,opponentKey:key,seed:"bishop/"+seed,revision:3}),
               rt.createPresetBot(engine,"hard-next",seed+":hard:1",1)];
const authored=[];
while(g.decision){
  if(existsSync(resolve("dist/quota-checkpoints/stop")))process.exit(3);
  const d=g.decision,i=inputs.length;
  const forcedPass=d.type==="quick" && d.actions.every(a=>a.type==="pass");
  const by=forcedPass?null:d.player;
  let input;
  if(by===0){
    const {answers}=rt.enumerateAnswers(d,180);
    const check=mode==="full" || i===117 ? 4 : 3;
    const decision=seatStrategy(g,0,key,answers,policies[check].coach,players[0],2);
    input=decision.input;
    if(decision.authored)authored.push({index:i,check});
  }else input=forcedPass?{type:"quick",action:{type:"pass"}}:players[by].decide(g);
  if(mode==="target" && i<117)assert.deepEqual({input,by},old.inputs[i]);
  g.act(input,by??undefined);inputs.push({input,by});assert(inputs.length<5000);
}
const verify=fresh();
for(const {input,by} of inputs)verify.act(input,by??undefined);
assert(g.result);assert.deepEqual(verify.state,g.state);
const firstDifference=(other)=>{let i=0;while(i<inputs.length && i<other.length && JSON.stringify(inputs[i])===JSON.stringify(other[i]))i++;
  return i===inputs.length && i===other.length ? null : i;};
const from=firstDifference(old.inputs),fromBase=firstDifference(baseline.inputs);
const practice={source:"15.json",fromInput:mode==="target"?117:from??0,checkpointFour:policies[4].hash,checkpointThree:policies[3].hash,
  scope:mode,authored,firstDifferenceFromThird:from,firstDifferenceFromR3:fromBase,terminalHP:g.state.players.map(p=>p.leaderDefense)};
mkdirSync(dirname(destination),{recursive:true});
writeFileSync(destination,JSON.stringify({format:old.format,version:old.version,options:old.options,inputs,info:{turn:g.state.turn,result:g.result},practice})+"\n",{flag:"wx"});
console.log(JSON.stringify({mode,turn:g.state.turn,winner:g.result.winner,...practice}));
