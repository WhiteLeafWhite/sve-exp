"""Run five seat-to-seat games, snapshot one common Haven per three opponents, and rebuild the public logs."""
import argparse
import hashlib
import json
import shutil
import subprocess
from pathlib import Path

ROOT=Path(__file__).resolve().parent
BATCH=ROOT.parent
KEYS=("cQZr8Z","zQrwne","t7B32v")
NAMES=dict(zip(KEYS,("破坏巫师","侮蔑龙","财宝皇室")))
ORIG=dict(zip(KEYS,("05-cQZr8Z","06-zQrwne","07-t7B32v")))
def read(p): return json.loads(p.read_text("utf-8-sig"))
def write(p,data):
    p.parent.mkdir(parents=True,exist_ok=True)
    tmp=p.with_suffix(".new");tmp.write_text(json.dumps(data,ensure_ascii=False,indent=2)+"\n","utf-8");tmp.replace(p)
def md(p,lines):
    p.parent.mkdir(parents=True,exist_ok=True)
    p.write_text("\n".join(lines).rstrip()+"\n","utf-8")
def tally(games): return "–".join(str(sum(w==p for w in games)) for p in (0,1,None)).removesuffix("–0")


def freeze(cycle):
    dest=ROOT/"cycles"/f"{cycle:03}.json"
    if dest.is_file(): return read(dest)
    labels=("bishop",*KEYS); files={}
    for label in labels:
        current=ROOT/"decks"/(label+".json")
        if not current.is_file():
            current=BATCH/"09-bp20-fixed-300/bishop.json" if label=="bishop" else BATCH/ORIG[label]/"opponent.json"
        deck=read(current)
        ident=hashlib.sha256(json.dumps([deck["leader"], sorted(deck["main"].items()),sorted(deck["evolve"].items())],separators=(",",":")).encode()).hexdigest()
        path=Path("decks/history")/(ident+".json")
        if not (ROOT/path).is_file(): write(ROOT/path,deck)
        files[label]=path.as_posix()
    write(dest,files)
    return files


def card_delta(a,b):
    words=[]
    for z,label in (("main","主牌"),("evolve","进化")):
        for c in sorted(set(a[z])|set(b[z])):
            amount=b[z].get(c,0)-a[z].get(c,0)
            if amount: words.append(f"{label} {c} {amount:+}")
    if a["leader"]!=b["leader"]: words.append(f"主战者 {a['leader']} → {b['leader']}")
    return "、".join(words) or "保留当前张数"


