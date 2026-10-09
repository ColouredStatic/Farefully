"""Create Farefully's share image during the GitHub Pages deployment."""
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont
out = Path(__file__).resolve().parent.parent / "assets" / "social-share.png"
out.parent.mkdir(parents=True, exist_ok=True)
w,h=1200,630
im=Image.new("RGB",(w,h),"#155943")
d=ImageDraw.Draw(im)
def f(size,bold=False,serif=False):
    styles=(["DejaVuSerif-Bold.ttf","LiberationSerif-Bold.ttf"] if serif else
        ["DejaVuSans-Bold.ttf","LiberationSans-Bold.ttf"] if bold else ["DejaVuSans.ttf","LiberationSans-Regular.ttf"])
    for folder in ["/usr/share/fonts/truetype/dejavu/","/usr/share/fonts/truetype/liberation2/"]:
        for name in styles:
            try:return ImageFont.truetype(folder+name,size)
            except OSError:pass
    return ImageFont.load_default()
for y in range(h):
    t=y/h
    d.line((0,y,w,y),fill=(int(18+5*t),int(90+12*t),int(66+6*t)))
d.ellipse((730,-290,1460,440),fill="#227357")
d.ellipse((875,280,1365,770),fill="#1b6a52")
d.ellipse((-300,455,130,885),fill="#1b664e")
d.rounded_rectangle((74,67,132,125),radius=18,fill="#e5f8df")
d.text((92,71),"F",font=f(42,True),fill="#155943")
d.text((151,70),"Farefully",font=f(35,True),fill="#ffffff")
d.text((75,166),"GOOD FOOD, BRIGHTER DAYS",font=f(17,True),fill="#cce6d5")
for text,y in [("Family meals,",224),("minus the",302),("daily guesswork.",380)]:
    d.text((70,y),text,font=f(61,serif=True),fill="#ffffff")
d.text((74,494),"Meal plans built around your tastes,",font=f(23),fill="#e1f1e7")
d.text((74,526),"budget and what is already in the cupboard.",font=f(23),fill="#e1f1e7")
d.rounded_rectangle((74,580,263,613),radius=15,fill="#e5f8df")
d.text((92,588),"FREE PUBLIC BETA",font=f(14,True),fill="#225e47")
d.rounded_rectangle((783,92,1136,573),radius=40,fill="#103c30")
d.rounded_rectangle((798,105,1121,560),radius=32,fill="#faf7f0")
d.text((822,129),"Your week, sorted.",font=f(25,serif=True),fill="#194f3d")
d.text((822,171),"THIS WEEK'S DINNERS",font=f(13,True),fill="#66806f")
rows=[("MON","Chicken curry","25 min","#f2ddad"),("TUE","Cottage pie","45 min","#d4e2b7"),("WED","Veggie tacos","20 min","#f5d4c4"),("THU","Pasta bake","30 min","#d5e1ef")]
for i,(day,meal,time,color) in enumerate(rows):
    y=210+i*74
    d.rounded_rectangle((817,y,1101,y+61),radius=15,fill="#ffffff",outline="#e8e4d9",width=2)
    d.rounded_rectangle((828,y+10,876,y+50),radius=11,fill=color)
    d.text((839,y+20),day,font=f(11,True),fill="#345f4e")
    d.text((892,y+11),meal,font=f(16,True),fill="#28483c")
    d.text((892,y+35),time,font=f(12),fill="#64746b")
d.text((838,517),"Simple plans. Happier dinners.",font=f(14,True),fill="#286547")
im.save(out,"PNG",optimize=True)
print("Created",out)
