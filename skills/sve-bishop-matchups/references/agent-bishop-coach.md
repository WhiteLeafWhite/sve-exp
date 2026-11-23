# 白牙萝蕾娜主教 · 双人实战复盘

## 第一组 · 五局

主教在正式实战取得 1 胜 4 负。对破坏巫师 0 胜 2 负，对侮蔑龙 0 胜 2 负，对财宝皇室 1 胜 0 负。主教先攻 1 胜 2 负，后攻 0 胜 2 负。

### 圣士郎直接放入承担者，可以分配两次 2 伤

进化圣士郎从手里放入加罚的承担者，同样触发入场回复。有可用的 BP18-106 时，承担者还会免费进化并再回 1，圣士郎每次回复各对一名敌方从者打 2。先看敌方有没有必须在自己回合清掉的 3–4 防直立从者，再决定下承担者、耶菈的祈祷或白牙。每次 2 伤分别选目标。第一局对巫师，输入 43 可处理场上唯一 4/4 里榭娜。相同牌序和后续双方策略，放祈祷的一线 T12 以 0／18 落败。放承担者的一线在 T12 尚有 18 血，T21 靠万裁与分身各攻 5，以 5／−3 取胜。[祈祷对照](https://github.com/WhiteLeafWhite/sve-exp/blob/main/batches/10-agent-duels/drills/rune-01-prayer-control.json) · [承担者分支](https://github.com/WhiteLeafWhite/sve-exp/blob/main/batches/10-agent-duels/drills/rune-01-punisher.json)

对龙第二局，我后攻首回合保留手中的承担者。T6 输入 20–22，用 3 PP 出圣士郎，以 EP 普通进化放承担者，两次回复打掉直立 3/3 团结者，耶菈仍可打脸 2。T8 输入 35 再进化第二张圣士郎，此时第一张承担者已经用过，场上还有清纯祈祷者·耶菈。我改放耶菈的祈祷，三体打 8，下一回合两名圣士郎便借耶菈的回血清第二张团结者。实战的龙席亲选连锁清掉四名从者，T15 新进场的侮蔑的使徒攻击 7 收尾。从输入 35 起全交双方原策略的重演呈现另一种应手，祈祷线的两名圣士郎活到 T10 各攻 6，主教 26／0 胜。换白牙能把击杀团结者提前到自己回合末，主教仍在 T17 以 −1／8 负。仅将龙换成首组复盘后的策略，祈祷线 T17 主教 −1／10 负，白牙线 T25 主教 6／17 以龙卡尽取胜。后者在 T23 还剩两张时，龙之启示和狂信者依次取尽牌库。评估护符要连同龙族自伤、解场和抽牌的具体路线。[龙族第二局，T6–T9](https://github.com/WhiteLeafWhite/sve-exp/blob/main/batches/10-agent-duels/zQrwne/games/02.md) · [白牙重演](https://github.com/WhiteLeafWhite/sve-exp/blob/main/batches/10-agent-duels/drills/dragon-02-whitefang.json) · [祈祷重演](https://github.com/WhiteLeafWhite/sve-exp/blob/main/batches/10-agent-duels/drills/dragon-02-prayer.json) · [更新龙策略的白牙](https://github.com/WhiteLeafWhite/sve-exp/blob/main/batches/10-agent-duels/drills/dragon-02-whitefang-trained.json) · [更新龙策略的祈祷](https://github.com/WhiteLeafWhite/sve-exp/blob/main/batches/10-agent-duels/drills/dragon-02-prayer-trained.json)

### 回复伤害和攻击要分给不同的站位

对龙第一局，T9 输入 44 时，在场的坚定不移的祈祷、手中圣士郎和耶菈的祈祷合计正好用 5 PP。圣士郎普通进化，把耶菈的祈祷放进场，以最后 1 PP 起动坚定祈祷。回复触发打直立 4/2 崇拜者，祈祷把圣士郎养到 5/5，再攻击横置 3/1 烈绝的显现·嘉鲁蜜儿，留下 5/2。此时若把 2 伤交给横置目标，进化从者碰不到另一名直立的 4 攻。[龙族第一局，T9](https://github.com/WhiteLeafWhite/sve-exp/blob/main/batches/10-agent-duels/zQrwne/games/01.md)

### 交完费用前，算下一次回复、减费与攻击窗口

- 巫师第二局 T6 输入 36，坚定祈祷展示的四张都置底。此时 0 PP，手中两个灾藤各自都能零费打出其中一个。继续检查合法出牌，才会看见本回合尚未使用的减 2。[巫师第二局](https://github.com/WhiteLeafWhite/sve-exp/blob/main/batches/10-agent-duels/cQZr8Z/notes/02-bishop.md)
- 巫师第一局 T9 输入 64，灾藤回收炎术后剩 2 PP。歪曲的进步弃承担者，清直立 4/4，灾藤攻击一名横置里榭娜，零费炎术再打另一名。分支 T10 比原局多 4 血，T14 仍落败。若要改变最后胜负，回到更早的输入 43 比较立即清 4/4 与铺祈祷。[歪曲分支](https://github.com/WhiteLeafWhite/sve-exp/blob/main/batches/10-agent-duels/drills/rune-01-warped-progress.json)
- 龙族第一局 T19 输入 152，免费灾藤后留 1 PP，在第一次敌方攻击时打水银的断绝。照原攻击顺序算会剩 4，重演中龙改用其他从者交换席翁，并启用进化侮蔑绝杰。减伤后的 3＋2＋2＋2＋2 仍有 11，主教从 10 血落败。预估减伤时，还要算席翁离场后对方换一种攻击、直伤顺序能造成多少。[水银分支](https://github.com/WhiteLeafWhite/sve-exp/blob/main/batches/10-agent-duels/drills/dragon-01-quicksilver.json)
- 皇室第一局 T7，公开三面海贼旗。我用天冥与白牙两次 2 伤移除炮手。对方 T8 下芭芭萝丝和第二名炮手，五旗直伤 5、炮手直伤 4、斥候攻击 7、副船长攻击 3，合计 19。主教剩 1 时，五费忒弥斯清四体，白牙继续回复。T11 白牙从牌库召莉迪耶尔，回 4 并检索承担者。算炮手与旗的伤害时，要把能继续加旗和使旗减费的芭芭萝丝放进可能线路。[皇室第一局](https://github.com/WhiteLeafWhite/sve-exp/blob/main/batches/10-agent-duels/t7B32v/games/01.md)

第一组结束后，主教将下一完整三职业循环的候选改为 1 张进化玛文、2 张进化灾藤，主牌沿用 40 张。后续记录第二张灾藤有没有进化、回收了哪张炎术，以及何时会想要第二张玛文。[构筑记录与候选牌表](https://github.com/WhiteLeafWhite/sve-exp/blob/main/batches/10-agent-duels/construction-bishop.md)

## 第二组 · 第六至十局

本组主教 2 胜 3 负。第六局用原表打皇室，随后四局共用灾藤进化 2、玛文进化 1 的候选。两场胜局均来自巫师对局。

### 先确认坚定祈祷能拿哪两张，再决定零费牌何时出

巫师第三局 T7，进化圣士郎直接把坚定不移的祈祷放上场。它的入场仍给下一张透京减 2。免费灾藤检索都市，原场上的都市把受伤的圣士郎从 4/2 提到 5/3。回复触发与炎术合计打 4，清直立的破坏的随从。圣士郎再击破横置 2/3 崇拜者并存活。将这道题停在输入 28，比较先下四费回复随从时还剩几费。[巫师第三局](https://github.com/WhiteLeafWhite/sve-exp/blob/main/batches/10-agent-duels/cQZr8Z/notes/03-bishop.md)

皇室第三局 T5，坚定祈祷展示了圣士郎、承担者和都市。第一次检索拿承担者，第二次检索拿圣士郎。我在输入 27 没有立刻打出已经减为零费的承担者，T7 才由圣士郎将它放入场。在输入 46、47 连续向直立 3/3 欧克托莉斯各打 2，然后用新进化的 2/2 承担者与横置 3/1 斥候交换，保留完整的 4/4 圣士郎。若反用圣士郎交换，它会剩 1 防，皇室公开 EX 的黄金短剑能打 2。[皇室第三局](https://github.com/WhiteLeafWhite/sve-exp/blob/main/batches/10-agent-duels/t7B32v/notes/03-bishop.md)

### 对第二张灾藤分三步记账

记录第二个进化位有没有实际消耗、是否回收了墓地炎术、该炎术有没有再打并解掉目标。另记进化身体打了什么或吸收了哪些去除。巫师第三局 T15 输入 120 在忒弥斯清场以后超进化第二名灾藤，炎术进 EX，但此后没有再打。两张破坏的隐者在 T16 先后选择这名灾藤，T17 天冥通过两次回复将它们分别处理。T27 胜于 11 攻天冥。[完整战报](https://github.com/WhiteLeafWhite/sve-exp/blob/main/batches/10-agent-duels/cQZr8Z/games/03.md)

皇室第二局 T8，基础玛文面对三体就能取得 0 费绝望的奔流。我消灭提供财宝减费的欧克托莉斯并横置玛文，下一个对手回合先回 2，守护接住两次攻击。基础玛文和 BP15-095 进化位分开统计。[皇室第二局](https://github.com/WhiteLeafWhite/sve-exp/blob/main/batches/10-agent-duels/t7B32v/notes/02-bishop.md)

巫师第四局的三费回合出现了整条线路。敌方三名从者均已横置，防御分别 2、2、3。我方 13 血，手中有第二名灾藤与炎术，还有 EP。先下灾藤再付 1 PP 炎术清阿克西雅，输入 39 用 EP 进化第二名灾藤，40 选择回收。用减为零费的同一张炎术清隐者，最后用进化灾藤交换 3/3 里榭娜。两次施放分别给主战者打 1。少一张灾藤进化或少一点 EP，都要重新算哪两名能在这个回合处理。[巫师第四局](https://github.com/WhiteLeafWhite/sve-exp/blob/main/batches/10-agent-duels/cQZr8Z/notes/04-bishop.md)

候选也可能失去进化玛文的机会。皇室第三局 T13 第一张已经超进化，T21 第二个本体确实上场。当时我先出萝蕾娜回 4，再以她的进化、战斗和玛文送的奔流清了三体，保住自己的赐予者打 3。比较有第二张玛文进化的路线时，要计入它也会扫掉自己的其他从者。两副牌从开局还原到同一局面后，萝蕾娜线均以 10／21 结束 T21。原表花 4＋3 费打第二张进化玛文，再用余下 3 费铺祈祷，以 6／24 交棒。原表萝蕾娜、玛文两条都在 T28 负，候选的萝蕾娜线 T26 负。[皇室第三局，T21](https://github.com/WhiteLeafWhite/sve-exp/blob/main/batches/10-agent-duels/t7B32v/games/03.md) · [原表玛文分支](https://github.com/WhiteLeafWhite/sve-exp/blob/main/batches/10-agent-duels/drills/royal-03-marwynn-B.json)

## 第三组 · 第十一至十五局

主教本组五局全负，累计 3 胜 12 负。巫师 2 胜 3 负、龙族 0 胜 5 负、皇室 1 胜 4 负。五局均使用相同的主牌 40、灾藤进化 2、玛文进化 1。

### 守护与能力伤害要分开计算

龙族第四局 T8，萝蕾娜的进化伤害能直接打倒直立 5/2 烈绝侮蔑·嘉鲁蜜儿。攻击时，敌方 2/1 侮蔑的祈祷者已经横置，3/1 团结者不在合法攻击目标中。输入 43 若改下天冥，自己的零费起动和白牙在回合末的回复可各打 2，能绕开守护清两体，但少回 3。T10 忒弥斯清场加白牙把主教带到 10。对面重新下侮蔑绝杰并进化，连续 1＋3＋3＋1＋3 的能力伤害在空场起步也够 11。[龙族第四局](https://github.com/WhiteLeafWhite/sve-exp/blob/main/batches/10-agent-duels/zQrwne/notes/04-bishop.md)

皇室第四局 T6，直立 3/3 欧克托莉斯与横置 4/3 海潮炮手在同一场。输入 29–36，圣士郎进化从手中放承担者，前后两次回复打欧克托莉斯共 4，再用 4/4 圣士郎交换炮手，己方留下 2/2 承担者。同是双解，若炮手只有 1–2 防且进化后的承担者可攻，就先看承担者能否替代圣士郎交换。[皇室第四局](https://github.com/WhiteLeafWhite/sve-exp/blob/main/batches/10-agent-duels/t7B32v/notes/04-bishop.md)

### 交换去除目标后，重新走一次对方回合

- 皇室第四局 T14 输入 115，两名敌人都能帮皇室清掉耶菈守护。保留进化欧克托莉斯，它能偷主教墓场天冥。天冥起动打脸 1、借回复清守护，再接旗 1、欧克托莉斯 4、副船长 3。保留偷来的圣士郎，公开 EX 的黄金之杯就能回复并触发 2 伤清守护，随后旗 1、进化副船长 5、圣士郎 3。两种顺序都恰好打 9。[歪曲指向圣士郎](https://github.com/WhiteLeafWhite/sve-exp/blob/main/batches/10-agent-duels/drills/royal-04-seishiro.json) · [歪曲指向欧克托莉斯](https://github.com/WhiteLeafWhite/sve-exp/blob/main/batches/10-agent-duels/drills/royal-04-octrice.json)
- 巫师第五局 T15 输入 123，先打都市找到天冥，以承担者、天冥自己的起动、都市起动触发三次 2 伤，能精确清横置 7/6 纱妃拉，并剩 1 PP。下一回合巫师用大红莲之术对主战者打 3 并清场，另外三名随从攻 3、2、2，仍然打完主教的 10 血。另一重演中，破坏的荒野翻到狂信者。狂信者与白之章·黑之章各打 2 并清两名主教随从，再接 3＋2＋2 的攻击，总计 11。进入这个残局前，T9 输入 53 也可复练五费萝蕾娜回 4、直伤打直立阿克西雅、攻击横置祈祷者的分工。[荒野分支](https://github.com/WhiteLeafWhite/sve-exp/blob/main/batches/10-agent-duels/drills/rune-05-wasteland.json) · [天冥三次回复](https://github.com/WhiteLeafWhite/sve-exp/blob/main/batches/10-agent-duels/drills/rune-05-tenmei.json) · [巫师第五局笔记](https://github.com/WhiteLeafWhite/sve-exp/blob/main/batches/10-agent-duels/cQZr8Z/notes/05-bishop.md)

### 水银的减伤只持续到打出它的那个回合结束

皇室第五局 T13 输入 123，5 血时出席翁剩 1 PP。自己的主阶段打水银能抽都市，到皇室 T14 时减伤已经结束。对方先用残光清席翁，再用甘露打 2、吉鲁涅莉婕攻 3 刚好致命。练习在 123 留费，逐步检查何时第一次出现 Quick。皇室攻击前已经造成的能力伤害要先扣掉。[皇室第五局](https://github.com/WhiteLeafWhite/sve-exp/blob/main/batches/10-agent-duels/t7B32v/notes/05-bishop.md) 这两条都已重演。席翁横置时，甘露先实扣 1，再由两次战斗清守护，水银在输入 137 打出后，剩余两击仍是 3、1。席翁直立时被残光先除，甘露实扣 2，输入 132 打出的水银只将欧克托莉斯的 4 降到 3，恰好致命。下一步从输入 121 的 7 PP 重算整回合。[横置分支](https://github.com/WhiteLeafWhite/sve-exp/blob/main/batches/10-agent-duels/drills/royal-05-quicksilver.json) · [直立分支](https://github.com/WhiteLeafWhite/sve-exp/blob/main/batches/10-agent-duels/drills/royal-05-upright.json) 七费入口的重演找到多活一个回合的顺序。输入 121 先下圣士郎并超进化，124 直接放白牙，留 3 PP 打善行的确信。圣士郎攻击被偷走的耶菈，确信和回合末的白牙各触发 2 伤清另一名 4/4，T14 主教剩 2，T16 才以 −1／19 负。先付 3 费下白牙再下圣士郎，只够触发一次 2 伤，T14 仍被甘露 2、欧克托莉斯 4 打完 6 血。[先圣士郎](https://github.com/WhiteLeafWhite/sve-exp/blob/main/batches/10-agent-duels/drills/royal-05-seishiro.json) · [先白牙](https://github.com/WhiteLeafWhite/sve-exp/blob/main/batches/10-agent-duels/drills/royal-05-whitefang.json)

龙族第五局 T17 输入 146，另一种费用问题是 9 PP 先下祈祷再下席翁，水银在 EX 却付不起。重演改为先席翁、保留 3 PP，输入 149 横置守护，166 打水银。若龙继续原来的 5＋5＋1，只会实扣 4＋4＋0，主教能剩 3。龙实际改使侮蔑之国配嘉鲁蜜儿，再用苍炎及第三名嘉鲁蜜儿处理使徒和席翁，席翁离场后实扣 6＋4＋2，主教从 11 血落败。[龙族第五局笔记](https://github.com/WhiteLeafWhite/sve-exp/blob/main/batches/10-agent-duels/zQrwne/notes/05-bishop.md) · [留水银的重演](https://github.com/WhiteLeafWhite/sve-exp/blob/main/batches/10-agent-duels/drills/dragon-05-quicksilver.json) 把席翁留在直立位置，T18 输入 153 再打水银，席翁的持续减伤与水银的回合效果叠加，使徒、嘉鲁蜜儿、团结者的三次攻击实扣 3＋3＋1。主教从 11 留到 4，T19 天冥与承担者能再解场并回至 8，席翁也打脸 3。T20 新一轮两次 5 攻才落败，终局 −2／13。练习这个位置时，入场和回合末的守护横置都要逐次选择。[直立席翁的分支](https://github.com/WhiteLeafWhite/sve-exp/blob/main/batches/10-agent-duels/drills/dragon-05-upright.json)

皇室第五局也能练前期费用安排。T4 皇室回合末用炎术把 3/3 副船长打到 1 防，T5 留满 3 PP 下坚定祈祷，免费下灾藤并留住承担者。T7 两次 2 伤打欧克托莉斯，2/2 承担者交换 3/1 副船长。T9 第二名灾藤本体才消耗第一张灾藤进化，以零费重用此前炎术。[皇室第五局战报](https://github.com/WhiteLeafWhite/sve-exp/blob/main/batches/10-agent-duels/t7B32v/games/05.md)

## 第四组已结束的四局 · 第十六至十九局

主教后攻负巫师、龙族、皇室，先攻胜巫师。累计 4 胜 15 负，按职业为巫师 3 胜 4 负、龙族 0 胜 6 负、皇室 1 胜 5 负。周额度到 15% 时，第二十局尚未结束。以下正式结果均截至第十九局，相关重演单独列出。

### 先回复、把水银留给巫师宣告攻击

巫师第六局 T14 输入 105，主教 12 血，手有白牙、承担者，水银在 EX，巫师场上已有三名 3 攻狂信者。实战先在自己的主阶段用水银，抽到耶菈，靠祈祷在巫师回合开头回到 15。对方打 3＋1＋2，再由三名狂信者各攻 3，正好致命。重演 105 先下白牙、106 下承担者，107 保留 3 PP 结束，回到 14。T15 大红莲之术先打 3，输入 111 在第一次攻击时用水银，三击各 2，主教余 5。T16 自然抽到忒弥斯，清四体并留下白牙。T24 圣士郎 8、萝蕾娜 6、天冥 6，主教以 9／−5 获胜。若在 T14 多用炎术并付费进化，先交换一个狂信者，T15 也余 5，却在 T19 以 0／35 负。记住主教使用水银前巫师有多少能力伤害可以先打。对手改变顺序时，要从那个窗口的实际血量重算。[正式战报](https://github.com/WhiteLeafWhite/sve-exp/blob/main/batches/10-agent-duels/cQZr8Z/games/06.md) · [保留水银的胜局](https://github.com/WhiteLeafWhite/sve-exp/blob/main/batches/10-agent-duels/drills/rune-06-hold.json) · [先交换狂信者](https://github.com/WhiteLeafWhite/sve-exp/blob/main/batches/10-agent-duels/drills/rune-06-trade.json) 巫师席在同一发牌把大红莲 3、黑之章 1、祈祷者 2 全部提前后，水银仍把三次攻击各减到 2，主教只剩 2。T16 忒弥斯同样清掉四体，白牙回到 3，T19 以 0／35 负。复算时分别用 2 血和 5 血接自己的清场回合。[巫师先打直伤的重演](https://github.com/WhiteLeafWhite/sve-exp/blob/main/batches/10-agent-duels/drills/rune-06-burn-first.json)

巫七在 T19 提供了自己主阶段打水银的正例。主教 9 血，水银抽到玛文后仍能用 4＋3 PP 打出并进化，当回合清三体、将入场取的奔流留到 T21 消灭进化阿克西雅。T25 两次攻击与两次天冥起动打 20，T27 三次攻击打 16 收尾。评估水银时，把抽到某张牌之后仍能支付的部署费用，与对方首个攻击窗口之前能打的伤害一起算。[巫师第七局](https://github.com/WhiteLeafWhite/sve-exp/blob/main/batches/10-agent-duels/cQZr8Z/notes/07-bishop.md)

独立困难巫师第 88 牌序 T6 输入 18，自己的 3 PP 已经花在圣士郎上，手中同时有坚定不移的祈祷和承担者，还有至少两个场位。圣士郎先放三费坚定祈祷，能找到都市，减费再使承担者以 0 PP 从手牌打出。圣士郎攻击横置里榭娜，承担者入场和免费进化两次回复，另一名里榭娜被两次 2 伤清掉。这样 T8 能用都市找到歪曲，并且还有费用将破坏的随从解掉，T20 以 16／−2 胜。若直接放承担者，同样能清场、回复 2，但三费祈祷留到 T8 支付，歪曲来不及用，T13 以 −1／28 负。只剩一个场位时，仍要给承担者预留落点。[先放坚定祈祷](https://github.com/WhiteLeafWhite/sve-exp/blob/main/batches/12-second-saito/candidate/cQZr8Z/games/88.md) · [直接放承担者](https://github.com/WhiteLeafWhite/sve-exp/blob/main/batches/14-trained-pilot/cQZr8Z/games/18.md)

巫师在 T14 改为献掉崇拜者、保留暗黑创造物的分支中，T23 对面正好 23 血。先用旧天冥起动打 3，回复伤害清掉崇拜者。旧圣士郎攻 9，出新天冥以后旧天冥攻 7，新天冥再起动打 4，总共 23。第一名天冥的攻击可以排在第二名进场以后，第二名当回合也能发动起动能力。[巫七保留暗黑创造物的重演](https://github.com/WhiteLeafWhite/sve-exp/blob/main/batches/10-agent-duels/drills/rune-07-keep-artifact.json)

### 皇室后攻的二费随从、四费回复与最后一费

皇六输入 1 还有更早的取舍。原手是萝蕾娜、白牙、灾藤、万裁，重抽后前两回合都空过。配对保留时，T4 灾藤先找坚定祈祷并进化回 1，T6 赐予者回复 2，T8 萝蕾娜与旧赐予者一起处理皇室三体。T18 分身攻 5、圣士郎攻 4，终局 8／−3。对皇室后攻，须把灾藤二费可下、白牙等三费跟进、萝蕾娜四费可用 EP 回复兼解场连起来评估。一张六费终结牌不必单独触发整手重抽。[保留原手的重演](https://github.com/WhiteLeafWhite/sve-exp/blob/main/batches/10-agent-duels/drills/royal-06-keep.json)

另外四个预先选定的困难皇室牌序，后攻初手均有灾藤和萝蕾娜。保留 4 胜，整手重抽 3 胜。F 皇 14 另两张为都市、莉迪耶尔，保留时都市接灾藤并进化，T24 以 19／0 胜。重抽后到 T10 才第一次进化，T13 以 0／20 负。B 皇 90 两边都胜，重抽还早 10 个全局回合收尾。若已有一费都市检索或可靠三费跟进，倾向保留后攻二费灾藤、四费萝蕾娜。仍须结合整手多大的行动空间来判断。

皇室第六局 T10，输入 57 的坚定祈祷先检索承担者，第二次再取圣士郎。减 2 后花 1 PP 打圣士郎，用最后一个后攻 EP 进化并放承担者。输入 66、67 两次 2 伤清直立 6/4 芭芭萝丝，最后 1 PP 在 68 起动同一张坚定祈祷，第三次 2 伤清 2/2 副船长。手上的炎术继续保留，自己从 17 回到 20，场上还有 4/4 和 2/2。若前一费先花来进化，或者先拿圣士郎而漏掉承担者，费用和回复次数都要重新核对。[皇室第六局](https://github.com/WhiteLeafWhite/sve-exp/blob/main/batches/10-agent-duels/t7B32v/notes/06-bishop.md)

皇六 T18 输入 158，分身已经受过 2 伤，场上实际 5/3。它可以攻袭直立 2/3 炮手，击倒后留 1 防。三种实测的落点中，打脸或交换横置芭芭萝丝都会在 T19 死于海贼旗与炮手。清炮手后，皇室换用偷来的天冥、带黄金之靴的欧克托莉斯，总伤 7，主教还剩 3，T20 能再行动一次，T21 以 0／13 负。[分身清炮手](https://github.com/WhiteLeafWhite/sve-exp/blob/main/batches/10-agent-duels/drills/royal-06-cannon.json)

### 龙族对局先算攻击次数与能力伤害

龙族第六局 T8 输入 42，圣士郎已经进化并从手中放了耶菈的祈祷。此时都市给承担者，祈祷的全体加成后两名随从为 4/4、5/5，都能受一次 3 伤。若给圣士郎，就是 3/3、6/6，当前能打脸的承担者会少 1 攻，受到 3 伤也会离场。实战承担者先打 4，下一次祈祷加强后又打 5。后面龙仍以五次能力 3 和一次攻击 3 收尾。[龙族第六局](https://github.com/WhiteLeafWhite/sve-exp/blob/main/batches/10-agent-duels/zQrwne/notes/06-bishop.md)

龙六 T16 输入 141 的实际手牌是双耶菈、祈祷与都市。都市只翻到炎术，水银在 EX。两名耶菈在回合末横置，保留两张 Quick。T17 龙先自伤，使原本已有 2 防的侮蔑的祈祷者继续受伤。团结者对守护宣攻时，157 用水银，158 用炎术，159 选祈祷者。主教 T17 余 17，T19 余 6，T23 以 0／11 负。若在 T16 提前让炎术除崇拜者或团结者，只保留水银，两路都在 T17 余 12，T19 落败。在自己的回合直接用炎术除 3/2 祈祷者，会改变下一回合哪些龙族从者能与守护交换。[保留两张 Quick](https://github.com/WhiteLeafWhite/sve-exp/blob/main/batches/10-agent-duels/drills/dragon-06-reserve.json)

同一发牌的另一线在输入 145 先除 3/2 祈祷者，151 双耶菈横置，157 第一次攻击出水银。1 防崇拜者与 1 防团结者分别撞守护同归于尽，嘉鲁蜜儿三次打 2，T17 剩 14。T18 坚定、灾藤、天冥接上回复清场，T26 超进化萝蕾娜同回合处理两名嘉鲁蜜儿，T33 龙牌库抽空，主教 8／12 胜。留 17 的一线在 T23 负，选目标时除了回合末血量，还要逐个检查攻过守护后的存活从者。[主教先除祈祷者的胜线](https://github.com/WhiteLeafWhite/sve-exp/blob/main/batches/10-agent-duels/drills/dragon-06-priest.json)

龙席也试出了反制。先 2 费进化侮蔑绝杰，用苍炎和炎爪清掉两面守护，配合两个侮蔑之国、纹章与祈祷者等效果，在首次攻击前六次自伤打 18。主教从 20 只剩 2，首次攻击 3 经水银减为 2，T17 仍以 0／11 负。要区分龙先交换守护和先靠能力解守护两种行动顺序，直到对方宣告攻击，水银都不能响应此前结算的能力。[龙先打能力伤害](https://github.com/WhiteLeafWhite/sve-exp/blob/main/batches/10-agent-duels/drills/dragon-06-burn-first.json)

困难龙族第 85 牌序给出了保留攻击手的例外。T15 输入 117 主教 25 血，有两座耶菈的祈祷、直立 5/5 灾藤、6/6 圣士郎。对方是直立 3/1 团结者与横置 4/3 祈祷者。第二段回复伤害给团结者后，灾藤再与祈祷者战斗会剩 1 防，龙以烈绝的灭牙对所有随从各打 1，灾藤随即离场。这一线清两体却输了。把第二段 2 伤给祈祷者，5/5 灾藤保留。龙 T16 打 4、1、3，主教余 17。T17 炎术 1、圣士郎 10、确信 2、灾藤 7，正好 20。遇到高血、双祈祷和两名直立大随从，先算保住两个下回合攻击手的打点。当前主教策略已将这种情况交回基础搜索。条件分支通过了定点检查，尚待下一次完整复盘冻结和新牌序复核。[先清两体的对照](https://github.com/WhiteLeafWhite/sve-exp/blob/main/batches/14-trained-pilot/zQrwne/games/15.md) · [留下灾藤的对照](https://github.com/WhiteLeafWhite/sve-exp/blob/main/batches/12-second-saito/candidate/zQrwne/games/85.md)
