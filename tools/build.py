#!/usr/bin/env python3
"""Generatore del sito statico Colorificio Papotti.

Legge src/pages/*.html (con front matter), li inserisce nel layout condiviso
(src/partials) e scrive le pagine finali nella radice del progetto.
Dati di contatto, orari e modalità demo stanno in data/site.json.

Uso:
    python3 tools/build.py            # rispetta "demo" in data/site.json
    python3 tools/build.py --no-demo  # genera il sito senza demo (banner, filigrana, noindex)
"""
import html
import json
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
SRC = ROOT / "src"

NAV = [
    ("home", "Home", "index.html"),
    ("soluzioni", "Soluzioni", "soluzioni.html"),
    ("settori", "Settori", None),
    ("marchi", "Marchi", "marchi.html"),
    ("chi-siamo", "Chi siamo", "chi-siamo.html"),
    ("contatti", "Contatti", "contatti.html"),
]
SETTORI = [
    ("edilizia", "Edilizia", "edilizia.html"),
    ("carrozzeria", "Carrozzeria e automotive", "carrozzeria.html"),
    ("industria", "Industria e altri veicoli", "industria.html"),
]


def parse_page(path):
    text = path.read_text(encoding="utf-8")
    m = re.match(r"---\n(.*?)\n---\n(.*)", text, re.S)
    if not m:
        raise SystemExit(f"Front matter mancante in {path}")
    meta = {}
    for line in m.group(1).splitlines():
        if ":" in line:
            k, v = line.split(":", 1)
            meta[k.strip()] = v.strip()
    return meta, m.group(2)


def hours_table(site):
    rows = []
    for h in site["hours"]:
        cls = ' class="is-closed"' if h.get("closed") else ""
        rows.append(f'<div{cls}><dt>{h["days"]}</dt><dd>{h["value"]}</dd></div>')
    return '<dl class="hours">' + "".join(rows) + "</dl>"


def schema_json(site):
    spec = []
    for h in site["hours"]:
        for slot in h.get("slots", []):
            spec.append({
                "@type": "OpeningHoursSpecification",
                "dayOfWeek": h["schema_days"],
                "opens": slot[0],
                "closes": slot[1],
            })
    data = {
        "@context": "https://schema.org",
        "@type": "Store",
        "name": site["name"],
        "legalName": site["legal_name"],
        "vatID": site["vat"],
        "telephone": site["phone_intl"],
        "faxNumber": site["fax_intl"],
        "address": {
            "@type": "PostalAddress",
            "streetAddress": site["street"],
            "postalCode": site["postal_code"],
            "addressLocality": site["city"],
            "addressRegion": site["province"],
            "addressCountry": "IT",
        },
        "openingHoursSpecification": spec,
    }
    return json.dumps(data, ensure_ascii=False, indent=2)


def nav_html(active, mobile=False):
    out = []
    for key, label, href in NAV:
        if key == "settori":
            cur = " is-current" if active in {s[0] for s in SETTORI} else ""
            items = "".join(
                '<li><a href="%s"%s>%s</a></li>'
                % (h, ' aria-current="page"' if active == k else "", l)
                for k, l, h in SETTORI
            )
            out.append(
                f'<li class="nav__item nav__item--sub">'
                f'<button class="nav__link nav__toggle{cur}" type="button" aria-expanded="false" aria-controls="sub-settori">'
                f'{label}<svg class="nav__caret" viewBox="0 0 12 12" aria-hidden="true" width="10" height="10"><path d="M2 4l4 4 4-4" fill="none" stroke="currentColor" stroke-width="1.8"/></svg></button>'
                f'<ul class="nav__sub" id="sub-settori">{items}</ul></li>'
            )
        else:
            cur = ' aria-current="page"' if active == key else ""
            out.append(f'<li class="nav__item"><a class="nav__link" href="{href}"{cur}>{label}</a></li>')
    return "".join(out)


def build(demo_override=None):
    site = json.loads((ROOT / "data" / "site.json").read_text(encoding="utf-8"))
    if demo_override is not None:
        site["demo"] = demo_override
    demo = site["demo"]

    partial = lambda n: (SRC / "partials" / n).read_text(encoding="utf-8")
    layout = partial("layout.html")
    banner = partial("banner.html")
    header = partial("header.html")
    footer = partial("footer.html")

    address = f'{site["street"]}, {site["postal_code"]} {site["city"]} ({site["province"]})'
    tokens = {
        "NAME": site["name"],
        "LEGAL_NAME": site["legal_name"],
        "VAT": site["vat"],
        "PHONE": site["phone_display"],
        "PHONE_INTL": site["phone_intl"],
        "PHONE_TEL": site["phone_tel"],
        "FAX": site["fax_display"],
        "STREET": site["street"],
        "CITY_LINE": f'{site["postal_code"]} {site["city"]} ({site["province"]})',
        "ADDRESS": address,
        "MAPS": site["maps_url"],
        "TRAMONTIS": site["tramontis_url"],
        "HOURS": hours_table(site),
        "SCHEMA": schema_json(site),
    }

    def fill(s, extra=None):
        t = dict(tokens)
        if extra:
            t.update(extra)

        def rep(m):
            k = m.group(1)
            if k not in t:
                raise SystemExit(f"Segnaposto sconosciuto: {{{{{k}}}}}")
            return t[k]
        return re.sub(r"\{\{\s*([A-Z_]+)\s*\}\}", rep, s)

    tokens["CTA"] = fill(partial("cta.html"))

    pages = sorted((SRC / "pages").glob("*.html"))
    for p in pages:
        meta, body = parse_page(p)
        slug = p.name
        nav = meta.get("nav", "")
        title = meta["title"]
        full_title = f"[DEMO] {title}" if demo else title
        robots = '<meta name="robots" content="noindex, nofollow">\n' if demo else ""
        extra = {
            "TITLE": html.escape(full_title, quote=False),
            "DESCRIPTION": html.escape(meta["description"], quote=True),
            "OG_TITLE": html.escape(full_title, quote=True),
            "ROBOTS": robots,
            "DEMO_ATTR": "on" if demo else "off",
            "BANNER": fill(banner) if demo else "",
            "NAV_DESKTOP": nav_html(nav),
            "SECTOR": meta.get("sector", "neutral"),
            "PAGE_CLASS": meta.get("class", ""),
            "BODY": fill(body),
            "SLUG": slug,
        }
        extra["HEADER"] = fill(header, extra)
        extra["FOOTER"] = fill(footer, extra)
        out = fill(layout, extra)
        (ROOT / slug).write_text(out, encoding="utf-8")
        print("scritto", slug)

    return len(pages)


if __name__ == "__main__":
    override = False if "--no-demo" in sys.argv else None
    n = build(override)
    print(f"{n} pagine generate")
