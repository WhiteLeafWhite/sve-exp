---
name: sve-loot-sword
description: 在 SVE NEXT 日版 BP20 用 t7B32v「20财宝」皇室对练，核算财宝 EX、费用减免、芭芭萝丝的攻击窗口和对透京主教的压力。
---

# 财宝皇室「20财宝」

每组新增的终局算例与出牌题见[固定百局复盘](references/fixed.md)。

1. 使用 t7B32v 的 40 张主牌、10 张进化牌，保留原表三张 BP05-018。起手看第一批盗贼能否提供场攻和财宝，再判断已有的减费能否在本回合兑现。大洋斥候进场给海贼旗，先检查旗有没有合适的盗贼目标，以及目标下回合能否存活。[冻结牌表](https://github.com/WhiteLeafWhite/sve-exp/blob/main/batches/07-t7B32v/opponent.json)
2. 把 EX 每张财宝的印刷费、实际支付的 PP、能造成的伤害逐项写出来。BP15-020 每回合可两次令下一张财宝减 2。芭芭萝丝在己方回合给从 EX 使用的财宝减 1。先用能使下一张动作合法的财宝，再消耗减费。EX 快满时给下一张入场曲或生成物留空位。[卡文查询](https://svehelperwin.com/)
3. 海贼旗要选盗贼，兼具八狱和盗贼才附带 1 点主战者伤害。黄金短剑先要有合法从者目标，对手墓场十张以上才附带主战者 2 点。考虑进化篡夺绝杰利用对方墓场时，优先看立刻能用的回复、移除或疾驰。主教席翁在场时，对每段分别减伤。
4. **实战题**。对主教第 22 局 T21，主教 12 血。两个旧随从先打 3、2，再用芭芭萝丝提供的海贼旗打 1，最后 6 攻收尾。反例在第 21 局，皇室从 12 血被天冥和两个老随从正好击败。交回合前，用「天冥起动＋能攻击的透京随从」复算主教的上限。[第 22 局](https://github.com/WhiteLeafWhite/sve-exp/blob/main/batches/08-bp20-hard-150/t7B32v/games/22.md) · [第 21 局](https://github.com/WhiteLeafWhite/sve-exp/blob/main/batches/08-bp20-hard-150/t7B32v/games/21.md)
5. 每五局记录未用尽的减费、被挤掉的 EX、最后一个合适的交换机会。保留至少一组「同局面先用旗或先攻击」的反事实重演。双 agent 对练阶段累计替牌按初始原表的主牌和进化牌合计，最多五张。局中只读取皇室座位的可见信息。[更多实战](https://github.com/WhiteLeafWhite/sve-exp/tree/main/batches/08-bp20-hard-150/t7B32v)
