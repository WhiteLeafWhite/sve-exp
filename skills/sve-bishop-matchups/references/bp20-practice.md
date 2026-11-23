# 规则与陪练操作

## 上桌前

- 标准职业牌组使用一张主战者、40–50 张主牌与 0–10 张进化牌。主牌和进化牌各按同名最多三张计算，再核对地区禁限。己方场上及 EX 各限五张。场上的护符也占一个位置，在满场前预留能立即解场或回血的一格。见 CR 4.4、4.8、6.1。[官方综合规则 v1.26.1](https://en.shadowverse-evolve.com/wordpress/wp-content/uploads/2026/10/01120524/SVEE-Comprehensive-Rules_v1.26.1_260916.pdf)
- 双方各 20 体力，抽四张。先攻方先决定是否将整手按任选顺序放回牌库底再抽四张，各有一次机会。先攻第一回合跳过抽牌，起始 0 EP。后攻从 3 EP 起步，双方各 1 SEP。见 CR 6.2、7.2。[官方综合规则](https://en.shadowverse-evolve.com/rules/)
- 主阶段通常每回合有一次进化机会。进化费用可以用 1 EP 抵 1 PP，仍要算清剩余费用。进化／突进使当回合新进场的随从有机会攻击随从，疾驰才允许新进场的随从直接攻击主战者。先检查卡文、合法目标与横置状态。见 CR 8、12。[官方综合规则](https://en.shadowverse-evolve.com/rules/)
- 敌方有横置守护随从时要先攻击合法的横置守护。宣告攻击后、防守方可在伤害结算前的 Quick 时点行动。结束阶段横置守护之后还有 Quick 时点。保留的 PP 要逐项配对到手上或公开 EX 的一张具体 Quick。见 CR 7.4.5、8.4.7、12.8.2。[官方综合规则](https://en.shadowverse-evolve.com/rules/)

## 在模拟器中练习

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

赛后从逐局复盘找到「输入 N 前」。`review --at N` 重演恰好 N 次输入，从该玩家视角列出可见牌和合法选择。`branch` 从同一点续打，可加 `--pick I --auto` 指定第一步并完成后续。分支内的自动驾驶从该位置重新初始化。把两种选择放在同一输入点、同一牌序和对手等级比较，再另用新种子检查能否复现。分支另存，正式成绩只统计首次正赛。

```powershell
$source = "dist/pc/replays/BP20-zQrwne-07.json"
node --import tsx "$skill/scripts/practice.mjs" review $source --at 148 --seat 0
node --import tsx "$skill/scripts/practice.mjs" branch $source --at 148 --seat 0 --pilot bishop --bot hard --out dist/pc/replays/dragon-07-retry.json
```

## 保持训练可检验

保存引擎版本、种子、先后攻、两个牌表的实际张数、策略版本、全部输入和终局。实战期间把看过的公开 EX 与墓场计入推测，隐藏手牌只作假设，抽牌顺序从本方可见信息重采样。桌面 Hard 使用完整隐藏信息，真人可能因罕见主轴产生的判断误差需要另做盲测。每个候选在三个职业面前使用相同搜索设置，先封存选择，再开独立验证组。[第八批条件与数据](https://github.com/WhiteLeafWhite/sve-exp/tree/main/batches/08-bp20-hard-150)
