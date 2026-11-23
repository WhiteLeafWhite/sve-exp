"""Install the archived BP20 practice replays into a SVE NEXT desktop release."""
import argparse
import json
import os
import tempfile
from collections import Counter
from pathlib import Path

SERIES = {
    '08-bp20-hard-150': 'BP20', '09-bp20-fixed-300': 'BP20-fixed',
    '09b-bp20-lyrial': 'BP20-lyrial', '09c-bp20-dragon-policy': 'BP20-r4',
    '09d-bp20-banish': 'BP20-banish', '10-agent-duels': 'BP20-agents',
    '11-dragon-mulligan/candidate': 'BP20-opening-r5', '11-dragon-mulligan/control': 'BP20-opening-r3',
    '12-second-saito/candidate': 'BP20-saito-F', '12-second-saito/control': 'BP20-saito-B',
    '13-sacred-sheep': 'BP20-sheep',
    '14-trained-pilot': 'BP20-trained',
}


def install(source, dest):
    payload = source.read_bytes()
    replay = json.loads(payload)
    if replay.get('format') != 'sve-replay' or not replay.get('info', {}).get('result') or not replay.get('inputs'):
        raise ValueError(f'Incomplete native replay at {source}')
    if not dest.exists():
        # The server can list the replay directory while this importer is running.
        # Publish only a complete file and preserve an existing user recording.
        with tempfile.NamedTemporaryFile(dir=dest.parent, prefix='.sve-', suffix='.tmp', delete=False) as temp:
            path = Path(temp.name)
            try:
                temp.write(payload)
            except BaseException:
                temp.close()
                path.unlink(missing_ok=True)
                raise
        try:
            try:
                if os.name == 'nt':
                    path.rename(dest)
                else:
                    os.link(path, dest)
            except FileExistsError:
                pass
        finally:
            path.unlink(missing_ok=True)
    if dest.read_bytes() != payload:
        raise ValueError(f'Different replay already exists at {dest}. Choose a separate desktop directory.')


def main():
    ap = argparse.ArgumentParser(description=__doc__)
    ap.add_argument('archive', type=Path, help='WhiteLeafWhite/sve-exp checkout')
    ap.add_argument('pc', type=Path, help='SVE NEXT desktop directory containing server.mjs')
    args = ap.parse_args()
    if not (args.pc/'server.mjs').is_file() or not (args.archive/'batches/08-bp20-hard-150').is_dir():
        ap.error('Pass the sve-exp checkout and an existing SVE NEXT desktop release.')
    dst = args.pc/'replays'
    dst.mkdir(exist_ok=True)
    counts = Counter()
    for path, prefix in SERIES.items():
        series = args.archive/'batches'/path
        for key in ('cQZr8Z', 'zQrwne', 't7B32v'):
            for source in sorted((series/key/'replays').glob('*.json')):
                install(source, dst/f'{prefix}-{key}-{source.name}')
                counts[prefix] += 1
        for source in sorted((series/'drills').glob('*.json')):
            install(source, dst/f'{prefix}-drill-{source.name}')
            counts['重练分支'] += 1
    print(json.dumps(counts, ensure_ascii=False))


if __name__ == '__main__':
    main()
