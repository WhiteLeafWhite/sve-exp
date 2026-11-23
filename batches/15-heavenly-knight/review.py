"""Review the two as-played lists and the shared fresh seeds."""
import json
from collections import Counter
from math import sqrt
from pathlib import Path

ROOT = Path(__file__).resolve().parent
REPO = ROOT.parents[1]
WEB = "https://github.com/WhiteLeafWhite/sve-exp/blob/main/batches/15-heavenly-knight"
KEYS = {"cQZr8Z": ("破坏巫师","sve-destruction-rune"), "zQrwne": ("侮蔑龙","sve-disdain-dragon"),
        "t7B32v": ("财宝皇室","sve-loot-sword")}
CARD = "BP09-091"


def read(p):
    return json.loads(p.read_text("utf-8-sig"))


def write(p, lines):
    p.write_text("\n".join(lines).rstrip()+"\n","utf-8")


def interval(w, n):
    if not n:
        return "—"
    z = 1.95996398454
    rate = w/n
    middle = (rate+z*z/(2*n))/(1+z*z/n)
    half = z*sqrt(rate*(1-rate)/n+z*z/(4*n*n))/(1+z*z/n)
    return f"{w}/{n}（{100*rate:.0f}%，{100*(middle-half):.0f}–{100*(middle+half):.0f}%）"


def verify(r, key, n, tag, base, expected):
    t,o = r["training"],r["options"]
    assert r["info"]["result"] and t["number"]==n and t["deckVersion"]==tag
    assert t["policy"]==3 and t["opponentEffort"]==1 and t["opponentPreset"]=="hard-next"
    assert t["opponentHash"]==base["training"]["opponentHash"] and t["engine"]==base["training"]["engine"]
    assert o["seed"]==f"sve-exp/bp20-heavenly-knight/v1/{key}/{n}"
    assert o["turnOrder"]==("player1" if n%2 else "player2")
    assert o["decks"][1]==base["options"]["decks"][1]
    actual = o["decks"][0]
    assert actual["main"]==expected and actual["evolve"]==base["options"]["decks"][0]["evolve"]
    assert actual["leader"]==base["options"]["decks"][0]["leader"]
    assert all(p["failedSimulations"]==0 for p in t["search"])


deck = read(ROOT/"bishop.json")
records = {}
diary = ["# 天曜战骑的每五局构筑日志","",
         "K 用两张天曜战骑换下一张席翁和一张莉迪耶尔；F 使用双灾藤原表。每一种构筑都兼打三个职业，保留所有首次完成的牌序。[预登记](protocol.md)",""]
index = ["# 天曜战骑与双灾藤原表的独立牌序","",
         "每种对手最多 50 对，每对由同一个种子的 K、F 两局组成。下表只用已复盘的场次，括号内为各自胜率与 Wilson 95% 区间。翻转只用两组都有录像的牌序。[选牌与验收](protocol.md) · [K 牌表](bishop.json) · [构筑日志](construction.md)","",
         "| 对手 | 天曜战骑 K | 双灾藤 F | 完整配对 | F 负→K 胜 | F 胜→K 负 | K 登场局 | 出牌时有两护符的局数 |",
         "|---|---|---|---:|---:|---:|---:|---:|"]
