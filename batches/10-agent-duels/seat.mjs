// node seat.mjs view bishop|meta [waitSeconds] [previousTicket]
// node seat.mjs act bishop|meta <ticket> <pick|pilot> <step|turn|game> "reason"
import assert from "node:assert/strict";
import { existsSync, linkSync, mkdirSync, readFileSync, unlinkSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { setTimeout as delay } from "node:timers/promises";
const [cmd,role,...args]=process.argv.slice(2);
const seat=["bishop","meta"].indexOf(role);
assert(seat>=0&&["view","act"].includes(cmd));
const table=resolve("dist/agent-table");
const read=f=>JSON.parse(readFileSync(f,"utf8"));
const current=()=>{
  const file=join(table,"current.json");
  if(!existsSync(file))return {status:"idle"};
  const s=read(file);
  if(s.status==="waiting" && existsSync(join(table,s.id,"answers",s.ticket+".json"))){
    return {id:s.id,key:s.key,n:s.n,status:"resolving",index:s.index,turn:s.turn};
  }
  return s;
};
const own=s=>read(join(table,s.id,"seat-"+seat+".json"));
if(cmd==="view"){
  const seconds=Number(args[0]||0);
  assert(Number.isFinite(seconds)&&seconds>=0&&seconds<=60);
  const end=Date.now()+1000*seconds;
  let s;
  do{
    s=current();
    if(s.status==="complete"&&args[1]!=="done:"+s.id||s.status==="stopped"||s.status==="waiting"&&s.seat===seat&&s.ticket!==args[1])break;
    if(Date.now()>=end)break;
    await delay(350);
  }while(true);
  if(s.status==="waiting"&&s.seat===seat&&s.ticket!==args[1]){
    const v=own(s);
    assert.equal(s.ticket,v.ticket);
    console.log(JSON.stringify(v));
  }else console.log(JSON.stringify(s));
}else{
  const [ticket,value,delegate,...why]=args;
  const s=current();
  assert(s.status==="waiting"&&s.seat===seat&&s.ticket===ticket,"Wait for your current ticket.");
  const v=own(s);
  assert(ticket===v.ticket&&["step","turn","game"].includes(delegate));
  const pick=value==="pilot"?value:JSON.parse(value);
  if(typeof pick==="number")assert(Number.isInteger(pick)&&pick>=0&&pick<v.choices.length);
  const chosen=typeof pick==="number"?JSON.parse(v.choices[pick]):pick;
  if(delegate==="game")assert(v.earlierMainPicks>0||v.decision==="mainPhase"&&chosen?.action&&chosen.action.type!=="endMainPhase",
    "Choose a main-phase action first.");
  const folder=join(table,s.id,"answers");mkdirSync(folder,{recursive:true});
  const dst=join(folder,ticket+".json"),tmp=dst+"."+process.pid+".new";
  writeFileSync(tmp,JSON.stringify({ticket,seat,pick,delegate,reason:why.join(" ")}),{flag:"wx"});
  try{linkSync(tmp,dst)}finally{unlinkSync(tmp)}
  console.log("Submitted "+ticket+" for "+role);
}
