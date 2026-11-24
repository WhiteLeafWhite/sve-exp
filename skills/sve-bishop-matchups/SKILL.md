---
name: sve-bishop-matchups
description: 驾驶 Shadowverse EVOLVE 日版 BP20 的透京耶菈主教，覆盖白牙萝蕾娜双灾藤 F、席翁玛文、梦羊、天曜战骑等九份牌表。练习整手重抽、免费入场、回复解场、天冥斩杀和水银 Quick。
---

# 白牙萝蕾娜透京耶菈主教

接手上一阶段时，默认拿 F 表作主教基准。主牌 40 张，进化 10 张，进化区灾藤 2、玛文 1。对三个固定困难 Bot 的独立牌序，主教对巫师 63/125、龙 55/122、皇室 62/125。19 场双方各按自己视野出牌的正式对练中，主教 4 胜 15 负，期间用过两种主教进化配额。在当前算力下优先复用这些决策点。要还原旧局，采用录像里保存的双方牌表。[导入 F 表](references/bp20-recommended.json) · [构筑、分母和胜率区间](references/bp20-current.md) · [双席逐局记录](https://github.com/WhiteLeafWhite/sve-exp/blob/6556d454e7baa65f7c18f233511868ab50700cb4/batches/10-agent-duels/index.md)

## 从起手打到收尾

- **起手先排自己的第二、第三回合。** 后攻有灾藤、白牙、萝蕾娜、万裁时，灾藤可在二费找后续，四费萝蕾娜可回 4 并准备解场。对皇室第 6 局，实战重抽后前两回合空过，保留同一手的分支打到 T18 主教胜。对龙把先攻留牌一律收紧，在同一百个牌序是原打法 37 胜、收紧后 33 胜。先看跟进和合法目标，再决定是否整手换掉。[皇室起手复练](https://github.com/WhiteLeafWhite/sve-exp/blob/6556d454e7baa65f7c18f233511868ab50700cb4/batches/10-agent-duels/drills/logs/royal-06-keep.md) · [对龙起手对照](references/dragon-opening.md)
- **圣士郎进化前数费用、空位与进化牌。** 有待用的承担者进化牌 BP18-106 时，圣士郎免费放承担者，入场与自动进化各回 1，圣士郎可分两次各打 2。若有两个空位、手里同时有坚定不移的祈祷和承担者，比较先免费放祈祷，检索后凭下一张透京减 2，再以 0 PP 打承担者。敌方从者已横置时，也要比较小随从交换与用 2 伤移除直立目标。[巫师牌序 88 的原线与对照](https://github.com/WhiteLeafWhite/sve-exp/blob/6556d454e7baa65f7c18f233511868ab50700cb4/batches/14-trained-pilot/target-85.md)
- **回复和攻击分开计数。** 先数这一回合能攻击的旧随从，再算能补几名透京随从、天冥 0 费起动能打几点。耶菈的祈祷每张每回合首次回复能强化全场。己方高血并有双祈祷时，把原本能活下来的攻击者换到只剩 1 防，可能丢掉下回合的致死伤害。龙牌序 85 保住灾藤的线路，次回合灾藤本体打了 7。该局和上一条都是已见牌序。第四次修正停在定点检查，整局复核 0/4。[选目标的代价](https://github.com/WhiteLeafWhite/sve-exp/blob/6556d454e7baa65f7c18f233511868ab50700cb4/batches/14-trained-pilot/target-85.md) · [冻结打法的 60 对复核](https://github.com/WhiteLeafWhite/sve-exp/blob/6556d454e7baa65f7c18f233511868ab50700cb4/batches/14-trained-pilot/index.md)

## 交回合前要看什么

| 对手 | 在己方视野比较的两条线 |
|---|---|
| 破坏巫师 | 预算首攻前的能力伤害，再算首攻时水银能挡多少。白牙加承担者留水银的一局，巫师先攻击，主教以 5 血等到忒弥斯并胜。巫师先献章，主教只剩 2，虽清场仍负。[两种巫师应手](https://github.com/WhiteLeafWhite/sve-exp/blob/6556d454e7baa65f7c18f233511868ab50700cb4/batches/10-agent-duels/drills/index.md) |
| 侮蔑龙 | 席翁横置能挡一次攻击，也给龙用战斗换掉减伤来源的机会。龙第 5 局，两种守护姿态都试过。在该局保留直立席翁和水银，三击由 6、4、2 变为 3、3、1，主教多获一个回合。再算龙的下一波。[主教席手记](references/agent-bishop-coach.md) |
| 财宝皇室 | 对面有炮手和多面公开海贼旗时，数炮手本体与每面旗的追加伤害。第 6 局，让万裁分身攻袭直立炮手，比打脸或去芭芭萝丝多争取一回合。皇室仍能借墓场的天冥另组伤害。[处理炮手后的录像日志](https://github.com/WhiteLeafWhite/sve-exp/blob/6556d454e7baa65f7c18f233511868ab50700cb4/batches/10-agent-duels/drills/logs/royal-06-cannon.md) |

## 可直接重练的一手

打开下列任一原生录像，恢复前 43 次输入，从**座位 0、T7** 接手。主教 20 血、0 PP，圣士郎刚进化，对面有直立 4/4 里榭娜。这个窗口列出两张耶菈的祈祷与一张承担者。先决定免费放哪张，再分配每次回复的目标。两份录像在输入 43 前相同。选祈祷的一线 T12 负，选承担者并连续两次打 2 的一线 T21 胜。[祈祷对照录像](assets/rune-01-prayer-control.json) · [承担者分支录像](assets/rune-01-punisher.json) · [打开录像与指定输入的方法](references/bp20-practice.md)

## 查找特定构筑或旧记录

- 手里的牌来自其他批次时，从[九份透京耶菈原表与操作差异](references/versions.md)选择对应版本。勒碧丝／封印控制可调用 `$sve-seraph-haven`。
- 对局中查[三职业打法](references/bp20-playbook.md)、[双席题库](references/agent-duels.md)或[固定百局胜负](references/bp20-fixed-results.md)。按对手找[巫师](references/fixed-cQZr8Z.md)、[侮蔑龙](references/fixed-zQrwne.md)、[皇室](references/fixed-t7B32v.md)。
- 比较主教变体时，先查[双玛文 B 与双灾藤 F](references/second-saito.md)、[梦羊 S](references/sacred-sheep.md)、[天曜战骑 K](references/heavenly-knight.md)。其他尝试有[神弓](references/lyrial.md)、[信仰的一击](references/banish.md)、[同表对龙改打法](references/dragon-r4.md)和[双席打法回到困难 Bot](references/trained-pilot.md)。
- 首轮席翁玛文牌表、34/60 的三组成绩与当时的 r2 单独保存在[历史实测](references/results.md)和[早期打法](references/playbook.md)。F 的困难基准采用 r3。需要模拟器操作时查[工具说明](references/bp20-practice.md)。
