"""Rebuild the Chinese chronological record of every completed practice branch."""
import json
import subprocess
from pathlib import Path

BATCH = Path(__file__).resolve().parent.parent
REPORT = BATCH / "08-bp20-hard-150" / "report.mjs"
NAMES = {"cQZr8Z": "破坏巫师", "zQrwne": "侮蔑龙", "t7B32v": "财宝皇室"}
TITLES = {
    "dragon-07-prayer": "先起动祈祷", "dragon-07-super": "改选超进化",
    "dragon-21-marwynn": "先下玛文", "dragon-21-pyromancy": "炎术、灾藤、再用炎术",
    "rune-01-prayer-control": "圣士郎取耶菈的祈祷", "rune-01-punisher": "圣士郎取承担者",
    "rune-01-warped-progress": "歪曲先解直立随从", "dragon-01-quicksilver": "留 1 PP 出水银",
    "dragon-02-prayer": "祈祷对开局时的龙策略", "dragon-02-whitefang": "白牙对开局时的龙策略",
    "dragon-02-prayer-trained": "祈祷对第一组更新后的龙", "dragon-02-whitefang-trained": "白牙对第一组更新后的龙",
    "dragon-02-whitefang-draw-control": "213 手选抽牌对照", "dragon-02-whitefang-take-control": "217 手选取牌对照",
    "dragon-02-whitefang-ramp": "213 改选加 PP 上限", "dragon-02-whitefang-decline": "217 拒绝取牌",
    "dragon-02-whitefang-keep-one": "隐者与启示都给下一回合留牌",
    "royal-03-lorena-F": "双灾藤重走萝蕾娜与奔流的交换", "royal-03-lorena-B": "双玛文重走萝蕾娜与奔流的交换",
    "royal-03-marwynn-B": "双玛文先用第二张玛文进化清场",
    "royal-03-marwynn-turn-B": "双玛文完整指定 T21，再从 T22 交回双方策略",
    "royal-04-seishiro": "歪曲处理被夺走的圣士郎", "royal-04-octrice": "歪曲处理进化欧克托莉斯",
    "rune-05-prayer-control": "先祈祷，复现巫师第五局", "rune-05-tenmei": "透京取天冥，用三次回复处理纱妃拉",
    "rune-05-wasteland": "同盘以破坏的荒野检索狂信者收尾",
    "dragon-05-prayer-control": "先用耶菈的祈祷，重走 T17 原线",
    "dragon-05-quicksilver": "席翁横置，首次攻击窗口用水银",
    "dragon-05-upright": "席翁直立，首次攻击窗口用水银",
    "dragon-05-tenmei": "祈祷配天冥，两次回复处理使徒",
    "dragon-05-union": "祈祷配天冥，两次回复处理团结者",
    "royal-05-control": "在主教回合用水银复现原局",
    "royal-05-quicksilver": "留水银并横置席翁",
    "royal-05-upright": "留水银并让席翁直立",
    "royal-05-seishiro": "七费先下圣士郎",
    "royal-05-whitefang": "七费先下白牙神殿",
    "rune-06-control": "主教主阶段打水银复现原局",
    "rune-06-hold": "白牙与承担者落场，留水银给首攻",
    "rune-06-trade": "白牙、炎术与承担者正常进化，先交换狂信者",
    "rune-06-city": "都市、炎术与正常进化承担者，留水银",
    "rune-06-city-super": "都市、炎术与超进化承担者，留水银",
    "rune-06-burn-first": "同盘巫师先耗尽直伤，再让三名狂信者攻击",
    "dragon-06-cached": "按原座位策略决策，复现完整龙六原局",
    "dragon-06-control": "手动指定与原局相同的水银，比较后续搜索",
    "dragon-06-worshipper": "都市取炎术，先除崇拜者",
    "dragon-06-union": "都市取炎术，先除团结者",
    "dragon-06-priest": "都市取炎术，先除祈祷者",
    "dragon-06-reserve": "双耶菈落场，水银与炎术都留给龙族回合",
    "royal-06-cached": "按原座位策略完整复现皇六",
    "royal-06-cannon": "煤木万裁分身攻袭直立的海潮炮手",
    "royal-06-barbaros": "煤木万裁分身攻击横置的芭芭萝丝",
    "royal-06-keep": "保留萝蕾娜、白牙、灾藤、万裁的整手",
}


def read(file):
    return json.loads(file.read_text("utf-8-sig"))


def source_match(folder, replay):
    source = replay["practice"]["source"]
    for key in NAMES:
        native = folder.parent / key / "replays" / source
        if native.is_file() and read(native)["options"]["seed"] == replay["options"]["seed"]:
            return key, int(native.stem)
    raise ValueError("Original game missing for " + source)


for folder in sorted(BATCH.glob("*/drills")):
    logs = []
    for file in sorted(folder.glob("*.json")):
        replay = read(file)
        key, n = source_match(folder, replay)
        subprocess.run(["node", REPORT, key, "1", "drill", file], check=True)
        winner = replay["info"]["result"]["winner"]
        result = {0: "主教胜", 1: NAMES[key]+"胜", None: "平局"}[winner]
        slug = file.stem
        logs.append(f"| {NAMES[key]}第 {n} 局 | {TITLES.get(slug,slug)} | T{replay['info']['turn']} {result} | "
                    f"[日志与逐局复盘](logs/{slug}.md) · [原生录像]({file.name}) |")
    if logs:
        lines = ["# 各分支的逐回合日志", "", "这些记录用于重做同一局面的选择。正式实战成绩只使用原局。", "",
                 "| 原局 | 重练的选择 | 分支终局 | 记录 |", "|---|---|---|---|", *logs]
        (folder/"logs.md").write_text("\n".join(lines)+"\n","utf-8")
        print(folder.parent.name,len(logs))
