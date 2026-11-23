# 白牙萝蕾娜主教 · 双人实战复盘

## 第一组 · 五局

主教在正式实战取得 1 胜 4 负。对破坏巫师 0 胜 2 负，对侮蔑龙 0 胜 2 负，对财宝皇室 1 胜 0 负。主教先攻 1 胜 2 负，后攻 0 胜 2 负。

### 圣士郎直接放入承担者，可以分配两次 2 伤

进化圣士郎从手里放入加罚的承担者，同样触发入场回复。有可用的 BP18-106 时，承担者还会免费进化并再回 1，圣士郎每次回复各对一名敌方从者打 2。先看敌方有没有必须在自己回合清掉的 3–4 防直立从者，再决定下承担者、耶菈的祈祷或白牙。每次 2 伤分别选目标。第一局对巫师，输入 43 可处理场上唯一 4/4 里榭娜。相同牌序和后续双方策略，放祈祷的一线 T12 以 0／18 落败。放承担者的一线在 T12 尚有 18 血，T21 靠万裁与分身各攻 5，以 5／−3 取胜。[祈祷对照](https://github.com/WhiteLeafWhite/sve-exp/blob/main/batches/10-agent-duels/drills/rune-01-prayer-control.json) · [承担者分支](https://github.com/WhiteLeafWhite/sve-exp/blob/main/batches/10-agent-duels/drills/rune-01-punisher.json)

对龙第二局，我后攻首回合保留手中的承担者。T6 输入 20–22，用 3 PP 出圣士郎，以 EP 普通进化放承担者，两次回复打掉直立 3/3 团结者，耶菈仍可打脸 2。T8 输入 35 再进化第二张圣士郎，此时第一张承担者已经用过，场上还有清纯祈祷者·耶菈。我改放耶菈的祈祷，三体打 8，下一回合两名圣士郎便借耶菈的回血清第二张团结者。龙族随后清了四名从者，T15 新进场的侮蔑的使徒攻击 7 收尾。[龙族第二局，T6–T9](https://github.com/WhiteLeafWhite/sve-exp/blob/main/batches/10-agent-duels/zQrwne/games/02.md)

### 回复伤害和攻击要分给不同的站位

对龙第一局，T9 输入 44 时，在场的坚定不移的祈祷、手中圣士郎和耶菈的祈祷合计正好用 5 PP。圣士郎普通进化，把耶菈的祈祷放进场，以最后 1 PP 起动坚定祈祷。回复触发打直立 4/2 崇拜者，祈祷把圣士郎养到 5/5，再攻击横置 3/1 烈绝的显现·嘉鲁蜜儿，留下 5/2。此时若把 2 伤交给横置目标，进化从者碰不到另一名直立的 4 攻。[龙族第一局，T9](https://github.com/WhiteLeafWhite/sve-exp/blob/main/batches/10-agent-duels/zQrwne/games/01.md)

### 交完费用前，算下一次回复、减费与攻击窗口

- 巫师第二局 T6 输入 36，坚定祈祷展示的四张都置底。此时 0 PP，手中两个灾藤各自都能零费打出其中一个。继续检查合法出牌，才会看见本回合尚未使用的减 2。[巫师第二局](https://github.com/WhiteLeafWhite/sve-exp/blob/main/batches/10-agent-duels/cQZr8Z/notes/02-bishop.md)
- 巫师第一局 T9 输入 64，灾藤回收炎术后剩 2 PP。歪曲的进步弃承担者，清直立 4/4，灾藤攻击一名横置里榭娜，零费炎术再打另一名。分支 T10 比原局多 4 血，T14 仍落败。若要改变最后胜负，回到更早的输入 43 比较立即清 4/4 与铺祈祷。[歪曲分支](https://github.com/WhiteLeafWhite/sve-exp/blob/main/batches/10-agent-duels/drills/rune-01-warped-progress.json)
- 龙族第一局 T19 输入 152，免费灾藤后留 1 PP，在第一次敌方攻击时打水银的断绝。照原攻击顺序算会剩 4，重演中龙改用其他从者交换席翁，并启用进化侮蔑绝杰。减伤后的 3＋2＋2＋2＋2 仍有 11，主教从 10 血落败。预估减伤时，还要算席翁离场后对方换一种攻击、直伤顺序能造成多少。[水银分支](https://github.com/WhiteLeafWhite/sve-exp/blob/main/batches/10-agent-duels/drills/dragon-01-quicksilver.json)
- 皇室第一局 T7，公开三面海贼旗。我用天冥与白牙两次 2 伤移除炮手。对方 T8 下芭芭萝丝和第二名炮手，五旗直伤 5、炮手直伤 4、斥候攻击 7、副船长攻击 3，合计 19。主教剩 1 时，五费忒弥斯清四体，白牙继续回复。T11 白牙从牌库召莉迪耶尔，回 4 并检索承担者。算炮手与旗的伤害时，要把能继续加旗和使旗减费的芭芭萝丝放进可能线路。[皇室第一局](https://github.com/WhiteLeafWhite/sve-exp/blob/main/batches/10-agent-duels/t7B32v/games/01.md)

第一组结束后，主教将下一完整三职业循环的候选改为 1 张进化玛文、2 张进化灾藤，主牌沿用 40 张。后续记录第二张灾藤有没有进化、回收了哪张炎术，以及何时会想要第二张玛文。[构筑记录与候选牌表](https://github.com/WhiteLeafWhite/sve-exp/blob/main/batches/10-agent-duels/construction-bishop.md)
