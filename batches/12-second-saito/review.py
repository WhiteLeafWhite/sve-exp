"""Compare reviewed native games on the preregistered paired seeds."""
import hashlib
import json
import math
from collections import Counter
from pathlib import Path

ROOT = Path(__file__).resolve().parent
REPO = ROOT.parents[1]
WEB = "https://github.com/WhiteLeafWhite/sve-exp/blob/main/batches/12-second-saito"
KEYS = {"cQZr8Z": ("破坏巫师", "sve-destruction-rune"), "zQrwne": ("侮蔑龙", "sve-disdain-dragon"),
        "t7B32v": ("财宝皇室", "sve-loot-sword")}
LANES = {"candidate": ("F", "BP18-118", "灾藤"), "control": ("B", "BP15-095", "马文")}
LABEL = {0: "胜", 1: "负", None: "平"}


def read(file):
    return json.loads(file.read_text("utf-8-sig"))


def write(file, lines):
    file.write_text("\n".join(lines).rstrip() + "\n", "utf-8")


def signature(deck):
    data = [deck["leader"], sorted(deck["main"].items()), sorted(deck["evolve"].items())]
    return hashlib.sha256(json.dumps(data, separators=(",", ":")).encode()).hexdigest()


def score(games):
    counts = Counter(g["winner"] for g in games)
    return [counts[0], counts[1], counts[None]]


def display(counts):
    return "–".join(str(n) for n in (counts if counts[2] else counts[:2]))


def duplicate_turn(game, card):
    uses = [action["turn"] for action in game["evolutions"] if action["card"] == card]
    return uses[1] if len(uses) > 1 else None


def exact_test(up, down):
    n = up + down
    return min(1.0, 2 * sum(math.comb(n, i) for i in range(min(up, down) + 1)) / 2**n)


old = read(ROOT.parent / "09-bp20-fixed-300/summary.json")
by_lane = {}
for lane, (version, slot, name) in LANES.items():
    by_lane[lane] = {}
    folder = ROOT / lane
    deck = read(folder / "bishop.json")
    diary = [f"# {version} 表的五局复盘与构筑取舍", "",
             f"本表的第二张{name}与另一表同种子比较。三种对手共用本表。[预登记](../protocol.md)", ""]
    for key, (opp, _) in KEYS.items():
        games = {}
        by_lane[lane][key] = games
        for file in sorted((folder / key / "reviews").glob("*.json")):
            group = int(file.stem)
            block = read(file)
            numbers = [g["number"] for g in block]
            assert numbers == sorted(set(numbers)) and numbers and set(numbers) <= set(range(5*group-4, 5*group+1))
            for g in block:
                n = g["number"]
                native = read(folder / key / "replays" / f"{n:02}.json")
                options, training = native["options"], native["training"]
                assert options["seed"] == f"sve-exp/bp20-second-saito/v1/{key}/{n}"
                assert options["turnOrder"] == ("player1" if n % 2 else "player2")
                assert training["bishopHash"] == signature(deck)
                assert options["decks"][0]["leader"] == deck["leader"]
                assert dict(Counter(options["decks"][0]["main"])) == deck["main"]
                assert dict(Counter(options["decks"][0]["evolve"])) == deck["evolve"]
                assert training["opponentHash"] == old["byMatchup"][key]["opponentHash"]
                assert training["policy"] == 3 and training["engine"] == old["engine"]
                assert training["opponentPreset"] == "hard-next" and training["opponentEffort"] == 1
                assert training["deckVersion"] == version and training["key"] == key and training["number"] == n
                assert all(item["fallbacks"] == item["failedSimulations"] == 0 for item in training["search"])
                assert native["info"]["result"]["winner"] == g["winner"] and len(native["inputs"]) == g["inputs"]
                assert len(g["openingHands"]) == 2 and all(len(hand) == 4 for hand in g["openingHands"])
                assert list(g["hand"]) == g["openingHands"][0]
                assert n not in games
                games[n] = g
            uses = [g for g in block if duplicate_turn(g, slot)]
            example = (uses or sorted(block, key=lambda g: -g["worst"]["loss"]))[0]
            n = example["number"]
            timing = (f"第 {n} 局在 T{duplicate_turn(example,slot)} 用出第二张{name}。" if uses else
                      f"第 {n} 局 T{example['worst']['turn']} 主教生命从 {example['worst']['start'][0]} 降至 {example['worst']['end'][0]}。")
            diary.extend([f'<a id="{key}-{group:02}"></a>', "", f"## {opp}第 {5*group-4}–{5*group} 局", "",
                          f"本组 {display(score(block))}，有 {len(uses)} 局用出第二张{name}。{timing}"
                          "保持登记的共同构筑，按该牌进化前的对手场面复核另一张可能创造的机会。"
                          f"[五局复盘]({key}/reviews/{group:02}.md) · [例局]({key}/games/{n:02}.md)", ""])
    write(folder / "construction.md", diary)

summary = {}
index = ["# 第二张灾藤与第二张马文", "", "两份共同牌表对同样的新牌序分别实打。每行只计已完成五局复盘的对局。"
         "[预登记与验收条件](protocol.md) · [双灾藤 F 构筑日志](candidate/construction.md) · [双马文 B 构筑日志](control/construction.md)", "",
         "| 对手 | 双灾藤 F | 双马文 B | 完整配对 | 原负转胜 | 原胜转负 | 第二张灾藤出场 | 第二张马文出场 |",
         "|---|---:|---:|---:|---:|---:|---:|---:|"]
