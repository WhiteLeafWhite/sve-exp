---
name: sve-bishop-matchups
description: 用 SVE NEXT 练习 Shadowverse EVOLVE 日版 BP20 主教，陪练起手、进化、Quick、斩杀与复盘。适用于从 SVE Helper 导入卡图牌表、用主教对三个固定困难 Bot、每五局优化构筑或从录像决策点重练。
---

# BP20 主教陪练

1. 准备牌表。使用第八批的同一套定稿对战 cQZr8Z 破坏巫师、zQrwne 侮蔑龙和 t7B32v 财宝皇室。向用户报出本对局独立验证的胜负，再说明这次要练的一个决定。[定稿与张数](references/bp20-deck.md) · [导入文件](references/bp20-150-final.json) · [三对局成绩](https://github.com/WhiteLeafWhite/sve-exp/tree/main/batches/08-bp20-hard-150)
2. 对练时由用户选择要驾驶的一方。开局先看四张手牌，给出先后攻、第二回合与第三回合各能做什么，再决定是否整手重抽。询问用户的一次取舍后，给出一个可执行的替代顺序，让用户在模拟器比较。按需核对规则与导入命令。[规则、启动及重演](references/bp20-practice.md)
3. 在主阶段先算可确认的斩杀，逐一扣除横置守护、解场费用与可能的 Quick。交回合前读敌方公开 EX、墓场、剩余 EP／SEP 和己方可减伤次数。写出对方一条可能的终结线，再决定进化、回血、铺护符或留 PP。按对手选择题目。[实战打法与重练题](references/bp20-playbook.md)
4. 提交引擎列出的合法动作。自定义主教使用自己可见的信息和公平抽样，三个对手用桌面困难预设。局中根据可见动作更新推测，赛后再打开全视角录像核查。将一次复盘写成「当时看到什么、选择了什么、另一条合法线路及其代价」。[主教决策程序](scripts/bishop-player.mjs) · [互动与分支工具](scripts/practice.mjs)
5. 每五局检查起手、最危险的一个对手回合、核心牌抽到／打出／实际进场的差别。把换出的卡、换入的卡、张数及想解决的问题写进构筑日志。把可复用的出牌顺序、例外、对应录像输入点写入打法。保留对手原表，平衡先后攻，选好构筑后用新种子独立验证。[每五局构筑日志](https://github.com/WhiteLeafWhite/sve-exp/blob/main/batches/08-bp20-hard-150/construction.md)

固定百局阶段，白牙萝蕾娜对巫师 55 胜、龙族 43 胜、皇室 56 胜。对龙先攻时优先练习 T5–T9 的去除与施压取舍，对巫师后攻时重点看对方先铺偶像后的解场窗口。按照对手和先后攻选题。[百局统计与斩杀类型](references/bp20-fixed-results.md) · [巫师](references/fixed-cQZr8Z.md) · [龙族](references/fixed-zQrwne.md) · [皇室](references/fixed-t7B32v.md)

双 agent 对练时，主教席和对手席各读自己的玩家视角。每个三职业循环冻结共同主教，三种主流各自与最初原表比较，换动最多五张。把两方亲自选择的关节点、委托给本方策略的操作及每一局的理由一同保存。[双方座位与录像操作](https://github.com/WhiteLeafWhite/sve-exp/blob/main/batches/10-agent-duels/seats.md)

在圣士郎进化时，核对手中承担者、剩余进化牌和直立目标的防御。练习把两次回复各自分配为 2 伤，再与下祈祷的同牌序结果比较。对龙或皇室，先算守护被移走或炮手被补回之后的伤害。[主教席实战题与配对重演](references/agent-bishop-coach.md)

检验防守卡位时，逐局看神弓座天使是否活到伤害结算、信仰的一击是否赶得上消灭触发源。练习先解场时，用同一份牌重演炎术、灾藤和炎术的顺序，记录龙族余下的攻击与直伤。[神弓两卡位实测](references/lyrial.md) · [快速消灭的实战目标](references/banish.md) · [龙族 r4 打法与配对实录](references/dragon-r4.md)

复查此前七批时，使用历史牌表、打法版本与当时的样本。历史策略默认使用 r2，本批正式比较使用 r3。[历史战绩](references/results.md) · [历史牌表](references/bishop-final.json) · [历史打法](references/playbook.md) · [历史条件](references/method.md)

先从本方座位重做一个关键决定，再对照当时的理由与比赛结果。[双座位对练题](references/agent-duels.md)

对龙起手时，先比较同一手四张在保留和整手重抽后的前三回合。[先攻留牌的独立实打](references/dragon-opening.md)

对照使用第二张灾藤和第二张玛文的场面，比较回收炎术、用身体交换与留费清场的收益。[配对实战](references/second-saito.md)

圣士郎进化后，选择手里一张放进场。先比较这回合能触发几次回复，以及对面的 4/4 会不会活到下回合。[从 T7 执主教](http://127.0.0.1:5170/practice/index.html?replay=BP20-agents-cQZr8Z-01.json&at=43&seat=0)

下梦羊时，先确定对手的第一段伤害是否能改由更小的一段支付。[一次伤害防止的实战](references/sacred-sheep.md)

核对两个护符的五费盘面，数清天曜战骑当天的疾驰、回复和交回合后的守护。[同牌序取舍](references/heavenly-knight.md)

在相同牌序第一次分歧处对照实战主教席和基础搜索的决定。[冻结打法对困难 Bot 的验证](references/trained-pilot.md)
