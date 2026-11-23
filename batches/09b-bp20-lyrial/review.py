"""Index the predeclared 15 paired deck trials, joining baseline games 76–80 when available."""
import json
from pathlib import Path

ROOT=Path(__file__).resolve().parent
FIXED=ROOT.parent/"09-bp20-fixed-300"
SKILL=ROOT.parents[1]/"skills/sve-bishop-matchups/references/lyrial.md"
KEYS={"cQZr8Z":"破坏巫师","zQrwne":"侮蔑龙","t7B32v":"财宝皇室"}
URL="https://github.com/WhiteLeafWhite/sve-exp/blob/main/batches/09b-bp20-lyrial"
def read(f): return json.loads(f.read_text("utf-8-sig"))
def md(f,arr): f.write_text("\n".join(arr).rstrip()+"\n",encoding="utf-8")
lines=["# 神弓莉莉耶尔 · 两个卡位的实测","",
       "对照固定白牙萝蕾娜 B，试验 D 用两张神弓座天使替换一张坚定不移的祈祷和一张希望女王。三种对局使用同一份 D，按预登记的五个配对种子复查。[构筑记录](construction.md)",""]
skill=["# 有神弓座天使时的打法","",
       "她在场期间主战者免受能力伤害，普通攻击仍会造成伤害。直立留场可提高对手以普通攻击处理她的难度。要使用横置 Quick 打 2 时，先数对方剩余可宣告攻击的从者与去除能力。交回合并非只看当时体力，对侮蔑龙先数清已进化嘉鲁蜜儿仍有几次受伤机会。",""]
records={}
for key,title in KEYS.items():
    f=ROOT/key/"reviews/01.json"
    if not f.exists(): continue
    games=read(f); assert [g["number"] for g in games]==list(range(1,6))
    baseline_file=FIXED/key/"reviews/16.json"
    old=read(baseline_file) if baseline_file.exists() else None
    wins=sum(g["winner"]==0 for g in games)
    seen=[g["number"] for g in games if "BP05-108" in g["drawn"]]
    entered=[g["number"] for g in games if "BP05-108" in g["entered"]]
    short=f"{title} {wins} 胜 {5-wins} 负，主教在 {len(seen)} 局取入手牌，{len(entered)} 局让神弓座天使进场。"
    skill.extend([short+f" [五局复盘]({URL}/{key}/reviews/01.md)",""])
    lines.extend([f"## {title}","",short,"","| 原表种子序号 | 主教先后攻 | D | B | 记录 |","|---:|---|---|---|---|"])
    improved=worsened=0
    for i,g in enumerate(games,1):
        native=read(ROOT/key/"replays"/f"{i:02}.json");num=i+75
        assert native["options"]["seed"]==f"sve-exp/bp20-fixed-300/v1/{key}/{num}"
        label=lambda x: {0:"胜",1:"负",None:"平"}[x]
        compare="待对应组完成"
        if old:
            src=read(FIXED/key/"replays"/f"{num:02}.json")
            assert src["options"]["seed"]==native["options"]["seed"] and src["options"]["turnOrder"]==native["options"]["turnOrder"] and src["options"]["decks"][1]==native["options"]["decks"][1]
            prev=old[i-1]["winner"]
            compare=f"[{label(prev)}](../09-bp20-fixed-300/{key}/games/{num:02}.md)"
            improved+=int(prev==1 and g["winner"]==0);worsened+=int(prev==0 and g["winner"]==1)
        lines.append(f"| {num} | {g['order']} | {label(g['winner'])} | {compare} | [日志]({key}/games/{i:02}.md) · [复盘]({key}/reviews/01.md#game-{i:02}) · [录像]({key}/replays/{i:02}.json) |")
    lines.append("")
    records[key]={"wins":wins,"drawn":seen,"entered":entered}
    if old:
        records[key].update({"baselineWins":sum(x["winner"]==0 for x in old),"lossToWin":improved,"winToLoss":worsened})
        lines.extend([f"同种子由负转胜 {improved} 局，由胜转负 {worsened} 局。",""])
        skill.extend([f"相同的五个种子，原表 B 对{title}为 {records[key]['baselineWins']} 胜。换上神弓后由负转胜 {improved} 局，由胜转负 {worsened} 局。",""])
    a=f'<a id="{key}-01"></a>'
    log=ROOT/"construction.md";text=log.read_text("utf-8")
    if a not in text: log.write_text(text.rstrip()+"\n\n"+a+"\n\n"+short+f" 此五局沿用共同 D 表，保留配对比较。 [五局复盘]({key}/reviews/01.md)\n",encoding="utf-8")
md(ROOT/"index.md",lines);md(SKILL,skill)
if "zQrwne" in records:
    skill.extend(["","侮蔑龙的第 2 局与第 3 局都抽到并打出了神弓，仍由龙获胜。第 2 局炎爪、崇拜者的能力配合完成去除，第 3 局也用炎爪配合祈祷者处理神弓。留直可以限制普通随从攻击，面对能力去除仍要能接续新的防线。"
                  +f" [第 2 局]({URL}/zQrwne/games/02.md) · [第 3 局]({URL}/zQrwne/games/03.md)"])
    md(SKILL,skill)
(ROOT/"summary.json").write_text(json.dumps(records,ensure_ascii=False,indent=2)+"\n","utf-8")
