#!/usr/bin/env python3
"""
Bake assets/globe-points.js from real geography (Natural Earth land-110m via
the world-atlas npm package) instead of the seal artwork.

Generates a full-sphere dot globe in latitude rings (GitHub-globe style),
classifies each dot land/ocean by ray-casting against the Natural Earth land
polygons, then rotates the whole sphere so the Philippines faces the camera
slightly right of centre with north up. The beacon sits on Cebu; arc endpoints
are real cities where the AJNC family worships or is reaching.

Output format matches the original baker (globe3d.js needs no changes).
Requires: /tmp/atlas/package/land-110m.json (npm pack world-atlas@2.0.2).
"""
import base64
import json
import struct
import numpy as np

SRC = "/tmp/atlas/package/land-110m.json"
OUT = "assets/globe-points.js"

# ---- decode TopoJSON ----
topo = json.load(open(SRC))
sx, sy = topo["transform"]["scale"]
tx, ty = topo["transform"]["translate"]

def decode_arc(arc):
    pts, x, y = [], 0, 0
    for dx, dy in arc:
        x += dx; y += dy
        pts.append((x * sx + tx, y * sy + ty))
    return pts

ARCS = [decode_arc(a) for a in topo["arcs"]]

def ring_coords(arc_indexes):
    ring = []
    for idx in arc_indexes:
        pts = ARCS[idx] if idx >= 0 else ARCS[~idx][::-1]
        ring.extend(pts if not ring else pts[1:])
    return ring

rings = []
land = topo["objects"]["land"]
geoms = land["geometries"] if land["type"] == "GeometryCollection" else [land]
for g in geoms:
    polys = g["arcs"] if g["type"] == "MultiPolygon" else [g["arcs"]]
    for poly in polys:
        for ring in poly:
            rings.append(ring_coords(ring))
print(f"land rings: {len(rings)}, total vertices: {sum(len(r) for r in rings)}")

# ---- generate dots: latitude rings, density scaled by circumference ----
ROWS = 110
EQUATOR_N = 240
lats, lons = [], []
for r in range(ROWS + 1):
    # tiny irrational offset keeps sample rows off polygon-vertex latitudes
    # (exact equality flips ray-cast parity and paints false land stripes)
    lat = min(89.99, max(-89.99, -90.0 + 180.0 * r / ROWS + 0.0137))
    n = max(1, int(round(np.cos(np.radians(lat)) * EQUATOR_N)))
    off = (r % 2) * (180.0 / n)  # stagger alternate rows
    for k in range(n):
        lats.append(lat)
        lons.append(-180.0 + 360.0 * k / n + off)
P_lat = np.array(lats)
P_lon = np.array(lons)
print(f"dots: {len(P_lat)}")

# ---- land classification: vectorised ray cast over all ring edges ----
# Rings that cross the antimeridian (e.g. Fiji: +179.4 jumping to -180) have a
# phantom 359-degree edge in naive planar space that breaks parity for their
# whole latitude band. Unwrap those into continuous longitude space and test
# each point at lon, lon+360, lon-360. Polar caps (Antarctica spans all
# longitudes) are left in the naive domain, where their seam edges cancel.
def unwrap(ring):
    out = [ring[0]]
    for x, y in ring[1:]:
        px = out[-1][0]
        while x - px > 180: x -= 360
        while x - px < -180: x += 360
        out.append((x, y))
    return out

def parity(ring_arr, Plon, Plat):
    x1, y1 = ring_arr[:-1, 0], ring_arr[:-1, 1]
    x2, y2 = ring_arr[1:, 0], ring_arr[1:, 1]
    cond = (y1 > Plat) != (y2 > Plat)
    with np.errstate(divide="ignore", invalid="ignore"):
        xint = (x2 - x1) * (Plat - y1) / (y2 - y1) + x1
    return (cond & (Plon < xint)).sum(axis=1) % 2

