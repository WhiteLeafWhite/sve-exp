"""Compare only reviewed S games with the exact F games specified before play."""
import json
from collections import Counter
from pathlib import Path

ROOT = Path(__file__).resolve().parent
REPO = ROOT.parents[1]
FOLDER = ROOT.parent / '12-second-saito' / 'candidate'
WEB = 'https://github.com/WhiteLeafWhite/sve-exp/blob/main/batches/13-sacred-sheep'
NAMES = {'cQZr8Z': ('破坏巫师', 'sve-destruction-rune'), 'zQrwne': ('侮蔑龙', 'sve-disdain-dragon'),
         't7B32v': ('财宝皇室', 'sve-loot-sword')}
CARD = 'BP20-099'


def read(path):
    return json.loads(path.read_text('utf-8-sig'))


def save(path, lines):
    path.write_text('\n'.join(lines).rstrip()+'\n', 'utf-8')


def display(winner):
    return {0:'胜', 1:'负', None:'平'}[winner]


def verify_pair(s, f, key, n, deck):
    st, ft = s['training'], f['training']
    assert st['deckVersion']=='S' and ft['deckVersion']=='F' and st['number']==n and ft['number']==n+60
    for shared in ('key','opponentHash','policy','opponentPreset','opponentEffort','engine'):
        assert st[shared]==ft[shared]
    assert st['key']==key and st['policy']==3 and st['opponentPreset']=='hard-next' and st['opponentEffort']==1
    so, fo = s['options'], f['options']
    assert so['seed']==fo['seed']==f'sve-exp/bp20-second-saito/v1/{key}/{n+60}'
    for attr in so.keys()-{'deckNames','decks'}:
        assert so[attr]==fo[attr]
    sd, fd = so['decks'][0], fo['decks'][0]
    assert so['decks'][1]==fo['decks'][1] and sd['evolve']==fd['evolve'] and sd['leader']==fd['leader']==deck['leader']
    expected = list(fd['main'])
    for old in ('BP18-104','BP19-095'):
        i = len(expected)-1-expected[::-1].index(old)
        expected[i] = CARD
    assert sd['main']==expected and dict(Counter(expected))==deck['main'] and dict(Counter(sd['evolve']))==deck['evolve']


deck = read(ROOT/'bishop.json')
index = ['# 两张圣启梦羊的共同主教', '', 'S 对三个固定困难 Bot 使用同一套 40/10。每一对都检查两张换牌的物理位置、双方其他牌的顺序、种子及底层打法。'
         '[选牌与筛选条件](protocol.md) · [导入 S 表](bishop.json) · [每五局构筑日志](construction.md)', '',
         '| 对手 | 已配对 | S 胜场 | F 胜场 | 原负转胜 | 原胜转负 | 梦羊登场局 | 梦羊触发局 |', '|---|---:|---:|---:|---:|---:|---:|---:|']
details = []
diary = ['# 圣启梦羊的构筑日志', '', '初始换入两张圣启梦羊，各减一张坚定不移的祈祷和希望女王·莉迪耶尔。'
         '每五局把卡位对获胜的影响与实际触发分开记录。[预登记](protocol.md)', '']