details = []
tips = {}
for key, (opp, skill) in KEYS.items():
    f, b = by_lane["candidate"][key], by_lane["control"][key]
    paired = sorted(f.keys() & b.keys())
    for n in paired:
        assert f[n]["order"] == b[n]["order"] and f[n]["openingHands"] == b[n]["openingHands"]
    up = [n for n in paired if b[n]["winner"] == 1 and f[n]["winner"] == 0]
    down = [n for n in paired if b[n]["winner"] == 0 and f[n]["winner"] == 1]
    outcomes = {}
    for lane, games in (("candidate", f), ("control", b)):
        card = LANES[lane][1]
        outcomes[lane] = {"record": score(games.values()), "first": score(g for n,g in games.items() if n%2),
                          "second": score(g for n,g in games.items() if n%2 == 0),
                          "secondCopy": {n: duplicate_turn(g,card) for n,g in games.items() if duplicate_turn(g,card)}}
    summary[key] = {**outcomes, "pairs":len(paired), "lossToWin":up, "winToLoss":down,
                    "exactMcNemarTwoSided": round(exact_test(len(up),len(down)),4)}
    f2, b2 = (outcomes[lane]["secondCopy"] for lane in LANES)
    index.append(f"| {opp} | {display(score(f.values()))} | {display(score(b.values()))} | {len(paired)} | "
                 f"{len(up)} | {len(down)} | {len(f2)} | {len(b2)} |")
    details += [f"## {opp}", "", f"主教先攻，F 为 {display(outcomes['candidate']['first'])}、B 为 {display(outcomes['control']['first'])}。"
                f"主教后攻，F 为 {display(outcomes['candidate']['second'])}、B 为 {display(outcomes['control']['second'])}。", "",
                "| 编号 | 双灾藤 F | 双马文 B | 第二张灾藤／马文的出场回合 |", "|---:|---:|---:|---|"]
    for n in sorted(f.keys() | b.keys()):
        def lookup(games, lane):
            return f"[{LABEL[games[n]['winner']]}]({lane}/{key}/games/{n:02}.md)" if n in games else "待配对"
        turns = "／".join(f"T{d[n]}" if n in d else "—" for d in (f2, b2))
        details.append(f"| {n} | {lookup(f,'candidate')} | {lookup(b,'control')} | {turns} |")
    details.append("")
    lesson = [f"## {opp}", "", f"双灾藤 {display(score(f.values()))}，双马文 {display(score(b.values()))}。"
              f"已有 {len(paired)} 对核对了双方初手；改成双灾藤后，{len(up)} 局负转胜，{len(down)} 局胜转负。", ""]
    for games, duplicates, name, lane in ((f,f2,"灾藤","candidate"), (b,b2,"马文","control")):
        if duplicates:
            n = next(iter(duplicates))
            lesson.append(f"- 第 {n} 局在 T{duplicates[n]} 进化第二张{name}。"
                          + ("进化前数墓地法术、EX 空位与可连续造成的伤害。" if lane=="candidate" else
                             "在进化前记录双方从者、可攻击数和替代去除的费用，再决定是否交清场。")
                          + f"[录像与逐回合日志]({WEB}/{lane}/{key}/games/{n:02}.md)")
    for seeds, label in ((up,"负转胜"),(down,"胜转负")):
        if seeds:
            n=seeds[0]
            lesson.append(f"- 种子 {n} {label}。先比较两边 T{min(f[n]['turn'],b[n]['turn'])} 之前的动作，再检查换位的进化牌是否上场。"
                          f"[双灾藤]({WEB}/candidate/{key}/games/{n:02}.md) · [双马文]({WEB}/control/{key}/games/{n:02}.md)")
    tips[key]=lesson
    if f or b:
        write(REPO/"skills"/skill/"references"/"second-saito.md",
              ["# 主教第二次进化灾藤时的应对", "", *lesson, "", f"[完整配对与两套进化区]({WEB}/index.md)"])
complete = all(item["pairs"] == 100 for item in summary.values())
total = sum(sum(sum(s[lane]["record"]) for lane in LANES) for s in summary.values())
data = {"physicalGames":total, "complete":complete, "byMatchup":summary}
if complete:
    data["criteria"] = {}
    for lane in LANES:
        wins = [s[lane]["record"][0] for s in summary.values()]
        data["criteria"][lane] = {"best65All35AtMostOneBelow50":max(wins)>=65 and min(wins)>=35 and sum(v<50 for v in wins)<=1,
                                  "allAtLeast45":min(wins)>=45}
index.extend(["",f"本次已复核 {total} 场独立实打的录像。配对共享相同开局，计算胜率时两表各自使用自己的实战记录。"
              "第二张进化卡的出场是赛中选择，不能把那几局的胜率直接当成换牌收益。", "", *details])
write(ROOT/"index.md",index)
(ROOT/"summary.json").write_text(json.dumps(data,ensure_ascii=False,indent=2)+"\n","utf-8")
write(REPO/"skills/sve-bishop-matchups/references/second-saito.md",
      ["# 第二张灾藤和第二张马文怎么选", "", "计算第二次进化的价值时，手上灾藤、墓地法术、EX 空位与对方关键目标要放在同一回合核对。"
       "对面有多名威胁时，另算马文在这个回合清场后对手还余几次攻击。", "", *[line for key in KEYS for line in tips[key]], "",
       f"[共同牌表、计数和实战]({WEB}/index.md)"])
print("Reviewed",total,"games.", {k:s["pairs"] for k,s in summary.items()})
