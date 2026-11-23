"""Publish the decisions, deck choices and native evidence for a five-game agent block."""
import argparse
import hashlib
from collections import Counter
from pathlib import Path

from table import KEYS, NAMES, ORIG, ROOT, card_delta, logs, md, read, write

REPO = ROOT.parents[1]
SKILLS = dict(zip(KEYS, ("sve-destruction-rune","sve-disdain-dragon","sve-loot-sword")))
BASE = "https://github.com/WhiteLeafWhite/sve-exp/blob/main/batches/10-agent-duels"


def per_seat(game, seat):
    decisions = [move for move in game["notes"] if move["seat"] == seat]
    main = [move for move in decisions if move["decision"] == "mainPhase" and isinstance(move["pick"],dict)
            and move["pick"].get("action",{}).get("type") != "endMainPhase"]
    if main:
        return main[-1]
    return decisions[-1] if decisions else None


def check_game(g):
    cycle, key = (g-1)//3+1, KEYS[(g-1)%3]
    num = f"{cycle:02}"
    native = read(ROOT/key/"replays"/(num+".json"))
    opt, training, duel = native["options"], native["training"], native["duel"]
    assert opt["controllers"] == ["human","human"] and not opt["manualActions"]
    assert opt["turnOrder"] == ("player1" if cycle%2 else "player2")
    assert training["key"]==key and training["number"]==cycle and training["opponentChanges"]<=5
    assert all(duel["explicit"]) and all(duel["strategyMoves"])
    frozen = read(ROOT/"cycles"/f"{cycle:03}.json")
    for seat,label,needle in ((0,"bishop","bishopHash"),(1,key,"opponentHash")):
        path=ROOT/frozen[label]
        assert path.stem == training[needle]
        deck=read(path); expanded=opt["decks"][seat]
        assert deck["leader"]==expanded["leader"]
        assert all(deck[z]==dict(Counter(expanded[z])) for z in ("main","evolve"))
    for sha in filter(None,duel["authors"]):
        assert hashlib.sha256((ROOT/"pilots/history"/(sha+".mjs")).read_bytes()).hexdigest()==sha
    assert (ROOT/key/"games"/(num+".md")).is_file() and (ROOT/key/"lessons"/(num+".md")).is_file()
    return {"global":g, "cycle":cycle, "key":key, "order":opt["turnOrder"], "winner":native["info"]["result"]["winner"],
            "turn":native["info"]["turn"], "inputs":len(native["inputs"]), "direct":duel["explicit"],
            "chosenByPolicy":duel["policyChoices"], "bishopHash":training["bishopHash"],
            "opponentHash":training["opponentHash"], "opponentChanges":training["opponentChanges"],
            "picks":[per_seat(duel,i) for i in (0,1)]}


def update_skills():
    recorded=[game for path in sorted((ROOT/"checks").glob("*.json")) for game in read(path)["games"]]
    for skill, seat, key in [("sve-bishop-matchups",0,None),*((s,1,k) for k,s in SKILLS.items())]:
        games=[game for game in recorded if key is None or game["key"]==key]
        if not games: continue
        lines=["# 双座位实战中的选择", "", "复习时先遮住终局，从对应回合的本方可见信息选一项。再比较执牌者亲自记录的实战理由、原始录像和赛后复盘。每个三职业循环共用一套主教。", ""]
        for game in games:
            k=game["key"]; n=f"{game['cycle']:02}"; m=game["picks"][seat]
            seatname="主教" if seat==0 else NAMES[k]
            outcome="胜" if game["winner"]==seat else "平" if game["winner"] is None else "负"
            lesson=f"{BASE}/{k}/lessons/{n}.md"
            if m:
                lines.extend([f"- 第 {game['global']} 场对{NAMES[k] if seat==0 else '主教'}，{seatname}{outcome}。T{m['turn']} 输入 {m['index']} 前的实战考虑为「{m['reason']}」。[原局及两席赛后复盘]({lesson})"])
        md(REPO/"skills"/skill/"references/agent-duels.md",lines)


def main(group, end):
    start=(group-1)*5+1
    assert group>=1 and start<=end<=group*5
    logs()
    games=[check_game(g) for g in range(start,end+1)]
    base=ROOT/"checks"/f"{group:03}"
    saved=read(base.with_suffix(".json")) if base.with_suffix(".json").is_file() else {}
    after=saved.get("nextPolicies",{}) if saved.get("range")==[start,end] else {}
    for role in ("bishop","meta"):
        live=ROOT/"pilots"/(role+".mjs")
        if role not in after and live.is_file():
            data=live.read_bytes()
            sha=hashlib.sha256(data).hexdigest()
            path=ROOT/"pilots/history"/(sha+".mjs")
            if not path.exists():path.write_bytes(data)
            after[role]=sha
        if role in after:
            frozen=ROOT/"pilots/history"/(after[role]+".mjs")
            assert hashlib.sha256(frozen.read_bytes()).hexdigest()==after[role]
    write(base.with_suffix(".json"), {"range":[start,end], "games":games, "nextPolicies":after})
    lines=[f"# 双座位第 {start}–{end} 场", "", "| 场次 | 对手 | 主教 | 双方直接选择 | 对手相对原表 | 原生证据 |", "|---:|---|---|---:|---:|---|"]
    for game in games:
        k=game["key"]; number=f"{game['cycle']:02}"
        label={0:"胜",1:"负",None:"平"}[game["winner"]]
        lines.append(f"| {game['global']} | {NAMES[k]} | {label} | {game['direct'][0]}／{game['direct'][1]} | {game['opponentChanges']} 张 | [双方复盘](../{k}/lessons/{number}.md) · [录像](../{k}/replays/{number}.json) |")
    lines.extend(["", "## 本组实际构筑", ""])
    cycles=sorted({g["cycle"] for g in games})
    for c in cycles:
        frozen=read(ROOT/"cycles"/f"{c:03}.json")
        previous=read(ROOT/"cycles"/f"{c-1:03}.json") if c>1 else None
        for label in ("bishop",*KEYS):
            initial=ROOT.parent/("09-bp20-fixed-300/bishop.json" if label=="bishop" else ORIG[label]+"/opponent.json")
            before=read(ROOT/previous[label]) if previous else read(initial)
            deck=read(ROOT/frozen[label]); diff=card_delta(before,deck)
            if label=="bishop" or diff!="保留当前张数":
                lines.append(f"- 循环 {c}，{('共同主教' if label=='bishop' else NAMES[label])}。{diff}。[所用牌表](../{frozen[label]})")
    for role,title in (("bishop","主教席"),("meta","主流席")):
        note=f"reviews-by-seat/{group:03}-{role}.md"
        if len(games)<5 and not (ROOT/note).is_file():
            note=f"reviews-by-seat/{group:03}-{role}-partial.md"
        if (ROOT/note).is_file():
            lines.extend(["",f"[{title}的本组复盘与下一组取舍](../{note})"])
        if role in after:
            lines.extend(["",f"[{title}完成本组复盘后的陪练程序](../pilots/history/{after[role]}.mjs)"])
    md(base.with_suffix(".md"),lines)
    update_skills()
    logs()


if __name__=="__main__":
    parser=argparse.ArgumentParser(description=__doc__)
    parser.add_argument("group",type=int);parser.add_argument("--through",type=int)
    args=parser.parse_args();main(args.group,args.through or args.group*5)
