/* Bond Energy Workbench — page code */
(function () {
  'use strict';
  var B = BEE, fmt = B.fmt, sgn = B.sgn;
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var store = {
    get: function (k, d) { try { var v = localStorage.getItem('bew_' + k); return v === null ? d : JSON.parse(v); } catch (e) { return d; } },
    set: function (k, v) { try { localStorage.setItem('bew_' + k, JSON.stringify(v)); } catch (e) { } }
  };
  function esc(s) { return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }
  function plain(s) { return String(s).replace(/<[^>]+>/g, ''); }
  var CAVEAT = '<b>These are estimates.</b> Bond energies are <i>averages</i> over many different molecules, and every species is treated as a gas. The real strength of a bond depends on the rest of its molecule, so ΔH from bond energies can differ noticeably from the measured value (from ΔH°<sub>f</sub> data or calorimetry).';

  var BASE = BEW_PROBLEMS.slice(), problems = [], byId = {}, LIB = B.MOLS;
  function mergeProblems() {
    var up = store.get('uploads', { mols: [], probs: [] });
    LIB = B.libWith(up.mols || []);
    var map = {}, order = [];
    BASE.forEach(function (p) { map[p.id] = p; order.push(p.id); });
    (up.probs || []).forEach(function (p) { if (!map[p.id]) order.push(p.id); map[p.id] = Object.assign({}, p, { uploaded: true }); });
    problems = order.map(function (id) { return map[id]; }).filter(function (p) { try { B.solve(p, LIB); return true; } catch (e) { return false; } });
    byId = {}; problems.forEach(function (p) { byId[p.id] = p; });
  }
  function solve(p) { return B.solve(p, LIB); }
  function inLevel(lv) { return problems.filter(function (p) { return lv === 'all' || String(p.level) === String(lv); }); }
  function randomFrom(list, notId) { var pool = list.filter(function (p) { return p.id !== notId; }); if (!pool.length) pool = list; return pool[Math.floor(Math.random() * pool.length)]; }
  function showTab(name) { $$('#nav button').forEach(function (b) { b.classList.toggle('on', b.dataset.tab === name); }); $$('.tab').forEach(function (t) { t.classList.toggle('on', t.id === 'tab-' + name); }); store.set('tab', name); }
  $('#nav').addEventListener('click', function (e) { var b = e.target.closest('button'); if (b) showTab(b.dataset.tab); });
  function levelChips(cur) {
    var h = '<button class="chip' + (cur === 'all' ? ' on' : '') + '" data-lv="all">All<span class="n">' + problems.length + '</span></button>';
    [1, 2, 3, 4].forEach(function (l) { h += '<button class="chip' + (String(cur) === String(l) ? ' on' : '') + '" data-lv="' + l + '">' + l + ' · ' + B.LEVELS[l] + '<span class="n">' + inLevel(l).length + '</span></button>'; });
    return h;
  }
  function bondTable(highlight) {
    highlight = highlight || [];
    var rows = B.BONDS.map(function (b) { var on = highlight.indexOf(b[0]) >= 0; return '<tr' + (on ? ' style="background:#fff4d6;font-weight:600"' : '') + '><td>' + b[0] + '</td><td class="v">' + b[1] + '</td></tr>'; });
    var half = Math.ceil(rows.length / 2);
    return '<div style="display:flex;gap:10px"><table class="bt">' + rows.slice(0, half).join('') + '</table><table class="bt">' + rows.slice(half).join('') + '</table></div><p class="small muted" style="margin:6px 0 0">Average bond energies, kJ/mol. Highlighted: bonds in this reaction.</p>';
  }
  function problemCard(s, p) {
    return '<div class="card"><div class="pid">' + esc(p.id) + ' · Level ' + p.level + (p.uploaded ? ' · <span class="tag">uploaded</span>' : '') + '</div>' +
      '<div class="ptext">' + s.text + '</div><div style="margin:10px 0 2px"><span class="eqbig">' + B.eqHTML(s.r) + ' &nbsp; ΔH ≈ ?</span></div>' +
      '<div class="mols">' + s.species.map(function (f) { var m = s.lib[f]; return '<div class="mol"><b>' + B.fhtml(f) + '</b> <span class="nm">' + esc(m.name) + '</span><pre class="struct">' + esc(m.struct) + '</pre></div>'; }).join('') + '</div>' +
      '<p class="small muted" style="margin:6px 0 0">Structures show every bond; lone pairs are not shown.</p></div>';
  }
  function compareHTML(s) {
    var mx = Math.max(Math.abs(s.est), Math.abs(s.meas)) || 1;
    var bar = function (v, col) { return '<div class="bar" style="width:' + Math.max(2, Math.abs(v) / mx * 100) + '%;background:' + col + '"></div>'; };
    return '<div class="cmp"><span>Bond-energy estimate</span>' + bar(s.est, '#e8590c') + '<b>' + sgn(s.est) + ' kJ</b>' +
      '<span>Measured (from ΔH°<sub>f</sub>)</span>' + bar(s.meas, '#1c64b0') + '<b>' + sgn(s.meas) + ' kJ</b></div>' +
      '<p style="margin:6px 0">Difference: ' + sgn(s.diff) + ' kJ (' + fmt(Math.abs(s.pct)) + '% of the measured value).</p>' +
      '<div class="caveat">' + CAVEAT + (Math.abs(s.pct) > 10 ? ' In this reaction the gap is large: the bonds involved are noticeably stronger or weaker here than their averages.' : ' Here the estimate is close.') + '</div>';
  }

  // ================= COACHING =================
  var C = { level: store.get('cLevel', 'all') };
  function coachShell() {
    $('#tab-coach').innerHTML = '<div class="card"><div class="chips" id="cLv"></div><div style="margin-top:10px;display:flex;gap:8px;flex-wrap:wrap;align-items:center"><select id="cPick" style="max-width:520px"></select><button class="btn alt" id="cRand">Pick one for me</button></div></div><div id="cBody"></div>';
    $('#cLv').addEventListener('click', function (e) { var b = e.target.closest('[data-lv]'); if (!b) return; C.level = b.dataset.lv; store.set('cLevel', C.level); fillPicker(); var l = inLevel(C.level); if (!C.p || l.indexOf(C.p) < 0) openCoach(l[0].id); });
    $('#cPick').addEventListener('change', function () { openCoach(this.value); });
    $('#cRand').addEventListener('click', function () { openCoach(randomFrom(inLevel(C.level), C.p && C.p.id).id); });
  }
  function fillPicker() {
    $('#cLv').innerHTML = levelChips(C.level);
    $('#cPick').innerHTML = inLevel(C.level).map(function (p) { return '<option value="' + esc(p.id) + '"' + (C.p && C.p.id === p.id ? ' selected' : '') + '>' + esc(p.id) + ' · ' + esc(plain(B.eqHTML(solve(p).r))) + '</option>'; }).join('');
  }
  function openCoach(id) {
    var p = byId[id] || problems[0]; C.p = p; C.s = solve(p); store.set('cId', p.id);
    C.tries = 0; C.shown = {}; C.step = 0; C.stepTries = []; C.vals = []; C.exprs = []; C.stepShown = []; C.counted = false;
    if (C.level !== 'all' && String(p.level) !== String(C.level)) { C.level = 'all'; store.set('cLevel', 'all'); }
    fillPicker(); renderCoach();
  }
  function renderCoach() {
    var s = C.s;
    var head = '<tr><th>Molecule</th>' + s.types.map(function (t) { return '<th>' + t + '</th>'; }).join('') + '<th></th></tr>';
    var rows = s.species.map(function (f, i) {
      return '<tr><td>' + B.fhtml(f) + '</td>' + s.types.map(function (t, j) { return '<td><input type="text" class="cnt" data-c="' + i + '_' + j + '" autocomplete="off"></td>'; }).join('') + '<td class="mini" id="cf' + i + '" style="text-align:left"></td></tr>';
    }).join('');
    $('#cBody').innerHTML = problemCard(s, C.p) +
      '<div class="work"><div>' +
      '<div class="card" id="cCount"><h2>1 · Count the bonds in one molecule of each</h2><p class="small muted" style="margin-top:-4px">Use the structures above. Type how many of each bond one molecule has; leave a box blank for 0. A double bond (=) counts as <b>one</b> C=C or C=O bond.</p>' +
      '<table class="cnt">' + head + rows + '</table><div style="margin-top:10px;display:flex;gap:8px;align-items:center"><button class="btn" id="kCheck">Check counts</button><span id="kShow"></span></div><div class="fb" id="kFb"></div></div>' +
      '<div class="card" id="cCalc"><h2>2 · Bonds broken, bonds formed, ΔH</h2><div id="calcBody"><p class="muted">Count the bonds first.</p></div></div>' +
      '</div><div class="sticky"><div class="card"><h2>Bond energies</h2>' + bondTable(s.types) + '</div></div></div>';
    $('#kCheck').addEventListener('click', checkCounts);
    $$('#cCount input').forEach(function (i) { i.addEventListener('keydown', function (e) { if (e.key === 'Enter') checkCounts(); }); });
  }
  function checkCounts() {
    var s = C.s, t = ++C.tries, all = true;
    s.species.forEach(function (f, i) {
      var msgs = [];
      s.types.forEach(function (ty, j) {
        var inp = $('[data-c="' + i + '_' + j + '"]'), r = B.checkCount(s, f, ty, inp.value);
        inp.classList.toggle('ok', r.ok); inp.classList.toggle('bad', !r.ok);
        if (!r.ok) { all = false; if (msgs.indexOf(r.msg) < 0) msgs.push(ty + ': ' + r.msg); }
      });
      $('#cf' + i).innerHTML = msgs.join(' ');
    });
    if (all) return countsDone(false);
    $('#kFb').className = 'fb bad'; $('#kFb').innerHTML = 'Some counts are off.' + (t >= 2 ? '<div class="fb rule">Every line in the structure is one bond. Count each line once, and name it by the two atoms it joins. A double line (=) is one double bond, not two single bonds.</div>' : '');
    if (t >= 3) { $('#kShow').innerHTML = '<button class="btn alt" id="kSh">Show me</button>'; $('#kSh').addEventListener('click', function () { countsDone(true); }); }
  }
  function countsDone(shown) {
    var s = C.s; C.shown.count = shown;
    s.species.forEach(function (f, i) { s.types.forEach(function (ty, j) { var inp = $('[data-c="' + i + '_' + j + '"]'), n = s.lib[f].bonds[ty] || 0; inp.value = n ? n : ''; inp.classList.remove('bad'); if (n) inp.classList.add('ok'); inp.disabled = true; }); $('#cf' + i).innerHTML = ''; });
    $('#kCheck').disabled = true; $('#kShow').innerHTML = ''; $('#kFb').className = 'fb ok'; $('#kFb').innerHTML = shown ? 'Here are the counts.' : 'All counts right.';
    C.step = 0; renderCalc();
  }
  function renderCalc() {
    var s = C.s, h = '';
    for (var i = 0; i <= Math.min(C.step, s.steps.length - 1); i++) {
      var st = s.steps[i], done = i < C.step;
      h += '<div class="step' + (done ? ' done' : '') + '"><div class="lbl">' + st.label + '</div>';
      if (i === 0 && !done) h += '<div class="small muted">Reactants: ' + s.r.L.map(function (t) { return t.c + ' × ' + B.fhtml(t.f); }).join(', ') + '</div>';
      if (i === 1 && !done) h += '<div class="small muted">Products: ' + s.r.R.map(function (t) { return t.c + ' × ' + B.fhtml(t.f); }).join(', ') + '</div>';
      if (done) h += ((C.exprs || [])[i] ? '<div class="small" style="margin-top:4px">You entered: <code>' + esc(C.exprs[i]) + '</code> = ' + fmt(B.evalExpr(C.exprs[i])) + ' kJ</div>' : '') + '<div class="worked">' + st.sym + ' = ' + st.worked + ((C.stepShown || [])[i] ? ' <span class="tag">shown</span>' : ' <span style="color:var(--ok)">✓</span>') + '</div>';
      else h += '<div class="row" style="margin-top:6px"><span class="sym">' + st.sym + ' =</span><input type="text" class="num" id="calcIn" autocomplete="off" style="width:280px" placeholder="e.g. 4×413 + 2×495" value="' + esc(C.vals[i] || '') + '"><span class="muted">kJ</span><span id="calcPrev" class="muted" style="font-family:ui-monospace,Consolas,monospace"></span><button class="btn" id="calcCk">Check</button></div><div class="small muted" style="margin-top:2px">You can type a calculation: numbers with + − × ÷ (or * /) and parentheses. It’s worked out when you check.</div><div class="fb" id="calcFb"></div>';
      h += '</div>';
    }
    if (C.step >= s.steps.length) h += summaryHTML();
    $('#calcBody').innerHTML = h;
    var b = $('#calcCk'); if (b) { b.addEventListener('click', checkCalc); $('#calcIn').addEventListener('keydown', function (e) { if (e.key === 'Enter') checkCalc(); }); $('#calcIn').addEventListener('input', preview); preview(); $('#calcIn').focus(); }
    var nx = $('#cNext'); if (nx) nx.addEventListener('click', function () { openCoach(randomFrom(inLevel(C.level), C.p.id).id); window.scrollTo(0, 0); });
    var tt = $('#cToTest'); if (tt) tt.addEventListener('click', function () { showTab('test'); openTest(randomFrom(inLevel(C.p.level), C.p.id).id); });
  }
  function preview() {
    var inp = $('#calcIn'), pv = $('#calcPrev'); if (!inp || !pv) return;
    var raw = inp.value;
    if (!B.isExpr(raw)) { pv.textContent = ''; return; }
    var v = B.evalExpr(raw); pv.textContent = isFinite(v) ? '= ' + plain(fmt(v)) : '= …';
  }
  function checkCalc() {
    var s = C.s, i = C.step, st = s.steps[i], raw = $('#calcIn').value; C.vals[i] = raw;
    var r = B.checkValue(st, raw), fb = $('#calcFb');
    if (r.empty) { fb.className = 'fb bad'; fb.innerHTML = r.msg; return; }
    if (r.ok) { C.exprs = C.exprs || []; C.exprs[i] = B.isExpr(raw) ? raw : ''; C.step++; renderCalc(); return; }
    if (B.isExpr(raw) && isFinite(B.evalExpr(raw))) r.msg = 'Your calculation gives ' + fmt(B.evalExpr(raw)) + ' kJ. ' + r.msg;
    var t = C.stepTries[i] = (C.stepTries[i] || 0) + 1;
    $('#calcIn').classList.add('bad'); fb.className = 'fb bad';
    fb.innerHTML = r.msg + (t >= 2 ? '<div class="fb rule">' + st.rule + '</div>' : '') + (t >= 3 ? '<div style="margin-top:6px"><button class="btn alt" id="cSh">Show me</button></div>' : '');
    var sb = $('#cSh'); if (sb) sb.addEventListener('click', function () { C.stepShown = C.stepShown || []; C.stepShown[i] = true; C.step++; renderCalc(); });
  }
  function summaryHTML() {
    var s = C.s, n = (C.stepShown || []).filter(Boolean).length + (C.shown.count ? 1 : 0);
    return '<div class="summary"><div class="big">ΔH<sub>est</sub> ≈ ' + sgn(s.est) + ' kJ <span class="tag ' + (s.est < 0 ? 'exo">exothermic' : 'endo">endothermic') + '</span></div>' +
      (C.p.id === 'B3-06' ? '<p style="margin:6px 0">Per mole of octane: ' + fmt(s.est / 2) + ' kJ, the slide’s −5140 kJ/mol.</p>' : '') +
      '<h3 style="margin:10px 0 2px">How close is the estimate?</h3>' + compareHTML(s) +
      '<p class="small muted" style="margin:8px 0">' + (n ? n + ' part' + (n > 1 ? 's were' : ' was') + ' shown.' : 'Every part done on your own.') + '</p>' +
      '<button class="btn" id="cNext">Next problem</button> <button class="btn alt" id="cToTest">Test myself on this level</button></div>';
  }

  // ================= TESTING =================
  var T = { level: store.get('tLevel', 'all'), score: { solved: 0, tried: 0, first: 0 } };
  function testShell() {
    $('#tab-test').innerHTML = '<div class="card"><div class="chips" id="tLv"></div><div style="margin-top:10px;display:flex;gap:16px;align-items:center;flex-wrap:wrap"><button class="btn" id="tNew">New problem</button><div class="score" id="tScore"></div></div></div><div class="work"><div id="tBody"></div><div class="sticky"><div class="card"><h2>Bond energies</h2><div id="tTable"></div></div></div></div>';
    $('#tLv').addEventListener('click', function (e) { var b = e.target.closest('[data-lv]'); if (!b) return; T.level = b.dataset.lv; store.set('tLevel', T.level); openTest(randomFrom(inLevel(T.level), T.p && T.p.id).id); });
    $('#tNew').addEventListener('click', function () { openTest(randomFrom(inLevel(T.level), T.p && T.p.id).id); });
  }
  function renderScore() { var s = T.score; $('#tScore').innerHTML = '<span>Solved <b>' + s.solved + '</b></span><span>Attempted <b>' + s.tried + '</b></span><span>First try <b>' + s.first + '</b></span>'; }
  function openTest(id) {
    var p = byId[id]; T.p = p; T.s = solve(p); T.tries = 0; T.finished = false; T.counted = false;
    $('#tLv').innerHTML = levelChips(T.level); $('#tTable').innerHTML = bondTable([]);
    $('#tBody').innerHTML = problemCard(T.s, p).replace(/<\/div>$/, '') +
      '<div style="display:flex;gap:10px;align-items:center;flex-wrap:wrap;margin-top:14px"><span style="font-family:Georgia,serif;font-size:17px">ΔH<sub>est</sub> ≈</span><input type="text" class="num" id="tAns" autocomplete="off"><span class="muted">kJ</span><button class="btn" id="tCheck">Check</button></div>' +
      '<div class="fb" id="tFb"></div><div id="tMore"></div><div style="margin-top:12px"><button class="btn alt" id="tCoach">Coach me through this one</button></div></div>';
    $('#tCheck').addEventListener('click', checkTest); $('#tAns').addEventListener('keydown', function (e) { if (e.key === 'Enter') checkTest(); });
    $('#tCoach').addEventListener('click', function () { showTab('coach'); openCoach(p.id); window.scrollTo(0, 0); });
    renderScore(); $('#tAns').focus();
  }
  function solutionHTML(s) { return '<ol>' + s.steps.map(function (x) { return '<li class="worked">' + x.sym + ' = ' + x.worked + '</li>'; }).join('') + '</ol>'; }
  function checkTest() {
    if (T.finished) return;
    var r = B.checkFinal(T.s, $('#tAns').value), fb = $('#tFb');
    if (r.empty) { fb.className = 'fb bad'; fb.innerHTML = r.msg; return; }
    if (!T.counted) { T.counted = true; T.score.tried++; } T.tries++;
    if (r.ok) {
      T.finished = true; T.score.solved++; if (T.tries === 1) T.score.first++;
      $('#tAns').classList.add('ok'); $('#tAns').classList.remove('bad'); fb.className = 'fb ok'; fb.innerHTML = '✓ Correct' + (T.tries === 1 ? ' on the first try!' : '.') + ' ΔH<sub>est</sub> ≈ ' + sgn(T.s.est) + ' kJ';
      $('#tMore').innerHTML = compareHTML(T.s) + '<details><summary>See the solution</summary>' + solutionHTML(T.s) + '</details><button class="btn" id="tNext" style="margin-top:8px">Next problem</button>';
      $('#tNext').addEventListener('click', function () { openTest(randomFrom(inLevel(T.level), T.p.id).id); }); renderScore(); return;
    }
    $('#tAns').classList.add('bad'); fb.className = 'fb bad'; fb.innerHTML = r.msg;
    var more = '';
    if (T.tries >= 2) more += '<div class="plan"><b>Plan</b><ol><li>Count the bonds in one molecule of each species.</li><li>Σ BE(broken): reactant bonds × coefficients × bond energies.</li><li>Σ BE(formed): the same for the products.</li><li>ΔH ≈ Σ broken − Σ formed.</li></ol></div>';
    if (T.tries >= 3) more += '<div style="margin-top:8px"><button class="btn alt" id="tShow">Show the solution</button></div>';
    $('#tMore').innerHTML = more;
    var sb = $('#tShow'); if (sb) sb.addEventListener('click', function () { T.finished = true; $('#tMore').innerHTML = '<div class="summary" style="margin-top:8px"><b>Solution</b>' + solutionHTML(T.s) + compareHTML(T.s) + '</div><button class="btn" id="tNext" style="margin-top:8px">Next problem</button>'; $('#tNext').addEventListener('click', function () { openTest(randomFrom(inLevel(T.level), T.p.id).id); }); });
    renderScore();
  }

  // ================= REVIEW =================
  function example(id, title, hidden, extra) {
    var p = BASE.filter(function (x) { return x.id === id; })[0]; if (!p) return '';
    var s = B.solve(p);
    var cnt = '<table class="cnt"><tr><th>Molecule</th>' + s.types.map(function (t) { return '<th>' + t + '</th>'; }).join('') + '</tr>' + s.species.map(function (f) { return '<tr><td>' + B.fhtml(f) + '</td>' + s.types.map(function (t) { return '<td>' + (s.lib[f].bonds[t] || '') + '</td>'; }).join('') + '</tr>'; }).join('') + '</table>';
    var body = cnt + solutionHTML(s) + (extra || '') + compareHTML(s);
    return '<div class="card"><h3 style="margin-top:0">' + title + '</h3><span class="eqbig">' + B.eqHTML(s.r) + '</span><div class="mols">' + s.species.map(function (f) { return '<div class="mol"><b>' + B.fhtml(f) + '</b><pre class="struct">' + esc(s.lib[f].struct) + '</pre></div>'; }).join('') + '</div><div style="margin-top:8px">' + (hidden ? '<details><summary>Show the solution</summary>' + body + '</details>' : body) + '</div></div>';
  }
  function renderReview() {
    var demo = ['B1-01', 'B1-02', 'B3-05', 'B3-01', 'B1-05', 'B2-03', 'B2-06'].map(function (id) { var s = B.solve(BASE.filter(function (x) { return x.id === id; })[0]); return '<tr><td>' + B.eqHTML(s.r) + '</td><td>' + sgn(s.est) + '</td><td>' + sgn(s.meas) + '</td><td>' + fmt(Math.abs(s.pct)) + '%</td></tr>'; }).join('');
    $('#tab-review').innerHTML =
      '<div class="caveat" style="font-size:15.5px">' + CAVEAT + '</div>' +
      '<div class="card"><h2>Chemical energy is stored in bonds</h2><p>The <b>bond energy</b> is the energy needed to break one mole of a particular bond in gas-phase molecules. Breaking a bond always takes energy (positive); forming the same bond releases the same amount.</p>' +
      '<p>In a reaction, the reactant bonds break and the product bonds form. So:</p><div class="eqn">ΔH<sub>rxn</sub> ≈ Σ BE(bonds broken) − Σ BE(bonds formed)</div>' +
      '<ul><li>If the product bonds are stronger than the reactant bonds, more energy comes out than goes in: ΔH &lt; 0, exothermic.</li><li>If the reactant bonds are stronger: ΔH &gt; 0, endothermic.</li></ul></div>' +
      '<div class="card"><h2>Why the result is an estimate</h2><p>A C–H bond in methane is not exactly as strong as a C–H bond in ethanol or in chloroform. Tables list an <b>average</b> taken over many molecules. That’s why the table has a separate value for C=O in CO₂ (799 kJ/mol) and a general C=O value (745 kJ/mol).</p>' +
      '<p>Bond energies are also for <b>gases</b>. If a reactant or product is a liquid or solid, the energy to vaporize it isn’t included.</p>' +
      '<p>How good is the estimate? It depends on the reaction. Here are some from this tool’s problems, compared with values from ΔH°<sub>f</sub> data:</p>' +
      '<table class="ref"><tr><th>Reaction (gases)</th><th>Estimate (kJ)</th><th>Measured (kJ)</th><th>Difference</th></tr>' + demo + '</table>' +
      '<p class="small">Use bond energies to estimate, to compare reactions, and to understand <i>why</i> a reaction releases energy. When an accurate ΔH is needed, use ΔH°<sub>f</sub> data (Hess’s law) or calorimetry.</p></div>' +
      '<div class="card"><h2>Counting bonds</h2><ol><li>Draw (or read) the structure of each molecule.</li><li>Count each line once, by the two atoms it joins: CH₄ has 4 C–H; C₂H₆ has 1 C–C and 6 C–H.</li><li>A double bond is <b>one</b> double bond: CO₂ has 2 C=O, not 4 C–O. A triple bond is one triple bond: N₂ has 1 N≡N.</li><li>Multiply by the coefficient: 2 CH₄ has 8 C–H.</li></ol></div>' +
      '<div class="card"><h2>Bond energy table</h2>' + bondTable([]) + '</div>' +
      '<h2 style="margin:18px 0 10px">Worked examples</h2>' +
      example('B1-01', 'Example 1 · H₂ + Cl₂ → 2HCl') + example('B3-01', 'Example 2 · Combustion of methane') +
      example('B3-06', 'Example 3 · Combustion of octane (slide 15)', false, '<p class="small">Per mole of octane: −10279 ÷ 2 = −5140 kJ, matching the slide. (The slide adds −42,380 + 32,101, which is −10,279 kJ for 2 mol of octane, then reports −5140 kJ per mole.)</p>') +
      example('B1-05', 'You try this one · The Haber process', true) +
      '<div class="card"><h2>How to type</h2><ul><li>Bond counts: whole numbers; leave blank for 0.</li><li>Energies in kJ: <kbd>2652</kbd>, <kbd>-802</kbd> or <kbd>−802</kbd>. In Coaching step 2 you can also type a calculation, such as <kbd>4×413 + 2×495</kbd> or <kbd>2642 − 3466</kbd>; it’s worked out when you check. Enter Σ broken and Σ formed as positive sums; the sign comes in ΔH = broken − formed.</li><li>Answers within about 1 kJ are accepted.</li></ul></div>';
  }

  // ================= INSTRUCTOR =================
  var TEMPLATE = [
    { kind: 'molecule', formula: 'C2H5OH', name: 'ethanol (gas)', bonds: 'C-C:1; C-H:5; C-O:1; O-H:1', dHf: '-234.8', struct: '    H   H\\n    |   |\\nH – C – C – O – H\\n    |   |\\n    H   H' },
    { kind: 'problem', id: 'X-01', level: 3, reaction: 'C2H5OH + 3O2 -> 2CO2 + 3H2O' },
    { kind: 'problem', id: 'X-02', level: 2, reaction: 'C2H4 + Cl2 -> C2H4Cl2', text: 'Requires a molecule row for C2H4Cl2.' }
  ];
  function csvCell(v) { v = v === undefined || v === null ? '' : String(v); return /[",\n\t]/.test(v) ? '"' + v.replace(/"/g, '""') + '"' : v; }
  function toCSV(rows) { return B.COLUMNS.join(',') + '\n' + rows.map(function (r) { return B.COLUMNS.map(function (c) { return csvCell(r[c]); }).join(','); }).join('\n') + '\n'; }
  function parseTable(text) {
    var delim = text.split('\n')[0].indexOf('\t') >= 0 ? '\t' : ',', rows = [], row = [], cell = '', q = false;
    for (var i = 0; i < text.length; i++) {
      var ch = text[i];
      if (q) { if (ch === '"') { if (text[i + 1] === '"') { cell += '"'; i++; } else q = false; } else cell += ch; }
      else if (ch === '"') q = true; else if (ch === delim) { row.push(cell); cell = ''; }
      else if (ch === '\n' || ch === '\r') { if (ch === '\r' && text[i + 1] === '\n') i++; row.push(cell); rows.push(row); row = []; cell = ''; } else cell += ch;
    }
    if (cell !== '' || row.length) { row.push(cell); rows.push(row); }
    rows = rows.filter(function (r) { return r.some(function (c) { return String(c).trim() !== ''; }); }); if (!rows.length) return [];
    var head = rows[0].map(function (h) { return h.trim(); });
    return rows.slice(1).map(function (r) { var o = {}; head.forEach(function (h, k) { var v = (r[k] || '').replace(/^\s+|\s+$/g, ''); if (v !== '') o[h] = v; }); return o; });
  }
  function offerFile(name, text, mime, box) {
    try { var a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([text], { type: mime })); a.download = name; document.body.appendChild(a); a.click(); setTimeout(function () { a.remove(); }, 500); } catch (e) { }
    $('#' + box).innerHTML = '<p class="small muted" style="margin:8px 0 4px">If no file downloaded (downloads are blocked in the claude.ai preview), copy this text into a file named <b>' + esc(name) + '</b>:</p><textarea class="copy" readonly>' + esc(text) + '</textarea>';
  }
  var pending = null;
  function renderInstr() {
    var up = store.get('uploads', { mols: [], probs: [] }), nU = (up.mols || []).length + (up.probs || []).length;
    $('#tab-instr').innerHTML =
      '<div class="card"><h2>Problem spreadsheet</h2><p>One sheet with two kinds of rows. <b>problem</b> rows give a reaction using formulas from the molecule library. <b>molecule</b> rows add new molecules to the library: formula, name, bond counts, gas-phase ΔH°<sub>f</sub> and an optional text structure. The tool counts the bonds and computes both the estimate and the measured value, so there is no answer-key column.</p>' +
      '<div style="display:flex;gap:8px;flex-wrap:wrap"><button class="btn" id="iTpl">Download template (.csv)</button><button class="btn alt" id="iCur">Download current problems (.csv)</button></div><div id="iBox1"></div>' +
      '<details style="margin-top:10px"><summary>Column guide</summary><ul class="small"><li><code>kind</code>: problem or molecule.</li><li>Problem rows: <code>id, level</code> (1–4), <code>reaction</code> like <code>CH4 + 2O2 -&gt; CO2 + 2H2O</code> (gases; whole-number coefficients), optional <code>text</code>.</li><li>Molecule rows: <code>formula</code> (e.g. C2H5OH), <code>name</code>, <code>bonds</code> like <code>C-C:1; C-H:5; C-O:1; O-H:1</code> (use = and # for double and triple bonds; <code>C=O (in CO2)</code> only for CO₂), <code>dHf</code> (gas, kJ/mol), optional <code>struct</code> with <code>\\n</code> between lines.</li><li>Molecules already in the library: ' + Object.keys(B.MOLS).join(', ') + '.</li></ul></details></div>' +
      '<div class="card"><h2>Upload</h2><p>A .csv or tab-delimited .txt file with the columns above.</p><input type="file" id="iFile" accept=".csv,.txt,.tsv"><div id="iRes"></div></div>' +
      '<div class="card"><h2>Saved in this browser</h2><p>' + (nU ? (up.mols || []).length + ' molecule(s) and ' + (up.probs || []).length + ' problem(s) uploaded.' : 'Nothing uploaded. Students see the built-in set (' + problems.length + ' problems).') + '</p>' + (nU ? '<button class="btn alt" id="iRemove">Remove uploads</button>' : '') +
      '<h3>Updating what students see</h3><ol class="small"><li>Edit the spreadsheet (start from “Download current problems” to keep the built-in set).</li><li>Upload it here and fix any flagged rows.</li><li>Click <b>Download problems.json</b>.</li><li>On GitHub: <b>Add file → Upload files</b>, upload problems.json, and commit. It replaces the whole problem set.</li></ol></div>';
    $('#iTpl').addEventListener('click', function () { offerFile('bond-energy-template.csv', toCSV(TEMPLATE), 'text/csv', 'iBox1'); });
    $('#iCur').addEventListener('click', function () { offerFile('bond-energy-problems.csv', toCSV(problems.map(function (p) { return Object.assign({ kind: 'problem' }, p); })), 'text/csv', 'iBox1'); });
    $('#iFile').addEventListener('change', function () { var f = this.files[0]; if (!f) return; var rd = new FileReader(); rd.onload = function () { handleUpload(String(rd.result)); }; rd.readAsText(f); });
    var rm = $('#iRemove'); if (rm) rm.addEventListener('click', function () { store.set('uploads', { mols: [], probs: [] }); mergeProblems(); refreshAll(); renderInstr(); });
  }
  function handleUpload(text) {
    var rows = parseTable(text), h = '', mols = [], probs = [], seen = {};
    rows.forEach(function (r) { if ((r.kind || '').toLowerCase() === 'molecule') { var e = B.validateMolecule(r); r._errs = e; if (!e.length) mols.push(r); } });
    var lib = B.libWith(mols);
    rows.forEach(function (r, k) {
      var kind = (r.kind || 'problem').toLowerCase(), errs, res = '';
      if (kind === 'molecule') { errs = r._errs; if (!errs.length) res = 'molecule ' + r.formula + ' added (bond energy sum ' + fmt(B.bondEnergyOf(lib[r.formula].bonds)) + ' kJ/mol)'; }
      else { errs = B.validateProblem(r, lib); if (r.id && seen[r.id]) errs.push('duplicate id'); seen[r.id] = 1; if (!errs.length) { var s = B.solve(r, lib); res = 'estimate ' + plain(sgn(s.est)) + ' kJ, measured ' + plain(sgn(s.meas)) + ' kJ'; probs.push(r); } }
      h += '<tr><td>' + (k + 2) + '</td><td>' + esc(kind) + '</td><td>' + esc(r.id || r.formula || '') + '</td><td>' + (errs.length ? '<span style="color:var(--bad)">✗ ' + esc(errs.join('; ')) + '</span>' : '<span style="color:var(--ok)">✓</span> ' + esc(res)) + '</td></tr>';
    });
    pending = { mols: mols.map(function (m) { var o = {}; ['kind', 'formula', 'name', 'bonds', 'dHf', 'struct'].forEach(function (k) { if (m[k] !== undefined) o[k] = m[k]; }); return o; }), probs: probs };
    $('#iRes').innerHTML = '<p>' + rows.length + ' rows read: ' + mols.length + ' molecule(s) and ' + probs.length + ' problem(s) ready.</p><table class="up"><tr><th>Row</th><th>Kind</th><th>id / formula</th><th>Result</th></tr>' + h + '</table>' +
      (probs.length || mols.length ? '<div style="margin-top:10px;display:flex;gap:8px;flex-wrap:wrap"><button class="btn" id="iTry">Try these in this browser</button><button class="btn alt" id="iJson">Download problems.json</button></div><div id="iBox2"></div>' : '');
    var tb = $('#iTry');
    if (tb) {
      tb.addEventListener('click', function () { var up = store.get('uploads', { mols: [], probs: [] }); var mm = {}, pm = {}; (up.mols || []).concat(pending.mols).forEach(function (m) { mm[m.formula] = m; }); (up.probs || []).concat(pending.probs).forEach(function (p) { pm[p.id] = p; }); store.set('uploads', { mols: Object.keys(mm).map(function (k) { return mm[k]; }), probs: Object.keys(pm).map(function (k) { return pm[k]; }) }); mergeProblems(); refreshAll(); renderInstr(); $('#iRes').innerHTML = '<div class="fb ok">Saved in this browser. Open Coaching or Testing to try them.</div>'; });
      $('#iJson').addEventListener('click', function () { offerFile('problems.json', JSON.stringify({ molecules: pending.mols, problems: pending.probs }, null, 1), 'application/json', 'iBox2'); });
    }
  }

  function refreshAll() { fillPicker(); if (!C.p || !byId[C.p.id]) openCoach(problems[0].id); $('#tLv').innerHTML = levelChips(T.level); }
  function start() {
    mergeProblems(); renderReview(); coachShell(); testShell(); renderInstr();
    var last = store.get('cId', null); openCoach(byId[last] ? last : (inLevel(C.level)[0] || problems[0]).id);
    openTest(randomFrom(inLevel(T.level)).id); showTab(store.get('tab', 'coach'));
  }
  var started = false; function go() { if (!started) { started = true; start(); } }
  try {
    if (location.protocol.indexOf('http') === 0 && typeof fetch === 'function') {
      var timer = setTimeout(go, 1500);
      fetch('problems.json', { cache: 'no-store' }).then(function (r) { return r.ok ? r.json() : null; }).then(function (j) {
        if (j && !started) {
          if (Array.isArray(j) && j.length) BASE = j;
          else if (j.problems && j.problems.length) { BASE = j.problems; B.MOLS_EXTRA = j.molecules || []; var lib = B.libWith(j.molecules || []); for (var k in lib) B.MOLS[k] = lib[k]; }
        }
        clearTimeout(timer); go();
      }).catch(function () { clearTimeout(timer); go(); });
    } else go();
  } catch (e) { go(); }
})();