skills = []
summary = {}
for key, (opp, skill_name) in NAMES.items():
    root = ROOT/key
    rec = {'n':0,'s':0,'f':0,'up':0,'down':0,'entered':0,'triggered':0,'spent':0}
    examples = []
    rows = [f'## {opp}', '', '| 牌序 | S／F | 梦羊上场次数 | 触发次数 | 同一主阶段内确认已用次数 | 逐局资料 |', '|---:|---|---:|---:|---:|---|']
    for file in sorted((root/'reviews').glob('*.json')):
        block = read(file)
        group = int(file.stem)
        assert block and {g['number'] for g in block}<=set(range(5*group-4,5*group+1))
        block_s = block_f = active = 0
        for g in block:
            n = g['number']
            s=read(root/'replays'/f'{n:02}.json')
            f=read(FOLDER/key/'replays'/f'{n+60:02}.json')
            verify_pair(s, f, key, n, deck)
            sw,fw=s['info']['result']['winner'],f['info']['result']['winner']
            assert sw==g['winner']
            entered=g['entered'].get(CARD,0)
            triggers,spent=g['sheepTriggers'],g['sheepSpent']
            assert len(spent)<=len(triggers)
            rec['n']+=1
            for field, condition in [('s',sw==0),('f',fw==0),('up',fw==1 and sw==0),('down',fw==0 and sw==1),
                                     ('entered',bool(entered)),('triggered',bool(triggers))]:
                rec[field]+=int(condition)
            rec['spent']+=len(spent)
            block_s+=sw==0
            block_f+=fw==0
            active+=bool(triggers)
            note=f'[S 日志]({key}/games/{n:02}.md) · [S 复盘]({key}/reviews/{group:02}.md#game-{n:02}) · [原生录像]({key}/replays/{n:02}.json) · [同牌序 F](../12-second-saito/candidate/{key}/games/{n+60:02}.md)'
            rows.append(f'| {n+60} | {display(sw)}／{display(fw)} | {entered} | {len(triggers)} | {len(spent)} | {note} |')
        sample=next((g for g in block if g['sheepSpent']), next((g for g in block if g['sheepTriggers']),block[0]))
        n=sample['number']
        if sample['sheepSpent']:
            event=sample['sheepSpent'][0]
            lesson=f"第 {n+60} 个牌序 T{event['turn']} 输入 {event['at']} 用掉一次防止。从这一步前数对手还能打出的攻击和直伤。"
        elif sample['sheepTriggers']:
            event=sample['sheepTriggers'][0]
            lesson=f"第 {n+60} 个牌序 T{event['turn']} 梦羊触发。看当回合对方选择打脸还是交换，以及留在场上的 2/3 下回合能打到哪里。"
        elif sample['entered'].get(CARD):
            lesson=f'第 {n+60} 个牌序梦羊进过场，下一次对手主阶段前没有产生触发。检查它怎样离场。'
        else:
            lesson=f'第 {n+60} 个牌序梦羊始终没有进场。先判断起手和检索的差异，再解释这一对的胜负。'
        diary.extend([f'<a id="{key}-{group:02}"></a>', '', f'## {opp} · 牌序 {min(g["number"] for g in block)+60}–{max(g["number"] for g in block)+60}', '',
                      f'本组 {len(block)} 对，S 胜 {block_s}，F 胜 {block_f}。{active} 局触发过梦羊。{lesson}'
                      f'本轮继续共同 S 表，完成三个职业的配对后再决定是否扩大。'
                      f'[逐局复盘]({key}/reviews/{group:02}.md) · [这一局]({key}/games/{n:02}.md)', ''])
        examples.append(f'- {lesson}[实战和录像]({WEB}/{key}/games/{n:02}.md)')
    index.append(f"| {opp} | {rec['n']} | {rec['s']} | {rec['f']} | {rec['up']} | {rec['down']} | {rec['entered']} | {rec['triggered']} |")
    summary[key]=rec
    if rec['n']:
        details.extend(['',*rows,''])
        tips=[f'## {opp}', '',*examples,'']
        skills.extend(tips)
        save(REPO/'skills'/skill_name/'references/sacred-sheep.md',
             ['# 对方有一次伤害防止时怎么出手','','在本方主阶段开始后，检查一次性防止是否已经生效。若争取当回合斩杀，可以先算用小伤害消耗防止后还剩几段。若先交换梦羊，已经取得的本回合防止仍须处理。','',*tips,f'[全部配对]({WEB}/index.md)'])
complete=all(s['n']==10 for s in summary.values())
if complete:
    diff={k:s['s']-s['f'] for k,s in summary.items()}
    expand=sum(diff.values())>0 and diff['zQrwne']>=0 and min(diff['cQZr8Z'],diff['t7B32v'])>=-1
    decision='达到预先登记的扩大验证条件。' if expand else '本次未达到预先登记的扩大验证条件，保留双灾藤 F 作为这一项的对照。'
    index.extend(['',decision]);diary.extend(['## 三十对结论','',decision,''])
else: expand=None
index.extend(['', '触发次数按引擎的自动能力事件计。只有在同一个对手主阶段内观察到同一份防止效果从有效变为用掉时才计一次，跨阶段和回合末到期均略过。',*details])
save(ROOT/'index.md',index)
save(ROOT/'construction.md',diary)
save(REPO/'skills/sve-bishop-matchups/references/sacred-sheep.md',
     ['# 梦羊能挡住哪一段伤害', '', '对自己的 2/3 和单次防止分别估价。下回合对手有几种 1 点伤害，是否必须先用较大的攻击，己方为这张牌推迟了哪一张祈祷或 4 费守护。', '',*skills,f'[每个种子的两份实战]({WEB}/index.md)'])
(ROOT/'summary.json').write_text(json.dumps({'byMatchup':summary,'complete':complete,'expand':expand},ensure_ascii=False,indent=2)+'\n','utf-8')
print({k:(v['n'],v['s'],v['f']) for k,v in summary.items()})
