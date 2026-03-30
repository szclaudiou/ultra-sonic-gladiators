"""Generate pixel art character sprites as PNG files using PIL"""
import struct
import zlib
import os

OUTPUT_DIR = os.path.dirname(__file__)

def write_png(filename, pixels, width, height):
    """Write a simple PNG file from pixel data (RGBA)"""
    def pack_ihdr(w, h):
        return struct.pack('>IIBBBBB', w, h, 8, 2, 0, 0, 0)  # 8-bit RGB... actually use RGBA

    # Build RGBA image row by row
    raw = b''
    for y in range(height):
        raw += b'\x00'  # filter type none
        for x in range(width):
            px = pixels.get((x, y), (0, 0, 0, 0))
            raw += bytes(px)

    compressed = zlib.compress(raw, 9)

    def chunk(name, data):
        c = name + data
        return struct.pack('>I', len(data)) + c + struct.pack('>I', zlib.crc32(c) & 0xffffffff)

    ihdr_data = struct.pack('>IIBBBBB', width, height, 8, 6, 0, 0, 0)  # RGBA

    png = b'\x89PNG\r\n\x1a\n'
    png += chunk(b'IHDR', ihdr_data)
    png += chunk(b'IDAT', compressed)
    png += chunk(b'IEND', b'')

    with open(filename, 'wb') as f:
        f.write(png)
    print(f"  Wrote: {filename}")


def make_argentum_sprite():
    """Silver cellist warrior — heroic stance"""
    W, H = 32, 48
    S = 0xC0  # Silver base
    SH = 0x88  # Shadow
    GL = 0xFF  # Glow/highlight
    A = 255

    pixels = {}

    # Silver color with slight blue tint
    def silver(shade=1.0): 
        v = int(192 * shade)
        return (v, v, min(255, int(v * 1.05)), A)
    def glow(): return (220, 230, 255, A)
    def dark(): return (40, 40, 60, A)
    def accent(): return (180, 200, 255, A)

    # Head (y 2-8)
    for x in range(12, 20):
        for y in range(2, 10):
            pixels[(x, y)] = silver()
    # Hair (flowing silver)
    for x in range(9, 23):
        pixels[(x, 2)] = glow()
    for x in range(8, 12):
        for y in range(3, 7):
            pixels[(x, y)] = accent()

    # Body/armor (y 10-26)
    for x in range(10, 22):
        for y in range(10, 26):
            pixels[(x, y)] = silver(0.85)
    # Chest armor highlight
    for x in range(12, 20):
        for y in range(11, 14):
            pixels[(x, y)] = glow()
    # Shoulder pads
    for x in range(7, 12):
        for y in range(10, 15):
            pixels[(x, y)] = silver()
    for x in range(20, 25):
        for y in range(10, 15):
            pixels[(x, y)] = silver()

    # Cello (y 8-36, right side) - elongated dark shape with silver strings
    for x in range(22, 28):
        for y in range(8, 36):
            pixels[(x, y)] = (60, 30, 20, A)  # dark wood
    # Cello body
    for x in range(20, 30):
        for y in range(14, 30):
            pixels[(x, y)] = (80, 40, 25, A)
    # Strings (vertical white lines)
    for y in range(10, 32):
        for sx in [23, 24, 25, 26]:
            if y % 3 != 0:
                pixels[(sx, y)] = (200, 200, 220, A)
    # F-holes
    pixels[(21, 20)] = (10, 5, 5, A)
    pixels[(21, 22)] = (10, 5, 5, A)

    # Arms
    # Left arm holding bow
    for x in range(4, 10):
        for y in range(14, 20):
            pixels[(x, y)] = silver(0.8)
    # Bow
    for y in range(8, 38):
        pixels[(5, y)] = (180, 160, 100, A)

    # Legs (y 26-42)
    for x in range(11, 16):
        for y in range(26, 42):
            pixels[(x, y)] = silver(0.75)
    for x in range(16, 21):
        for y in range(26, 42):
            pixels[(x, y)] = silver(0.75)
    # Boot highlight
    for x in range(11, 16):
        for y in range(40, 44):
            pixels[(x, y)] = silver(0.6)
    for x in range(16, 21):
        for y in range(40, 44):
            pixels[(x, y)] = silver(0.6)

    # Glow aura (very subtle)
    for x in range(5, 27):
        pixels[(x, 0)] = (180, 200, 255, 60)
        pixels[(x, 47)] = (180, 200, 255, 60)

    write_png(os.path.join(OUTPUT_DIR, 'argentum-sprite.png'), pixels, W, H)


