"""body360.py — prepara los escaneos corporales: difumina la cara, quita EXIF/GPS y reduce el tamaño.
Uso: python connector/body360.py            (procesa data/body360/<atleta>/<fecha>/)
Sólo requiere Pillow. No hay detector de caras: las cajas están en connector/caras.json
(fracciones 0-1 de la imagen) y se ajustan a mano; el script falla si falta la caja de una foto."""
import json, re, sys, glob, os
from PIL import Image, ImageOps, ImageFilter

RAIZ = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
BASE = os.path.join(RAIZ, 'data', 'body360')
SALIDA = os.path.join(RAIZ, 'assets', 'body')
CARAS = json.load(open(os.path.join(RAIZ, 'connector', 'caras.json'), encoding='utf8'))
ANCHO = 720
PLU = {'in': 2.54, 'cm': 1, 'mts': 100, 'm': 100, 'kg': 1}

def medidas(ruta):
    m = {}
    for l in open(ruta, encoding='utf8'):
        k, _, v = l.strip().partition('=')
        if not v: continue
        n = re.match(r'^([\d.]+)\s*([a-z]*)$', v)
        m[k] = (float(n.group(1)) * PLU.get(n.group(2), 1) if n and n.group(2) in ('in', 'cm', 'mts', 'm') else
                float(n.group(1)) if n and n.group(2) in ('kg', '') else v)
    return m

def difuminar(im, caja):
    w, h = im.size
    x0, y0, x1, y1 = caja[0]*w, caja[1]*h, caja[2]*w, caja[3]*h
    r = im.crop((int(x0), int(y0), int(x1), int(y1)))
    p = max(8, r.size[0] // 6)                       # pixelado grueso + desenfoque: no es reversible
    r = r.resize((max(1, r.size[0]//p), max(1, r.size[1]//p)), Image.BILINEAR).resize(r.size, Image.NEAREST)
    r = r.filter(ImageFilter.GaussianBlur(p // 2))
    mask = Image.new('L', r.size, 0)
    from PIL import ImageDraw
    ImageDraw.Draw(mask).ellipse((0, 0, r.size[0]-1, r.size[1]-1), fill=255)
    im.paste(r, (int(x0), int(y0)), mask.filter(ImageFilter.GaussianBlur(3)))
    return im

salida = {}
for dirf in sorted(glob.glob(os.path.join(BASE, '*', '*'))):
    if not os.path.isdir(dirf): continue
    atleta, fecha = dirf.split(os.sep)[-2:]
    fotos = sorted(f for f in glob.glob(os.path.join(dirf, '*.jpg')))
    if not fotos: continue
    iso = __import__('datetime').datetime.strptime(fecha, '%b %d %Y').strftime('%Y-%m-%d')
    dest = os.path.join(SALIDA, iso); os.makedirs(dest, exist_ok=True)
    lista = []
    for i, f in enumerate(fotos):
        nombre = os.path.basename(f)
        clave = nombre.split('.')[0]
        if clave not in CARAS[atleta][iso]:
            sys.exit('Falta la caja de cara para %s (%s)' % (nombre, iso))
        im = ImageOps.exif_transpose(Image.open(f)).convert('RGB')   # al reducir se pierde el EXIF
        im.thumbnail((ANCHO, ANCHO * 4 // 3 + 1))
        im = difuminar(im, CARAS[atleta][iso][clave]['caja'])
        out = '%02d.jpg' % (i + 1)
        im.save(os.path.join(dest, out), quality=82, optimize=True)
        lista.append({'f': 'assets/body/%s/%s' % (iso, out), 'vista': CARAS[atleta][iso][clave]['vista']})
    salida.setdefault(atleta, []).append({'fecha': iso, 'medidas': medidas(os.path.join(dirf, 'measurements.txt')), 'fotos': lista})
js = 'window.__BODY360__ = ' + json.dumps(salida, ensure_ascii=False) + ';\n'
open(os.path.join(RAIZ, 'body360.js'), 'w', encoding='utf8').write(js)
print('OK', sum(len(v) for v in salida.values()), 'escaneos -> body360.js y assets/body/')
