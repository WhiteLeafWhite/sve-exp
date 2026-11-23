"""Verify the completed 150 games and build their Markdown and machine-readable indexes."""
import hashlib
import json
import re
from collections import Counter
from pathlib import Path

from series import KEYS, PLAN, ROOT, read, score, select, write


NAMES = {"cQZr8Z": "破坏巫师", "zQrwne": "侮蔑龙", "t7B32v": "财宝皇室"}
SOURCE = {"cQZr8Z": "05-cQZr8Z", "zQrwne": "06-zQrwne", "t7B32v": "07-t7B32v"}
SKILL = ROOT.parents[1] / "skills/sve-bishop-matchups"


def md(path, lines):
    path.write_text("\n".join(lines).rstrip() + "\n", encoding="utf-8")


def record(games):
    wins, losses, draws = score(games)
    return f"{wins}–{losses}" + (f"–{draws}" if draws else "")


def signature(deck):
    contents = [deck["leader"], sorted(deck["main"].items()), sorted(deck["evolve"].items())]
    return hashlib.sha256(json.dumps(contents, separators=(",", ":")).encode()).hexdigest()


def verify_deck(expanded, deck):
    assert expanded["leader"] == deck["leader"]
    for zone in ("main", "evolve"):
        assert dict(Counter(expanded[zone])) == deck[zone]


