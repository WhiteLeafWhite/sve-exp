"""Review the frozen seat against the matching baseline after each five games."""
import hashlib
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parent
BATCHES = ROOT.parent
SKILLS = BATCHES.parent/'skills'
WEB = 'https://github.com/WhiteLeafWhite/sve-exp/blob/main/batches/14-trained-pilot'
KEYS = {'cQZr8Z':('破坏巫师','sve-destruction-rune'), 'zQrwne':('侮蔑龙','sve-disdain-dragon'),
        't7B32v':('财宝皇室','sve-loot-sword')}


def read(path):
    return json.loads(path.read_text('utf-8-sig'))


def save(path, lines):
    path.write_text('\n'.join(lines).rstrip()+'\n','utf-8')


def outcomes(s, b):
    return {0:'胜',1:'负',None:'平'}[s]+'／'+{0:'胜',1:'负',None:'平'}[b]


check = BATCHES/'10-agent-duels/checks/003.json'
sha = read(check)['nextPolicies']['bishop'] if check.is_file() else None
if sha:
    source = BATCHES/'10-agent-duels/pilots/history'/(sha+'.mjs')
    assert hashlib.sha256(source.read_bytes()).hexdigest()==sha
index = ['# 第三次复盘后的主教打法对困难 Bot', '', '两边使用相同的双灾藤 F，三个对手也都用冻结原表。'
         '唯一区别是主教可按第三次实战复盘冻结的打法指定合法动作。[预登记](protocol.md) · [五局取舍记录](construction.md)', '']
if sha:
    index.extend([f'[主教席冻结源码](../10-agent-duels/pilots/history/{sha}.mjs) · [第三次双席复盘](../10-agent-duels/checks/003.md)', ''])
index.extend(['| 对手 | 配对局 | 训练打法胜 | 原 r3 胜 | 原负转胜 | 原胜转负 | 全部输入相同 | 至少一次多选项由训练打法决定 |',
              '|---|---:|---:|---:|---:|---:|---:|---:|'])
