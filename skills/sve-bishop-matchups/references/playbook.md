# 透京耶菈主教的三对局打法

这套主教用回复触发圣士郎与天冥来解场，让上一回合留下的随从能继续攻击主战者。席翁和玛文为这些攻击者争取下一个回合。每次决定交换、弃牌或清场前，先算这一回合自己能造成多少伤害。[可导入的 40＋10 牌表](bishop-final.json) · [三组实战成绩](results.md) · [对手原表与练习条件](method.md)

## 起手与前三个自己的回合

- 起手同时有 BP18-097 圣士郎和 BP18-104 坚定不移的祈祷、BP18-105 承担者或 BP02-095 耶菈的祈祷时，保留这条可兑现的连动。后攻自己的第 3 回合能借 EP 进化圣士郎，把手里的组件免费放入场。祈祷可继续检索，本回合下一张透京牌减 2；承担者在圣士郎在场且有可用进化体时可回复两次。[首轮龙族第 2 局](https://github.com/WhiteLeafWhite/sve-exp/blob/main/batches/01-zQrwne/games/02.md)
- 单张 BP18-120 新约都市或 BP18-117 灾藤能看牌库顶三张。优先找下一回合能打出的牌。只有一个检索点、另三张都要 4 费以上时，倾向整手重抽。两个前期动作，或检索点加圣士郎，值得保留。起手不保证命中，多给没有后续的手牌一次重抽机会。[巫师第 9 局](https://github.com/WhiteLeafWhite/sve-exp/blob/main/batches/02-cQZr8Z/games/09.md)
- 手牌与场地一起算。祈祷占一个场位，第二个护符进场前，先给赐予者与复活目标、或万裁与分身各留两个位置。赐予者 BP18-101 额外支付 2 PP 才能复活墓场里原费 4 以下的其他透京随从。留有天冥时，优先比较这 2 PP 能增加多少解场、直伤与后续攻击。[巫师第 1 局](https://github.com/WhiteLeafWhite/sve-exp/blob/main/batches/02-cQZr8Z/games/01.md)

## 每回合怎样排顺序

1. 先数有资格打脸的随从，检查横置守护，再数天冥的起动伤害。天冥按己方场上透京随从数打脸，0 PP，每回合每张一次。将能增加计数的新随从或复活先结算。直伤已经足够时立即起动。
2. 只有一个横置守护时，先算廉价解牌打开的攻击路线。首轮龙族第 5 局 T23，对方 9 血，唯一守护剩 1 血，主教有两个能攻击的 5 攻。实战把炎术弃掉，T29 才结束。相同前缀在引擎重演，1 PP 炎术解守护，两个 5 攻都能打脸，当回合结束。对手有可用 Quick 时，另算其合法响应。[原局与逐步记录](https://github.com/WhiteLeafWhite/sve-exp/blob/main/batches/01-zQrwne/games/05.md) · [引擎重演分支](https://github.com/WhiteLeafWhite/sve-exp/blob/main/batches/01-zQrwne/case-05-t23.json)
3. 一次回复让每个在场的圣士郎或天冥各对敌随从打 2。耶菈的祈祷每张、每回合各触发一次。安排交换前先结算这些伤害，留一名能打脸的旧随从常常比多回几点更有价值。对方主阶段开始时，耶菈配祈祷、或未离场的玛文，可以在对方回合再触发祈祷。[皇室第 3 局](https://github.com/WhiteLeafWhite/sve-exp/blob/main/batches/04-t7B32v/games/03.md)
4. 玛文进化会破坏其他所有随从，自己的攻击者也在范围内。能安全完成的攻击先做，再比较清场或单解。席翁 BP14-090 有能力破坏抗性，第 17 局两张席翁都在忒弥斯清场后留场并攻击。席翁让自己和主战者每次受伤减少 1。它给 EX 的水银的断绝 BP14-T07 再减 1 并抽一张，需要预留 1 PP 和合法 Quick 窗口。对面多段小伤时按每段计算。[巫师第 5 局](https://github.com/WhiteLeafWhite/sve-exp/blob/main/batches/02-cQZr8Z/games/05.md) · [巫师第 17 局](https://github.com/WhiteLeafWhite/sve-exp/blob/main/batches/05-cQZr8Z/games/17.md)

## 三种对手怎样改变决策

| 对手 | 交回合前看什么 | 可据此决定的动作 |
|---|---|---|
| 破坏巫师 cQZr8Z | 阿克西雅 BP20-040/041 的超进化按对方场上偶像牌数打主战者。数随从和护符，查对方 SEP。暗黑破坏创造物 BP05-T02 在其主阶段开始时打 2；祈祷者 BP20-048 可横置自身、埋葬另一张偶像打 2。 | 在其超进化前一回合，用回复触发处理偶像随从、降低可见直伤。把可拦的攻击与能力伤害分别算。若两名老随从已经能打死回过血的巫师，优先保住这两条攻击路线。[巫师第 1 局](https://github.com/WhiteLeafWhite/sve-exp/blob/main/batches/02-cQZr8Z/games/01.md) · [巫师第 2 局](https://github.com/WhiteLeafWhite/sve-exp/blob/main/batches/02-cQZr8Z/games/02.md) |
| 侮蔑龙 zQrwne | BP15-057 受己方能力伤害可以翻牌并为 EX 中的绝杰减费。进化 BP05-053 受能力伤害可向主战者打 3。看墓场能重打的低费绝杰、EX 炽火与灭牙、觉醒和场上使徒。 | 能取胜时，用另一名随从交换，把天冥留到起动后再打脸。第 19 局玛文解决祈祷者，天冥起动打 1、借回复解决团结者，本体正好打完余下 11 血。要交回合时，再估新进场绝杰的射程。第 10 局清场后仍从 11 血被打穿。[龙族第 19 局](https://github.com/WhiteLeafWhite/sve-exp/blob/main/batches/06-zQrwne/games/19.md) · [龙族第 10 局](https://github.com/WhiteLeafWhite/sve-exp/blob/main/batches/03-zQrwne/games/10.md) |
| 财宝皇室 t7B32v | 先点己方墓场与余下牌库，再数公开 EX。黄金短剑 BP15-T01 有合法随从目标且我方墓场至少 10 张时，另打主战者 2。海贼旗选中同时具「八狱」「盗贼」的随从会打脸 1，并给目标加攻。 | 芭芭萝丝 BP19-019 在皇室回合为 EX 财宝减 1，BP15-020 每回合可两次让下张财宝减 2。防多段伤害时比较席翁减伤与拆除减费来源。进化篡夺绝杰可以把我方墓场的牌放进皇室 EX。第 16 局被取走的莉迪耶尔打完我方最后 4 血，第 17 局被取走的玛文又给了皇室一张奔流。[皇室第 5 局](https://github.com/WhiteLeafWhite/sve-exp/blob/main/batches/04-t7B32v/games/05.md) · [皇室第 16 局](https://github.com/WhiteLeafWhite/sve-exp/blob/main/batches/07-t7B32v/games/16.md) · [皇室第 17 局](https://github.com/WhiteLeafWhite/sve-exp/blob/main/batches/07-t7B32v/games/17.md) |

日志的 T 是双方合计的回合数，每个小节另标「主教第几回合」。录像包含实战洗牌和完整输入，仅在终局后打开复盘。采用其他地区禁限、卡池或对手换表时，重新核对会影响这些线路的牌。[练习条件](method.md)
