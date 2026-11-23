"""Import public Standard decks and their card faces from SVE Helper into SVE NEXT."""

import argparse
import json
import os
import re
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path
from tempfile import NamedTemporaryFile
from urllib.error import HTTPError
from urllib.parse import quote
from urllib.request import Request, urlopen


SITE = "https://svehelperwin.com"
ART = "https://www.svehelperwin.com"


def query(route, payload):
    req = Request(f"{SITE}/api/{route}", data=json.dumps(payload).encode(),
                  headers={"Content-Type": "application/json", "Accept": "application/json"})
    with urlopen(req, timeout=35) as response:
        body = json.load(response)
    if body["code"] != 200:
        raise ValueError(f"{route}: {body.get('msg', body['code'])}")
    return body["data"]


def save(path, content):
    path.parent.mkdir(parents=True, exist_ok=True)
    with NamedTemporaryFile(dir=path.parent, delete=False) as tmp:
        pending = Path(tmp.name)
        try:
            tmp.write(content)
        except BaseException:
            tmp.close()
            pending.unlink(missing_ok=True)
            raise
    try:
        os.replace(pending, path)
    finally:
        pending.unlink(missing_ok=True)


def json_bytes(value):
    return (json.dumps(value, indent=2, ensure_ascii=False) + "\n").encode()


def face_name(card, back):
    # The website's proxy image filenames retain the original case for SD01–06.
    number = card["card_no"]
    stem = number.replace("LDⓈ", "lds").replace("ldⓈ", "lds")
    early = number.split("-")[0] in {"SD01", "SD02", "SD03", "SD04", "SD05", "SD06"}
    if not early:
        stem = stem.lower()
    if number.startswith(("BP01-", "BP02-")):
        stem = stem.replace("-", "_")
    if stem in {"bp03-u03", "bp03-u04", "bp03-u06"}:
        stem += "-2"
    if card.get("has_back") or back:
        if number.startswith("BP08-"):
            stem += "_back" if back else "_front"
        elif back:
            stem += "_ura"
    return quote(card["from"], safe="") + "/" + quote(stem, safe="")


def card_art(folder, card, back):
    name = card["card_no"] + ("_back" if back else "")
    if any((folder / f"{name}.{ext}").is_file() for ext in ("png", "jpg", "jpeg", "webp", "gif", "avif")):
        return
    suffix = face_name(card, back)
    for prefix, ext, signature in (("static-images-origin", "png", b"\x89PNG\r\n\x1a\n"),
                                   ("static-images", "jpg", b"\xff\xd8\xff")):
        try:
            with urlopen(f"{ART}/{prefix}/{suffix}.{ext}", timeout=35) as response:
                image = response.read()
        except HTTPError as exc:
            if exc.code == 404:
                continue
            raise
        if image.startswith(signature):
            save(folder / f"{name}.{ext}", image)
            return
    raise ValueError(f"SVE Helper has no readable image for {name}")


def definitions(root):
    result = {}
    for file in (root / "packages/core/data").glob("*.json"):
        data = json.loads(file.read_text(encoding="utf-8"))
        if data.get("format") == 2:
            for card in data["cards"]:
                for printing in [card["id"], *card["printings"]]:
                    result[printing] = (data["set"], card)
    if not result:
        raise ValueError("Run from the ShadowverseEvolve-NEXT checkout or pass --repo.")
    return result


def import_deck(key, pc, catalog):
    if not re.fullmatch(r"[A-Za-z0-9]+", key):
        raise ValueError(f"Invalid SVE Helper deck key: {key}")
    deck = query("deck/getDeckByKey", {"key": key, "view": False})
    if deck["key"] != key or deck["type"] != "Basic" or deck.get("glory_card_no"):
        raise ValueError(f"{key}: expected a public Basic deck for a Standard match.")
    main, evolve, leader = deck["basic_deck"], deck["evo_deck"], deck["leader_card_no"]
    needed = {leader, *main, *evolve}
    unknown = needed.difference(catalog)
    if unknown:
        raise ValueError(f"{key}: printings missing in this engine: {sorted(unknown)}")
    for counts in (main, evolve):
        if any(type(count) is not int or count < 1 for count in counts.values()):
            raise ValueError(f"{key}: invalid card count")
    target = pc / "decks" / "svehelper" / f"{key}.json"
    converted = {"format": "sve-deck", "version": 1, "name": f"{deck['name']} [{key}]",
                 "leader": leader, "main": main, "evolve": evolve,
                 "notes": f"SVE Helper · {SITE}/ · 查看卡组 · {key}"}
    if target.exists() and json.loads(target.read_text(encoding="utf-8-sig")) != converted:
        raise ValueError(f"{target} differs from the website. Preserve your edits under another name before reimporting.")

    rows = query("deck/getDeckCardsByKey", {"key": key})
    cards = {row["card"]["card_no"]: row["card"] for row in rows if row["card"]["card_no"] in needed}
    if missing := needed.difference(cards):
        raise ValueError(f"{key}: card details missing on SVE Helper: {sorted(missing)}")
    faces = install_resources(cards, pc, catalog)
    if not target.exists():
        save(target, json_bytes(converted))
    print(f"{converted['name']} · main {sum(main.values())} · evolve {sum(evolve.values())} · art {faces} · {target}")


