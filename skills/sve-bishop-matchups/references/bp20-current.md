# BP20 三职业共同主教

**本次陪练首选「透京耶菈 · 白牙萝蕾娜与双灾藤进化」（F）。** 保留原来的 40 张主牌，进化区把第二张绝望安息·玛文换成第二张魔污区政府职员·灾藤。龙和皇室有更多用灾藤回收炎术、连续处理直立随从的机会，代价是长盘少一次玛文清场。三个对手共用这套 40 张主牌和 10 张进化牌。[直接导入](bp20-recommended.json) · [白牙萝蕾娜基础 40 张及进化区](bp20-deck.md)

截至已复盘的对局，使用同一构筑与相同主教打法，对破坏巫师 47/95（49.5%）、对侮蔑龙 43/95（45.3%）、对财宝皇室 46/95（48.4%）。按实际点估计达到三项均 ≥45% 的参考线。将“三种约五五开”按每项至少 45% 检查。另一条要求一项至少 65%，三项均至少 35%，最多一项低于 50%。

## 固定困难 Bot 的独立牌序

每个格子是主教胜局／场数。B 汇总第九批、十二批，以及第十一批对龙的原打法先攻与两种打法共用的后攻。F 汇总第十二批和第十五批对照。K、S 各用自己的新录像。逐一核对牌表指纹与困难预设，同一份牌、同一职业与同一种子只计一次。

| 构筑 | 破坏巫师 | 侮蔑龙 | 财宝皇室 |
|---|---:|---:|---:|
| B · 双玛文进化 | 97/190（51.1%） | 116/285（40.7%） | 93/185（50.3%） |
| F · 双灾藤进化 | 47/95（49.5%） | 43/95（45.3%） | 46/95（48.4%） |
| K · 双天曜战骑 | 4/10（40.0%） | 2/10（20.0%） | 2/10（20.0%） |
| S · 双圣启梦羊 | 5/10（50.0%） | 3/10（30.0%） | 4/10（40.0%） |

F · 双灾藤进化 的 Wilson 95% 区间，破坏巫师 39.6%–59.4%、侮蔑龙 35.6%–55.3%、财宝皇室 38.6%–58.3%。区间和实测胜率只描述这三套困难 Bot 与本次打法。

第九批最初完整独立百局的 B 分别为 55–45、43–57、56–44。[第九批实测与先后攻](https://github.com/WhiteLeafWhite/sve-exp/blob/main/batches/09-bp20-fixed-300/index.md) · [第十一批对龙起手](https://github.com/WhiteLeafWhite/sve-exp/blob/main/batches/11-dragon-mulligan/index.md)

## 同一牌序的构筑取舍

只看一对中两份牌表已经分别实打的牌序。每格按旧表胜局 → 新表胜局 / 完整对数列出。

| 改动 | 破坏巫师 | 侮蔑龙 | 财宝皇室 |
|---|---:|---:|---:|
| 第二张玛文进化换灾藤 | 41 → 41 / 85 | 36 → 39 / 85 | 37 → 40 / 85 |
| 席翁、莉迪耶尔各一张换两张战骑 | 6 → 4 / 10 | 4 → 2 / 10 | 6 → 2 / 10 |
| 坚定不移的祈祷、莉迪耶尔各一张换两张梦羊 | 3 → 5 / 10 | 4 → 3 / 10 | 3 → 4 / 10 |

换一张进化位的前后拥有相同的主牌与开手。战骑与梦羊的实验在洗牌前匹配被替换主牌的物理位置。F 的对照在不同表之间复用时，各实验分别展示配对，累计只录一次。[双灾藤与双玛文](https://github.com/WhiteLeafWhite/sve-exp/blob/main/batches/12-second-saito/index.md) · [天曜战骑](https://github.com/WhiteLeafWhite/sve-exp/blob/main/batches/15-heavenly-knight/index.md) · [圣启梦羊](https://github.com/WhiteLeafWhite/sve-exp/blob/main/batches/13-sacred-sheep/index.md)

## 用本套牌练三个决定

- **对破坏巫师，先算对方第一攻之前能打几段。** 面对三名 3 攻狂信者，白牙加承担者能保留水银。如果巫师提前攻击，主教在实打中活到忒弥斯清场并翻盘。如果对手先把大红莲、黑章和祈祷者的伤害打完，主教只剩 2，另一份完整重演由巫师获胜。[从主教 T14 接手](http://127.0.0.1:5170/practice/index.html?replay=BP20-agents-cQZr8Z-06.json&at=105&seat=0) · [两席应手与终局](https://github.com/WhiteLeafWhite/sve-exp/blob/main/batches/10-agent-duels/drills/index.md)
- **对侮蔑龙，比较横置守护和直立减伤。** 龙五的 9 PP 局面中，横置席翁后龙能转移自伤目标，拆守护后仍打 6、4、2。直立并留水银把三击压成 3、3、1，主教才有下一回合处理旧场。对手还有其他自伤来源时，继续数第二波。[从主教 T17 接手](http://127.0.0.1:5170/practice/index.html?replay=BP20-agents-zQrwne-05.json&at=146&seat=0) · [两条线路及另外三种回答](https://github.com/WhiteLeafWhite/sve-exp/blob/main/batches/10-agent-duels/drills/index.md)
- **对财宝皇室，先算圣士郎进化能省几费。** 七费先下圣士郎，进化从手里免费放白牙，余 3 PP 用善行的确信，两个回复各打 2，能在交回合前清掉 4/4 欧克托莉斯。先花钱下白牙的线路只有一次回复。两边的下一回合相差一名 4 攻随从。[从主教七费接手](http://127.0.0.1:5170/practice/index.html?replay=BP20-agents-t7B32v-05.json&at=121&seat=0) · [五种次序的实际结果](https://github.com/WhiteLeafWhite/sve-exp/blob/main/batches/10-agent-duels/drills/index.md)

两名子 agent 的正式成绩另算，共 18 局。主教对三职业的胜负为破坏巫师 2–4、侮蔑龙 0–6、财宝皇室 1–5。每个三职业循环都冻结主教的共同构筑，主流可在原表上合计微调最多 5 张。分支重练用于校准打法，每份正式牌序仍只计原局。[两席成绩与逐局复盘](https://github.com/WhiteLeafWhite/sve-exp/blob/main/batches/10-agent-duels/index.md) · [实战席打法对原版困难 Bot 的配对](https://github.com/WhiteLeafWhite/sve-exp/blob/main/batches/14-trained-pilot/index.md)

SVE Helper 的 38 份 BP20 主教样本中，白牙与萝蕾娜同表出现 2 份。样本支持把它作为较冷门的轴。难度预设能使用完整信息，真人对冷门卡的陌生程度仍待实战测量。对照沿用这三份历史主流原表，日本现行禁限与其中两份有差异。[公开牌表采样](https://github.com/WhiteLeafWhite/sve-exp/blob/main/batches/08-bp20-hard-150/source-sample.json) · [规则、地区禁限与导入](bp20-practice.md)
