// Solves and self-checks every built-in problem. Run: node test/solve_all.js
const B = require('../src/engine.js'), P = require('../src/problems.js');
let bad = 0; const ids = new Set();
for (const p of P) {
  const errs = B.validateProblem(p, B.MOLS); if (ids.has(p.id)) errs.push('duplicate id'); ids.add(p.id);
  let s; try { s = B.solve(p); } catch (e) { errs.push(e.message); }
  if (s) {
    s.species.forEach(f => s.types.forEach(t => { if (!B.checkCount(s, f, t, String(s.lib[f].bonds[t] || 0)).ok) errs.push('count ' + f + ' ' + t); }));
    s.steps.forEach(st => { if (!B.checkValue(st, String(st.ans)).ok) errs.push(st.key + ' fails'); st.diags.forEach(d => { if (B.checkValue(st, String(d.v)).ok) errs.push(st.key + ' diag accepted'); }); });
    if (!B.checkFinal(s, String(s.est)).ok) errs.push('final fails');
  }
  console.log((errs.length ? '✗ ' : '✓ ') + p.id + '  ' + (s ? p.reaction.padEnd(32) + ' est ' + B.fmt(s.est).padStart(8) + '  meas ' + B.fmt(s.meas).padStart(8) + '  diff ' + B.fmt(s.pct) + '%' : '') + (errs.length ? '   ' + errs.join('; ') : ''));
  if (errs.length) bad++;
}
console.log(`\n${P.length} problems, ${bad} with errors`); process.exit(bad ? 1 : 0);
