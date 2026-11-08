"""Build index.html from src/. Run: python3 build.py"""
from pathlib import Path
src = Path(__file__).parent / 'src'
t = (src / 'template.html').read_text()
for tag, f in [('/*ENGINE*/', 'engine.js'), ('/*PROBLEMS*/', 'problems.js'), ('/*UI*/', 'ui.js')]:
    t = t.replace(tag, (src / f).read_text())
(Path(__file__).parent / 'index.html').write_text(t)
print('index.html', len(t), 'bytes')
