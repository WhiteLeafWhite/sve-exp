"""Play and review consecutive five-game blocks using the locked 300-game protocol."""
import argparse
import json
import subprocess
from collections import Counter
from pathlib import Path

ROOT = Path(__file__).resolve().parent
PREV = ROOT.parent / "08-bp20-hard-150"
KEYS = ("cQZr8Z", "zQrwne", "t7B32v")
NAMES = dict(zip(KEYS, ("破坏巫师", "侮蔑龙", "财宝皇室")))


def read(path):
    return json.loads(path.read_text("utf-8-sig"))


def store(path, obj):
    path.parent.mkdir(parents=True, exist_ok=True)
    tmp = path.with_suffix(".new")
    tmp.write_text(json.dumps(obj, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    tmp.replace(path)


def score(games):
    return [sum(g["winner"] == s for g in games) for s in (0, 1, None)]


def checkpoint(key, r, protocol):
    folder = ROOT / key
    games = read(folder / "reviews" / f"{r:02}.json")
    assert [g["number"] for g in games] == list(range(5*r-4, 5*r+1))
    assert all(g["deck"] == protocol["deck"] and g["policy"] == protocol["policy"] for g in games)
    total = [g for j in range(1, r+1) for g in read(folder / "reviews" / f"{j:02}.json")]
    losses = [g for g in games if g["winner"] == 1]
    g = max(losses or games, key=lambda x: x["worst"]["loss"])
    ref = g["worst"]
    finish = Counter(h.split("对主教主战者造成")[0] for x in losses for h in x["last"]["finish"] if "对主教主战者造成" in h)
    cause = "、".join(f"{card}（{n} 段）" for card,n in finish.most_common(3))
    used = {n: {"drawn":sum(n in x["drawn"] for x in games), "played":sum(n in x["cast"] for x in games),
                "entered":sum(n in x["entered"] for x in games)} for n in ("BP09-095","BP18-107","BP14-090","BP18-099")}
    use = sum(g["earlyPlays"] <= 1 for g in games)
    wins = score(total)[0]
    if key == "cQZr8Z":
        tactic = "检查掉血前巫师的偶像总数、可用 SEP 与场上的祈祷者。比较清随从、压主战者和为 Quick 留 PP 的顺序。"
    elif key == "zQrwne":
        tactic = "分别计算现有攻击与嘉鲁蜜儿受伤能触发的次数，将对方公开 EX 中的自伤手段逐张计入。比较先除触发源和先回血。"
    else:
        tactic = "数对方公开财宝、自己的墓场与横置守护。分开计算黄金短剑、海贼旗的能力伤害与新登场随从的攻击。"
    decision = (f"维持共同 40/10，累计 {wins}/{len(total)} 胜。"
                f"本组白牙进入场上的有 {used['BP09-095']['entered']} 局，萝蕾娜进入场上的有 {used['BP18-107']['entered']} 局。")
    decision += ("把早期互动与高费用起手的比例列为下次改表的复核项。" if use >= 2 else
                 "下一次微调先核查致命回合前能否少留一个护符场位。" if ref["loss"] >= 12 else
                 "保留目前的回复与解场张数，复核选择出牌顺序造成的差异。")
    store(folder / "checks" / f"{r:02}.json", {
        "range":[5*r-4,5*r], "record":score(games), "cumulative":score(total), "slowOpenings":use, "usage":used,
        "example":{"game":g["number"],**ref}, "lossSources":cause, "tactic":tactic, "decision":decision})


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("key", choices=KEYS)
    parser.add_argument("--start", type=int, default=1)
    parser.add_argument("--end", type=int, default=20)
    args = parser.parse_args()
    assert 1 <= args.start <= args.end <= 20
    p = read(ROOT / "protocol.json")
    assert read(PREV / "selected.json")["deck"] == p["deck"]
    assert read(ROOT / "bishop.json") == read(PREV / "decks" / (p["deck"] + ".json"))
    assert all((PREV/k/"checks/10.json").exists() for k in KEYS)
    for r in range(args.start, args.end+1):
        if r > 1:
            assert (ROOT / args.key / "checks" / f"{r-1:02}.json").exists()
        subprocess.run(["node", PREV / "block.mjs", args.key, str(r), p["deck"], str(p["policy"]), "fixed100"], check=True)
        subprocess.run(["node", PREV / "report.mjs", args.key, str(r), "fixed100"], check=True)
        checkpoint(args.key, r, p)
        print(args.key, "group", r, read(ROOT/args.key/"checks"/f"{r:02}.json")["cumulative"], flush=True)