inside = np.zeros(len(P_lat), dtype=bool)
n_seam = 0
for ring in rings:
    arr = np.array(ring)
    jumps = np.abs(np.diff(arr[:, 0])) > 180
    uw = np.array(unwrap(ring)) if jumps.any() else arr
    seam = jumps.any() and (uw[:, 0].max() - uw[:, 0].min()) < 350
    if seam: n_seam += 1
    use = uw if seam else arr
    for s in range(0, len(P_lat), 4000):
        Plon = P_lon[s:s+4000, None]
        Plat = P_lat[s:s+4000, None]
        p = parity(use, Plon, Plat)
        if seam:
            p = p + parity(use, Plon + 360, Plat) + parity(use, Plon - 360, Plat)
        inside[s:s+4000] ^= (p % 2).astype(bool)
print(f"seam-crossing rings unwrapped: {n_seam}")
land_flags = inside
print(f"land dots: {int(land_flags.sum())} ({100*land_flags.mean():.0f}%)")

# ---- lat/lon -> xyz (y up; -sin(lon) keeps east on screen-right when
# viewed from outside the sphere, i.e. no east-west mirroring) ----
def to_xyz(lat, lon):
    la, lo = np.radians(lat), np.radians(lon)
    return np.stack([np.cos(la) * np.cos(lo), np.sin(la), -np.cos(la) * np.sin(lo)], axis=-1)

XYZ = to_xyz(P_lat, P_lon)

# ---- no baked rotation: north pole stays exactly +y so the renderer can
# spin the globe continuously about the true Earth axis (like a desk globe).
# globe3d.js computes the initial yaw that brings the beacon front-centre. ----
CEBU = (10.3157, 123.8854)
R = np.eye(3)
beacon = R @ to_xyz(*CEBU)
print(f"beacon (Cebu, unrotated frame): {tuple(round(float(x), 3) for x in beacon)}")

# ---- arc endpoints: real cities ----
CITIES = [
    ("Phnom Penh", 11.556, 104.928),
    ("Dubai",      25.204,  55.270),
    ("Tokyo",      35.676, 139.650),
    ("Sydney",    -33.868, 151.209),
    ("Delhi",      28.614,  77.209),
    ("Jakarta",    -6.175, 106.827),
    ("Seoul",      37.566, 126.978),
    ("Nairobi",    -1.292,  36.822),
]
arcs = []
for name, la, lo in CITIES:
    v = R @ to_xyz(la, lo)
    arcs.append(v)
    print(f"arc {name}: {tuple(round(float(x), 3) for x in v)}")

# ---- pack ----
def b64_i16(arr):
    flat = np.clip(np.round(np.asarray(arr).reshape(-1) * 32000), -32767, 32767).astype("<i2")
    return base64.b64encode(flat.tobytes()).decode()

def b64_u8(seq):
    return base64.b64encode(bytes(int(v) for v in seq)).decode()

N = len(P_lat)
js = (
    "/* AUTO-GENERATED by scripts/bake-globe-world.py from Natural Earth\n"
    "   land-110m (world-atlas npm package). Real full-sphere geography,\n"
    "   Philippines-centred, beacon on Cebu, arcs to real cities.\n"
    "   Do not edit by hand. */\n"
    "window.AJNC_GLOBE = {\n"
    f"  count: {N},\n"
    f"  frontCount: {N},\n"
    '  pts: "' + b64_i16(XYZ) + '",\n'
    '  land: "' + b64_u8(land_flags) + '",\n'
    f"  beacon: [{beacon[0]:.4f}, {beacon[1]:.4f}, {beacon[2]:.4f}],\n"
    "  arcs: [\n"
    + ",\n".join(f"    [{v[0]:.4f}, {v[1]:.4f}, {v[2]:.4f}]" for v in arcs)
    + "\n  ]\n};\n"
)
with open(OUT, "w") as f:
    f.write(js)
import os
print(f"wrote {OUT}: {os.path.getsize(OUT) // 1024} KB")
