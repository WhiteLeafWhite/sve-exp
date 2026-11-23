"""Publish one reviewed group into the local Git history; network push stays with the supervisor."""
import argparse
import subprocess
import shutil
from pathlib import Path
from run import ROOT, KEYS, NAMES, read, score, store

REPO=ROOT.parents[1]
SLUG=dict(zip(KEYS,("sve-destruction-rune","sve-disdain-dragon","sve-loot-sword")))
BASE="https://github.com/WhiteLeafWhite/sve-exp/blob/main/batches/09-bp20-fixed-300"


def md(path,lines):
    path.parent.mkdir(parents=True,exist_ok=True)
    path.write_text("\n".join(lines).rstrip()+"\n",encoding="utf-8")


def record(r):
    return "–".join(map(str,r[:2]))+(f"–{r[2]}" if r[2] else "")


def max_group(k):
    f=ROOT/k/"published.json"
    return read(f)["through"] if f.is_file() else 0


def generate(key,r):
    f=ROOT/key
    assert 1<=r<=20 and r==max_group(key)+1 and (f/"checks"/f"{r:02}.json").is_file()
    store(f/"published.json",{"through":r,"games":5*r})
    bishop=REPO/"skills/sve-bishop-matchups/references"/("fixed-"+key+".md")
    meta=REPO/"skills"/SLUG[key]/"references/fixed.md"
    title=NAMES[key]
    bl=[f"# 主教对{title} · 每五局的实战打法","","每个处理过的决策点都可以从录像恢复。",""]
    ml=[f"# {title}对主教 · 每五局战术","","从本职业的可见信息推演，再用已结束的录像核查。",""]
    idx=[f"# 主教对{title} · 固定 100 局验证","","[总表](../index.md) · [构筑检查](../construction.md)","","| 局 | 主教 | 胜负 | 终局生命 | 记录 |","|---:|---|---|---|---|"]
    for j in range(1,r+1):
        games=read(f/"reviews"/f"{j:02}.json")
        c=read(f/"checks"/f"{j:02}.json")
        g=next(x for x in games if x["number"]==c["example"]["game"])
        a=g["alternative"]
        link=f"{BASE}/{key}/games/{g['number']:02}.md"
        heading=f"## 第 {5*j-4}–{5*j} 局 · "
        bl.extend([heading+"主教 "+record(c["record"]),"",
            f"第 {g['number']} 局 T{c['example']['turn']}，主教体力从 {c['example']['start'][0]} 到 {c['example']['end'][0]}。"+c["tactic"]+
            (f" 可从输入 {a['at']} 前重练，当时有 {a['pp']} PP，从「{a['actual']}」和「{a['alternatives'][0]}」中比较一个不同动作。" if a else "")
            +f" [战报]({link})",""])
        opp_wins=[x for x in games if x["winner"]==1]
        ex=(opp_wins or games)[0]
        move=ex.get("metaAlternative")
        cause="、".join(ex["last"]["finish"][:3]) or ex["last"]["reason"]
        mlink=f"{BASE}/{key}/games/{ex['number']:02}.md"
        ml.extend([heading+title+" "+record([c["record"][1],c["record"][0],c["record"][2]]),"",
            f"第 {ex['number']} 局终局回合 T{ex['turn']}，从主教／{title}体力 {ex['last']['start'][0]}／{ex['last']['start'][1]} 起算。"
            f"实际记录包括{cause}。"+
            (f" 输入 {move['at']} 前，本方持有 {move['pp']} PP、{move['ep']} EP、{move['sep']} SEP。比较先「{move['actual']}」或先「{move['alternatives'][0]}」，重新计算可保留的攻击与直伤。" if move else
             "回到该回合前，分别写下能用于交换和能攻击主战者的随从，再按单段伤害检验选择。")+f" [战报]({mlink})",""])
        for g in games:
            n=g["number"]; s={0:"胜",1:"负",None:"平"}[g["winner"]]
            idx.append(f"| {n} | {g['order']} | {s} | T{g['turn']} · {g['hp'][0]}／{g['hp'][1]} | [日志](games/{n:02}.md) · [复盘](reviews/{j:02}.md#game-{n:02}) · [录像](replays/{n:02}.json) |")
    md(bishop,bl); md(meta,ml); md(f/"index.md",idx)
    intro=["# 同一份主教打三套主流 · 固定验证","",
           "同一副白牙萝蕾娜透京耶菈，三个对手各计划 100 局。每满五局提交一组完整日志、录像及两个座位的打法复盘。","",
           "| 对手 | 已归档 | 主教胜–负 |","|---|---:|---:|"]
    diary=["# 共同牌表的构筑检查","","主教首发使用 B 表，每五局记录维持或更改的理由与可复查证据。[共同主教](bishop.json)",""]
    for k in KEYS:
        latest=max_group(k)
        if not latest: continue
        score_now=read(ROOT/k/"checks"/f"{latest:02}.json")["cumulative"]
        intro.append(f"| [{NAMES[k]}]({k}/index.md) | {latest*5} | {record(score_now)} |")
        for j in range(1,latest+1):
            c=read(ROOT/k/"checks"/f"{j:02}.json"); ex=c["example"]
            diary.extend([f'<a id="{k}-{j:02}"></a>',"",f"## {NAMES[k]}第 {5*j-4}–{5*j} 局 · {record(c['record'])}","",
                c["decision"]+f" 第 {ex['game']} 局 T{ex['turn']} 体力净减 {ex['loss']}。"+c["tactic"]+
                f" [逐局复盘]({k}/reviews/{j:02}.md)",""])
    intro.extend(["","[每五局构筑检查](construction.md) · [验证条件](protocol.json) · [主教 40/10](bishop.json)"])
    md(ROOT/"index.md",intro); md(ROOT/"construction.md",diary)
    files=[bishop,meta,f/"published.json",f/"index.md",ROOT/"index.md",ROOT/"construction.md",f/"checks"/f"{r:02}.json",f/"reviews"/f"{r:02}.json",f/"reviews"/f"{r:02}.md"]
    for n in range(r*5-4,r*5+1): files.extend([f/"games"/f"{n:02}.md",f/"replays"/f"{n:02}.json"])
    pc=Path("dist/pc/replays")
    if pc.is_dir():
        for n in range(r*5-4,r*5+1):
            source=f/"replays"/f"{n:02}.json"
            dest=pc/f"BP20-fixed-{key}-{n:02}.json"
            if dest.exists():
                assert source.read_bytes()==dest.read_bytes()
            else:
                shutil.copyfile(source,dest)
    return [str(i.relative_to(REPO)) for i in files]


if __name__=="__main__":
    parser=argparse.ArgumentParser(description=__doc__)
    parser.add_argument("key",choices=KEYS)
    parser.add_argument("round",type=int)
    a=parser.parse_args()
    files=generate(a.key,a.round)
    subprocess.run(["git","-C",str(REPO),"-c","core.safecrlf=false","add","--",*files],check=True)
    subprocess.run(["git","-C",str(REPO),"commit","-q","-m",f"Review fixed Haven vs {a.key}, games {a.round*5-4}-{a.round*5}","--only","--",*files],check=True)
