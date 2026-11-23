"""Check the fixed 100 games per matchup and publish all indices and the acceptance result."""
import json
import math
import statistics
from collections import Counter

from run import KEYS, NAMES, PREV, ROOT, read, score, store


def md(path, lines):
    path.write_text("\n".join(lines).rstrip()+"\n", encoding="utf-8")


def fmt(s):
    return "–".join(map(str,s[:2])) + (f"–{s[2]}" if s[2] else "")


def interval(n, total):
    z = 1.96
    p = n/total
    center = (p + z*z/(2*total))/(1+z*z/total)
    width = z*math.sqrt(p*(1-p)/total+z*z/(4*total*total))/(1+z*z/total)
    return [round(100*(center-width),1), round(100*(center+width),1)]


def terminal_threats(games):
    lost = [g for g in games if g["winner"] == 1]
    sources = Counter()
    for g in lost:
        kinds = set()
        for line in g["last"]["finish"]:
            if line.endswith("点能力伤害"):
                kinds.add("ability")
            elif line.endswith("点攻击伤害"):
                kinds.add("attack")
            else:
                raise ValueError(f"Unrecognized terminal damage in game {g['number']}: {line}")
        category = "both" if len(kinds) == 2 else next(iter(kinds), "other")
        sources[category] += 1
    return {"losses":len(lost), **{k:sources[k] for k in ("attack","ability","both","other")},
            "from10":sum(g["last"]["start"][0] >= 10 for g in lost),
            "from20":sum(g["last"]["start"][0] >= 20 for g in lost)}


