# Rendering diagram figures for the LaTeX report

All six figures referenced by `../report.tex` are **already rendered** in this
folder (`*.png`). The Mermaid sources live in `../../diagrams/`. If you edit a
diagram, re-render it with:

## mermaid-cli (used to produce these PNGs)

```bash
# one-time: point puppeteer at your local Chrome
echo '{ "executablePath": "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe", "args": ["--no-sandbox"] }' > puppeteer.json

npx -y @mermaid-js/mermaid-cli -i ../../diagrams/class-diagram.mmd -o class-diagram.png --size 1600 -b white -p puppeteer.json
npx -y @mermaid-js/mermaid-cli -i ../../diagrams/sequence-issue.mmd -o sequence-issue.png --size 1600 -b white -p puppeteer.json
npx -y @mermaid-js/mermaid-cli -i ../../diagrams/sequence-return.mmd -o sequence-return.png --size 1600 -b white -p puppeteer.json
npx -y @mermaid-js/mermaid-cli -i ../../diagrams/sdlc-incremental.mmd -o sdlc-incremental.png --size 1400 -b white -p puppeteer.json
npx -y @mermaid-js/mermaid-cli -i ../../diagrams/mongodb-relationships.mmd -o mongodb-relationships.png --size 1600 -b white -p puppeteer.json
npx -y @mermaid-js/mermaid-cli -i ../../diagrams/use-case-graph.mmd -o use-case.png --size 1600 -b white -p puppeteer.json
npx -y @mermaid-js/mermaid-cli -i ../../diagrams/architecture.mmd -o architecture.png --size 1600 -b white -p puppeteer.json
```

Notes:
- `use-case.mmd` uses UML `usecaseDiagram` notation; current mermaid-cli
  cannot detect that type, so `use-case-graph.mmd` (same content as a
  flowchart) is what gets rendered.
- Mermaid method signatures must not contain `{...}` (it breaks the class
  diagram parser) — use plain parameter names.

## Still to add by the student

- `ui-wireframe.png` — optional; the report prints a placeholder until added
- Application screenshots for Appendix B (run the app and capture each page)

## Compile the report

```bash
cd docs/report
xelatex report.tex
xelatex report.tex   # twice for TOC / figure list
```

Verified on this machine: MiKTeX + XeLaTeX produced a 23-page `report.pdf`
with Times New Roman (fontspec found the real font on Windows).
