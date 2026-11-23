# BP20 主教对困难 Bot · 150 局

主教共 62–88，每个对手 50 局、先后攻各 25 局。三套候选中选出 **透京耶菈 · 白牙与萝蕾娜**。选定后使用 45 个新种子，成绩为 **21–24**。

| 对手原表 | 首轮 5 局 | 选表 30 局 | 定稿 15 局 | 全部 50 局 | 全部先攻 | 全部后攻 |
|---|---:|---:|---:|---:|---:|---:|
| [破坏巫师 cQZr8Z](cQZr8Z/index.md) | 1–4 | 16–14 | 8–7 | 25–25 | 12–13 | 13–12 |
| [侮蔑龙 zQrwne](zQrwne/index.md) | 1–4 | 8–22 | 7–8 | 16–34 | 8–17 | 8–17 |
| [财宝皇室 t7B32v](t7B32v/index.md) | 2–3 | 13–17 | 6–9 | 21–29 | 11–14 | 10–15 |

表中依次为主教的胜、负，有平局时另列。前 5 局沿用旧打法。第 6–35 局以同一个 r3 驾驶三套候选，每套每对手各 10 局、先后攻各 5 局。最后 15 局保持同一套牌和打法。

[三套候选与每五局的构筑日志](construction.md) · [最终牌表](../../skills/sve-bishop-matchups/references/bp20-150-final.json) · [实战打法与重练题](../../skills/sve-bishop-matchups/references/bp20-playbook.md) · [机器可读成绩](summary.json)

## 录像与复现

使用 SVE NEXT 0.4.3 提交 `028e157`，引擎指纹 `c95927874b565f21`。共记录 22,122 次输入。每局从种子重新执行所有输入并比较完整终局状态。打开任一对手索引，在模拟器菜单的「观看录像」中载入原生 JSON。

在已安装依赖的模拟器源码根目录，以 `$batch` 指向本批目录，先运行 `node $batch/prepare.mjs`。空白输出目录可分别用 `python $batch/series.py <分享码> --end 7` 跑完三个对手，再执行 `python $batch/series.py select`，然后分别执行 `python $batch/series.py <分享码> --start 8 --end 10`。已有同条件录像会复用。最终用 `python $batch/summarize.py` 逐项比对牌表、先后攻、种子及成绩。

龙族保留原表 3 张 BP15-066，皇室保留 3 张 BP05-018。主教单独核对日版十月禁限，三个对手逐局核对冻结原表。困难 Bot 使用桌面 Hard 完整强度，能读取双方的隐藏区域。主教使用自己的合法视野、公开 EX 与假想牌序。社区牌表出现数只能描述抽到的站内样本。

[SVE NEXT 源码](https://github.com/eireetm/ShadowverseEvolve-NEXT/tree/028e157) · [SVE Helper](https://www.svehelperwin.com/#/deck-list) · [日本官方禁限](https://shadowverse-evolve.com/card_limit/)
