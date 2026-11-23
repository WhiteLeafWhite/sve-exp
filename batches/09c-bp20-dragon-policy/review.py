"""Review the five policy-only Dragon games against the predeclared baselines."""
import json
from pathlib import Path
R=Path(__file__).resolve().parent
def read(f):return json.loads(f.read_text("utf-8"))
games=read(R/"zQrwne/reviews/01.json")
baseline=R.parent/"09-bp20-fixed-300/zQrwne"
old=read(baseline/"reviews/19.json") if (baseline/"reviews/19.json").is_file() else None
wins=sum(g["winner"]==0 for g in games)
rows=["# 侮蔑龙 · 共同 B 牌表的 r4 打法验证","",f"5 局中主教 {wins} 胜 {5-wins} 负，主牌与进化牌沿用 B。对手是同一原表的满强度 Hard。[试验条件](construction.md)","",
      "| 种子原局号 | 主教 | r4 | r3 | 实战 |","|---:|---|---|---|---|"]
for i,g in enumerate(games,1):
    r=read(R/"zQrwne/replays"/f"{i:02}.json");num=90+i
    assert r["options"]["seed"]==f"sve-exp/bp20-fixed-300/v1/zQrwne/{num}" and r["training"]["policy"]==4
    outcome=lambda w:{0:"胜",1:"负",None:"平"}[w]
    compare="待原组完成"
    if old:
        o=read(baseline/"replays"/f"{num:02}.json")
        assert r["options"]==o["options"]
        compare=f"[{outcome(old[i-1]['winner'])}](../09-bp20-fixed-300/zQrwne/games/{num:02}.md)"
    rows.append(f"| {num} | {g['order']} | {outcome(g['winner'])} | {compare} | [日志](zQrwne/games/{i:02}.md) · [复盘](zQrwne/reviews/01.md#game-{i:02}) · [录像](zQrwne/replays/{i:02}.json) |")
(R/"index.md").write_text("\n".join(rows)+"\n","utf-8")
skill=R.parents[1]/"skills/sve-bishop-matchups/references/dragon-r4.md"
skill.write_text(
    "# 对侮蔑龙的 r4 打法\n\n"
    "遇到已经进化的 BP05-052，先算己方回合的低费解法。对方本回合的自伤触发尚未开始。炎术可以打 2，进化灾藤可把墓场炎术放到 EX 并在本回合减费，因而有机会用同一张牌打两次。"
    "若对方仍有 PP，要在每一个 Quick 窗口重新估算。无可确认的斩杀时，把己方唯一的守护被移除后对方的攻击与直伤合起来计算。"
    f"相同 B 牌表的五局试验 r4 为 {wins} 胜 {5-wins} 负。"
    +(f"配对 r3 为 {sum(x['winner']==0 for x in old)} 胜 {sum(x['winner']==1 for x in old)} 负。" if old else "")
    +"每个决定与原表种子逐一相连。[配对记录](https://github.com/WhiteLeafWhite/sve-exp/blob/main/batches/09c-bp20-dragon-policy/index.md)\n","utf-8")
print(wins,5-wins)
