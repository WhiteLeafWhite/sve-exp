"""Index only reviewed games, match complete pairs, and validate their setup and decision histories."""
import json
import math
from pathlib import Path

ROOT=Path(__file__).resolve().parent
REPO=ROOT.parents[1]; URL="https://github.com/WhiteLeafWhite/sve-exp/blob/main/batches/11-dragon-mulligan"
KEY="zQrwne"; NAMES={"candidate":"先攻留牌候选 r5","control":"原打法 r3"}
W={0:"胜",1:"负",None:"平"}
def read(file):return json.loads(file.read_text("utf-8-sig"))
def save(file,lines):file.write_text("\n".join(lines).rstrip()+"\n","utf-8")
def record(gs):return [sum(g["winner"]==n for g in gs) for n in (0,1,None)]
def score(gs):
    a,b,c=record(gs);return f"{a}–{b}"+(f"–{c}" if c else "")

all_games={}; cache={}
for label, title in NAMES.items():
    folder=ROOT/label; by_seed={}; cache[label]={}
    diary=[f"# {title}的五局检查","", "三种主流共用原 B 主教，此次只实验先攻对龙留牌。对手逐局使用固定原表与满强度 Hard。[预先登记的验证条件](../protocol.md)",""]
    for source in sorted((folder/KEY/"reviews").glob("*.json")):
        number=int(source.stem); group=read(source)
        assert [g["number"] for g in group]==list(range(5*number-4,5*number+1))
        for g in group:
            n=g["number"]; seed=n if label=="candidate" else 2*n-1
            r=read(folder/KEY/"replays"/f"{n:02}.json"); tr=r["training"]
            assert tr["bishopHash"]=="d780a138fbf854dea21540dea2d6f9e4d6a62001818fe1449388d3b467f7130e"
            assert tr["opponentHash"]=="9416da999b748650b862702d9bbf970470089f6aace1182a43097cb5fca1bcf7"
            assert tr["policy"]==(5 if label=="candidate" else 3) and tr["opponentPreset"]=="hard-next" and tr["opponentEffort"]==1
            assert r["options"]["seed"]==f"sve-exp/bp20-dragon-mulligan/v1/{KEY}/{seed}" and r["options"]["turnOrder"]==("player1" if seed%2 else "player2")
            assert len(r["inputs"])==g["inputs"] and r["info"]["result"]["winner"]==g["winner"]
            by_seed[seed]=g;cache[label][seed]=r
        example=max(group,key=lambda g:g["worst"]["loss"]); ex=example["number"]; t=example["worst"]
        diary.extend([f'<a id="{KEY}-{number:02}"></a>',"",f"## 第 {number} 组 · {score(group)}","",
            f"保留四张 {sum(g['mulligan']=='保留' for g in group)} 局，整手重抽 {sum(g['mulligan']=='整手重抽' for g in group)} 局。第 {ex} 局 T{t['turn']} 主教从 {t['start'][0]} 血降到 {t['end'][0]} 血。先从此前的公开场面算致命威胁，再回看起手如何影响最初三回合的互动。",
            f"维持共同 B 与预登记打法，记录本组五次起手和三回合内实际使用的牌。[逐局复盘]({KEY}/reviews/{number:02}.md) · [例局日志]({KEY}/games/{ex:02}.md)",""])
    all_games[label]=by_seed
    if folder.is_dir():save(folder/"construction.md",diary)

candidate=all_games["candidate"]; control=all_games["control"]
first=[g for n,g in candidate.items() if n%2]; second=[g for n,g in candidate.items() if not n%2]
pairs=sorted(candidate.keys() & control.keys()); up=[];down=[]; switched=[];same=0
pair_rows=[]
for n in pairs:
    a,b=cache["candidate"][n],cache["control"][n]; assert a["options"]==b["options"]
    old,new=control[n],candidate[n]
    if old["mulligan"]==new["mulligan"]:
        assert a["inputs"]==b["inputs"] and a["info"]==b["info"]
        same+=1
    else:
        assert old["mulligan"]=="保留" and new["mulligan"]=="整手重抽"
        switched.append(n)
    if old["winner"]==1 and new["winner"]==0:up.append(n)
    if old["winner"]==0 and new["winner"]==1:down.append(n)
    pair_rows.append(f"| {n} | {old['mulligan']} → {new['mulligan']} | [{W[old['winner']]}](control/{KEY}/games/{old['number']:02}.md) | [{W[new['winner']]}](candidate/{KEY}/games/{new['number']:02}.md) |")
discord=len(up)+len(down)
p_exact=min(1,2*sum(math.comb(discord,i) for i in range(min(len(up),len(down))+1))/2**discord) if discord else 1
summary={"candidate":record(candidate.values()),"candidateFirst":record(first),"sharedSecond":record(second),"controlFirst":record(control.values()),
         "candidateGames":len(candidate),"independentControlGames":len(control),"verifiedStartPairs":len(pairs),"identicalInputPairs":same,
         "changedOpeningSeeds":switched,"lossToWin":up,"winToLoss":down,"exactMcNemarTwoSided":round(p_exact,4),"complete":len(candidate)==100 and len(control)==50}
