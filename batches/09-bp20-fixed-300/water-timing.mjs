import assert from "node:assert/strict";
import {readFileSync, writeFileSync} from "node:fs";
import {dirname, join, resolve} from "node:path";
import {fileURLToPath, pathToFileURL} from "node:url";

const root=dirname(fileURLToPath(import.meta.url));
const rt=await import(pathToFileURL(resolve("dist/bp20-training-engine.mjs")).href);
const engine=rt.createEngine({cards:rt.ALL_CARDS,scripts:rt.ALL_SCRIPTS});
const keys={cQZr8Z:"破坏巫师",zQrwne:"侮蔑龙",t7B32v:"财宝皇室"};
const table=[],drills=[];
for(const [key,name] of Object.entries(keys)) {
  const ownUses=[],enemyUses=[];
  for(let n=1;n<=100;n++){
    const id=String(n).padStart(2,"0"), r=JSON.parse(readFileSync(join(root,key,"replays",id+".json"),"utf8"));
    const g=engine.newGame({seed:r.options.seed,players:r.options.decks,config:rt.configOf(r.options)});
    const leader=g.state.players[0].zones.leader[0];
    const ownActions=[],spent=[],windows=new Map(),hits=new Map(),uses=[];
    for(const [at,{input,by}] of r.inputs.entries()){
      const d=g.decision,turn=g.state.turn,active=g.state.activePlayer;
      if(d.player===0&&d.type==="quick"&&d.timing==="attack"&&active===1&&!windows.has(turn))windows.set(turn,at);
      if(by===0&&d.type==="mainPhase"&&input.action.type!=="endMainPhase")ownActions.push({at,turn});
      const water=by===0&&input.action?.type==="play"&&g.state.cards[input.action.card].def==="BP14-T07";
      let hand;
      if(water)hand=new Set(g.view(0).players[0].hand.map(c=>c.id));
      const events=g.act(input,by??undefined);
      if(water){
        const drawn=g.view(0).players[0].hand.filter(c=>!hand.has(c.id));
        assert(drawn.length<=1);
        const use={n,id,at,turn,drawn:drawn[0]?.id,drawName:drawn[0]?engine.db.get(drawn[0].def).names.cn:"没有抽到牌"};
        (active===0?uses:enemyUses).push(use);
      }
      for(const e of events){
        if(e.type==="cardsMoved")for(const m of e.moves)if(m.from?.zone==="hand"&&m.from.player===0)
          spent.push({id:m.card,at,turn});
        if(e.type==="damageDealt"&&e.target===leader&&e.amount>0){
          if(!hits.has(turn))hits.set(turn,[]);
          hits.get(turn).push({at,amount:e.amount});
        }
      }
    }
    assert.deepEqual(g.result,r.info.result);
    for(const u of uses){
      u.spent=spent.some(m=>m.id===u.drawn&&m.turn===u.turn&&m.at>u.at);
      u.last=!ownActions.some(a=>a.turn===u.turn&&a.at>u.at);
      u.lethal=g.state.turn===u.turn+1 && g.result.losses?.some(l=>l.player===0&&l.reason==="leaderDefense");
      const start=windows.get(u.turn+1);
      u.after=start!==undefined?(hits.get(u.turn+1)??[]).filter(e=>e.at>=start):[];
      u.wouldStay=Boolean(u.lethal && u.after.length && g.state.players[0].leaderDefense+u.after.length>0);
      ownUses.push(u);
    }
  }
  const count=f=>ownUses.filter(f).length;
  table.push("| "+[name,ownUses.length,enemyUses.length,count(u=>u.spent),count(u=>u.last),count(u=>u.last&&u.lethal),
    count(u=>u.last&&u.wouldStay)].join(" | ")+" |");
  const show=(u,text)=>{
    if(!u)return;
    drills.push("- "+name+"第 "+u.n+" 局 T"+u.turn+"，输入 "+u.at+"。"+text+
       "[原局战报]("+key+"/games/"+u.id+".md) · [从出水银前接手](http://127.0.0.1:5170/practice/index.html?replay=BP20-fixed-"+key+"-"+u.id+".json&at="+u.at+"&seat=0)");
  };
  const next=ownUses.find(u=>u.last&&u.wouldStay);
  show(next,next?"水银是本回合最后一次主阶段行动。下一回合从第一次攻击 Quick 窗口起，原顺序打到主教的正伤害为 "+next.after.map(e=>e.amount).join("、")+"。":"");
  const cast=ownUses.find(u=>u.spent);
  show(cast,cast?"水银抽到"+cast.drawName+"，同一张牌在本回合就离开手牌。先算延后抽牌会失去哪项行动。":"");
}
const lines=["# 水银留给哪一个回合","",
  "逐手重演固定 B 的三个百局。水银的断绝给本回合每段伤害减 1，然后抽一张。表中以实际施放次数为单位。一张牌抽入手、又以同一张实体离手，可能用于出牌、弃牌或以能力放置到场上。最后一次主阶段行动之后仍可能有回合末触发。",
  "","| 对手 | 自己回合用水银 | 对手回合用水银 | 自己回合抽到并于当回合离手 | 自己回合最后一次行动是水银 | 其中下回合主战者被击倒 | 原顺序从首次攻击窗口起逐段减 1 后仍有血 |",
  "|---|---:|---:|---:|---:|---:|---:|",...table,"",
  "末栏只对表中前一栏计算。保留攻击前已经结算的伤害，从原局第一次攻击 Quick 窗口起，每一段实际正伤害再减 1，检查终局体力是否回到正数。这是原有动作的算术复核。改为留费还会改变抽牌和对手的出牌顺序，真正的胜负要从原局面另打。","",...drills,"",
  "巫师双席第六局提供了一次实际检验。原局当回合用水银 T15 落败，改为白牙、承担者、留水银应对首攻后，面对归档打法在 T24 取胜。用两局的对手视角练习把能力伤害放到首攻之前。[同牌序的不同线路](../10-agent-duels/drills/index.md)",""];
writeFileSync(join(root,"water-timing.md"),lines.join("\n"));
console.log(table.join("\n"));
