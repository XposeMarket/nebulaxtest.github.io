# NebulaX Runner – Pack v2

What’s new:
- **Runtime scaling**: press `[` to shrink and `]` to grow Nebby. The HUD shows the live scale.
- **Spritesheet**: `assets/nebby_run_sheet.png` now has 6 distinct frames (placeholder), so animation actually flips the stride.
- **Scale path**: All drawing paths (sheet or static) multiply by the same `NEBBY_SCALE` value.

How to run:
1) Unzip and open `index.html` in a browser.
2) Press Enter to start. Controls: ←/→ rotate, Space to jump/double, P pause, R restart, [ / ] scale.

To replace with real art:
- Export a straight‑back 6‑frame run sheet as `assets/nebby_run_sheet.png`, 1×6 layout, 512×512 per frame, transparent. Keep the feet in the same pixel row across frames (bottom‑center pivot).

If you still see the old size after edits, do a hard refresh (Ctrl/Cmd + Shift + R) to bust the browser cache.