def main():
    selected = read(ROOT / "selected.json")
    assert selected == select()
    best = selected["deck"]
    decks = {v: read(ROOT / "decks" / (v + ".json")) for v in "ABC"}
    for deck in decks.values():
        assert all(re.fullmatch(r"BP(0[1-9]|1\d|20)-.+", n) for n in [deck["leader"], *deck["main"], *deck["evolve"]])
    all_games, summary, checks, seeds = [], {}, [], set()
    inputs = 0
    engines = set()
    search = [[0, 0], [0, 0]]
    for key in KEYS:
        folder = ROOT / key
        original = read(ROOT.parent / SOURCE[key] / "opponent.json")
        raw = read(ROOT.parent / SOURCE[key] / "source.json")
        assert [original["leader"], original["main"], original["evolve"]] == [raw["leader_card_no"], raw["basic_deck"], raw["evo_deck"]]
        groups = [read(folder / "reviews" / f"{r:02}.json") for r in range(1, 11)]
        games = [g for group in groups for g in group]
        assert [g["number"] for g in games] == list(range(1, 51))
        assert len(list((folder / "games").glob("*.md"))) == len(list((folder / "replays").glob("*.json"))) == 50
        assert sum(g["order"] == "先攻" for g in games) == 25
        for r, group in enumerate(groups, 1):
            check = read(folder / "checks" / f"{r:02}.json")
            assert check["games"] == [g["number"] for g in group] and check["record"] == score(group)
            checks.append(check)
            for g in group:
                num = g["number"]
                native = read(folder / "replays" / f"{num:02}.json")
                tr, opts = native["training"], native["options"]
                v = PLAN[r-1] if r < 8 else best
                assert native["format"] == "sve-replay" and native["version"] == 1
                assert tr["key"] == key and tr["number"] == num and tr["policy"] == (2 if r == 1 else 3)
                assert tr["deckVersion"] == g["deck"] == v and tr["bishopHash"] == signature(decks[v])
                assert tr["opponentHash"] == signature(original) and tr["opponentPreset"] == "hard-next" and tr["opponentEffort"] == 1
                assert opts["controllers"] == ["human", "hard"] and not opts["manualActions"] and opts["deckRestrictions"]
                assert opts["seed"] not in seeds and opts["seed"] == f"sve-exp/bp20-hard-150/v1/{key}/{num}"
                assert opts["turnOrder"] == ("player1" if num % 2 else "player2")
                verify_deck(opts["decks"][0], decks[v])
                verify_deck(opts["decks"][1], original)
                assert native["info"]["result"]["winner"] == g["winner"] and native["info"]["turn"] == g["turn"]
                assert len(native["inputs"]) == g["inputs"] and tr["hp"] == g["hp"]
                assert f'id="game-{num:02}"' in (folder / "reviews" / f"{r:02}.md").read_text(encoding="utf-8")
                assert (folder / "games" / f"{num:02}.md").is_file()
                seeds.add(opts["seed"])
                engines.add(tr["engine"])
                inputs += len(native["inputs"])
                for seat, stats in enumerate(tr["search"]):
                    search[seat][0] += stats["fallbacks"]
                    search[seat][1] += stats["failedSimulations"]
        summary[key] = {"all": score(games), "first": score([g for g in games if g["order"] == "先攻"]),
                        "second": score([g for g in games if g["order"] == "后攻"]),
                        "baseline": score(games[:5]), "selection": score(games[5:35]), "holdout": score(games[35:]),
                        "holdoutFirst": score([g for g in games[35:] if g["order"] == "先攻"]),
                        "holdoutSecond": score([g for g in games[35:] if g["order"] == "后攻"])}
        index = [f"# 主教对{NAMES[key]} · 50 局", "",
                 f"总战绩 {record(games)}，定稿独立验证 {record(games[35:])}。生命先列主教，T 按双方回合合计。每五局的复盘内可定位到单局。", "",
                 f"[原表](../../{SOURCE[key]}/opponent.json) · [三对局成绩](../index.md) · [构筑日志](../construction.md)", "",
                 "| 局 | 主教 | 构筑 / 打法 | 胜负 | 终局 | 生命 | 记录 |", "|---:|---|---|---|---:|---|---|"]
        for g in games:
            n = g["number"]
            label = {0: "胜", 1: "负", None: "平"}[g["winner"]]
            index.append(f"| {n} | {g['order']} | {g['deck']} / r{g['policy']} | {label} | T{g['turn']} | {g['hp'][0]} / {g['hp'][1]} | "
                         f"[战报](games/{n:02}.md) · [复盘](reviews/{(n+4)//5:02}.md#game-{n:02}) · [录像](replays/{n:02}.json) |")
        md(folder / "index.md", index)
        all_games.extend(games)
    assert len(engines) == 1 and len(seeds) == 150 and len(checks) == 30
    holdout = [g for g in all_games if g["number"] > 35]
    stats = {"games": len(all_games), "checkpoints": len(checks), "engine": engines.pop(), "inputs": inputs,
             "search": {"seatOrder":["bishop","hard"], "counts":["fallbacks","failedSimulations"], "totals":search},
             "record": score(all_games), "holdout": score(holdout), "selected": best, "byMatchup": summary}
    write(ROOT / "summary.json", stats)
    write(SKILL / "references/bp20-150-final.json", decks[best])
    names = {}
    for file in Path("packages/core/data").glob("*.json"):
        data = read(file)
        if data.get("format") != 2:
            continue
        for card in data["cards"]:
            for n in [card["id"], *card["printings"]]:
                names[n] = card["names"].get("cn") or card["names"].get("ja") or card["name"]
    deck = decks[best]
    cardlist = ["# " + deck["name"], "", f"选表阶段为构筑 {best}，三套固定对手各占三分之一。定稿后 45 局为 {record(holdout)}。"
                f"主战者为 {names[deck['leader']]}（{deck['leader']}）。[模拟器牌表](bp20-150-final.json) · [逐局成绩](https://github.com/WhiteLeafWhite/sve-exp/blob/main/batches/08-bp20-hard-150/index.md)", ""]
    for zone, label in (("main", "主牌"), ("evolve", "进化牌")):
        cardlist.extend([f"## {label} · {sum(deck[zone].values())} 张", "", "| 卡号 | 名称 | 张数 |", "|---|---|---:|"])
        cardlist.extend(f"| {n} | {names[n]} | {quantity} |" for n, quantity in sorted(deck[zone].items()))
        cardlist.append("")
    md(SKILL / "references/bp20-deck.md", cardlist)
    intro = ["# BP20 主教对困难 Bot · 150 局", "",
             f"主教共 {record(all_games)}，每个对手 50 局、先后攻各 25 局。三套候选中选出 **{decks[best]['name']}**。选定后使用 45 个新种子，成绩为 **{record(holdout)}**。", "",
             "| 对手原表 | 首轮 5 局 | 选表 30 局 | 定稿 15 局 | 全部 50 局 | 全部先攻 | 全部后攻 |",
             "|---|---:|---:|---:|---:|---:|---:|"]
    for key in KEYS:
        row = summary[key]
        stat = lambda field: "–".join(map(str, row[field][:2])) + (f"–{row[field][2]}" if row[field][2] else "")
        intro.append(f"| [{NAMES[key]} {key}]({key}/index.md) | " + " | ".join(stat(f) for f in ("baseline","selection","holdout","all","first","second")) + " |")
    intro.extend(["", "表中依次为主教的胜、负，有平局时另列。前 5 局沿用旧打法。第 6–35 局以同一个 r3 驾驶三套候选，每套每对手各 10 局、先后攻各 5 局。最后 15 局保持同一套牌和打法。", "",
                  "[三套候选与每五局的构筑日志](construction.md) · [最终牌表](../../skills/sve-bishop-matchups/references/bp20-150-final.json) · "
                  "[实战打法与重练题](../../skills/sve-bishop-matchups/references/bp20-playbook.md) · [机器可读成绩](summary.json)", "",
                  "## 录像与复现", "",
                  f"使用 SVE NEXT 0.4.3 提交 `028e157`，引擎指纹 `{stats['engine']}`。共记录 {inputs:,} 次输入。每局从种子重新执行所有输入并比较完整终局状态。打开任一对手索引，在模拟器菜单的「观看录像」中载入原生 JSON。", "",
                  "在已安装依赖的模拟器源码根目录，以 `$batch` 指向本批目录，先运行 `node $batch/prepare.mjs`。"
                  "空白输出目录可分别用 `python $batch/series.py <分享码> --end 7` 跑完三个对手，再执行 `python $batch/series.py select`，"
                  "然后分别执行 `python $batch/series.py <分享码> --start 8 --end 10`。已有同条件录像会复用。"
                  "最终用 `python $batch/summarize.py` 逐项比对牌表、先后攻、种子及成绩。", "",
                  "龙族保留原表 3 张 BP15-066，皇室保留 3 张 BP05-018。主教单独核对日版十月禁限，三个对手逐局核对冻结原表。困难 Bot 使用桌面 Hard 完整强度，能读取双方的隐藏区域。"
                  "主教使用自己的合法视野、公开 EX 与假想牌序。社区牌表出现数只能描述抽到的站内样本。", "",
                  "[SVE NEXT 源码](https://github.com/eireetm/ShadowverseEvolve-NEXT/tree/028e157) · [SVE Helper](https://www.svehelperwin.com/#/deck-list) · [日本官方禁限](https://shadowverse-evolve.com/card_limit/)"])
    md(ROOT / "index.md", intro)
    diary = ["# 主教构筑日志", "", "## 候选与改牌", "",
             f"- **A · {decks['A']['name']}**。从上一批最终表开始，主牌 40 张、进化 10 张。[A 表](decks/A.json)",
             "- **B · 白牙与萝蕾娜**。从 A 的主牌各减 1 张 BP18-101、BP18-109、BP18-110、BP19-095。加入 BP09-095 白牙神殿和 BP18-107 萝蕾娜各 2 张。进化区各减 1 张 BP18-106、BP18-111，补入 2 张 BP18-108。目标是把一次回血变成当回合的解场行动，并增加对方回合前的回复机会。[B 表](decks/B.json)",
             "- **C · 勒碧丝与封印的炽天使**。以 SVE Helper 的 XHhdUE「升天」为底稿。原表 42/10，去掉主牌 CP02-089 两张。进化区去掉 CP02-090 两张，补入 BP15-114、BP19-101 各一张，得到 BP 牌号的 40/10。观察勒碧丝能否攻击、封印能否直接从牌库进场，再评估 4 指示物的回报。[C 表](decks/C.json)", "",
             "## 三套构筑的同条件比较", "",
             "| 构筑 | 破坏巫师 | 侮蔑龙 | 财宝皇室 | 积分 / 30 | 站内特征组合 / 38 |",
             "|---|---:|---:|---:|---:|---:|"]
    for v, entry in selected["candidates"].items():
        scores = ["–".join(map(str, entry["records"][k][:2])) for k in KEYS]
        diary.append(f"| [{v}](decks/{v}.json) | " + " | ".join(scores) + f" | {entry['points']:g} | {entry['signature']} {entry['publicDecks']} |")
    diary.extend(["", f"固定三对手等权，胜计 1、平计 0.5。总分相同先比较最弱对局，再优先考虑站内较少见的特征组合。选中 {best} 后才启用第 36–50 局的种子。"
                  "三套候选沿用相同的 r3 决策程序，其中部分透京评价继承自旧版。对专用驾驶策略的进一步优化可能改变候选排名。", "",
                  "在 SVE Helper 的 BP20、Basic、主教筛选下共返回 38 份分享表。每份按卡牌定义合并异画。作为参照，希弥佳＋安息神殿出现 15 份。"
                  "采用公开提交样本，未测量真人对局中隐藏主轴带来的额外胜率。[站内取样](source-sample.json) · [选表输入与结果](selected.json)", "",
                  "## 五局检查记录", ""])
    for check in checks:
        key, r = check["key"], check["round"]
        numbers = check["games"]
        observation = check["observation"].replace("在自己前三回合", "在开局前六个双方回合")
        diary.extend([f'<a id="{key}-{r:02}"></a>', "", f"### {NAMES[key]}第 {numbers[0]}–{numbers[-1]} 局 · {check['deck']} / r{check['policy']}", "",
                      observation + " " + check["decision"], "", check["coaching"] + f" [五局复盘]({key}/reviews/{r:02}.md)", ""])
    md(ROOT / "construction.md", diary)
    print(json.dumps(stats, ensure_ascii=False))


if __name__ == "__main__":
    main()
