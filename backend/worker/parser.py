from typing import List, Dict
import re

OPS = [
    "Стари град","Савски венац","Врачар","Звездара","Палилула","Вождовац",
    "Чукарица","Раковица","Нови Београд","Земун","Гроцка","Барајево",
    "Сурчин","Сопот","Младеновац","Обреновац","Лазаревац"
]

TIME_RE = re.compile(r"До\s+(\d{1,2})[:.](\d{2})", flags=re.U | re.I)
OPS_RE = re.compile(r"(?P<opstina>" + "|".join(map(re.escape, OPS)) + r")\s*:\s*", flags=re.U)

# markers where we should STOP (we only want the outages list, not tankers or share widgets)
STOP_MARKERS = [
    "Распоред аутоцистерни", "Распоред цистерни",  # tanker schedule
    "Подели садржај", "Подели на", "Share on", "Podeli",  # share widgets (various langs)
]

def _normalize(s: str) -> str:
    return re.sub(r"\s+", " ", s).strip()

def _clip_bvk_region(full: str) -> str:
    """
    Keep only the outages block:
    - start at the first 'До HH:MM' (if present) or the first municipality
    - stop at the first STOP_MARKER (if present)
    """
    s = _normalize(full)

    # find start
    mtime = TIME_RE.search(s)
    mops  = OPS_RE.search(s)
    start_idx = None
    if mtime: start_idx = mtime.start()
    if mops:
        start_idx = min(start_idx, mops.start()) if start_idx is not None else mops.start()
    if start_idx is None:
        start_idx = 0  # fallback

    # find stop
    stops = [s.find(k) for k in STOP_MARKERS if s.find(k) != -1]
    stop_idx = min(stops) if stops else len(s)

    clipped = s[start_idx:stop_idx]
    # remove “share” fragments that slipped through
    clipped = re.sub(r"(Подели\s+садржај.*)$", "", clipped, flags=re.U | re.I)
    return clipped.strip(" ,;–-")

def parse_bvk(text: str) -> List[Dict]:
    s = re.sub(r"\s+", " ", text).strip()

    mtime = TIME_RE.search(s)
    until = f"{mtime.group(1).zfill(2)}:{mtime.group(2)}" if mtime else None

    items: List[Dict] = []
    matches = list(OPS_RE.finditer(s))
    if not matches:
        return items

    for i, m in enumerate(matches):
        opst = m.group("opstina")
        start = m.end()
        end = matches[i + 1].start() if i + 1 < len(matches) else len(s)
        seg = s[start:end].strip(" ,;–-")

        addrs = [a.strip(" ,;–-") for a in re.split(r",\s*", seg) if a.strip()]
        for addr in addrs:
            # " - " into a comma
            addr = re.sub(r"\s+–\s+", ", ", addr)
            addr = re.sub(r"\s+-\s+", ", ", addr)
            addr = re.sub(r"\s{2,}", " ", addr).strip(" ,;–-")

            title = f"{opst}: {addr}"
            desc = f"До {until} — {title}" if until else title
            items.append({
                "title": title,
                "description": desc,
                "address_text": f"{opst}, {addr}",
            })
    return items

def parse(source_name: str, text: str) -> List[Dict]:
    if source_name == "BVK":
        return parse_bvk(text)
    return []
