# SVE 主教实战记录

每局都有 SVE NEXT 录像与按回合整理的中文日志。战报中的生命先列主教，后列对手。第八批为日版 BP20 主教对三个固定困难 Bot 各 50 局，每五局有一次构筑与打法复盘。

这台电脑可以直接打开[主教陪练牌桌](http://127.0.0.1:5170/practice/index.html)。默认你执巫师，对面是本仓库训练的白牙萝蕾娜。也可以自己执主教，挑战三个困难对手。在高级设置选「双席实战陪练」，可以直接挑战两个子 agent 在实战里练出的职业打法。启动、换座位、导入与分支重演见[陪练操作](skills/sve-bishop-matchups/references/bp20-practice.md)。

想直接练一个回合，可以从实战中接手。牌桌会停在你需要作决策的那一步，只展示本方可见的牌。[从 T7 执主教](http://127.0.0.1:5170/practice/index.html?replay=BP20-agents-cQZr8Z-01.json&at=43&seat=0) · [从 T2 执破坏巫师](http://127.0.0.1:5170/practice/index.html?replay=BP20-agents-cQZr8Z-01.json&at=8&seat=1) · [从 T9 执侮蔑龙](http://127.0.0.1:5170/practice/index.html?replay=BP20-agents-zQrwne-02.json&at=51&seat=1) · [从 T8 执财宝皇室](http://127.0.0.1:5170/practice/index.html?replay=BP20-agents-t7B32v-01.json&at=37&seat=1)

**第九批**　同一份白牙萝蕾娜透京耶菈对三个原版困难 Bot 各 100 局，先后攻各半。主教对破坏巫师 55–45、侮蔑龙 43–57、财宝皇室 56–44。龙族后攻 25–25，先攻 18–32。三组取较低的一组是 43%，距离本次用来衡量「约五五开」的 45% 参考线还有两胜。[百局分组成绩与全部录像](batches/09-bp20-fixed-300/index.md) · [构筑日志](batches/09-bp20-fixed-300/construction.md) · [共同主教](batches/09-bp20-fixed-300/bishop.json)

两次共同构筑微调各测试了三个职业相同的五个配对种子，另有五局只改变对龙打法。神弓代替两个卡位时对龙 0–5，原表同种子 4–1。信仰的一击的五局对龙为 2–3，原表 4–1。现阶段保留白牙、萝蕾娜各两张的原表作为困难 Bot 基准。[神弓试验](batches/09b-bp20-lyrial/index.md) · [快速消灭试验](batches/09d-bp20-banish/index.md) · [同表打法试验](batches/09c-bp20-dragon-policy/index.md)

**第十批**　两个独立子 agent 各执一方，主教连续对同一轮的三职业，双方只读本方视野。每局列出直接选择、委托范围、实际牌表与两人的赛后复盘。[对局成绩、录像和复盘](batches/10-agent-duels/index.md) · [构筑日志](batches/10-agent-duels/construction.md)

**第十一和十二批**　对龙的独立 100 个牌序中，原打法胜 37 局。先攻采用更严格的留牌标准后胜 33 局，保留原打法。另用三个职业的新牌序比较第二张灾藤与第二张玛文的取舍。每项都有匹配的对照牌序、先后攻记录与逐局录像。[对龙起手](batches/11-dragon-mulligan/index.md) · [三对局进化位](batches/12-second-saito/index.md)

按驾驶职业选择陪练技能。[主教](skills/sve-bishop-matchups/SKILL.md) · [破坏巫师](skills/sve-destruction-rune/SKILL.md) · [侮蔑龙](skills/sve-disdain-dragon/SKILL.md) · [财宝皇室](skills/sve-loot-sword/SKILL.md)

**第十三批**　圣启梦羊在对方主阶段提供一次伤害防止。将两张梦羊放入共同主教，用预先指定的相同牌序与双灾藤原表比较，保留两张牌在洗牌前的物理位置。[构筑与三职业复盘](batches/13-sacred-sheep/index.md) · [原百局的首段伤害](batches/09-bp20-fixed-300/first-damage.md)

**第八批**　[150 局总成绩与录像](batches/08-bp20-hard-150/index.md) · [每五局构筑日志](batches/08-bp20-hard-150/construction.md) · [定稿主教与完整张数](skills/sve-bishop-matchups/references/bp20-deck.md) · [模拟器导入文件](skills/sve-bishop-matchups/references/bp20-150-final.json) · [三对局打法](skills/sve-bishop-matchups/references/bp20-playbook.md) · [陪练技能](skills/sve-bishop-matchups/SKILL.md)

前七批每批十局，对应以下历史资料。

[三组二十局战绩](skills/sve-bishop-matchups/references/results.md) · [最终主教牌表与张数](skills/sve-bishop-matchups/references/deck.md) · [导入牌表](skills/sve-bishop-matchups/references/bishop-final.json) · [三对局打法](skills/sve-bishop-matchups/references/playbook.md) · [可供其他会话使用的 skill](skills/sve-bishop-matchups/SKILL.md)

跨设备使用时，安装完整的 `skills/sve-bishop-matchups` 目录，在新会话中调用 `$sve-bishop-matchups`。每局的 JSON 可在 SVE NEXT 0.4.3 的 Watch replays 中打开。

| 批次 | 对手 | 资料 |
|---|---|---|
| 01 | zQrwne「20五妹」 | [逐局日志与录像](batches/01-zQrwne/games.md) · [逐局复盘](batches/01-zQrwne/review.md) · [打法与卡组](batches/01-zQrwne/matchup.md) |
| 02 | cQZr8Z「20二妹」，第 1–10 局 | [录像、日志和卡组](batches/02-cQZr8Z/index-01.md) · [逐局复盘](batches/02-cQZr8Z/review-01.md) |
| 03 | zQrwne「20五妹」，第 1–10 局 | [录像、日志和卡组](batches/03-zQrwne/index-01.md) · [逐局复盘](batches/03-zQrwne/review-01.md) |
| 04 | t7B32v「20财宝」，第 1–10 局 | [录像、日志和卡组](batches/04-t7B32v/index-01.md) · [逐局复盘](batches/04-t7B32v/review-01.md) |
| 05 | cQZr8Z「20二妹」，第 11–20 局 | [录像、日志和卡组](batches/05-cQZr8Z/index-02.md) · [逐局复盘](batches/05-cQZr8Z/review-02.md) |
| 06 | zQrwne「20五妹」，第 11–20 局 | [录像、日志和卡组](batches/06-zQrwne/index-02.md) · [逐局复盘](batches/06-zQrwne/review-02.md) |
| 07 | t7B32v「20财宝」，第 11–20 局 | [录像、日志和卡组](batches/07-t7B32v/index-02.md) · [逐局复盘](batches/07-t7B32v/review-02.md) |
