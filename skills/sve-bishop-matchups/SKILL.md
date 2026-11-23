---
name: sve-bishop-matchups
description: 使用透京耶菈主教练习 Shadowverse EVOLVE 日版 BP20，在 SVE NEXT 中对战 cQZr8Z 破坏巫师、zQrwne 侮蔑龙、t7B32v 财宝皇室。提供实战牌表、起手与应对、困难 Bot 录像和逐局复盘。
---

# 透京耶菈主教陪练

1. 用[分组成绩](references/results.md)确认这套构筑在指定对手上的实测表现。构筑与对局胜负的适用范围由卡池、对手原表与先后攻共同决定。
2. 导入[主教牌表](references/bishop-final.json)。开局前阅读[打法](references/playbook.md)中的起手部分和本轮对手那一行。查看公开 EX、对方已使用的进化资源、双方墓场、己方手牌和 PP。
3. 每回合优先验算合法斩杀。把廉价解守护、天冥直伤、已经能攻击的随从和对方可用 Quick 按顺序结算。准备交回合时，分别估算攻击、能力伤害和后续回复，再决定是否留 1 PP。
4. 在模拟器里接入保存的主教决策时，按[练习条件](references/method.md)调用[决策程序](scripts/bishop-player.mjs)。对手使用原版桌面 Hard，主教按自己的合法视野行动。
5. 赛后保存原生录像并逐回合记录，标明先后攻、起手与重抽、关键行动、终局生命、胜负原因和可改进的一步。训练样本、正式分组、改变过去输入的重演分别记账。可从[原始七批对局](https://github.com/WhiteLeafWhite/sve-exp)逐局比对。