if summary["complete"]:
    summary["matchedBaseline"]=record([*control.values(),*second]);summary["candidateAtLeast45"]=len([g for g in candidate.values() if g["winner"]==0])>=45
(ROOT/"summary.json").write_text(json.dumps(summary,indent=2,ensure_ascii=False)+"\n","utf-8")
index=["# 从先攻换牌改善侮蔑龙对局","", "固定 B 主教、满强度龙族 Hard。每个奇数种子有两份实际对战录像，偶数种子只实打一次，因为两个打法在后攻完全相同。[试验协议](protocol.md)","",
       "| 样本 | 当前局数 | 主教胜–负 |", "|---|---:|---:|",f"| r5 全部 | {len(candidate)} | {score(candidate.values())} |",f"| r5 先攻 | {len(first)} | {score(first)} |",f"| r3 先攻 | {len(control)} | {score(control.values())} |",f"| 共同后攻 | {len(second)} | {score(second)} |","",
       f"已对齐 {len(pairs)} 对先攻种子，{same} 对的完整输入与结果一致。实际改变起手 {len(switched)} 次，其中原负转胜 {len(up)} 次、原胜转负 {len(down)} 次。",""]
if summary["complete"]:
    index.extend([f"候选与原打法各覆盖同样的 100 个种子，共有 150 场实际对战。原打法合计 {score([*control.values(),*second])}，候选合计 {score(candidate.values())}。配对方向的双侧精确检验 p={p_exact:.3f}。","",
                  "本轮保留 r3。遇到白牙、炎术、坚定祈祷、灾藤这手，先算出灾藤接白牙的曲线，再决定是否重抽。"
                  "种子 3 保留后 T19 以 28／−1 获胜，重抽后只在前三个己方回合打出一张，到 T18 以 0／24 落败。"
                  "种子 25 的双炎术、耶菈的祈祷、圣士郎是另一道题。保留后到前三回合只打一张，重抽获得耶菈与透京，T25 获胜。"
                  "[种子 3 保留](control/zQrwne/games/02.md) · [种子 3 重抽](candidate/zQrwne/games/03.md) · "
                  "[种子 25 保留](control/zQrwne/games/13.md) · [种子 25 重抽](candidate/zQrwne/games/25.md)",""])
for label,title in NAMES.items():
    if all_games[label]:index.extend([f"[{title}的每五局构筑与复盘]({label}/construction.md)",""])
index.extend(["| 先攻种子 | 原打法 → 候选 | 原局 | 候选 |", "|---:|---|---|---|",*pair_rows,"","## 后攻逐局记录",""])
for n in sorted(candidate):
    if n%2==0:index.append(f"- 第 {n} 局主教{W[candidate[n]['winner']]}。[战报](candidate/{KEY}/games/{n:02}.md) · [原生录像](candidate/{KEY}/replays/{n:02}.json)")
save(ROOT/"index.md",index)

for sk,title,advice in [("sve-bishop-matchups","先攻对龙的换牌题","看到耶菈先算 2 费守护能否接出祈祷。若靠圣士郎起步，把承担者与实际找牌的费用写出。减少低攻检索过多的起手可能同时错过炎术和中期的回复。"),
                        ("sve-disdain-dragon","如何应对主教先攻换牌","对方公开选择整手重抽，只能据此修正对四张初手的猜测。看到 2 费耶菈公开检索祈祷，才把下回合祈祷和之后的回复计入。对手交回合时请先算可以主动造成的自伤与疾驰攻击。")]:
    tips=["# "+title,"",advice,"",f"独立模拟已核对 {len(pairs)} 对先攻，留牌实际改变 {len(switched)} 次，负转胜 {len(up)} 次、胜转负 {len(down)} 次。完整候选当前 {score(candidate.values())}。相同先攻决定的 {same} 对检查了所有引擎输入，完全相同。",""]
    for numbers,why in [(up,"由负转胜"),(down,"由胜转负"),(sorted(set(switched)-set(up)-set(down)),"起手改变而胜负相同")]:
        if numbers:
            n=numbers[0];old=control[n];new=candidate[n]
            tips.append(f"- 种子 {n} {why}。原方案前三个己方回合打出 {old['earlyPlays']} 张，候选打出 {new['earlyPlays']} 张。遮住结局后分别重排前三回合。[保留四张]({URL}/control/{KEY}/games/{old['number']:02}.md) · [重抽四张]({URL}/candidate/{KEY}/games/{n:02}.md)")
    if summary["complete"]:
        tips.extend(["","本轮 r3 在同样一百个牌序胜 37 局，r5 胜 33 局。保留原 r3，训练时逐手比较前两回合可打出的牌。"
                     "白牙、炎术、坚定祈祷、灾藤的手牌可先靠灾藤找牌并接白牙；双炎术、祈祷与圣士郎的手牌起步较慢。"
                     "将这两手分别遮住终局再决定，而后打开种子 3 和 25 的两份录像。"])
    tips.extend(["",f"[样本口径、配对局和全部录像]({URL}/index.md)"])
    save(REPO/"skills"/sk/"references/dragon-opening.md",tips)
