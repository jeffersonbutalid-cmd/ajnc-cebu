#!/usr/bin/env python3
"""
Bake assets/globe-points.js from the AJNC seal artwork.

Maps the seal's orthographic globe (assets/ajnc-seal-mark.png) onto a 3D
hemisphere of dots: every sampled pixel inside the globe disk becomes a unit
vector on the front hemisphere, classified land (yellow/green) or ocean
(blue). The red "APOSTOLIC JESUS NAME CHURCH" lettering is inpainted from
neighbouring pixels first so it doesn't punch holes in the continents. A
procedural back hemisphere of ocean dots keeps the limb from looking empty
when the globe sways. Also finds the Philippines beacon position and arc
endpoints (land centroids per region) for the "carry the gospel" beams.

Output: window.AJNC_GLOBE = { pts (base64 Int16 xyz, scale 32000),
land (base64 Uint8 flags), beacon, arcs } in assets/globe-points.js.
"""
import base64
import struct
import numpy as np
from PIL import Image

SRC = "assets/ajnc-seal-mark.png"
OUT = "assets/globe-points.js"

im = Image.open(SRC).convert("RGBA")
a = np.array(im).astype(np.int16)
H, W = a.shape[:2]
r, g, b, al = a[..., 0], a[..., 1], a[..., 2], a[..., 3]
opaque = al > 100

# ---- locate the globe disk from globe-only colours ----
yellow = (r > 170) & (g > 140) & (b < 150) & opaque
green = (g > 110) & (g > r) & (g > b) & (b < 170) & opaque
red = (r > 140) & (g < 90) & (b < 90) & opaque
blue = (b > 120) & (b > r) & (b > g) & opaque
globe_px = yellow | green | blue | red
ys, xs = np.where(globe_px)
cx, cy = (xs.min() + xs.max()) / 2.0, (ys.min() + ys.max()) / 2.0
R = max(xs.max() - xs.min(), ys.max() - ys.min()) / 2.0
print(f"disk centre ({cx:.0f},{cy:.0f}) radius {R:.0f}")

# ---- inpaint the lettering: iterative nearest-neighbour fill ----
# The red letters AND their pale outlines (and any other unclassified pixel
# inside the disk, e.g. anti-aliased strokes) must all be refilled from the
# surrounding map, or the text imprints itself into the dot cloud.
cls = np.full((H, W), -1, dtype=np.int8)  # -1 unknown / 0 ocean / 1 land
cls[blue] = 0
cls[yellow | green] = 1
YY, XX = np.mgrid[0:H, 0:W]
inside = ((XX - cx) ** 2 + (YY - cy) ** 2) <= (R * 0.995) ** 2
need = inside & (cls < 0)
for _ in range(160):
    if not need.any():
        break
    known = cls >= 0
    # vote from 4-neighbours
    votes = np.zeros((H, W), dtype=np.int16)
    cnts = np.zeros((H, W), dtype=np.int16)
    for dy, dx in ((1, 0), (-1, 0), (0, 1), (0, -1)):
        sh_k = np.roll(known, (dy, dx), (0, 1))
        sh_c = np.roll(cls, (dy, dx), (0, 1))
        m = need & sh_k
        votes[m] += (sh_c[m] == 1)
        cnts[m] += 1
    done = need & (cnts > 0)
    cls[done] = (votes[done] * 2 > cnts[done]).astype(np.int8)
    need[done] = False
print(f"inpainted lettering; unknown left: {int(need.sum())}")

# ---- sample the disk into dots ----
GRID = 105  # dots across the diameter
step = (2.0 * R) / GRID
pts, land = [], []
yy = cy - R
while yy <= cy + R:
    # offset alternate rows for a hex-ish lattice
    row = int((yy - (cy - R)) / step)
    x0 = cx - R + (step / 2 if row % 2 else 0)
    xx = x0
    while xx <= cx + R:
        u = (xx - cx) / R
        v = (cy - yy) / R  # flip: image y down -> world y up
        d2 = u * u + v * v
        if d2 <= 0.985:  # trim the very limb (anti-aliased edge)
            xi, yi = int(round(xx)), int(round(yy))
            if 0 <= xi < W and 0 <= yi < H and cls[yi, xi] >= 0:
                z = np.sqrt(max(0.0, 1.0 - d2))
                pts.append((u, v, z))
                land.append(int(cls[yi, xi]))
        xx += step
    yy += step