details = []
all_skills = []
for key, (opp,skill) in KEYS.items():
    base = read(ROOT.parent/"12-second-saito/candidate"/key/"replays/01.json")
    f_cards = base["options"]["decks"][0]["main"]
    k_cards = list(f_cards)
    for old in ("BP14-090","BP19-095"):
        slot = len(k_cards)-1-k_cards[::-1].index(old)
        k_cards[slot] = CARD
    assert dict(Counter(k_cards))==deck["main"]
    games={"K":{},"F":{}}
    plays=active=hits=targeted=damage=0
    tips = []
    for tag,folder,expected in (("K","candidate",k_cards),("F","control",f_cards)):
        directory=ROOT/folder/key
        for block in sorted((directory/"reviews").glob("*.json")):
            group=int(block.stem)
            rows=read(block)
            assert rows and {g["number"] for g in rows}<=set(range(group*5-4,group*5+1))
            for g in rows:
                n=g["number"]
                r=read(directory/"replays"/f"{n:02}.json")
                verify(r,key,n,tag,base,expected)
                assert g["winner"]==r["info"]["result"]["winner"] and n not in games[tag]
                games[tag][n]=g
                if tag=="K":
                    k=g["knight"]
                    assert len(k["plays"])==g["cast"].get(CARD,0)
                    plays+=bool(k["plays"])
                    active+=any(x["amulets"]>=2 for x in k["plays"])
                    hits+=bool(k["face"])
                    targeted+=bool(k["attacked"])
                    damage+=sum(e["amount"] for e in k["face"])
            sample=next((g for g in rows if g.get("knight",{}).get("plays")),rows[0])
            n=sample["number"]
            k=sample.get("knight",{})
            if k.get("plays"):
                x=k["plays"][0]
                line=f"第 {n} 局 T{x['turn']} 输入 {x['at']} 下战骑时有 {x['amulets']} 个护符，全局战骑实际打脸 {sum(z['amount'] for z in k['face'])}，承受 {len(k['attacked'])} 次宣攻。"
            else:
                a=sample["alternative"]
                line=(f"第 {n} 局 T{a['t']} 输入 {a['at']} 还有 {a['pp']} PP，实际{a['actual']}。"
                      if a else f"第 {n} 局在 T{sample['turn']} 结算。")
                if tag=="K":line+="这一局没有打出天曜战骑。"
            log=f"{folder}/{key}/games/{n:02}.md"
            diary.extend([f"## {opp} · {tag} 第 {rows[0]['number']}–{rows[-1]['number']} 局","",
                          f"胜 {sum(g['winner']==0 for g in rows)}/{len(rows)}。{line}本项继续使用登记的共同 40/10，另一个卡位方案保留作比较。"
                          f"[本组逐局复盘]({folder}/{key}/reviews/{group:02}.md) · [本局]({log})",""])
            tips.append(f"- {tag} 版本。{line}[当时的局面与录像]({WEB}/{log})")
    paired=set(games["K"])&set(games["F"])
    up=sum(games["K"][n]["winner"]==0 and games["F"][n]["winner"]==1 for n in paired)
    down=sum(games["K"][n]["winner"]==1 and games["F"][n]["winner"]==0 for n in paired)
    record={}
    for tag,s in games.items():
        record[tag]={"n":len(s),"w":sum(g["winner"]==0 for g in s.values()),
                     "first":[sum(g["winner"]==0 for n,g in s.items() if n%2),sum(n%2==1 for n in s)],
                     "second":[sum(g["winner"]==0 for n,g in s.items() if not n%2),sum(n%2==0 for n in s)]}
    for n in paired:
        k=read(ROOT/"candidate"/key/"replays"/f"{n:02}.json")["options"]
        f=read(ROOT/"control"/key/"replays"/f"{n:02}.json")["options"]
        assert all(k[a]==f[a] for a in k.keys()-{"decks","deckNames"})
    record.update(pairs=len(paired),up=up,down=down,played=plays,boosted=active,faceGames=hits,faceDamage=damage,attackedGames=targeted)
    records[key]=record
    st=[interval(record[t]["w"],record[t]["n"]) for t in ("K","F")]
    index.append(f"| {opp} | {st[0]} | {st[1]} | {len(paired)} | {up} | {down} | {plays} | {active} |")
    details.extend(["",f"## {opp}","",
                    f"主教先攻胜/场数，K 为 {'/'.join(map(str,record['K']['first']))}、F 为 {'/'.join(map(str,record['F']['first']))}。后攻 K 为 {'/'.join(map(str,record['K']['second']))}、F 为 {'/'.join(map(str,record['F']['second']))}。"
                    f"战骑在 {hits} 局攻击主战者并造成正伤害，合计 {damage} 点。对手在 {targeted} 局对战骑宣告攻击。","",
                    "| 牌序 | K 结果、中文战报、复盘、录像 | F 结果、中文战报、复盘、录像 |","|---:|---|---|"])
    for n in sorted(set(games["K"])|set(games["F"])):
        item=[]
        for tag,folder in (("K","candidate"),("F","control")):
            if n not in games[tag]:
                item.append("待配对")
                continue
            label={0:"胜",1:"负",None:"平"}[games[tag][n]["winner"]]
            path=f"{folder}/{key}"
            item.append(f"{label} · [战报]({path}/games/{n:02}.md) · [复盘]({path}/reviews/{(n+4)//5:02}.md#game-{n:02}) · [录像]({path}/replays/{n:02}.json)")
        details.append(f"| {n} | {item[0]} | {item[1]} |")
    if tips:
        all_skills.extend([f"## 对{opp}","","先按当前盘面判断天曜战骑能打 3 还是 5，回复能触发几次。决定疾驰指向后，再数下回合必须处理它的攻击者。","",*tips,""])
        write(REPO/"skills"/skill/"references/heavenly-knight.md",["# 应对天曜战骑","",
              "看对方场上的护符与空位，预留战骑当回合的伤害。轮到己方再检查横置守护是否必须处理、有哪些能力能绕开守护。","",*tips,"",f"[牌序与总成绩]({WEB}/index.md)"])
write(ROOT/"index.md",[*index,*details])
write(ROOT/"construction.md",diary)
if all_skills:
    write(REPO/"skills/sve-bishop-matchups/references/heavenly-knight.md",["# 打脸与守护的五费取舍","",*all_skills,f"[牌序与总成绩]({WEB}/index.md)"])
(ROOT/"summary.json").write_text(json.dumps({"byMatchup":records,"complete":all(r["pairs"]==50 for r in records.values())},ensure_ascii=False,indent=2)+"\n","utf-8")
