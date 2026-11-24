---
name: sve-seraph-haven
description: 驾驶 Shadowverse EVOLVE 日版 BP20 的勒碧丝／封印炽天使控制主教（第八批 C 表，源自 XHhdUE）。用于起手防守、祈祷指示物、攻击检索护符、四指示物结算与从 EX 选终结牌。
---

# 勒碧丝与封印的炽天使

使用第八批 C 表，主战者 BP07-LD03，主牌 40、进化 10。原型是 XHhdUE「升天」42/10。实测时移出两张 CP02-089，进化区两张 CP02-090 换成 BP15-114 和 BP19-101 各一张。共同 r3 策略对固定困难巫、龙、皇各打 10 局，主教依次 1 胜、0 胜、2 胜。该策略沿用了部分透京估值。以现有算力练这副牌时，先看慢速计划是否来得及，再决定要把哪一张牌放进 EX。[可导入实测 C 表](assets/C-seraph.json) · [来源、选表条件与结果](https://github.com/WhiteLeafWhite/sve-exp/blob/6556d454e7baa65f7c18f233511868ab50700cb4/batches/08-bp20-hard-150/construction.md)

## 两张护符的时点

30 局中，只有两局结算了封印给主战者加 10 血的效果。主教在巫师第 15 局胜，在龙族第 27 局负。另两场胜局都在对皇室时靠随从攻击完成。练这套牌应分别看勒碧丝能否攻击、封印是否进场、是否活到结束阶段兑现，以及兑现后有没有斩杀。[巫师第 15 局](https://github.com/WhiteLeafWhite/sve-exp/blob/6556d454e7baa65f7c18f233511868ab50700cb4/batches/08-bp20-hard-150/cQZr8Z/games/15.md) · [龙第 27 局](https://github.com/WhiteLeafWhite/sve-exp/blob/6556d454e7baa65f7c18f233511868ab50700cb4/batches/08-bp20-hard-150/zQrwne/games/27.md)

| 牌 | 何时数指示物 | 对当前选择的影响 |
|---|---|---|
| 崇高的炽天使·勒碧丝，实表印刷 BP16-U06、定义 BP16-093 | 自己主阶段开始时，给它自身和任选的其他己方场牌各加 1 个祈祷指示物。达到 4 个时成为 5/5 随从。 | 检查本回合的合法攻击，攻击触发可从牌库把封印的炽天使放进场。先确认牌库中还可能有封印，并为它留场位。攻击敌方随从也能触发。 |
| 封印的炽天使 BP02-091 | 自己结束阶段开始时先加 1，再检查是否至少有 4 个。达到门槛便将自身置入墓场，主战者加 10 血，可从牌库取至多两张放进 EX，以 0 PP 使用。 | 主阶段能用勒碧丝提前加计数。龙第 27 局主阶段已到 4，实际到结束阶段加至 5 才回 10。把过对方回合的防守和下一次进攻分别算清，再决定 EX 名额。[第 27 局日志](https://github.com/WhiteLeafWhite/sve-exp/blob/6556d454e7baa65f7c18f233511868ab50700cb4/batches/08-bp20-hard-150/zQrwne/games/27.md) |

## 起手、留费与收尾

- 起手有平静的教会 BP16-104 时，可先检索勒碧丝，再用叮当天使·莉亚或解牌覆盖前期。漆黑法典可消灭当前防御 3 以下的敌随从。射杀的光辉 BP08-092 需要对方回合与 2 PP，可将 4 点在至多两个合法目标之间分配。手里已有慢护符时，具体写出下个敌方回合能解谁。巫师第 15 局留下教会、审判、勒碧丝、射杀；皇室第 12 局则在封印发动前的 T7 就遭四名随从合攻 10。[巫师第 15 局](https://github.com/WhiteLeafWhite/sve-exp/blob/6556d454e7baa65f7c18f233511868ab50700cb4/batches/08-bp20-hard-150/cQZr8Z/games/15.md) · [皇室第 12 局](https://github.com/WhiteLeafWhite/sve-exp/blob/6556d454e7baa65f7c18f233511868ab50700cb4/batches/08-bp20-hard-150/t7B32v/games/12.md)
- 临近发动时给实际要取的两张牌留 EX 位。要过对方爆发，比较零费法典、射杀能阻止的伤害与对方首攻前的能力伤害。龙第 27 局取这两张，回到 18 血，仍在 T26 被炽火收尾。要在下回合抢血，先数旧随从，再排零费展开与新进场的疾驰。BP16-113 撒旦入场会对己方主战者造成 6 伤，出牌前先检查余下体力。[龙第 27 局](https://github.com/WhiteLeafWhite/sve-exp/blob/6556d454e7baa65f7c18f233511868ab50700cb4/batches/08-bp20-hard-150/zQrwne/games/27.md)
- 每个主阶段先数能否用现成攻击取胜。皇室第 30 局在 T16，勒碧丝、艾路拉戴、戒律间谍依次攻击 **5＋5＋3**，正好打穿 13。选择推进封印前也要看这条线。[第 30 局](https://github.com/WhiteLeafWhite/sve-exp/blob/6556d454e7baa65f7c18f233511868ab50700cb4/batches/08-bp20-hard-150/t7B32v/games/30.md)

## 可直接重练的一手

用巫师第 15 局录像恢复前 **182 次输入，座位 0、T21**。主教刚回到 20、巫师 11，结束阶段的检索允许从 14 张候选中选至多两张。先说出取一张应急解和取两张展开牌各准备过哪一轮。实战取艾路拉戴与戒律间谍。T23 旧艾路拉戴攻 5、罗德欧攻 4，再以撒旦提供的沉默的魔将攻 5，打完对手回复后的 14 血。另一种取牌属于待练选择，封存的这局只实打了上述线路。[原生录像](assets/seraph-rune-15.json) · [逐回合日志](https://github.com/WhiteLeafWhite/sve-exp/blob/6556d454e7baa65f7c18f233511868ab50700cb4/batches/08-bp20-hard-150/cQZr8Z/games/15.md)
