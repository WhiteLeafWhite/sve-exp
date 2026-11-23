"""Five-game checkpoints. Run from the simulator checkout, with Node on PATH."""

import argparse
import json
import statistics
import subprocess
from pathlib import Path

ROOT = Path(__file__).resolve().parent
KEYS = ("cQZr8Z", "zQrwne", "t7B32v")
PLAN = ("A", "B", "C", "A", "B", "C", "A")
HYPOTHESIS = {
    "A": "旧表用透京回复、天冥直伤和万裁分身结束对局",
    "B": "白牙神殿持续回复，萝蕾娜入场立即回四，并可进化处理一个随从",
    "C": "勒碧丝积累计数并检索封印的炽天使，检验慢速启动能否换来免费 EX 终结",
}


def read(file):
    return json.loads(file.read_text(encoding="utf-8-sig"))


def write(file, value):
    file.parent.mkdir(parents=True, exist_ok=True)
    tmp = file.with_suffix(file.suffix + ".new")
    tmp.write_text(json.dumps(value, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    tmp.replace(file)


def checkpoint(key, r):
    return ROOT / key / "checks" / f"{r:02}.json"


def score(games):
    return [sum(g["winner"] == player for g in games) for player in (0, 1, None)]


def select():
    evidence = {v: {} for v in "ABC"}
    for key in KEYS:
        for r in range(2, 8):
            assert checkpoint(key, r).exists(), f"Await checkpoint {key}/{r}"
            group = read(ROOT / key / "reviews" / f"{r:02}.json")
            v = PLAN[r-1]
            assert len(group) == 5 and all(g["policy"] == 3 and g["deck"] == v for g in group)
            evidence[v].setdefault(key, []).extend(group)
    sample = read(ROOT / "source-sample.json")["rows"]
    tags = {"A":"天冥＋耶菈的祈祷","B":"白牙＋萝蕾娜","C":"勒碧丝＋封印"}
    table = {}
    for v, opponents in evidence.items():
        assert all(len(opponents[k]) == 10 and sum(g["order"] == "先攻" for g in opponents[k]) == 5 for k in KEYS)
        results = {k: score(opponents[k]) for k in KEYS}
        points = [w + d / 2 for w, _, d in results.values()]
        table[v] = {"records":results, "points":sum(points), "weakest":min(points),
                    "signature":tags[v], "publicDecks":sum(tags[v] in row["matches"] for row in sample)}
    winner = max("ABC", key=lambda v: (table[v]["points"], table[v]["weakest"], -table[v]["publicDecks"]))
    return {"deck":winner, "policy":3, "candidates":table, "communitySample":len(sample)}


def run_group(key, r, adopt=False):
    if r > 1 and not checkpoint(key, r-1).exists():
        raise ValueError(f"First review {key} group {r-1}")
    deck = PLAN[r-1] if r <= 7 else read(ROOT/"selected.json")["deck"]
    policy = 2 if r == 1 else 3
    if not adopt:
        subprocess.run(["node", ROOT/"block.mjs", key, str(r), deck, str(policy)], check=True)
    subprocess.run(["node", ROOT/"report.mjs", key, str(r)], check=True)
    games = read(ROOT/key/"reviews"/f"{r:02}.json")
    assert len(games) == 5 and all(g["deck"] == deck and g["policy"] == policy for g in games)
    w, l, d = score(games)
    worst = max(games, key=lambda g: g["worst"]["loss"])
    early = sum(g["earlyPlays"] <= 1 for g in games)
    cards = {"A":["BP18-099","BP14-090","BP18-116"],"B":["BP09-095","BP18-107"],"C":["BP16-093","BP02-091"]}[deck]
    usage = {n:sum(bool(g["cast"].get(n)) for g in games) for n in cards}
    played = "、".join(f"{card} 有 {count} 局实际使用" for card,count in usage.items())
    rationale = (f"本组 {w} 胜 {l} 负 {d} 平，{early} 局在开局前六个双方回合至多使用一张牌。{played}。"
                 f"第 {worst['number']} 局 T{worst['worst']['turn']} 主教体力在该回合净减 {worst['worst']['loss']}。")
    if early >= 3:
        coaching = "重看这些慢起手，逐张写出第二、第三回合的合法动作，再决定整手重抽。"
    elif worst["worst"]["loss"] >= 10:
        coaching = "回到这次掉血前一个主阶段，分别合计能穿守护的能力伤害、已能攻击的随从和公开 EX，比较留 Quick 与铺场。"
    else:
        coaching = "回看己方最后一个有选择的主阶段，比较先解守护、先攻击和先起动伤害的次序。"
    if r < 7:
        next_deck = PLAN[r]
        next_step = (f"下一组用 {next_deck} 检验「{HYPOTHESIS[next_deck]}」。"
                     if next_deck != deck else f"保留 {deck} 再取五局，复核该构筑。")
        if r == 1:
            next_step += "启用 r3 的护符计数、场位与留牌估值。"
        else:
            next_step += "保留 r3 和该候选的固定张数，以便三套构筑都覆盖先后攻。"
    elif r == 7:
        next_step = "探索组封存。合并三种对局的 r3 成绩选出一套共同牌表，随后用新种子验证。"
    elif r < 10:
        next_step = f"保留共同定稿 {deck} 与 r3。已记录的战术问题留待复盘，保持后续独立验证的条件一致。"
    else:
        next_step = f"该对手满 50 局，封存 {deck} 的最后验证组并计入分对局成绩。"
    data = {"key":key,"round":r,"games":[g["number"] for g in games],"deck":deck,"policy":policy,
            "record":[w,l,d],"medianTurn":statistics.median(g["turn"] for g in games),
            "cards":usage,"observation":rationale,"coaching":coaching,"decision":next_step}
    write(checkpoint(key,r),data)
    print(key,r,deck,policy,[w,l,d],next_step,flush=True)


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("key", choices=[*KEYS,"select"])
    parser.add_argument("--start",type=int,default=1)
    parser.add_argument("--end",type=int,default=7)
    parser.add_argument("--adopt-first",action="store_true",help="first block already ran")
    args=parser.parse_args()
    if args.key == "select":
        chosen = select()
        write(ROOT/"selected.json",chosen)
        print(json.dumps(chosen,ensure_ascii=False))
    else:
        assert 1 <= args.start <= args.end <= 10
        for r in range(args.start,args.end+1):
            run_group(args.key,r,args.adopt_first and r == args.start)
