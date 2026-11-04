#!/usr/bin/env python3
"""Regenerate the Seclusa Convert icons.

    python3 tools/make_icons.py

Needs Pillow. Mark: white bidirectional convert arrows on black.
"""

from pathlib import Path

from PIL import Image, ImageDraw

HERE = Path(__file__).resolve().parent
ICONS = HERE.parent / "static" / "icons"

SIZE = 1024
BG = (10, 10, 10, 255)
FG = (255, 255, 255, 255)


def draw_mark(canvas_size, colour=FG):
    """Two opposing arrows (⇄) — the convert gesture — on a transparent canvas."""
    s = canvas_size
    layer = Image.new("RGBA", (s, s), (0, 0, 0, 0))
    d = ImageDraw.Draw(layer)

    stroke = max(int(s * 0.085), 3)
    head = int(s * 0.13)
    left = int(s * 0.22)
    right = int(s * 0.78)
    y_top = int(s * 0.38)
    y_bot = int(s * 0.62)

    # Top arrow →
    d.line([(left, y_top), (right - head // 2, y_top)], fill=colour, width=stroke)
    d.polygon(
        [
            (right, y_top),
            (right - head, y_top - head // 2),
            (right - head, y_top + head // 2),
        ],
        fill=colour,
    )

    # Bottom arrow ←
    d.line([(right, y_bot), (left + head // 2, y_bot)], fill=colour, width=stroke)
    d.polygon(
        [
            (left, y_bot),
            (left + head, y_bot - head // 2),
            (left + head, y_bot + head // 2),
        ],
        fill=colour,
    )
    return layer


def round_corners(img, radius):
    mask = Image.new("L", img.size, 0)
    ImageDraw.Draw(mask).rounded_rectangle(
        [0, 0, img.size[0] - 1, img.size[1] - 1], radius=radius, fill=255
    )
    out = img.copy()
    out.putalpha(mask)
    return out


def make_tile(size):
    field = Image.new("RGBA", (size, size), BG)
    mark = draw_mark(size, FG)
    field.paste(mark, (0, 0), mark)
    return round_corners(field, int(size * 0.2))


def make_maskable(size):
    """Solid bleed to the edges; mark inset to the safe ~72% zone."""
    out = Image.new("RGBA", (size, size), BG)
    inner = int(size * 0.72)
    mark = draw_mark(inner, FG)
    off = (size - inner) // 2
    out.paste(mark, (off, off), mark)
    return out


SVG = """<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1024 1024" role="img" aria-label="Seclusa Convert">
  <rect width="1024" height="1024" rx="200" fill="#0a0a0a"/>
  <path d="M225 389 H700" fill="none" stroke="#ffffff" stroke-width="88" stroke-linecap="butt"/>
  <path d="M798 389 L665 320 V458 Z" fill="#ffffff"/>
  <path d="M799 635 H324" fill="none" stroke="#ffffff" stroke-width="88" stroke-linecap="butt"/>
  <path d="M226 635 L359 566 V704 Z" fill="#ffffff"/>
</svg>
"""


def main():
    ICONS.mkdir(parents=True, exist_ok=True)

    for size in (192, 512):
        make_tile(size).save(ICONS / f"icon-{size}.png")

    make_maskable(512).save(ICONS / "icon-maskable-512.png")
    (ICONS / "icon.svg").write_text(SVG, encoding="utf-8")

    for name in ("icon-192.png", "icon-512.png", "icon-maskable-512.png", "icon.svg"):
        print(f"static/icons/{name}")


if __name__ == "__main__":
    main()