def make_morgana_sprite():
    """Black Widow organist — spider-person, multiple arms"""
    W, H = 40, 52
    A = 255

    def dark(): return (20, 10, 30, A)
    def purple(): return (100, 0, 160, A)
    def bright_purple(): return (150, 50, 220, A)
    def black(): return (10, 5, 20, A)
    def pale(): return (200, 190, 210, A)
    def web(): return (60, 40, 80, A)

    pixels = {}

    # Main body (center, y 12-30)
    for x in range(14, 26):
        for y in range(12, 30):
            pixels[(x, y)] = dark()

    # Head (y 4-12)
    for x in range(15, 25):
        for y in range(4, 12):
            pixels[(x, y)] = pale()
    # Mask stripe
    for x in range(14, 26):
        for y in range(6, 9):
            pixels[(x, y)] = black()
    # Hair
    for x in range(12, 28):
        for y in range(2, 6):
            pixels[(x, y)] = (120, 0, 180, A)

    # Victorian collar/dress
    for x in range(12, 28):
        for y in range(12, 16):
            pixels[(x, y)] = purple()
    # Dress flows down
    for x in range(10, 30):
        for y in range(20, 34):
            pixels[(x, y)] = dark()
    for x in range(8, 32):
        for y in range(30, 40):
            pixels[(x, y)] = black()

    # SPIDER ARMS (6 total: 3 left, 3 right)
    # Left arms
    arm_data = [
        (14, 16, [(13,16),(11,15),(9,14),(7,13),(5,12),(4,11),(3,10)]),
        (14, 20, [(12,20),(10,21),(8,21),(6,21),(4,20),(3,19)]),
        (14, 24, [(12,25),(10,26),(8,27),(6,27),(4,26),(3,25)]),
    ]
    for ax, ay, path in arm_data:
        for (px_, py_) in path:
            pixels[(px_, py_)] = web()
            # Arm is 2px thick
            if py_ < H - 1:
                pixels[(px_, py_+1)] = web()

    # Right arms (mirrored)
    right_arms = [
        (25, 16, [(26,16),(28,15),(30,14),(32,13),(34,12),(35,11),(36,10)]),
        (25, 20, [(27,20),(29,21),(31,21),(33,21),(35,20),(36,19)]),
        (25, 24, [(27,25),(29,26),(31,27),(33,27),(35,26),(36,25)]),
    ]
    for ax, ay, path in right_arms:
        for (px_, py_) in path:
            if 0 <= px_ < W and 0 <= py_ < H:
                pixels[(px_, py_)] = web()
                if py_ < H - 1:
                    pixels[(px_, py_+1)] = web()

    # Grasping hands on arms (playing organ keys)
    for (ax, ay, path) in arm_data:
        last = path[-1]
        for dx in range(-1, 2):
            if 0 <= last[0]+dx < W:
                pixels[(last[0]+dx, last[1])] = bright_purple()

    # Web threads
    for y in range(0, 52, 6):
        pixels[(0, y)] = (50, 30, 70, 80)
    for x in range(0, 40, 8):
        pixels[(x, 0)] = (50, 30, 70, 80)

    # Purple glow bottom
    for x in range(10, 30):
        pixels[(x, 48)] = (80, 0, 120, 100)
        pixels[(x, 49)] = (60, 0, 90, 60)

    write_png(os.path.join(OUTPUT_DIR, 'morgana-sprite.png'), pixels, W, H)


if __name__ == '__main__':
    print("Generating sprites...")
    make_argentum_sprite()
    make_morgana_sprite()
    print("Done!")
