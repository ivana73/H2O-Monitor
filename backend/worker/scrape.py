# backend/worker/scrape.py
from dataclasses import dataclass
from bs4 import BeautifulSoup, NavigableString
import hashlib, re, requests
from datetime import datetime
try:
    from zoneinfo import ZoneInfo  # py3.9+
except Exception:
    ZoneInfo = None
import requests
from pathlib import Path
from dotenv import load_dotenv
import os

BASE_DIR = Path(__file__).resolve().parents[1]
load_dotenv(BASE_DIR / ".env")

GEOAPIFY_KEY = os.getenv("GEOAPIFY_KEY")

HEADERS = {"User-Agent": "H2O-Monitor/1.0 (contact: you@example.com)"}

@dataclass
class Source:
    name: str
    url: str
    selector: str  # unused

SOURCES = [
    Source("BVK", "https://www.bvk.rs/kvarovi-na-mrezi/", ""),
]

TITLE_CANDIDATES = [
    ".elementor-accordion-title",
    ".elementor-tab-title",
    ".elementor-toggle-title",
    ".elementor-accordion-item .elementor-accordion-title",
    ".elementor-toggle-item .elementor-toggle-title",
    "[role='tab']",
    "button[aria-controls]",
    "a[aria-controls]",
    "h1", "h2", "h3", "h4",
]
CONTENT_CANDIDATES = [
    ".elementor-tab-content",
    ".elementor-accordion-content",
]

def geocode_address(address):
    url = "https://api.geoapify.com/v1/geocode/search"
    params = {
        "text": f"Beograd, Serbia, {address}",
        "apiKey": GEOAPIFY_KEY
    }

    try:
        response = requests.get(url, params=params)
        response.raise_for_status()
        data = response.json()

        if data["features"]:
            coords = data["features"][0]["geometry"]["coordinates"]
            return coords[1], coords[0]  # lat, lon
    except Exception as e:
        print(f"Geocoding failed: {e}")

    return None, None

def _belgrade_today() -> tuple[int, int, int]:
    now = datetime.now(ZoneInfo("Europe/Belgrade")) if ZoneInfo else datetime.now()
    return now.day, now.month, now.year

def _norm(s: str) -> str:
    return " ".join(s.replace("\xa0", " ").split())

def _build_date_regex_fuzzy(day: int, mon: int, year: int) -> re.Pattern:
    """
    Match things like:
      '06.10.2025.', '06 . 10 . 2025', '6. 10. 2025. (понедељак)', etc.
    - allow optional leading 0 on day/month
    - allow spaces around separators
    - allow '.', '-', or '/' as separators
    - optional trailing dot and optional short suffix/weekday
    """
    d = fr"(?:{day:02d}|{day})"
    m = fr"(?:{mon:02d}|{mon})"
    sep = r"(?:\s*[.\-/]\s*)"
    base = fr"{d}{sep}{m}{sep}{year}"
    tail = r"(?:\.)?(?:\s*(?:год\.?|године))?(?:\s*\([^)]+\))?"
    return re.compile(base + tail, flags=re.U | re.I)

def _find_date_title(soup: BeautifulSoup, date_re: re.Pattern):
    # Search candidate “title” elements first
    for sel in TITLE_CANDIDATES:
        for el in soup.select(sel):
            txt = _norm(el.get_text(" ", strip=True))
            if date_re.search(txt):
                return el, sel, txt
    # If still not found, do a broader search over all elements (lightweight)
    for el in soup.find_all(True):
        txt = _norm(el.get_text(" ", strip=True))
        if txt and date_re.search(txt):
            return el, "(any-element)", txt
    return None, "(no-date-title)", ""

def _iter_meaningful_siblings(node):
    sib = node.next_sibling
    while sib is not None:
        if isinstance(sib, NavigableString):
            if _norm(str(sib)) == "":
                sib = sib.next_sibling
                continue
        yield sib
        sib = sib.next_sibling

def _find_content_for_title(title_el, soup: BeautifulSoup):
    # 1) aria-controls → panel
    ac = title_el.get("aria-controls")
    if ac:
        panel = soup.select_one(f"#{ac}")
        if panel and panel.get_text(strip=True):
            return panel, f"aria-controls→#{ac}"

    # 2) next few siblings (self or inner content)
    for idx, sib in enumerate(_iter_meaningful_siblings(title_el)):
        if getattr(sib, "name", None) in {"script", "style"}:
            continue
        if hasattr(sib, "get") and sib.get("class"):
            classes = " ".join(sib.get("class", []))
            for sel in CONTENT_CANDIDATES:
                cls = sel.strip(".")
                if cls in classes and sib.get_text(strip=True):
                    return sib, f"next-sibling[{idx}] self→{sel}"
        for sel in CONTENT_CANDIDATES:
            inner = getattr(sib, "select_one", lambda _s: None)(sel)
            if inner and inner.get_text(strip=True):
                return inner, f"next-sibling[{idx}] inner→{sel}"
        if idx >= 6:  # don’t scan too far
            break

    # 3) parent item → inner content
    parent = title_el.find_parent(lambda tag: tag.has_attr("class") and any(
        key in " ".join(tag.get("class", []))
        for key in ["elementor-accordion-item", "elementor-toggle-item"]
    ))
    if parent:
        for sel in CONTENT_CANDIDATES:
            node = parent.select_one(sel)
            if node and node.get_text(strip=True):
                return node, f"parent-item→{sel}"

    return None, "(date-title-found-but-no-content)"

def section_hash(html: str, _unused_selector: str):
    soup = BeautifulSoup(html, "lxml")
    d, m, y = _belgrade_today()
    date_re = _build_date_regex_fuzzy(d, m, y)

    title_el, title_sel, title_text = _find_date_title(soup, date_re)
    if not title_el:
        used = f"{title_sel} expected≈{d:02d}.{m:02d}.{y}."
        return None, "", used

    content_node, how = _find_content_for_title(title_el, soup)
    if not content_node:
        used = f"title={title_sel} title_text='{title_text}' {how}"
        return None, "", used

    text = _norm(content_node.get_text("\n", strip=True))
    h = hashlib.sha1(text.encode("utf-8")).hexdigest()
    used = f"title={title_sel} title_text='{title_text}' {how}"
    return h, text, used

def fetch(url: str, etag: str | None, last_modified: str | None):
    headers = HEADERS.copy()
    if etag: headers["If-None-Match"] = etag
    if last_modified: headers["If-Modified-Since"] = last_modified
    return requests.get(url, headers=headers, timeout=20)
