# 规则与陪练操作

## 上桌前

- 标准职业牌组使用一张主战者、40–50 张主牌与 0–10 张进化牌。主牌和进化牌各按同名最多三张计算，再核对地区禁限。己方场上及 EX 各限五张。场上的护符也占一个位置，在满场前预留能立即解场或回血的一格。见 CR 4.4、4.8、6.1。[官方综合规则 v1.26.1](https://en.shadowverse-evolve.com/wordpress/wp-content/uploads/2026/10/01120524/SVEE-Comprehensive-Rules_v1.26.1_260916.pdf)
- 双方各 20 体力，抽四张。先攻方先决定是否将整手按任选顺序放回牌库底再抽四张，各有一次机会。先攻第一回合跳过抽牌，起始 0 EP。后攻从 3 EP 起步，双方各 1 SEP。见 CR 6.2、7.2。[官方综合规则](https://en.shadowverse-evolve.com/rules/)
- 主阶段通常每回合有一次进化机会。进化费用可以用 1 EP 抵 1 PP，仍要算清剩余费用。进化／突进使当回合新进场的随从有机会攻击随从，疾驰才允许新进场的随从直接攻击主战者。先检查卡文、合法目标与横置状态。见 CR 8、12。[官方综合规则](https://en.shadowverse-evolve.com/rules/)
- 敌方有横置守护随从时要先攻击合法的横置守护。宣告攻击后、防守方可在伤害结算前的 Quick 时点行动。结束阶段横置守护之后还有 Quick 时点。保留的 PP 要逐项配对到手上或公开 EX 的一张具体 Quick。见 CR 7.4.5、8.4.7、12.8.2。[官方综合规则](https://en.shadowverse-evolve.com/rules/)

## 在模拟器中练习

本机的主教陪练牌桌默认让你执破坏巫师，另一侧是本次推荐的白牙萝蕾娜和「BP20 主教陪练」。想自己执主教，在己方选择名称含 `BP20-Haven-recommended-` 的牌表与「人类」，在对面选择一个 `svehelper/` 牌表和「Bot-困难」。历史百局的 B 表仍可用 `BP20-Haven-final.json` 重练。三份固定主流牌表使用标准构筑规则，区域禁限列表选「无」。[打开陪练](http://127.0.0.1:5170/practice/index.html) · [当前共同牌表](bp20-current.md) · [原版桌面入口](http://127.0.0.1:5170/)

陪练按双方公开主战者的职业识别这三种对局，使用百局验证的 r3。对局中只按合法选择行动。按钮、卡图、Quick 与录像沿用 NEXT 的图形桌面。在另一台电脑部署时，从已装依赖的 NEXT 0.4.3 源码目录运行 `node <技能目录>/scripts/build-desktop.mjs <PC版目录>`，然后从该 PC 版的 `start.bat` 启动。[陪练桌构建脚本](../scripts/build-desktop.mjs)

想练双席实战里积累的新打法，在「对战」的高级设置里把对面设为「双席实战陪练」，自己选「人类」。自己执主教时，替对面选巫师、龙族或皇室的牌表。自己执主流时，替对面选主教。两个席位的策略都只读自己能看到的信息，复用实战里选出的出牌顺序。刚完成的五局组会更新本机陪练，重新加载牌桌即可使用。已发布的两份策略指纹可以在[本机陪练版本](http://127.0.0.1:5170/practice/coaches.json)核对。

在其他电脑同时装上双席策略时，构建命令加 `--duels <sve-exp仓库>/batches/10-agent-duels`。原生录像可直接在 Watch replays 复看。[两个座位的策略及赛后手记](https://github.com/WhiteLeafWhite/sve-exp/tree/main/batches/10-agent-duels)

把录像装到另一台电脑时，从 NEXT 源码目录运行 `python -X utf8 <技能目录>/scripts/install-replays.py <sve-exp仓库> dist/pc`。原局和重练分支会用习题链接指定的文件名进入录像库。以后拉取新战报，再执行同一命令即可补新局。[录像安装脚本](../scripts/install-replays.py)

要重练双灾藤候选，在主教的牌组选择里找「透京耶菈 · 白牙与萝蕾娜（灾藤进化2）」，本机文件名是 `bp20-agents/bishop-c36513adac.json`。白牙、萝蕾娜各两张，40 张主牌与固定百局相同。一张绝望安息·玛文进化换成了第二张魔污区政府职员·灾藤进化。[可导入的双灾藤牌表](https://github.com/WhiteLeafWhite/sve-exp/blob/main/batches/12-second-saito/candidate/bishop.json)

使用 SVE NEXT 0.4.3（源码提交 `028e157`）。本机 PC 版双击 `dist/pc/start.bat`，首页选择对战或观看录像。桌面练习用标准职业格式。要复现三套原表，在标准格式的禁限下拉框选择「无」，并单独按日版 2026 年十月表检查主教。龙族原表保留 3 张日版限 1 的 BP15-066，皇室原表保留 3 张日版禁用的 BP05-018。可在牌组选择里用分享码定位原表。将主教位设为玩家，对手选困难。[模拟器项目](https://github.com/eireetm/ShadowverseEvolve-NEXT) · [日版官方禁限](https://shadowverse-evolve.com/card_limit/)

在模拟器源码根目录打开 PowerShell。令 `$skill` 指向本技能目录。以下写法适用于按默认路径安装的技能。SVE Helper 导入脚本也能给自己调整过的牌表安装正反面卡图与中文、日文卡效。[SVE Helper 公开卡组](https://www.svehelperwin.com/#/deck-list)

```powershell
$skill = Join-Path $env:USERPROFILE ".codex/skills/sve-bishop-matchups"
python -X utf8 "$skill/scripts/import_helper.py" cQZr8Z zQrwne t7B32v --deck-file "$skill/references/bp20-150-final.json"
Copy-Item "$skill/references/bp20-150-final.json" dist/pc/decks/BP20-Haven-final.json
```

互动对战会显示己方手牌、对方公开区及合法选择。输入从 0 开始的选择序号，或输入 `bot` 请求主教策略代走当前一步，`finish` 交给它完成后续。输出路径须使用新文件名。三个原表由分享码与牌张指纹共同核对。

```powershell
$key = "zQrwne"
node --import tsx "$skill/scripts/practice.mjs" play "$skill/references/bp20-150-final.json" "dist/pc/decks/svehelper/$key.json" --matchup $key --bot hard --pilot bishop --first 0 --out dist/pc/replays/dragon-practice-01.json
```

要自己执侮蔑龙、让陪练驾驶主教，可以沿用上述牌表顺序，把参数改为 `--seat 1 --matchup zQrwne --bot bishop --pilot medium`，并选一个新录像文件。默认的主教打法是 r3。专练侮蔑龙的触发源处理时，可加 `--revision 4` 试用针对该对局的两回合搜索和双炎术解场。

赛后从逐局复盘找到「输入 N 前」。`review --at N` 重演恰好 N 次输入，从该玩家视角列出可见牌和合法选择。`branch` 从同一点续打，可加 `--pick I --auto` 指定第一步并完成后续。分支内的自动驾驶从该位置重新初始化。把两种选择放在同一输入点、同一牌序和对手等级比较，再另用新种子检查能否复现。分支另存，正式成绩只统计首次正赛。

```powershell
$source = "dist/pc/replays/BP20-zQrwne-07.json"
node --import tsx "$skill/scripts/practice.mjs" review $source --at 148 --seat 0
node --import tsx "$skill/scripts/practice.mjs" branch $source --at 148 --seat 0 --pilot bishop --bot hard --out dist/pc/replays/dragon-07-retry.json
```

## 从一局录像的指定输入接手

本机陪练地址可带 `replay`、`at`、`seat` 三个参数。`replay` 是本机回放库里的 BP20 文件名，`at` 为已走过的输入数，`seat=0` 为主教，`seat=1` 为主流。引擎只载入已走过的前缀，你会从正常对战界面看到自己的手牌和当前合法选项。双席录像由最近五局复盘的另一席接着下，困难录像保留原困难对手。接手点会重新初始化对手的底层搜索，因此续局可能与当时实战不同。

## 保持训练可检验

按分享对话中的陪练方法，把同一个问题拆成两次回答。局中先用当时能看见的区域写行动和对方可能回应，赛后才打开全录像，指出哪一步的预测落空。每个结论附可重放的输入点，再换新牌序检验。对练时可用「这个回合花完 PP 解场，还是保留 Quick」这类有明确取舍的题目。[培养卡牌 AI 陪练的参考对话](https://chatgpt.com/share/6b045a9d-e814-83ee-98ea-d46768315061)

保存引擎版本、种子、先后攻、两个牌表的实际张数、策略版本、全部输入和终局。实战期间把看过的公开 EX 与墓场计入推测，隐藏手牌只作假设，抽牌顺序从本方可见信息重采样。桌面 Hard 使用完整隐藏信息，真人可能因罕见主轴产生的判断误差需要另做盲测。每个候选在三个职业面前使用相同搜索设置，先封存选择，再开独立验证组。[第八批条件与数据](https://github.com/WhiteLeafWhite/sve-exp/tree/main/batches/08-bp20-hard-150)