n_front = len(pts)
print(f"front hemisphere dots: {n_front} (land {sum(land)})")

# ---- procedural back hemisphere (ocean) ----
N_BACK = 2600
ga = np.pi * (3.0 - np.sqrt(5.0))
for i in range(N_BACK):
    z = -(i + 0.5) / N_BACK  # z in (-1, 0)
    rho = np.sqrt(1.0 - z * z)
    th = ga * i
    pts.append((rho * np.cos(th), rho * np.sin(th), z))
    land.append(0)
print(f"total dots: {len(pts)}")


def centroid_in(u0, u1, v0, v1, want_land=True):
    """Centroid of land dots within a normalized disk window."""
    sel = [p for p, l in zip(pts[:n_front], land[:n_front])
           if l == (1 if want_land else 0) and u0 <= p[0] <= u1 and v0 <= p[1] <= v1]
    if not sel:
        u, v = (u0 + u1) / 2, (v0 + v1) / 2
        z = np.sqrt(max(0.0, 1.0 - u * u - v * v))
        return (u, v, z)
    m = np.mean(np.array(sel), axis=0)
    m = m / np.linalg.norm(m)
    return tuple(float(x) for x in m)


# ---- Philippines beacon: centroid of the archipelago cluster ----
beacon = centroid_in(0.30, 0.52, -0.18, 0.08)
print(f"beacon (Philippines): {tuple(round(x, 3) for x in beacon)}")

# ---- arc endpoints: land centroids per world region on the seal ----
arcs = [
    centroid_in(0.38, 0.72, 0.28, 0.62),    # Japan / NE Asia
    centroid_in(0.30, 0.85, -0.85, -0.45),  # Australia
    centroid_in(-0.35, -0.02, -0.10, 0.22), # India / South Asia
    centroid_in(-0.80, -0.42, 0.02, 0.38),  # Middle East
    centroid_in(-0.92, -0.55, -0.45, -0.05),# Africa
    centroid_in(-0.15, 0.28, 0.32, 0.66),   # China / Central Asia
    centroid_in(-0.72, -0.30, 0.45, 0.80),  # Europe / Russia (top-left)
    centroid_in(0.55, 0.95, -0.25, 0.15),   # Pacific islands (ocean ok)
]
for i, e in enumerate(arcs):
    print(f"arc {i}: {tuple(round(x, 3) for x in e)}")


def b64_i16(seq):
    flat = []
    for p in seq:
        flat.extend(int(round(c * 32000)) for c in p)
    return base64.b64encode(struct.pack(f"<{len(flat)}h", *flat)).decode()


def b64_u8(seq):
    return base64.b64encode(bytes(seq)).decode()


js = (
    "/* AUTO-GENERATED by scripts/bake-globe.py from assets/ajnc-seal-mark.png.\n"
    "   3D dot-cloud of the AJNC seal globe: front hemisphere sampled from the\n"
    "   actual seal artwork (land/ocean), procedural ocean back hemisphere,\n"
    "   Philippines beacon, and arc endpoints. Do not edit by hand. */\n"
    "window.AJNC_GLOBE = {\n"
    f"  count: {len(pts)},\n"
    f"  frontCount: {n_front},\n"
    '  pts: "' + b64_i16(pts) + '",\n'
    '  land: "' + b64_u8(land) + '",\n'
    f"  beacon: [{beacon[0]:.4f}, {beacon[1]:.4f}, {beacon[2]:.4f}],\n"
    "  arcs: [\n"
    + ",\n".join(f"    [{e[0]:.4f}, {e[1]:.4f}, {e[2]:.4f}]" for e in arcs)
    + "\n  ]\n};\n"
)
with open(OUT, "w") as f:
    f.write(js)
import os
print(f"wrote {OUT}: {os.path.getsize(OUT) // 1024} KB")
