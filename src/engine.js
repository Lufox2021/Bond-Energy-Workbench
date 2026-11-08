/* Bond Energy Workbench — engine (no DOM; runs in Node for tests) */
var BEE = (function () {
  'use strict';

  // Average bond energies, kJ/mol (gas phase). C=O in CO2 is listed separately.
  var BONDS = [
    ['H–H', 432], ['H–F', 565], ['H–Cl', 427], ['H–Br', 363], ['H–I', 295],
    ['C–H', 413], ['C–C', 347], ['C=C', 614], ['C≡C', 839], ['C–N', 305], ['C=N', 615], ['C≡N', 891],
    ['C–O', 358], ['C=O', 745], ['C=O (in CO₂)', 799], ['C≡O', 1072], ['C–F', 485], ['C–Cl', 339], ['C–Br', 276], ['C–I', 240],
    ['N–H', 391], ['N–N', 160], ['N=N', 418], ['N≡N', 941], ['N–O', 201], ['N=O', 607],
    ['O–H', 467], ['O–O', 146], ['O=O', 495],
    ['F–F', 154], ['Cl–Cl', 239], ['Br–Br', 193], ['I–I', 149]
  ];
  var BE = {}; BONDS.forEach(function (b) { BE[b[0]] = b[1]; });
  function normBond(s) { return String(s).trim().replace(/-/g, '–').replace(/#/g, '≡').replace(/\s*\(in CO2\)/i, ' (in CO₂)'); }

  // Molecule library (gas phase). struct: plain-text structural formula, lone pairs not shown.
  var MOLS = {
    H2: { name: 'hydrogen', bonds: { 'H–H': 1 }, dHf: 0, struct: 'H – H' },
    F2: { name: 'fluorine', bonds: { 'F–F': 1 }, dHf: 0, struct: 'F – F' },
    Cl2: { name: 'chlorine', bonds: { 'Cl–Cl': 1 }, dHf: 0, struct: 'Cl – Cl' },
    Br2: { name: 'bromine (gas)', bonds: { 'Br–Br': 1 }, dHf: 30.9, struct: 'Br – Br' },
    O2: { name: 'oxygen', bonds: { 'O=O': 1 }, dHf: 0, struct: 'O = O' },
    N2: { name: 'nitrogen', bonds: { 'N≡N': 1 }, dHf: 0, struct: 'N ≡ N' },
    HF: { name: 'hydrogen fluoride', bonds: { 'H–F': 1 }, dHf: -273.3, struct: 'H – F' },
    HCl: { name: 'hydrogen chloride', bonds: { 'H–Cl': 1 }, dHf: -92.3, struct: 'H – Cl' },
    HBr: { name: 'hydrogen bromide', bonds: { 'H–Br': 1 }, dHf: -36.3, struct: 'H – Br' },
    H2O: { name: 'water (gas)', bonds: { 'O–H': 2 }, dHf: -241.8, struct: 'H – O – H' },
    H2O2: { name: 'hydrogen peroxide (gas)', bonds: { 'O–H': 2, 'O–O': 1 }, dHf: -136.3, struct: 'H – O – O – H' },
    NH3: { name: 'ammonia', bonds: { 'N–H': 3 }, dHf: -45.9, struct: 'H – N – H\n    |\n    H' },
    N2H4: { name: 'hydrazine (gas)', bonds: { 'N–N': 1, 'N–H': 4 }, dHf: 95.4, struct: 'H – N – N – H\n    |   |\n    H   H' },
    CH4: { name: 'methane', bonds: { 'C–H': 4 }, dHf: -74.6, struct: '    H\n    |\nH – C – H\n    |\n    H' },
    C2H6: { name: 'ethane', bonds: { 'C–C': 1, 'C–H': 6 }, dHf: -84.0, struct: '    H   H\n    |   |\nH – C – C – H\n    |   |\n    H   H' },
    C3H8: { name: 'propane', bonds: { 'C–C': 2, 'C–H': 8 }, dHf: -103.8, struct: '    H   H   H\n    |   |   |\nH – C – C – C – H\n    |   |   |\n    H   H   H' },
    C8H18: { name: 'octane (gas)', bonds: { 'C–C': 7, 'C–H': 18 }, dHf: -208.6, struct: '    H   H   H   H   H   H   H   H\n    |   |   |   |   |   |   |   |\nH – C – C – C – C – C – C – C – C – H\n    |   |   |   |   |   |   |   |\n    H   H   H   H   H   H   H   H' },
    C2H4: { name: 'ethylene', bonds: { 'C=C': 1, 'C–H': 4 }, dHf: 52.4, struct: 'H       H\n  \\   /\n   C = C\n  /   \\\nH       H' },
    C2H2: { name: 'acetylene', bonds: { 'C≡C': 1, 'C–H': 2 }, dHf: 227.4, struct: 'H – C ≡ C – H' },
    CO2: { name: 'carbon dioxide', bonds: { 'C=O (in CO₂)': 2 }, dHf: -393.5, struct: 'O = C = O' },
    CO: { name: 'carbon monoxide', bonds: { 'C≡O': 1 }, dHf: -110.5, struct: 'C ≡ O' },
    CH3OH: { name: 'methanol (gas)', bonds: { 'C–H': 3, 'C–O': 1, 'O–H': 1 }, dHf: -201.0, struct: '    H\n    |\nH – C – O – H\n    |\n    H' },
    C2H5OH: { name: 'ethanol (gas)', bonds: { 'C–C': 1, 'C–H': 5, 'C–O': 1, 'O–H': 1 }, dHf: -234.8, struct: '    H   H\n    |   |\nH – C – C – O – H\n    |   |\n    H   H' },
    CH3Cl: { name: 'chloromethane', bonds: { 'C–H': 3, 'C–Cl': 1 }, dHf: -81.9, struct: '    H\n    |\nH – C – Cl\n    |\n    H' },
    C2H5Cl: { name: 'chloroethane', bonds: { 'C–C': 1, 'C–H': 5, 'C–Cl': 1 }, dHf: -112.1, struct: '    H   H\n    |   |\nH – C – C – Cl\n    |   |\n    H   H' },
    CCl4: { name: 'carbon tetrachloride (gas)', bonds: { 'C–Cl': 4 }, dHf: -95.7, struct: '     Cl\n     |\nCl – C – Cl\n     |\n     Cl' },
    CH2O: { name: 'formaldehyde', bonds: { 'C–H': 2, 'C=O': 1 }, dHf: -108.6, struct: 'H\n  \\\n   C = O\n  /\nH' },
    HCN: { name: 'hydrogen cyanide', bonds: { 'C–H': 1, 'C≡N': 1 }, dHf: 135.1, struct: 'H – C ≡ N' }
  };
  function fhtml(f) { return String(f).replace(/(\d+)/g, '<sub>$1</sub>'); }

  // ---------- numbers ----------
  function parseNum(s) {
    var v = String(s === undefined || s === null ? '' : s).trim().replace(/[−–]/g, '-').replace(/,/g, '').replace(/\s+/g, '').replace(/^\+/, '');
    return /^-?(\d+\.?\d*|\.\d+)$/.test(v) ? parseFloat(v) : NaN;
  }
  // Safe arithmetic: numbers, + − × ÷ * / ·, x between numbers, parentheses, unary minus. No eval().
  function evalExpr(str) {
    var s = String(str === undefined || str === null ? '' : str).replace(/[\u2212\u2013\u2014]/g, '-').replace(/[×·xX]/g, '*').replace(/÷/g, '/').replace(/,/g, '').replace(/\s+/g, '');
    if (s === '') return NaN;
    var i = 0;
    function peek() { return s[i]; }
    function number() { var m = /^(\d+\.?\d*|\.\d+)(e[+-]?\d+)?/i.exec(s.slice(i)); if (!m) throw 0; i += m[0].length; return parseFloat(m[0]); }
    function factor() {
      var c = peek();
      if (c === '+') { i++; return factor(); }
      if (c === '-') { i++; return -factor(); }
      if (c === '(') { i++; var v = expr(); if (peek() !== ')') throw 0; i++; return v; }
      return number();
    }
    function term() {
      var v = factor();
      while (peek() === '*' || peek() === '/' || peek() === '(') {
        if (peek() === '(') { v = v * factor(); continue; } // 2(413) means 2 × 413
        var op = s[i++], r = factor(); v = op === '*' ? v * r : v / r;
      }
      return v;
    }
    function expr() { var v = term(); while (peek() === '+' || peek() === '-') { var op = s[i++], r = term(); v = op === '+' ? v + r : v - r; } return v; }
    try { var v = expr(); if (i !== s.length || !isFinite(v)) return NaN; return v; } catch (e) { return NaN; }
  }
  function isExpr(str) { return /[-+*/×÷·xX()\u2212\u2013]/.test(String(str).trim().replace(/^[-\u2212+]/, '')); }
  function fmt(x) { var r = Math.round(x * 10) / 10; if (Math.abs(r) < 1e-9) r = 0; return String(r).replace('-', '−'); }
  function sgn(x) { return (x > 0 ? '+' : '') + fmt(x); }
  function within(v, t, tol) { return isFinite(v) && Math.abs(v - t) <= Math.max(tol.abs || 0, Math.abs(t) * (tol.rel || 0)) + 1e-9; }
  var TOL = { abs: 1, rel: 0.002 };
  var LEVELS = { 1: 'Diatomic molecules', 2: 'Small organic reactions', 3: 'Combustion', 4: 'Multiple bonds & nitrogen' };

  // ---------- reactions ----------
  function parseReaction(str, lib) {
    lib = lib || MOLS;
    var parts = String(str).replace(/→|=>/g, '->').split('->');
    if (parts.length !== 2) throw new Error('use one arrow (->)');
    function side(s) {
      return s.split(/\s\+\s/).map(function (t) {
        var m = /^\s*(\d+)?\s*([A-Za-z0-9]+)\s*(?:\(g\))?\s*$/.exec(t);
        if (!m) throw new Error('can’t read “' + t.trim() + '”');
        if (!lib[m[2]]) throw new Error(m[2] + ' is not in the molecule library');
        return { c: m[1] ? +m[1] : 1, f: m[2] };
      });
    }
    var L = side(parts[0]), R = side(parts[1]);
    // atom balance
    var bal = {};
    function atoms(f) { var a = {}, re = /([A-Z][a-z]?)(\d*)/g, m; while ((m = re.exec(f))) if (m[1]) a[m[1]] = (a[m[1]] || 0) + (m[2] ? +m[2] : 1); return a; }
    L.forEach(function (t) { var a = atoms(t.f); for (var e in a) bal[e] = (bal[e] || 0) - t.c * a[e]; });
    R.forEach(function (t) { var a = atoms(t.f); for (var e in a) bal[e] = (bal[e] || 0) + t.c * a[e]; });
    var unb = Object.keys(bal).filter(function (e) { return bal[e] !== 0; });
    return { L: L, R: R, unbalanced: unb };
  }
  function eqHTML(r) {
    var side = function (s) { return s.map(function (t) { return (t.c > 1 ? t.c : '') + fhtml(t.f) + '(g)'; }).join(' + '); };
    return side(r.L) + ' → ' + side(r.R);
  }
  function bondEnergyOf(bonds) { var s = 0; for (var b in bonds) s += bonds[b] * BE[b]; return s; }

  function solve(p, lib) {
    lib = lib || MOLS;
    var r = parseReaction(p.reaction, lib);
    if (r.unbalanced.length) throw new Error('reaction isn’t balanced (' + r.unbalanced.join(', ') + ')');
    var species = [];
    r.L.concat(r.R).forEach(function (t) { if (species.indexOf(t.f) < 0) species.push(t.f); });
    var types = [];
    species.forEach(function (f) { Object.keys(lib[f].bonds).forEach(function (b) { if (types.indexOf(b) < 0) types.push(b); }); });
    types.sort(function (a, b) { return BONDS.findIndex(function (x) { return x[0] === a; }) - BONDS.findIndex(function (x) { return x[0] === b; }); });
    var sideE = function (s) { return s.reduce(function (a, t) { return a + t.c * bondEnergyOf(lib[t.f].bonds); }, 0); };
    var broken = sideE(r.L), formed = sideE(r.R), est = broken - formed;
    var meas = r.R.reduce(function (a, t) { return a + t.c * lib[t.f].dHf; }, 0) - r.L.reduce(function (a, t) { return a + t.c * lib[t.f].dHf; }, 0);
    // totals of each bond type broken/formed (for worked lines)
    function tally(s) { var o = {}; s.forEach(function (t) { var b = lib[t.f].bonds; for (var k in b) o[k] = (o[k] || 0) + t.c * b[k]; }); return o; }
    var tb = tally(r.L), tf = tally(r.R);
    var line = function (o) { return Object.keys(o).map(function (k) { return o[k] + ' × ' + k + ' (' + BE[k] + ')'; }).join(' + '); };
    var noCoef = function (s) { return s.reduce(function (a, t) { return a + bondEnergyOf(lib[t.f].bonds); }, 0); };
    // C=O value slip
    var swapCO = function (s, to) {
      return s.reduce(function (a, t) {
        var b = lib[t.f].bonds, e = 0; for (var k in b) e += b[k] * (k === 'C=O (in CO₂)' ? to : BE[k]); return a + t.c * e;
      }, 0);
    };
    var hasCO2 = species.indexOf('CO2') >= 0 && lib.CO2 === MOLS.CO2;
    var plainF = function (f) { return f.replace(/\d/g, function (d) { return '₀₁₂₃₄₅₆₇₈₉'[+d]; }); };
    var coefEx = function (side) {
      var t = side.filter(function (x) { return x.c > 1; })[0]; if (!t) return '';
      var b = lib[t.f].bonds, k = Object.keys(b)[0];
      return ' For example, ' + t.c + ' ' + plainF(t.f) + ' has ' + t.c * b[k] + ' ' + k + ' bonds, not ' + b[k] + '.';
    };
    var steps = [
      {
        key: 'broken', label: 'Energy needed to break all the bonds in the reactants', sym: 'Σ BE(broken)', ans: broken,
        worked: line(tb) + ' = ' + fmt(broken) + ' kJ',
        rule: 'Multiply the number of each bond in one molecule by the coefficient, then by its bond energy. Add them all up. Breaking bonds always takes energy, so this sum is positive.',
        diags: [
          { v: noCoef(r.L), msg: 'It looks like you left out the coefficients. Multiply each molecule’s bonds by its coefficient.' + coefEx(r.L) },
          { v: broken + formed, msg: 'Only the reactants’ bonds are broken. The products’ bonds are formed.' },
          { v: formed, msg: 'That’s the energy of the product bonds. Here you need the reactant bonds.' },
          { v: -broken, msg: 'Breaking bonds takes energy, so this sum is positive.' }
        ]
      },
      {
        key: 'formed', label: 'Energy released forming all the bonds in the products', sym: 'Σ BE(formed)', ans: formed,
        worked: line(tf) + ' = ' + fmt(formed) + ' kJ',
        rule: 'Same method, for the products. Enter the sum as a positive number; it is subtracted in the next step.',
        diags: [
          { v: noCoef(r.R), msg: 'It looks like you left out the coefficients of the products. Multiply each molecule’s bonds by its coefficient.' + coefEx(r.R) },
          { v: broken, msg: 'That’s the reactant bonds. Here you need the product bonds.' },
          { v: -formed, msg: 'Enter the sum of the bond energies as a positive number. The sign comes in the next step (ΔH = broken − formed).' }
        ].concat(hasCO2 && r.R.some(function (t) { return t.f === 'CO2'; }) ? [{ v: swapCO(r.R, 745), msg: 'For CO₂, use the C=O value listed for CO₂ (799 kJ/mol), not the general C=O value (745).' }] : [])
      },
      {
        key: 'dH', label: 'Estimated ΔH = Σ BE(broken) − Σ BE(formed)', sym: 'ΔH<sub>est</sub>', ans: est,
        worked: fmt(broken) + ' − ' + fmt(formed) + ' = ' + sgn(est) + ' kJ',
        rule: 'Energy goes in to break bonds and comes out when bonds form. ΔH = (energy in) − (energy out) = Σ BE(broken) − Σ BE(formed).',
        diags: [
          { v: formed - broken, msg: 'You subtracted the wrong way round. ΔH = Σ broken − Σ formed: energy in minus energy out.' },
          { v: broken + formed, msg: 'Subtract the energy released by forming bonds; don’t add it.' },
          { v: noCoef(r.L) - noCoef(r.R), msg: 'It looks like you left out the coefficients.' },
          { v: meas, msg: 'That’s the value from ΔH°f data. This step asks for the bond-energy estimate.' }
        ].concat(hasCO2 && r.R.some(function (t) { return t.f === 'CO2'; }) ? [{ v: broken - swapCO(r.R, 745), msg: 'For CO₂, use the C=O value listed for CO₂ (799 kJ/mol), not the general C=O value (745).' }] : [])
      }
    ];
    steps.forEach(function (s) { s.unit = 'kJ'; s.tol = TOL; s.diags = s.diags.filter(function (d) { return isFinite(d.v) && !within(d.v, s.ans, TOL); }); });
    return {
      id: p.id, level: +p.level, r: r, lib: lib, species: species, types: types, broken: broken, formed: formed, est: est, meas: meas,
      diff: est - meas, pct: meas !== 0 ? (est - meas) / Math.abs(meas) * 100 : NaN, steps: steps,
      text: p.text && String(p.text).trim() ? p.text : 'Use average bond energies to estimate ΔH for this gas-phase reaction.'
    };
  }
  function checkCount(sol, f, type, raw) {
    var want = sol.lib[f].bonds[type] || 0, v = String(raw).trim() === '' ? 0 : parseNum(raw);
    if (!isFinite(v)) return { ok: false, msg: 'Type a whole number (blank = 0).' };
    if (v === want) return { ok: true };
    if (type.indexOf('=') >= 0 || type.indexOf('≡') >= 0) return { ok: false, msg: 'A double (=) or triple (≡) bond counts once, as one ' + type + ' bond.' };
    return { ok: false, msg: v > want ? 'Too many.' : (want && !v ? 'This molecule has ' + type + ' bonds.' : 'Too few.') };
  }
  function checkValue(step, raw) {
    if (String(raw).trim() === '') return { ok: false, empty: true, msg: 'Enter a number or a calculation.' };
    var v = evalExpr(raw);
    if (!isFinite(v)) return { ok: false, msg: 'I can’t work that out. Use numbers with + − × ÷ and parentheses, like 4×413 + 2×495. Leave out units and bond names.' };
    if (within(v, step.ans, step.tol)) return { ok: true };
    for (var i = 0; i < step.diags.length; i++) if (within(v, step.diags[i].v, TOL)) return { ok: false, msg: step.diags[i].msg };
    return { ok: false, msg: 'Not quite. Check your bond counts, the coefficients and the arithmetic.' };
  }
  function checkFinal(sol, raw) {
    var r = checkValue(sol.steps[2], raw);
    if (r.ok || r.empty) return r;
    var v = evalExpr(raw), extras = [];
    sol.steps[0].diags.forEach(function (d) { extras.push({ v: d.v - sol.formed, msg: d.msg }); });
    sol.steps[1].diags.forEach(function (d) { extras.push({ v: sol.broken - d.v, msg: d.msg }); });
    for (var i = 0; i < extras.length; i++) if (!within(extras[i].v, sol.est, TOL) && within(v, extras[i].v, TOL)) return { ok: false, msg: extras[i].msg };
    return r;
  }

  // ---------- uploads ----------
  var COLUMNS = ['kind', 'id', 'level', 'reaction', 'text', 'formula', 'name', 'bonds', 'dHf', 'struct'];
  function parseBonds(s) {
    var o = {}, errs = [];
    String(s || '').split(/[;,]/).forEach(function (part) {
      part = part.trim(); if (!part) return;
      var m = /^(.+?)\s*[:=x×]\s*(\d+)$/.exec(part.replace(/\s*\(in CO2\)/i, ' (in CO₂)'));
      if (!m) { errs.push('can’t read bond “' + part + '”'); return; }
      var b = normBond(m[1]);
      if (!(b in BE)) { errs.push('unknown bond ' + b); return; }
      o[b] = (o[b] || 0) + +m[2];
    });
    return { bonds: o, errs: errs };
  }
  function validateMolecule(m) {
    var errs = [];
    if (!m.formula || !/^[A-Za-z0-9]+$/.test(m.formula)) errs.push('formula must be letters and numbers only, e.g. C2H5OH');
    var pb = parseBonds(m.bonds); errs = errs.concat(pb.errs);
    if (!Object.keys(pb.bonds).length) errs.push('no bonds given (e.g. "C-H:4; C=O:1")');
    if (!isFinite(parseNum(m.dHf))) errs.push('dHf (gas phase, kJ/mol) is missing or not a number');
    return errs;
  }
  function libWith(extra) {
    var lib = {}; for (var k in MOLS) lib[k] = MOLS[k];
    (extra || []).forEach(function (m) {
      var pb = parseBonds(m.bonds);
      lib[m.formula] = { name: m.name || m.formula, bonds: pb.bonds, dHf: parseNum(m.dHf), struct: m.struct ? String(m.struct).replace(/\\n/g, '\n') : '(structure not provided)' };
    });
    return lib;
  }
  function validateProblem(p, lib) {
    var errs = [];
    if (!p.id) errs.push('missing id');
    if (!(+p.level >= 1 && +p.level <= 4)) errs.push('level must be 1–4');
    if (!p.reaction) errs.push('missing reaction');
    if (!errs.length) { try { solve(p, lib); } catch (e) { errs.push(e.message); } }
    return errs;
  }

  return {
    BONDS: BONDS, BE: BE, MOLS: MOLS, LEVELS: LEVELS, COLUMNS: COLUMNS, fhtml: fhtml, parseNum: parseNum, evalExpr: evalExpr, isExpr: isExpr, fmt: fmt, sgn: sgn, within: within,
    parseReaction: parseReaction, eqHTML: eqHTML, bondEnergyOf: bondEnergyOf, solve: solve, checkCount: checkCount, checkValue: checkValue, checkFinal: checkFinal,
    parseBonds: parseBonds, validateMolecule: validateMolecule, validateProblem: validateProblem, libWith: libWith
  };
})();
if (typeof module !== 'undefined') module.exports = BEE;
