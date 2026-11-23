// Audit actual uses and publicly visible second-Saito opportunities in the locked triple of 100.
import assert from "node:assert/strict";
import {readFileSync,writeFileSync} from "node:fs";
import {dirname,join,resolve} from "node:path";
import {fileURLToPath,pathToFileURL} from "node:url";
const folder=dirname(fileURLToPath(import.meta.url));
const rt=await import(pathToFileURL(resolve("dist/bp20-training-engine.mjs")).href);
const engine=rt.createEngine({cards:rt.ALL_CARDS,scripts:rt.ALL_SCRIPTS});
const keys={cQZr8Z:"破坏巫师",zQrwne:"侮蔑龙",t7B32v:"财宝皇室"};
const deck=JSON.parse(readFileSync(join(folder,"bishop.json"),"utf8"));
const stats={};
for(const key of Object.keys(keys)){
  const cards=Object.fromEntries(Object.keys(deck.evolve).map(id=>[id,[0,0,0]]));
  const windows={secondBody:[],pyro:[],galm:[]};
  for(let n=1;n<=100;n++){
    const replay=JSON.parse(readFileSync(join(folder,key,"replays",String(n).padStart(2,"0")+".json"),"utf8"));
    const o=replay.options, game=engine.newGame({seed:o.seed,players:o.decks,config:rt.configOf(o)});
    const hits={},counts={};let spentOn=-1,lastEvolve=-1;
    for(const [i,{input,by}] of replay.inputs.entries()){
      const d=game.decision,turn=game.state.turn;
      if(spentOn>=0 && turn>spentOn && turn!==lastEvolve && d.type==="mainPhase" && d.player===0){
        const v=game.view(0),[me,foe]=v.players, cost=me.evolutionPoints>0?0:1;
        const board=me.field.some(c=>!c.hidden&&c.def==="BP18-117"&&!c.evolvedWith&&!c.boxed&&!c.abilitiesLost)&&me.playPoints>=cost;
        const fromHand=me.playPoints>=2+cost&&d.actions.some(a=>a.type==="play"&&[...me.hand,...me.ex].some(c=>!c.hidden&&c.def==="BP18-117"&&c.id===a.card));
        if(board||fromHand){
          const point={number:n,turn,input:i};hits.secondBody??=point;
          if(me.ex.length<5&&me.cemetery.some(c=>c.def==="BP18-123")){
            hits.pyro??=point;
            if(foe.field.some(c=>!c.hidden&&c.def==="BP05-052"&&c.evolvedWith&&!c.abilitiesLost&&c.defense<=4))hits.galm??=point;
          }
        }
      }
      for(const ev of game.act(input,by??undefined)){
        if(ev.type!=="evolved")continue;
        const evo=game.state.cards[ev.evolveCard],body=game.state.cards[ev.card];
        if(evo?.owner!==0||body?.controller!==0)continue;
        lastEvolve=turn;
        if(Object.hasOwn(cards,evo.def))counts[evo.def]=(counts[evo.def]||0)+1;
        if(evo.def==="BP18-118")spentOn=turn;
      }
    }
    assert.deepEqual(game.result,replay.info.result);
    for(const [id,used] of Object.entries(counts))for(let j=0;j<Math.min(3,used);j++)cards[id][j]++;
    for(const [reason,point] of Object.entries(hits))windows[reason].push(point);
  }
  stats[key]={cards,windows};
}
writeFileSync(join(folder,"evolve-slots.json"),JSON.stringify(stats,null,2)+"\n");
const md=["# 主教进化牌的实际使用与可替换卡位","", "全部采用共同 B 对原表 Hard 的三个独立百局。每格是该进化卡在这些局中至少被使用一／二／三次的局数。包含能力造成的免费进化。","", "| 进化牌 | 张数 | 巫师 | 龙族 | 皇室 |","|---|---:|---:|---:|---:|"];
for(const [id,copies] of Object.entries(deck.evolve)){
  const name=engine.db.get(id).names.cn;
  md.push(`| ${name} ${id} | ${copies} | `+Object.keys(keys).map(k=>stats[k].cards[id].slice(0,copies).join("／")).join(" | ")+" |");
}
md.push("","## 第二张灾藤进化是否有机会上场","","先要求第一张灾藤进化已在更早回合用过。另一个己方回合尚未发生任何己方进化，有可进化状态的灾藤在场且具基础费用，或此刻能合法从手牌／EX 出灾藤且 PP 足以付基础费用和进化。再逐层检查 EX 空位、墓地炎术、龙族剩 4 防以内的进化侮蔑绝杰。每局每项最多计一次。折扣、变化后的对方应手和改表后的胜负须另行实战。","","| 对手 | 后续有灾藤及费用 | 还能回收炎术 | 同时遇到上述嘉鲁蜜儿 |","|---|---:|---:|---:|");
for(const [k,name] of Object.entries(keys)){
  const w=stats[k].windows;
  md.push(`| ${name} | ${w.secondBody.length} | ${w.pyro.length} | ${w.galm.length} |`);
}
md.push("","对龙可从下列先后攻与输入点重做选择。先遮住对手手牌，仅看主教当时的牌、公开 EX、墓场、剩余 PP／EP 和对方从者。","");
for(const g of stats.zQrwne.windows.galm){const n=String(g.number).padStart(2,"0");md.push(`- 第 ${g.number} 局 T${g.turn} 输入 ${g.input} 前。[逐回合日志](zQrwne/games/${n}.md) · [原生录像](zQrwne/replays/${n}.json)`);}
md.push("","[每项最早出现的输入与所有卡位计数](evolve-slots.json)");
writeFileSync(join(folder,"evolve-slots.md"),md.join("\n")+"\n");
console.log(JSON.stringify(Object.fromEntries(Object.entries(stats).map(([k,v])=>[k,{cards:v.cards,windows:Object.fromEntries(Object.entries(v.windows).map(([n,a])=>[n,a.length]))}]))));