def main():
    protocol = read(ROOT/"protocol.json")
    records, all_seeds, total_inputs = {}, set(), 0
    search = [[0,0],[0,0]]
    deck = read(ROOT/"bishop.json")
    previous = read(PREV/"summary.json")
    source = dict(zip(KEYS, ("05-cQZr8Z","06-zQrwne","07-t7B32v")))
    checks, all_games, observations = [], [], {}
    for key in KEYS:
        folder = ROOT/key
        original = read(ROOT.parent/source[key]/"opponent.json")
        baseline = read(PREV/key/"replays/50.json")["training"]
        parts = [read(folder/"reviews"/f"{r:02}.json") for r in range(1,21)]
        games = [g for group in parts for g in group]
        assert [g["number"] for g in games] == list(range(1,101))
        assert len(list((folder/"replays").glob("*.json"))) == len(list((folder/"games").glob("*.md"))) == 100
        for r, group in enumerate(parts,1):
            check=read(folder/"checks"/f"{r:02}.json")
            assert check["record"]==score(group) and check["cumulative"]==score(games[:r*5])
            checks.append((key,r,check))
        per_game=["| 局 | 主教 | 胜负 | 终局 | 生命（主教／对手） | 记录 |","|---:|---|---|---:|---|---|"]
        for g in games:
            n=g["number"]
            native=read(folder/"replays"/f"{n:02}.json")
            o,tr=native["options"],native["training"]
            assert o["seed"]==protocol["seedPrefix"]+key+"/"+str(n) and o["seed"] not in all_seeds
            assert tr["engine"]==previous["engine"] and tr["number"]==n and tr["policy"]==protocol["policy"] and tr["deckVersion"]==protocol["deck"]
            assert [tr["bishopHash"],tr["opponentHash"]]==[baseline["bishopHash"],baseline["opponentHash"]]
            assert o["controllers"]==["human","hard"] and tr["opponentPreset"]==protocol["hardPreset"] and tr["opponentEffort"]==1 and not o["manualActions"]
            assert o["turnOrder"]==("player1" if n%2 else "player2") and g["order"]==("先攻" if n%2 else "后攻")
            for expanded, d in zip(o["decks"],[deck,original]):
                assert expanded["leader"]==d["leader"] and all(dict(Counter(expanded[z]))==d[z] for z in ("main","evolve"))
            assert g["winner"]==native["info"]["result"]["winner"] and g["turn"]==native["info"]["turn"] and g["hp"]==tr["hp"]
            assert g["inputs"]==len(native["inputs"]) and (folder/"games"/f"{n:02}.md").is_file()
            assert f'id="game-{n:02}"' in (folder/"reviews"/f"{(n+4)//5:02}.md").read_text("utf-8")
            all_seeds.add(o["seed"])
            total_inputs+=g["inputs"]
            for i,side in enumerate(tr["search"]):
                search[i][0]+=side["fallbacks"]
                search[i][1]+=side["failedSimulations"]
            result={0:"胜",1:"负",None:"平"}[g["winner"]]
            per_game.append(f"| {n} | {g['order']} | {result} | T{g['turn']} | {g['hp'][0]}／{g['hp'][1]} | "
                            f"[战报](games/{n:02}.md) · [复盘](reviews/{(n+4)//5:02}.md#game-{n:02}) · [录像](replays/{n:02}.json) |")
        record=score(games)
        rr={"record":record,"first":score(games[::2]),"second":score(games[1::2]),"winPercent":record[0],"wilson95":interval(record[0],100),"terminalThreats":terminal_threats(games),
            "medianTurn":statistics.median(g["turn"] for g in games),"bishopHash":baseline["bishopHash"],"opponentHash":baseline["opponentHash"]}
        records[key]=rr
        observations[key]={
            "cards":{c:{"drawn":sum(c in g["drawn"] for g in games),"entered":sum(c in g["entered"] for g in games)}
                     for c in ("BP09-095","BP18-107","BP14-090")},
            "sharpest":max(games,key=lambda g:g["worst"]["loss"]),
            "slow":sum(g["earlyPlays"]<=1 for g in games)}
        md(folder/"index.md",[f"# 主教对{NAMES[key]} · 100 局","",f"主教 {fmt(record)}，先攻 {fmt(rr['first'])}，后攻 {fmt(rr['second'])}。"
           "每局使用同一份主教和固定原表。T 是双方累计回合数。","",
           f"[总成绩](../index.md) · [五局检查](../construction.md) · [对手原表](../../{source[key]}/opponent.json)","",*per_game])
        all_games.extend(games)
    assert len(all_seeds)==300 and len(checks)==60
    wins=[r["winPercent"] for r in records.values()]
    tests={"bestAtLeast65":max(wins)>=65,"allAtLeast35":min(wins)>=35,"noMoreThanOneBelow50":sum(w<50 for w in wins)<=1}
    verdict=all(tests.values())
    balanced=min(wins)>=protocol["alternateMinimumWinsPerMatchup"]
    data={"games":300,"record":score(all_games),"inputs":total_inputs,"checkpoints":60,"uniqueSeeds":len(all_seeds),"engine":previous["engine"],
          "criteria":tests,"pass":verdict,"allAtLeast45":balanced,"acceptedByEither":verdict or balanced,"byMatchup":records,"search":{"order":["bishop","hard"],"measures":["fallbacks","failedSimulations"],"totals":search}}
    store(ROOT/"summary.json",data)
    status="达到三项门槛" if verdict else "本轮未达到全部三项门槛"
    lines=["# 一份主教打三套主流 · 300 局","",f"**{deck['name']}** 共同 40/10，三套对手各 100 局、先后攻各 50 局。"
        f"主教合计 {fmt(score(all_games))}。**{status}。**","",
        "| 固定对手 | 主教胜–负 | 胜率 | 胜率 95% 区间 | 先攻 | 后攻 | 终局回合中位数 |",
        "|---|---:|---:|---:|---:|---:|---:|"]
    for k,r in records.items():
        lo,hi=r["wilson95"]
        lines.append(f"| [{NAMES[k]} {k}]({k}/index.md) | {fmt(r['record'])} | {r['winPercent']}% | {lo:g}–{hi:g}% | {fmt(r['first'])} | {fmt(r['second'])} | T{r['medianTurn']:g} |")
    lines.extend(["",f"最高胜率 {max(wins)}%（要求 ≥65%），最低 {min(wins)}%（要求 ≥35%），低于 50% 的对局有 {sum(w<50 for w in wins)} 种（要求 ≤1）。"
       "验收以每 100 局的实际胜场计算，Wilson 区间表明抽样误差的量级。三组均接近五五开按各自至少 45 胜另行判断，本轮"
       +("达到" if balanced else "未达到")+"这个标准。真人信息差另计。","",
       f"使用原版桌面 Hard 满强度。每局对比从种子重放得到的完整终局状态，合计 {total_inputs:,} 次输入。"
       f"同一份主教和 r3 打满全部种子。展示一项改表假设时，另列未来版本及独立验证成绩。","",
       "[每五局构筑及取舍](construction.md) · [共同主教](bishop.json) · [开赛协议](protocol.json) · [机器可读成绩](summary.json) · [上一轮 150 局](../08-bp20-hard-150/index.md)","",
       "从装好依赖的 SVE NEXT 源码根目录先执行上一批的 `prepare.mjs`。在此目录的完整数据旁运行 `python run.py <分享码>` 时，"
       "用脚本的实际路径调用，它会从同条件文件继续。指定 `--start R --end R` 可重放一个五局小组。"
       "完成三组后，运行本批的 `summarize.py` 核对 300 份牌表和所有终局。"])
    md(ROOT/"index.md",lines)
    diary=["# 共同构筑的 60 次五局检查","", "三套主流的初始牌表逐局按冻结指纹核对，主教在本轮全程使用白牙与萝蕾娜各两张。每五局记录关键牌能否登场、终局伤害来源与下一步取舍，三对局共享一套 40/10。[牌表](bishop.json) · [验收结果](index.md)",""]
    for k,r,c in checks:
        n1,n2=c["range"]; ex=c["example"]; game=ex["game"]
        diary.extend([f'<a id="{k}-{r:02}"></a>',"",f"### {NAMES[k]}第 {n1}–{n2} 局 · {fmt(c['record'])}","",
             c["decision"]+f" 第 {game} 局 T{ex['turn']} 单回合主教生命净减 {ex['loss']}。"
             +("本组败局最后一回合伤害来源包括"+c["lossSources"]+"。" if c["lossSources"] else "")+c["tactic"],
             "",f"[五局复盘]({k}/reviews/{r:02}.md) · [局面日志]({k}/games/{game:02}.md) · [输入与统计]({k}/checks/{r:02}.json)",""])
    diary.extend(["## 三个卡位在各对局的实际表现","","每格为取入手牌局数／实际进场局数，共 100 局。牌库直接召唤也算进场。较长的对局可以摸到更多牌，"
                  "这些数据用于定位重演样本。","",
                  "| 对手 | 白牙神殿 | 传教司祭·萝蕾娜 | 永久之盾·席翁 | 开局六个双方回合至多打一张的局数 |","|---|---:|---:|---:|---:|"])
    for k,item in observations.items():
        rates=[f"{c['drawn']}／{c['entered']}" for c in item["cards"].values()]
        diary.append(f"| {NAMES[k]} | "+" | ".join(rates)+f" | {item['slow']} |")
    md(ROOT/"construction.md",diary)
    ref=ROOT.parents[1]/"skills/sve-bishop-matchups/references/bp20-fixed-results.md"
    tips=["# 共同白牙萝蕾娜的三组百局","",f"三种职业各 100 局，主教共 {fmt(score(all_games))}，先后攻各 150 局。{status}。"
          +("三组均达到 45%。" if balanced else "三组均达到 45% 的条件也未满足。")+" 本表采用每个对手的全部 100 局。","",
          "| 对手 | 胜–负 | 先攻 | 后攻 |","|---|---:|---:|---:|"]
    for k,r in records.items(): tips.append(f"| {NAMES[k]} | {fmt(r['record'])} | {fmt(r['first'])} | {fmt(r['second'])} |")
    tips.extend(["","## 败局最后一回合怎样扣血","",
                 "下表按整局计数，只看主教落败的最后一回合。起始 ≥20 血的场次已包含在 ≥10 血中。伤害类别取自引擎实际结算。","",
                 "| 对手 | 败局 | 仅攻击 | 仅能力 | 两者都有 | 无主战者伤害 | 起始 ≥10 血 | 起始 ≥20 血 |",
                 "|---|---:|---:|---:|---:|---:|---:|---:|"])
    for k,r in records.items():
        threat=r["terminalThreats"]
        tips.append(f"| {NAMES[k]} | "+" | ".join(str(threat[c]) for c in ("losses","attack","ability","both","other","from10","from20"))+" |")
    tips.extend(["","自己只挡住攻击或只防能力伤害时，先读该行的混合伤害局数，再回看前一回合能否少留一个对方攻击手或自伤触发源。移除减伤随从会改变后续结算，逐段比较须另开录像分支。"])
    tips.extend(["","## 三次交回合前的重练题",""])
    for k,item in observations.items():
        g=item["sharpest"];s=g["worst"];n=g["number"]
        link=f"https://github.com/WhiteLeafWhite/sve-exp/blob/main/batches/09-bp20-fixed-300/{k}/games/{n:02}.md"
        tips.append(f"- 对{NAMES[k]}第 {n} 局，T{s['turn']} 主教生命从 {s['start'][0]} 降到 {s['end'][0]}。"
                    f"在前一回合暂停，按公开 EX、当前攻击、需要处理的守护算出对方可能的路线，再揭晓该局操作。[逐回合日志]({link})")
    tips.extend(["","下一次采用新构筑时，三个对手共用一份主牌与进化牌，单独统计改动后的样本。"
                 "神弓两卡位与龙族 r4 的配对重演另有索引。[百局全记录](https://github.com/WhiteLeafWhite/sve-exp/tree/main/batches/09-bp20-fixed-300)"])
    md(ref,tips)
    print(json.dumps(data,ensure_ascii=False))

if __name__=="__main__":
    main()