diary=['# 对局中的构筑与打法取舍', '', '本项固定 F 的 40/10，逐组记录用同一份牌实际做了哪些不同的选择。[预登记](protocol.md)', '']
details=[]
skill_lines=[]
summary={}
for key,(opp,skill) in KEYS.items():
    scores={k:0 for k in ['games','trained','baseline','up','down','identical','withChoices','choices']}
    examples=[]
    rows=[f'## {opp}', '', '| 牌序 | 训练／原 r3 | 首次不同输入 | 训练打法选项数 | 日志与对照 |', '|---:|---|---|---:|---|']
    for file in sorted((ROOT/key/'reviews').glob('*.json')):
        group=int(file.stem)
        block=read(file)
        assert block and sha and {g['number'] for g in block}<=set(range(5*group-4,5*group+1))
        ws=bs=0
        selections=[]
        for g in block:
            n=g['number']
            s=read(ROOT/key/'replays'/f'{n:02}.json')
            b=read(BATCHES/'12-second-saito/candidate'/key/'replays'/f'{n+70:02}.json')
            assert s['options']==b['options']
            assert s['options']['seed']==f'sve-exp/bp20-second-saito/v1/{key}/{n+70}'
            for attr in ['key','deckVersion','policy','engine','bishopHash','opponentHash','opponentPreset','opponentEffort']:
                assert s['training'][attr]==b['training'][attr]
            assert s['training']['policy']==3 and s['training']['opponentPreset']=='hard-next' and s['training']['opponentEffort']==1
            pilot=s['training']['seatPilot']
            assert pilot['hash']==sha and pilot['checkpoint']==3 and pilot['viewVersion']==2
            authored=[c for c in pilot['authored'] if c['options']>1]
            assert len(g['seatChoices'])==len(authored) and all(s['inputs'][c['at']]['by']==0 for c in authored)
            diff=next((i for i,(x,y) in enumerate(zip(s['inputs'],b['inputs'])) if x!=y),None)
            if diff is None:
                assert s['inputs']==b['inputs'] and s['info']==b['info']
            if not pilot['authored']:
                assert diff is None
            sw,bw=s['info']['result']['winner'],b['info']['result']['winner']
            assert sw==g['winner']
            ws+=sw==0
            bs+=bw==0
            scores['games']+=1
            scores['trained']+=sw==0
            scores['baseline']+=bw==0
            scores['up']+=bw==1 and sw==0
            scores['down']+=bw==0 and sw==1
            scores['identical']+=diff is None
            scores['withChoices']+=bool(authored)
            scores['choices']+=len(authored)
            notes=f'[训练日志]({key}/games/{n:02}.md) · [逐局复盘]({key}/reviews/{group:02}.md#game-{n:02}) · [录像]({key}/replays/{n:02}.json) · [原 r3](../12-second-saito/candidate/{key}/games/{n+70:02}.md)'
            rows.append(f"| {n+70} | {outcomes(sw,bw)} | {diff if diff is not None else '完全相同'} | {len(authored)} | {notes} |")
            if authored:
                # Prefer a real decision close to the first divergence, then a
                # main-phase choice over a routine opening or mandatory target.
                choice=min(range(len(authored)),key=lambda j:(abs(authored[j]['at']-diff),j) if diff is not None else (authored[j]['decision']!='mainPhase',j))
                selections.append((sw!=bw, n, g['seatChoices'][choice],diff))
        label=f'{min(g["number"] for g in block)+70}–{max(g["number"] for g in block)+70}'
        if selections:
            _,n,decision,diff=max(selections,key=lambda x:x[0])
            comparison=f'两份录像首次分歧在输入 {diff}。' if diff is not None else '两份录像所有输入一致。'
            text=f'牌序 {n+70}，{decision}{comparison}'
        else:
            n=block[0]['number']
            text=f'这组没有在多个合法选项之间命中冻结打法。可重练牌序 {n+70} 的基础搜索。'
        examples.append(f'- {text}[训练席逐回合]({WEB}/{key}/games/{n:02}.md)')
        diary.extend([f'<a id="{key}-{group:02}"></a>', '', f'## {opp} · 牌序 {label}', '',
                      f'训练打法胜 {ws}/{len(block)}，原 r3 胜 {bs}/{len(block)}。{text}共同 F 的张数继续冻结。'
                      f'[五局复盘]({key}/reviews/{group:02}.md)', ''])
    summary[key]=scores
    index.append('| '+opp+' | '+' | '.join(str(scores[k]) for k in ['games','trained','baseline','up','down','identical','withChoices'])+' |')
    if scores['games']:
        details.extend(['',*rows,''])
        tips=[f'## {opp}', '',*examples,'']
        skill_lines.extend(tips)
        save(SKILLS/skill/'references/trained-pilot.md',['# 训练席对固定困难对手的选择', '',
             '从相同牌序的第一次不同输入开始，检查己方下一轮是否要改变去除目标或斩杀顺序。', '',*tips,f'[三种对局]({WEB}/index.md)'])
complete=all(s['games']==20 for s in summary.values())
decision=None
if complete:
    difference=[s['trained']-s['baseline'] for s in summary.values()]
    wins=[s['trained'] for s in summary.values()]
    decision={'expand':sum(x>0 for x in difference)>=2 and min(difference)>=-1 and sum(difference)>0,
              'advantage':max(wins)>=13 and min(wins)>=7 and sum(x<10 for x in wins)<=1,
              'allAtLeast45':min(wins)>=9}
    label='达到' if decision['expand'] else '未达到'
    index.extend(['',f'六十对的胜负{label}预登记的扩大验证条件。'])
    diary.extend(['## 六十对结论', '',f'训练打法{label}扩大验证条件。三个对局继续分别报出样本和胜负。'])
index.extend(['', '选项数只计主教面对至少两个合法选项时，冻结打法亲自指定的一步。两份录像可能在更早的一次相同选择后使用不同的搜索缓存。',*details])
save(ROOT/'index.md',index)
save(ROOT/'construction.md',diary)
save(SKILLS/'sve-bishop-matchups/references/trained-pilot.md',['# 把双席实战中的决定带回困难对局', '',
     '先按同一盘面算出一条主教线路，再从第一次不同输入观看两种打法。在第二次回复、选目标和保留 Quick 上，说明触发条件及对手剩余的进攻手段。','',*skill_lines,f'[冻结打法、同表对照和原生录像]({WEB}/index.md)'])
(ROOT/'summary.json').write_text(json.dumps({'complete':complete,'checkpoint':3,'hash':sha,'byMatchup':summary,'criteria':decision},ensure_ascii=False,indent=2)+'\n','utf8')
print({k:(s['games'],s['trained'],s['baseline']) for k,s in summary.items()})