def logs():
    listing=["# 两个独立座位的主流对练","",
             "主教与主流各由一名子 agent 读取本方视野并作决定。双方可以在给出清楚的选择和理由后，将后续规则操作交给各自的公平策略。每局记录直接输入次数、策略代行、替换张数和原生录像。先后攻按每个对手的局号交替。","",
             "| 场次 | 对手 | 主教先后攻 | 主教结果 | 手选次数（主教／主流） | 记录 |","|---:|---|---|---|---:|---|"]
    ledger=["# 双座位构筑日志","", "一个循环由三种主流各一局组成，使用同一份主教。对手本轮实际差额与各自最初的 Hard 原表比较，主牌与进化牌合计最多五张。",""]
    prev={k:read(BATCH/ORIG[k]/"opponent.json") for k in KEYS}
    prev["bishop"]=read(BATCH/"09-bp20-fixed-300/bishop.json")
    results={k:[] for k in KEYS}; changes={}; rows=[]; total=0
    for f in sorted((ROOT/"cycles").glob("*.json")):
        cycle=int(f.stem); chosen=read(f)
        for label,path in chosen.items():
            now=read(ROOT/path); diff=card_delta(prev[label],now);prev[label]=now
            if label=="bishop" or diff!="保留当前张数":
                ledger.extend([f"- 循环 {cycle} · {('共同主教' if label=='bishop' else NAMES[label])} · {diff}。[实际牌表]({path})"])
        for pos,k in enumerate(KEYS):
            num=f"{cycle:02}"; g=(cycle-1)*3+pos+1
            replay=ROOT/k/"replays"/(num+".json")
            if not replay.exists():continue
            data=read(replay); w=data["info"]["result"]["winner"]; d=data["duel"]; tr=data["training"]
            results[k].append(w);changes[k]=tr["opponentChanges"];total+=1
            txt={0:"胜",1:"负",None:"平"}[w]; side="先" if cycle%2 else "后"
            row=f"| {g} | {NAMES[k]} | {side} | {txt} | {d['explicit'][0]}／{d['explicit'][1]} | [日志]({k}/games/{num}.md) · [两个座位的复盘]({k}/lessons/{num}.md) · [录像]({k}/replays/{num}.json) |"
            rows.append(row)
            lesson=[f"# 第 {g} 场 · 主教对{NAMES[k]}","",f"主教{side}攻，终局 T{data['info']['turn']}，主教{txt}。对手相对原表换了 {tr['opponentChanges']} 张。","",
                f"[引擎逐回合战报](../games/{num}.md) · [完整输入](../replays/{num}.json) · [可重练的合法替代](../reviews/{(cycle+4)//5:02}.md#game-{num})","","| 输入前 | 回合 | 座位 | 决策理由 | 后续代行 |","|---:|---:|---|---|---|"]
            for move in d["notes"]:
                reason=(move["reason"] or "选择见录像输入").replace("|","／").replace("\n"," ")
                scope={"step":"一步","turn":"本回合","game":"本局余下"}[move["delegate"]]
                lesson.append(f"| {move['index']} | T{move['turn']} | {('主教' if move['seat']==0 else NAMES[k])} | {reason} | {scope} |")
            lesson.extend(["",f"两方直接选择 {d['explicit'][0]}／{d['explicit'][1]} 次，各自书写的策略另选 {d['policyChoices'][0]}／{d['policyChoices'][1]} 次。剩余规则输入包括唯一合法动作、可委托的己方公平搜索及无选择的 Quick 让过。"])
            for role in ("bishop","meta"):
                note=ROOT/k/"notes"/(num+"-"+role+".md")
                if note.is_file(): lesson.extend(["",note.read_text("utf-8").strip()])
            md(ROOT/k/"lessons"/(num+".md"),lesson)
        ledger.append("")
    listing+=rows
    listing.extend(["","主教各对局战绩为"+"、".join(f"{NAMES[k]} {tally(s)}" for k,s in results.items() if s)+"。 [构筑日志](construction.md)"])
    groups=sorted((ROOT/"checks").glob("*.md"))
    if groups:
        listing.extend(["", "每五场从双方座位复查。"+" · ".join(f"[第 {int(f.stem)} 组](checks/{f.name})" for f in groups)])
    for k,s in results.items():
        for j in range(1,(len(s)+4)//5+1):
            ledger.extend([f'<a id="{k}-{j:02}"></a>',"",f"{NAMES[k]}第 {(j-1)*5+1}–{min(j*5,len(s))} 局。 [五局复盘]({k}/reviews/{j:02}.md)",""])
    md(ROOT/"index.md",listing);md(ROOT/"construction.md",ledger)
    write(ROOT/"summary.json",{"games":total,"records":{k:[s.count(p) for p in (0,1,None)] for k,s in results.items()},"latestOpponentChanges":changes})


if __name__=="__main__":
    parser=argparse.ArgumentParser(description=__doc__)
    parser.add_argument("mode",choices=("block","logs"));parser.add_argument("group",type=int,nargs="?",default=1)
    a=parser.parse_args()
    if a.mode=="logs":logs()
    else:
        assert a.group>=1 and read(BATCH/"09-bp20-fixed-300/summary.json")["games"]==300
        for g in range((a.group-1)*5+1,a.group*5+1):
            if Path("dist/quota-checkpoints/stop").exists():break
            cycle=(g-1)//3+1;key=KEYS[(g-1)%3];chosen=freeze(cycle)
            out=ROOT/key/"replays"/f"{cycle:02}.json"
            if not out.is_file():
                subprocess.run(["node",ROOT/"arena.mjs",key,str(cycle),ROOT/chosen["bishop"],ROOT/chosen[key]],check=True)
            subprocess.run(["node",BATCH/"08-bp20-hard-150/report.mjs",key,str((cycle+4)//5),"duel"],check=True)
            pc=Path("dist/pc/replays")/f"BP20-agents-{key}-{cycle:02}.json"
            if pc.parent.exists():
                if pc.exists():assert pc.read_bytes()==out.read_bytes()
                else:shutil.copyfile(out,pc)
            logs()
