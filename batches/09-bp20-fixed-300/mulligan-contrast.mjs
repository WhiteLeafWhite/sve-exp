// Run from the SVE NEXT checkout. Give the path to a completed standard r3 game.
import assert from "node:assert/strict";
import {existsSync, mkdirSync, readFileSync, writeFileSync} from "node:fs";
import {basename, dirname, join, resolve} from "node:path";
import {pathToFileURL} from "node:url";
import {makeBishopPlayer} from "../../skills/sve-bishop-matchups/scripts/bishop-player.mjs";

const source=resolve(process.argv[2]);
const r=JSON.parse(readFileSync(source,"utf8"));
const {key,policy,opponentPreset,opponentEffort}=r.training;
assert(key==="t7B32v" && policy===3 && opponentPreset==="hard-next" && opponentEffort===1);
assert(r.info.result && r.options.turnOrder==="player2");
const id=basename(source,".json");
const folder=join(dirname(dirname(dirname(source))),"drills");
const output=join(folder,"royal-opening-"+id+".json");
if(existsSync(output)){assert(JSON.parse(readFileSync(output,"utf8")).info.result);process.exit(0)}
const rt=await import(pathToFileURL(resolve("dist/bp20-training-engine.mjs")).href);
assert.equal(rt.engineFingerprint(resolve("packages/gui")),r.training.engine);
const engine=rt.createEngine({cards:rt.ALL_CARDS,scripts:rt.ALL_SCRIPTS});
const fresh=()=>engine.newGame({seed:r.options.seed,players:r.options.decks,config:rt.configOf(r.options)});
const g=fresh();
const pilots=[makeBishopPlayer(engine,rt,{seat:0,opponentKey:key,seed:"bishop/"+r.options.seed,revision:3}),
  rt.createPresetBot(engine,"hard-next",r.options.seed+":hard:1",1)];
const inputs=[];
let at=-1;
while(g.decision){
  if(existsSync(resolve("dist/quota-checkpoints/stop")))process.exit(3);
  const d=g.decision;
  const forcedPass=d.type==="quick" && d.actions.every(a=>a.type==="pass");
  const by=forcedPass?null:d.player;
  let input=forcedPass?{type:"quick",action:{type:"pass"}}:pilots[by].decide(g);
  if(at<0)assert.deepEqual({input,by},r.inputs[inputs.length]);
  if(d.type==="mulligan" && d.player===0){
    assert.equal(at,-1);
    const hand=g.view(0).players[0].hand.map(c=>c.def);
    assert(hand.includes("BP18-107") && hand.includes("BP18-117"));
    at=inputs.length;
    input=input.redraw?{type:"mulligan",redraw:false}:{type:"mulligan",redraw:true,bottomOrder:[...d.hand]};
  }
  g.act(input,by??undefined);
  inputs.push({input,by});
  assert(inputs.length<5000);
}
const verify=fresh();
for(const {input,by} of inputs)verify.act(input,by??undefined);
assert(at>=0 && g.result);assert.deepEqual(verify.state,g.state);
const replay={format:r.format,version:r.version,options:r.options,inputs,info:{result:g.result,turn:g.state.turn},
  practice:{source:basename(source),fromInput:at,manualInputs:[at],matchup:key,opponentPreset,opponentEffort,
    fingerprint:r.training.engine,originalRedraw:r.inputs[at].input.redraw,terminalHP:g.state.players.map(p=>p.leaderDefense)}};
mkdirSync(folder,{recursive:true});
writeFileSync(output,JSON.stringify(replay)+"\n",{flag:"wx"});
console.log(basename(output),inputs.length,replay.info.turn,replay.info.result.winner);
