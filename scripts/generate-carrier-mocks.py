"""
生成「载体底图」透明剪影 PNG（供前端 mask-image / canvas 合成使用）
输出：public/images/{silk-scarf,hanfu,ceramic-plate}.png
说明：2x 超采样绘制后缩放到 1024，保证边缘抗锯齿；alpha 通道即蒙版。
"""
import math
import os

from PIL import Image, ImageDraw, ImageFilter

S = 2  # 超采样倍数
W = H = 1024 * S
OUT = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'public', 'images')
os.makedirs(OUT, exist_ok=True)

WHITE = (255, 255, 255, 255)


def canvas():
    return Image.new("RGBA", (W, H), (0, 0, 0, 0))


def save(img, name):
    img.resize((1024, 1024), Image.LANCZOS).save(os.path.join(OUT, name))
    print("saved", name)


# ---------------------------------------------------------------- 丝巾：折叠方巾
def silk():
    cx, cy, hw, hh = 512 * S, 508 * S, 310 * S, 310 * S

    layer = canvas()
    d = ImageDraw.Draw(layer)
    # 主体：圆角方巾
    d.rounded_rectangle([cx - hw, cy - hh, cx + hw, cy + hh], radius=44 * S, fill=WHITE)
    # 下摆折起的折边带
    d.rounded_rectangle(
        [cx - hw + 8 * S, cy + hh * 0.40, cx + hw - 8 * S, cy + hh - 8 * S],
        radius=20 * S,
        fill=(255, 255, 255, 250),
    )
    # 右上折角
    d.polygon(
        [
            (cx + hw - 152 * S, cy - hh - 4 * S),
            (cx + hw + 4 * S, cy - hh + 152 * S),
            (cx + hw + 4 * S, cy - hh - 4 * S),
        ],
        fill=(255, 255, 255, 236),
    )
    layer = layer.rotate(-7, resample=Image.BICUBIC, center=(cx, cy))

    # 柔和折痕（半透明线条 → 合成后呈现织物褶皱质感）
    crease = canvas()
    cd = ImageDraw.Draw(crease)
    for y in (cy - hh * 0.34, cy - hh * 0.02, cy + hh * 0.30):
        cd.line([(cx - hw * 0.82, y), (cx + hw * 0.82, y + 16 * S)],
                fill=(120, 110, 95, 80), width=3 * S)
    crease = crease.rotate(-7, resample=Image.BICUBIC, center=(cx, cy)).filter(
        ImageFilter.GaussianBlur(7 * S)
    )

    save(Image.alpha_composite(Image.alpha_composite(canvas(), layer), crease), "silk-scarf.png")


# ---------------------------------------------------------------- 汉服：交领袍
def hanfu():
    cx = 512 * S
    img = canvas()
    d = ImageDraw.Draw(img)

    # 衣身（V 形交领领口 + 舒展下摆）
    d.polygon(
        [
            (cx - 196 * S, 150 * S), (cx - 74 * S, 150 * S), (cx, 374 * S),
            (cx + 74 * S, 150 * S), (cx + 196 * S, 150 * S),
            (cx + 258 * S, 620 * S), (cx + 302 * S, 908 * S),
            (cx - 302 * S, 908 * S), (cx - 258 * S, 620 * S),
        ],
        fill=WHITE,
    )
    # 左右大袖
    d.polygon(
        [(cx - 200 * S, 150 * S), (cx - 302 * S, 330 * S), (cx - 356 * S, 662 * S),
         (cx - 188 * S, 694 * S), (cx - 118 * S, 430 * S)],
        fill=WHITE,
    )
    d.polygon(
        [(cx + 200 * S, 150 * S), (cx + 302 * S, 330 * S), (cx + 356 * S, 662 * S),
         (cx + 188 * S, 694 * S), (cx + 118 * S, 430 * S)],
        fill=WHITE,
    )
    # 腰带
    d.rounded_rectangle([cx - 264 * S, 468 * S, cx + 264 * S, 520 * S],
                        radius=16 * S, fill=(255, 255, 255, 230))
    # 交领压线
    d.line([(cx - 74 * S, 150 * S), (cx, 374 * S), (cx + 74 * S, 150 * S)],
           fill=(120, 110, 95, 66), width=5 * S)
    # 下摆褶皱
    d.line([(cx - 150 * S, 700 * S), (cx - 96 * S, 908 * S)],
           fill=(120, 110, 95, 52), width=4 * S)
    d.line([(cx + 150 * S, 700 * S), (cx + 96 * S, 908 * S)],
           fill=(120, 110, 95, 52), width=4 * S)

    save(img.filter(ImageFilter.GaussianBlur(1.4 * S)), "hanfu.png")


# ---------------------------------------------------------------- 陶瓷盘：俯视
def ceramic():
    cx, cy = 512 * S, 508 * S
    rx, ry = 432 * S, 318 * S
    img = canvas()
    d = ImageDraw.Draw(img)

    # 盘体
    d.ellipse([cx - rx, cy - ry, cx + rx, cy + ry], fill=WHITE)
    # 盘心（略低不透明度 → 模拟釉面反差异）
    ix, iy = 352 * S, 254 * S
    d.ellipse([cx - ix, cy - iy, cx + ix, cy + iy], fill=(255, 255, 255, 214))
    # 圈足（盘底露出的一小道）
    fx = 150 * S
    d.ellipse([cx - fx, cy + ry - 54 * S, cx + fx, cy + ry + 26 * S], fill=WHITE)
    # 盘沿高光弧
    d.arc([cx - rx + 10 * S, cy - ry + 10 * S, cx + rx - 10 * S, cy + ry - 10 * S],
          start=195, end=345, fill=(255, 255, 255, 255), width=10 * S)

    save(img.filter(ImageFilter.GaussianBlur(1.4 * S)), "ceramic-plate.png")


if __name__ == "__main__":
    silk()
    hanfu()
    ceramic()
    print("done ->", OUT)
