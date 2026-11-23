import assert from "node:assert/strict";
import {readFileSync, writeFileSync} from "node:fs";
import {dirname, join, resolve} from "node:path";
import {fileURLToPath, pathToFileURL} from "node:url";

const root=dirname(fileURLToPath(import.meta.url));
const rt=await import(pathToFileURL(resolve("dist/bp20-training-engine.mjs")).href);
const engine=rt.createEngine({cards:rt.ALL_CARDS,scripts:rt.ALL_SCRIPTS});
const foes={cQZr8Z:"破坏巫师",zQrwne:"侮蔑龙",t7B32v:"财宝皇室"};
const lines=["# 五费疾驰与两个护符的出场机会","",
  "在原共同 B 的三组百局中，逐步恢复主教自己的第五至第七回合。先找有 5 PP、场上至少一个空位的主阶段决定，再数至少有两个护符、对手没有横置守护、主教手里有席翁或莉迪耶尔的情形。每项每局最多计一次，右边条件包含其左边的全部条件。","",
  "| 对手 | 可付 5 费且有场位 | 同时有两护符 | 同时能攻击主战者 | 同时看到任一席翁或莉迪耶尔 |","|---|---:|---:|---:|---:|"];
const drills=[];
for(const [key,name] of Object.entries(foes)) {
  const totals=[0,0,0,0];let example;
  for(let i=1;i<=100;i++) {
    const n=String(i).padStart(2,"0");
    const r=JSON.parse(readFileSync(join(root,key,"replays",n+".json"),"utf8"));
    const g=engine.newGame({seed:r.options.seed,players:r.options.decks,config:rt.configOf(r.options)});
    const seen=new Set();
    for(const [at,{input,by}] of r.inputs.entries()) {
      if(g.decision.type==="mainPhase" && g.decision.player===0 && g.state.turn>=9 && g.state.turn<=14) {
        const [own,opp]=g.view(0).players;
        if(own.playPoints>=5 && own.field.length<5) {
          seen.add(0);
          const amulets=own.field.filter(c=>c.type==="amulet");
          if(amulets.length>=2) {
            seen.add(1);
            if(!opp.field.some(c=>c.engaged && c.keywords.includes("ward"))) {
              seen.add(2);
              if(own.hand.some(c=>["BP14-090","BP19-095"].includes(c.def))) {
                seen.add(3);
                if(!example)example={n,at,turn:g.state.turn,pp:own.playPoints,oppHP:opp.leaderDefense,
                  amulets:amulets.map(c=>engine.db.get(c.def).names.cn).join("、")};
              }
            }
          }
        }
      }
      g.act(input,by??undefined);
    }
    assert.deepEqual(g.result,r.info.result);
    for(const j of seen)totals[j]++;
  }
  lines.push("| "+[name,...totals].join(" | ")+" |");
  if(example){const x=example;drills.push("- "+name+"第 "+Number(x.n)+" 局 T"+x.turn+"，输入 "+x.at+" 前有 "+x.pp+" PP，场上护符为"+x.amulets+"，对手剩 "+x.oppHP+" 血。[原局]("+key+"/games/"+x.n+".md) · [以主教接手](http://127.0.0.1:5170/practice/index.html?replay=BP20-fixed-"+key+"-"+x.n+".json&at="+x.at+"&seat=0)")}
}
lines.push("","天曜战骑本体 5 费 3/7、疾驰、守护。入场时己方场上有至少两个护符，会加 2 攻并回 2。最右列允许手里是被保留的那一张同名卡，因而只用来挑练习局面。是否实际抽到替换卡、出场、触发、攻击或改变胜负，须另用换牌后的录像核查。","",...drills,"");
writeFileSync(join(root,"knight-windows.md"),lines.join("\n"));
console.log(lines.slice(6,9).join("\n"));
