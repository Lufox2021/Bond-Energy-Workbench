# Bond Energy Workbench

A student tool for estimating ΔH of gas-phase reactions from average bond energies: ΔH ≈ Σ BE(broken) − Σ BE(formed). Every result is compared with the value from ΔH°f data, because bond energies are averages and the estimate can differ from measured values.

- **Review**, **Coaching** (count bonds → Σ broken → Σ formed → ΔH, then estimate vs measured), **Testing**, **Instructor** (upload problems and new molecules).

`index.html` is built from `src/` with `python3 build.py`. Tests: `node test/solve_all.js`, `python3 test/browser_test.py`.