def install_resources(cards, pc, catalog):
    related = {no for card in cards.values() for no in re.split(r"[,，;\s]+", card.get("related_card_nos") or "")}
    for no in sorted(related.difference(cards)):
        if no in catalog and catalog[no][1]["token"]:
            cards[no] = query("card/getCardDetail", {"card_no": no})
    texts = {}
    faces = []
    for no, card in cards.items():
        if card["card_no"] != no:
            raise ValueError(f"Wrong card detail for {no}")
        faces.append((card, False))
        face_data = [(no, card)]
        if card.get("has_back"):
            faces.append((card, True))
            if no + "_back" in catalog:
                face_data.append((no + "_back", query("backCard/getCardByCardNo", {"card_no": no})))
        for printing, face in face_data:
            set_id, definition = catalog[printing]
            for field, lang in (("desc_cn", "cn"), ("desc_jp", "ja")):
                if isinstance(face.get(field), str) and face[field]:
                    texts.setdefault((set_id, lang), {})[definition["id"]] = face[field]
    with ThreadPoolExecutor(max_workers=4) as pool:
        jobs = [pool.submit(card_art, pc / "public/images/cards", card, back) for card, back in faces]
        for job in jobs:
            job.result()
    for (set_id, lang), additions in texts.items():
        path = pc / "public/text" / f"{set_id}_{lang}.json"
        file = (json.loads(path.read_text(encoding="utf-8-sig")) if path.exists()
                else {"format": 1, "set": set_id, "lang": lang, "cards": {}})
        if (file["format"], file["set"], file["lang"]) != (1, set_id, lang):
            raise ValueError(f"Unrecognized custom text file: {path}")
        for card_id, effect in additions.items():
            file["cards"].setdefault(card_id, effect)
        save(path, json_bytes(file))
    return len(faces)


def local_deck(path, pc, catalog):
    deck = json.loads(path.read_text(encoding="utf-8-sig"))
    if deck.get("format") != "sve-deck":
        raise ValueError(f"{path}: expected an SVE NEXT deck")
    printings = sorted({deck["leader"], *deck["main"], *deck["evolve"]})
    if missing := set(printings).difference(catalog):
        raise ValueError(f"{path}: unknown printings {sorted(missing)}")
    with ThreadPoolExecutor(max_workers=4) as pool:
        rows = pool.map(lambda no: query("card/getCardDetail", {"card_no": no}), printings)
        cards = dict(zip(printings, rows))
    faces = install_resources(cards, pc, catalog)
    print(f"{deck['name']} · {len(printings)} printings · {faces} faces")


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("keys", nargs="*", help="case-sensitive SVE Helper public deck keys")
    parser.add_argument("--repo", type=Path, default=Path.cwd())
    parser.add_argument("--pc", type=Path, help="PC release directory (default: <repo>/dist/pc)")
    parser.add_argument("--deck-file", action="append", type=Path, default=[],
                        help="install art and rules text for an existing SVE NEXT deck; repeatable")
    args = parser.parse_args()
    if not args.keys and not args.deck_file:
        rows = query("deck/getDeckList", {"pageable": {"offset": 0, "limit": 25}})["list"]
        for row in rows:
            print(row["key"], row["type"], row["name"])
        return
    pc = args.pc or args.repo / "dist/pc"
    if not (pc / "server.mjs").is_file():
        parser.error(f"No PC release at {pc}")
    catalog = definitions(args.repo)
    for key in args.keys:
        import_deck(key, pc, catalog)
    for path in args.deck_file:
        local_deck(path, pc, catalog)


if __name__ == "__main__":
    main()
