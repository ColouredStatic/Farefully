"""Render the approved vector social card when explicitly requested (not during deployment)."""
from pathlib import Path
import cairosvg
root = Path(__file__).resolve().parent.parent
cairosvg.svg2png(url=str(root / "assets/brand/social-share.svg"),write_to=str(root / "assets/social-share.png"),output_width=1200,output_height=630)
print("Rendered approved Foodie F social card")
