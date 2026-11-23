// Rebuild five Chinese turn logs and a group review from the native replays.
// node report.mjs <opponent key> <round 1–10>   (cwd = simulator checkout)
import assert from "node:assert/strict";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { basename, dirname, join, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
const here = dirname(fileURLToPath(import.meta.url));
const rt = await import(pathToFileURL(resolve("dist/bp20-training-engine.mjs")).href);
const [key, roundText, series = "explore"] = process.argv.slice(2);
const otherFolders = {fixed100:"09-bp20-fixed-300",duel:"10-agent-duels",lyrial:"09b-bp20-lyrial",dragonPolicy:"09c-bp20-dragon-policy",banish:"09d-bp20-banish",opening:"11-dragon-mulligan/candidate",openingControl:"11-dragon-mulligan/control",secondSaito:"12-second-saito/candidate",saitoControl:"12-second-saito/control"};
const slotTrial = series === "secondSaito" || series === "saitoControl";
const drillFile=series==="drill" ? resolve(process.argv[5]) : null;
assert(series==="explore" || drillFile || Object.hasOwn(otherFolders,series));
const root = drillFile || series==="explore" ? here : join(here, "..", otherFolders[series]);
const round = Number(roundText);
const foe = { cQZr8Z: "巫师", zQrwne: "龙族", t7B32v: "皇室" }[key];
assert(foe && Number.isSafeInteger(round) && round >= 1 && (series === "duel" || round <= (slotTrial || ["fixed100","opening"].includes(series) ? 20 : 10)));
const who = ["主教", foe];
const engine = rt.createEngine({ cards: rt.ALL_CARDS, scripts: rt.ALL_SCRIPTS });
const read = (path) => JSON.parse(readFileSync(path, "utf8").replace(/^\uFEFF/, ""));
const save = (path, text) => { mkdirSync(dirname(path), { recursive: true }); writeFileSync(path, text, "utf8"); };
const pad = (n) => String(n).padStart(2, "0");
const name = (def) => engine.db.has(def) ? engine.db.get(def).names.cn || engine.db.get(def).name : def || "能力";
const fmtHp = (a) => a.join("／");
const resultName = (w) => w === 0 ? "胜" : w === 1 ? "负" : "平";
const handNames = (list) => list.map((c) => name(c)).join("、");

function summarize(number) {
  const id = pad(number), group = pad(round);
  const r = read(drillFile || join(root, key, "replays", id + ".json"));
  const opts = r.options;
  const g = engine.newGame({ seed: opts.seed, players: opts.decks, config: rt.configOf(opts) });
  const lookup = new Map(Object.values(g.state.cards).map((c) => [c.id, c.def]));
  const card = (id) => name(lookup.get(id) ?? g.state.cards[id]?.def);
  const leaders = g.state.players.map((p) => p.zones.leader[0]);
  const targetName = (id) => leaders.includes(id) ? who[leaders.indexOf(id)] + "主战者" : card(id);
  const hp = [20,20], turns = [], hand = [], mulligan = ["",""];
  const drawn = {}, cast = {}, entered = {};
  const evolutions = [];
  const openingHands = [[], []];
  const branches=new Set(drillFile?[r.practice.fromInput,...(r.practice.manualInputs??[]),
    ...(r.practice.picks??[]).map(p=>p[0]),...(r.practice.conditionalPicks??[]).map(p=>p[0])]:[]);
  const marked=[];
  let t = null, alternative = null, metaAlternative = null, earlyPlays = 0, firstHeal = null;
  const log = (s) => { if (t) t.lines.push(s); };
  const record = (events) => {
    for (const e of events) {
      if (e.type === "turnStarted") {
        t = { n: e.turn, p: e.player, start: [...hp], end: [...hp], lines: [], hits: [], cards: [] };
        turns.push(t);
      } else if (e.type === "cardsMoved") {
        for (const m of e.moves) {
          if (m.card) lookup.set(m.card, m.def);
          if (m.newCard) lookup.set(m.newCard,m.def);
          if (m.to.zone === "field" && m.from?.zone !== "field") {
            if (m.to.player === 0) entered[m.def] = (entered[m.def] ?? 0) + 1;
            if (m.from?.zone === "deck") log(who[m.to.player] + "将" + name(m.def) + "从牌库直接召唤或放置到场上。");
          }
          if (m.to.zone === "hand" && m.owner === 0) {
            drawn[m.def] = (drawn[m.def] ?? 0) + 1;
            if (t) log("主教将" + name(m.def) + "加入手牌。");
          } else if (m.to.zone === "ex") log(who[m.to.player] + "的 EX 加入" + name(m.def) + "。");
          else if (m.from?.zone === "field" && ["cemetery","banished","hand"].includes(m.to.zone)) {
            log(name(m.def) + ({cemetery:"进入墓场。",banished:"被消灭。",hand:"回到手牌。"}[m.to.zone]));
          }
        }
      } else if (e.type === "cardPlayed") {
        log(who[e.player] + "使用" + name(e.def) + "。");
        if (t) t.cards.push([e.player,e.def]);
        if (e.player === 0) {
          cast[e.def] = (cast[e.def] ?? 0) + 1;
          if (t && t.n <= 6) earlyPlays++;
        }
      } else if (e.type === "evolved") {
        log(card(e.card) + (e.superEvolved ? "超进化。" : "进化。"));
        const evo = g.state.cards[e.evolveCard];
        if (slotTrial && evo?.owner === 0 && g.state.cards[e.card]?.controller === 0)
          evolutions.push({card:evo.def,turn:t.n});
      }
      else if (e.type === "attackDeclared") log(who[e.player] + "用" + card(e.attacker) + "攻击" + targetName(e.target) + "。");
      else if (e.type === "cardsSelected" && e.source && e.cards.length) log(card(e.source) + "选择" + e.cards.map(targetName).join("、") + "。");
      else if (e.type === "countersChanged" && e.counter === "prayer") log(card(e.card) + "现有 " + e.count + " 个祈祷指示物。");
      else if (e.type === "damageDealt" && leaders.includes(e.target)) {
        const to = leaders.indexOf(e.target), from = e.by?.def || lookup.get(e.source);
        const text = name(from) + "对" + who[to] + "主战者造成 " + e.amount + " 点" + (e.kind === "ability" ? "能力" : "攻击") + "伤害";
        log(text + "。");
        if (t) t.hits.push({ to, from, amount:e.amount, kind:e.kind, text });
      } else if (e.type === "leaderDefenseChanged") {
        hp[e.player] = e.defense;
        if (t) t.end = [...hp];
        if (e.player === 0 && e.delta > 0 && t && firstHeal === null) firstHeal = t.n;
        log(who[e.player] + "体力 " + (e.delta > 0 ? "+" : "") + e.delta + "，现为 " + e.defense + "。");
      } else if (e.type === "gameEnded") {
        for (const loss of e.result.losses) if (loss.reason === "deckOut") log(who[loss.player] + "因需要抽牌时牌库已空而落败。");
      } else if (e.type === "mulligan") mulligan[e.player] = e.redraw ? "整手重抽" : "保留";
      else if (e.type === "dieRolled") log(who[e.player] + "掷出 " + e.result + "。");
    }
  };
  record(g.startupEvents);
  for (const [i, {input,by}] of r.inputs.entries()) {
    const d = g.decision;
    if(branches.has(i)){
      let action=input.type;
      if(input.type==="selectCards") {
        const chosen=input.cards.map(id=>name(d.candidateDefs[d.candidates.indexOf(id)]));
        action=chosen.length?"选择"+chosen.join("、"):"不取牌";
      } else if(input.type==="choose"){
        const choices=d.options.filter(o=>input.ids.includes(o.id));
        const oracle=g.state.cards[d.source]?.def==="SD04-002";
        action=oracle ? (input.ids[0]==="1" ? "选择提高 PP 上限" : "选择抽一张牌") : "选择模式 "+choices.map(o=>o.id).join("、");
      } else if(input.action){
        const a=input.action;
        action=({play:"使用",evolve:"进化",activate:"起动"}[a.type]??"")+
          (a.card?card(a.card):a.type==="attack"?card(a.attacker)+"攻击"+targetName(a.target):a.type==="pass"?"让过 Quick":a.type==="endMainPhase"?"结束主阶段":a.type);
      }
      const note="输入 "+i+" · T"+g.state.turn+" · "+who[d.player]+action+"。";
      marked.push(note);log("重练决定。"+note);
    }
    if (slotTrial && d?.type === "mulligan")
      openingHands[d.player] = g.view(d.player).players[d.player].hand.map(c => c.def);
    if (d?.type === "mulligan" && d.player === 0) hand.push(...g.view(0).players[0].hand.map((c) => c.def));
    if (d?.type === "mainPhase" && d.actions.length > 1 && input.type === "mainPhase") {
      const v = g.view(d.player), own = v.players[d.player], opp = v.players[1-d.player];
      const label = (a) => {
        if (a.type === "play") return "使用" + card(a.card);
        if (a.type === "attack") return card(a.attacker) + "攻击" + targetName(a.target);
        if (a.type === "evolve") return (a.superEvolve ? "超进化" : "进化") + card(a.card);
        if (a.type === "activate") return "起动" + card(a.card) + "的能力";
        if (a.type === "endMainPhase") return "结束主阶段";
        return a.type;
      };
      const actual = label(input.action);
      const alternatives = [...new Set(d.actions.map(label))].filter((a) => a !== actual && a !== "结束主阶段");
      if (alternatives.length) {
        const choice = { at:i, t:v.turn, pp:own.playPoints, opposingPP:opp.playPoints, ep:own.evolutionPoints, sep:own.superEvolutionPoints,
        hp:[own.leaderDefense,opp.leaderDefense], actual, alternatives:alternatives.slice(0,3),
        ownSlots:own.field.length, opposingEx:opp.ex.filter((c)=>!c.hidden).map((c)=>name(c.def)),
        engagedWards:opp.field.filter((c)=>!c.hidden && c.engaged && c.keywords.includes("ward")).map((c)=>name(c.def)) };
        if(d.player===0) alternative=choice; else metaAlternative=choice;
      }
    }
    if (input.action?.type === "activate") log(who[d.player] + "起动" + card(input.action.card) + "的能力。");
    record(g.act(input, by ?? undefined));
  }
  assert.deepEqual(g.result,r.info.result);
  assert.equal(g.state.turn,r.info.turn);
  if(drillFile) {
    assert(r.practice && basename(dirname(drillFile))==="drills");
    assert.equal(engine.db.get(opts.decks[1].leader).class,{cQZr8Z:"Runecraft",zQrwne:"Dragoncraft",t7B32v:"Swordcraft"}[key]);
    if(r.practice.terminalHP)assert.deepEqual(hp,r.practice.terminalHP);
  } else assert.deepEqual(hp,r.training.hp);
  const winner = g.result.winner, order = opts.turnOrder === "player1" ? "先攻" : "后攻";
  const heading = "第 " + number + " 局 · 主教" + order + " · " + resultName(winner);
  const originalLog = !drillFile && ["# " + heading,"",opts.deckNames.join(" 对 ") + "。主教构筑 " + r.training.deckVersion +
    (series === "duel" ? "，两名子 agent 分席操控" : "，打法 r" + r.training.policy) + "。终局 T" + g.state.turn + "，主教／对手体力 " + fmtHp(hp) +
    "。已重放核对 " + r.inputs.length + " 次输入。","",
    "主教起手为" + handNames(hand) + "，选择" + mulligan[0] + "。" + foe + mulligan[1] + "。","",
    "[原生录像](../replays/" + id + ".json) · [本局复盘](../reviews/" + group + ".md#game-" + id + ")",""];
  const loglines = drillFile ? [
    "# "+basename(drillFile,".json")+" · "+who[0]+resultName(winner),"",
    opts.deckNames.join(" 对 ")+"。从原局输入 "+r.practice.fromInput+" 前开始重练，核对 "+r.inputs.length+
    " 次输入。终局 T"+g.state.turn+"，主教／对手 "+fmtHp(hp)+"。","",
    "主教"+order+"，起手为"+handNames(hand)+"，"+mulligan[0]+"。"+foe+mulligan[1]+"。","",
    "[此分支的原生录像](../"+basename(drillFile)+") · [原局逐回合日志](../../"+key+"/games/"+
      basename(r.practice.source,".json")+".md) · [同组重练目录](../logs.md)","",
    "## 重练决定","",...marked.map(m=>"- "+m),""
  ] : originalLog;
  const seatTurns = [0,0];
  for (const turn of turns) {
    seatTurns[turn.p]++;
    loglines.push("## T" + turn.n + " · " + who[turn.p] + "第 " + seatTurns[turn.p] + " 回合","","主教／对手体力 " +
      fmtHp(turn.start) + " → " + fmtHp(turn.end) + "。","");
    if (!turn.lines.length) loglines.push("双方交接回合。","");
    else loglines.push(...turn.lines.map((s) => "- " + s),"");
  }
  const last = turns.at(-1);
  const damage = last.hits.filter((h) => h.to === (winner === 0 ? 1 : 0));
  const worst = turns.reduce((a,b) => a.start[0]-a.end[0] >= b.start[0]-b.end[0] ? a : b);
  if(drillFile){
    loglines.push("## 赛后复盘","","T"+worst.n+" 是主教净失血最多的一个回合，主教／对手从 "+
      fmtHp(worst.start)+" 变成 "+fmtHp(worst.end)+"。终局"+
      (g.result.losses?.[0]?.reason==="deckOut"?"因一方需要抽牌时牌库已空而结束。":damage.map(h=>h.text).join("，")+"。"));
    if(alternative) loglines.push("","从输入 "+alternative.at+" 前接手，主教有 "+alternative.pp+" PP，实战"+
      alternative.actual+"。重新计算"+alternative.alternatives.join("、")+"的费用与风险。");
    save(join(dirname(drillFile),"logs",basename(drillFile,".json")+".md"),loglines.join("\n")+"\n");
    return;
  }
  save(join(root,key,"games",id+".md"),loglines.join("\n"));
  return { number, order, winner, hp, turn:g.state.turn, inputs:r.inputs.length, deck:r.training.deckVersion,
    policy:r.training.policy, mulligan:mulligan[0], hand, earlyPlays, firstHeal, drawn, cast, entered,
    ...(slotTrial ? {evolutions, openingHands} : {}),
    worst:{ turn:worst.n, loss:worst.start[0]-worst.end[0], start:worst.start,end:worst.end },
    last:{ start:last.start, end:last.end, finish:damage.map((h) => h.text), reason:g.result.losses?.[0]?.reason }, alternative, metaAlternative };
}

if(drillFile){summarize(round);process.exit(0);}
const numbers = Array.from({ length:5 }, (_,i) => (round-1)*5+i+1);
const partial = series === "duel" || process.argv.includes("--partial");
const games = numbers.filter(n=>!partial || existsSync(join(root,key,"replays",pad(n)+".json"))).map(summarize);
assert(games.length > 0);
const lines = ["# 第 " + round + " 组 · 主教对" + foe,"","本组 " + games.filter((g) => g.winner === 0).length +
  " 胜，" + games.filter((g) => g.winner === 1).length + " 负，" + games.filter((g) => g.winner === null).length +
  " 平。" + (series === "duel" ? "各局牌表与两名子 agent 的选择见逐局记录。" : "构筑 " + games[0].deck + "，打法 r" + games[0].policy + "。"),"","[本轮构筑与打法决策](../../construction.md#"+key+"-"+pad(round)+")",""];
for (const g of games) {
  const id=pad(g.number), a=g.alternative;
  lines.push('<a id="game-'+id+'"></a>',"", "## 第 " + g.number + " 局 · "+g.order+" · "+resultName(g.winner),"",
    "主教" + g.mulligan + "，开局前六个双方回合合计用牌 " + g.earlyPlays + " 张。T" + g.turn + " 从 " +
    fmtHp(g.last.start) + " 打到 " + fmtHp(g.hp) + "。" + (g.last.finish.length ? g.last.finish.join("，") + "。" : "胜负原因为 "+g.last.reason+"。"),"");
  if (a) lines.push("**可重练的决定**　输入 "+a.at+" 前，T"+a.t+"，体力 "+fmtHp(a.hp)+"，主教有 "+a.pp+
    " PP，对手有 "+a.opposingPP+" PP。实战选择"+a.actual+"。其他合法选择包括"+a.alternatives.join("、")+"。"+
    "主教占用 "+a.ownSlots+"/5 个场位。对方横置守护为"+(a.engagedWards.join("、")||"零张")+"，公开 EX 为"+
    (a.opposingEx.join("、")||"空")+"。先根据这些信息算一条行动线，再打开录像检查。","");
  const m=g.metaAlternative;
  if(m && series!=="explore")lines.push("**"+foe+"席位**　输入 "+m.at+" 前持有 "+m.pp+" PP、"+m.ep+" EP、"+m.sep+" SEP。"+
    "主教横置守护为"+(m.engagedWards.join("、")||"零张")+"。实战选择"+m.actual+"，还可选择"+m.alternatives.join("、")+"。","");
  lines.push("[逐回合日志](../games/"+id+".md) · [录像](../replays/"+id+".json)","");
}
save(join(root,key,"reviews",pad(round)+".md"),lines.join("\n"));
save(join(root,key,"reviews",pad(round)+".json"),JSON.stringify(games)+"\n");
console.log(key,round,games.map((g)=>[g.number,g.winner,g.turn,g.hp,g.earlyPlays,g.worst.loss]));
