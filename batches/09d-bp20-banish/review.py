"""Join the predeclared E games to 96–100 of the fixed 300 when available."""
import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parent
FIXED = ROOT.parent / "09-bp20-fixed-300"
SKILL = ROOT.parents[1] / "skills/sve-bishop-matchups/references/banish.md"
KEYS = {"cQZr8Z":"破坏巫师", "zQrwne":"侮蔑龙", "t7B32v":"财宝皇室"}
URL = "https://github.com/WhiteLeafWhite/sve-exp/blob/main/batches/09d-bp20-banish"
RESULT = {0:"胜", 1:"负", None:"平"}


def read(path):
    return json.loads(path.read_text("utf-8-sig"))


def effect_targets(path):
    return re.findall(r"^- 信仰的一击选择(.+?)。$", path.read_text("utf-8"), re.MULTILINE)


def write(path, lines):
    path.write_text("\n".join(lines).rstrip()+"\n", "utf-8")


rows = ["# 两张快速消灭的共同主教", "", "每组使用白牙萝蕾娜 E 与同一满强度 Hard 对手。原表 B 的第 96–100 局为预登记配对。对手、种子、先后攻与搜索参数相同。每局选择的目标来自引擎战报。[构筑取舍](construction.md)", ""]
tips = ["# 给信仰的一击留多少 PP", "", "信仰的一击需要 3 PP。对侮蔑龙，发现已经进化的嘉鲁蜜儿时，可在自己的主阶段先消灭她。等对方宣告攻击才行动，对方可能已经在主阶段完成数次自伤。对刚上场便结算伤害的从者，还要单算其入场曲。每次交回合都要说出留下 3 PP 预期在哪个合法窗口干预。", ""]
records = {}
for key, name in KEYS.items():
    group = ROOT / key / "reviews/01.json"
    if not group.exists():
        continue
    group_games = read(group)
    assert [g["number"] for g in group_games] == list(range(1,6))
    wins = sum(g["winner"] == 0 for g in group_games)
    drawn = sum("BP14-098" in g["drawn"] for g in group_games)
    cast = sum("BP14-098" in g["cast"] for g in group_games)
    fixed_group = FIXED / key / "reviews/20.json"
    previous = read(fixed_group) if fixed_group.is_file() else None
    summary = f"{name}五局为 {wins} 胜 {5-wins} 负，{drawn} 局取入手牌，{cast} 局实际使用。"
    rows.extend([f"## {name}", "", summary, "", "| 原表种子 | 主教 | E | B | 信仰的一击选择的目标 | 存档 |", "|---:|---|---|---|---|---|"])
    hand_to_table = []
    for g in group_games:
        i = g["number"]
        num = f"{i:02}"
        original = 95+i
        replay = read(ROOT/key/"replays"/(num+".json"))
        assert replay["options"]["seed"] == f"sve-exp/bp20-fixed-300/v1/{key}/{original}"
        assert replay["training"]["deckVersion"] == "E" and replay["training"]["policy"] == 3
        targets = effect_targets(ROOT/key/"games"/(num+".md"))
        target = "、".join(targets) or "未用"
        other = "待原组完成"
        if previous:
            old = read(FIXED/key/"replays"/(str(original)+".json"))
            assert all(replay["options"][p] == old["options"][p] for p in ("seed","turnOrder","controllers"))
            assert replay["options"]["decks"][1] == old["options"]["decks"][1]
            other = f"[{RESULT[old['info']['result']['winner']]}](../09-bp20-fixed-300/{key}/games/{original}.md)"
        rows.append(f"| {original} | {g['order']} | {RESULT[g['winner']]} | {other} | {target} | [日志]({key}/games/{num}.md) · [复盘]({key}/reviews/01.md#game-{num}) · [录像]({key}/replays/{num}.json) |")
        if targets:
            hand_to_table.append(f"第 {i} 局选择{target}，主教{RESULT[g['winner']]}")
    compare = f"相同五个种子，原表 B 为 {sum(g['winner']==0 for g in previous)} 胜。" if previous else ""
    rows.extend(["", compare, ""])
    tips.extend([summary+compare+("；".join(hand_to_table)+"。" if hand_to_table else "五局均未观察到消灭目标。")+f" [逐局对照]({URL}/index.md)",""])
    records[key] = {"wins":wins, "drawn":drawn, "cast":cast, "targetsByGame":hand_to_table}
    if previous:
        records[key]["baselineWins"] = sum(g["winner"]==0 for g in previous)
    anchor = f'<a id="{key}-01"></a>'
    diary = ROOT / "construction.md"
    existing = diary.read_text("utf-8")
    if anchor not in existing:
        diary.write_text(existing.rstrip()+f"\n\n{anchor}\n\n{summary} 保留本组共同 E 完成同条件比较。[五局复盘]({key}/reviews/01.md)\n", "utf-8")
write(ROOT/"index.md", rows)
write(SKILL, tips)
(ROOT/"summary.json").write_text(json.dumps(records, ensure_ascii=False, indent=2)+"\n", "utf-8")
