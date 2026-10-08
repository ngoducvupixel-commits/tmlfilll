"""Model sheet: a silent 8-second turntable of the whole family cycling through every expression.
Use it to check character changes:  node tools/check.mjs model-sheet --n 8 --cols 4"""
from build import Sheet

sheet = Sheet(room_gain=0.0)
sheet.mark('turn', 8.0)
