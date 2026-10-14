(function () {
  'use strict';

  const root = document.getElementById('llm-logistic');
  if (!root) return;

  const chartContainer = document.getElementById('llm-logistic-frontier-chart');

  const lang = root.dataset.lang === 'it' ? 'it' : 'en';

  const i18n = {
    notEnoughData: {
      en: 'Not enough data for frontier (need at least 4 frontier points).',
      it: 'Dati insufficienti per la frontiera (servono almeno 4 punti).',
    },
    fitFailed: {
      en: 'Logistic fit did not converge.',
      it: 'Il fit logistico non è riuscito.',
    },
    traceFrontier: { en: 'Frontier models',            it: 'Modelli frontiera' },
    traceTrend:    { en: 'Logistic trend',              it: 'Trend logistico' },
    traceProj:     { en: 'Projected 6 months',          it: 'Proiezione 6 mesi' },
    chartTitle:    { en: 'Most Intelligent Model Over Time', it: 'Modello più intelligente nel tempo' },
    axisRelease:   { en: 'Release date',                it: 'Data di rilascio' },
    axisIntel:     { en: 'Intelligence index',          it: 'Indice di intelligenza' },
    loadError:     { en: 'Failed to load data:',        it: 'Caricamento dati fallito:' },
  };

  function _(key) { return i18n[key][lang]; }

  const isDark = () => document.documentElement.dataset.theme !== 'light' &&
    (document.documentElement.dataset.theme === 'dark' ||
     window.matchMedia('(prefers-color-scheme: dark)').matches);

  const fmt = () => isDark() ? '#ddd' : '#333';
  const bg = 'rgba(0,0,0,0)';

  const EPOCH_ORD = 719163;

  function toOrd(d) {
    return Math.floor(d.getTime() / 86400000) + EPOCH_ORD;
  }
  function fromOrd(ord) {
    return new Date((ord - EPOCH_ORD) * 86400000);
  }

  function init() {
    fetch(root.dataset.src || '/data/language_models_free_2026-10-14.json')
      .then(r => r.json())
      .then(raw => {
        const maxDate = root.dataset.maxDate;
        const data = raw.data.filter(m => !maxDate || !m.release_date || m.release_date <= maxDate).map(m => {
          const rd = m.release_date ? new Date(m.release_date) : null;
          return {
            cleanName: m.name.replace(/\s*\(.*?\)/g, '').trim(),
            creator: m.model_creator?.name || 'Unknown',
            releaseDate: rd,
            releaseOrd: rd ? toOrd(rd) : null,
            intelligenceIndex: m.evaluations?.artificial_analysis_intelligence_index,
          };
        }).filter(d => d.releaseOrd != null && d.intelligenceIndex != null);

        renderChart(dedupBestVariant(data));
      })
      .catch(err => {
        chartContainer.innerHTML = '<p style="color:red;text-align:center;padding:2rem">' + _('loadError') + ' ' + err.message + '</p>';
      });
  }

  // Keep only the best-scoring variant per base model (e.g. Max thinking
  // over Xhigh/High/Non-reasoning) so no model appears twice on the frontier.
  function dedupBestVariant(data) {
    const best = new Map();
    for (const d of data) {
      const cur = best.get(d.cleanName);
      if (!cur || d.intelligenceIndex > cur.intelligenceIndex ||
          (d.intelligenceIndex === cur.intelligenceIndex && d.releaseOrd > cur.releaseOrd)) {
        best.set(d.cleanName, d);
      }
    }
    return [...best.values()];
  }

  function computeFrontier(data) {
    const sorted = [...data].sort((a, b) => a.releaseOrd - b.releaseOrd);
    let maxSoFar = -1;
    return sorted.filter(d => {
      if (d.intelligenceIndex > maxSoFar) {
        maxSoFar = d.intelligenceIndex;
        return true;
      }
      return false;
    });
  }

  // Logistic frontier fit, mirroring analysis/pages/1_Frontier.py:
  //   L / (1 + exp(-k * (x - x0))), bounds L in [yMax, max(100, yMax*1.5)],
  //   k in [0, 1], x0 in [0, xMaxShifted + 3650], p0 = (yMax*1.3, 0.005, median).
  function logisticEval(x, L, k, x0) {
    const z = Math.max(-500, Math.min(500, -k * (x - x0)));
    return L / (1 + Math.exp(z));
  }

  function sigmoid(u) { return 1 / (1 + Math.exp(-u)); }
  function toU(p, low, high) {
    const t = (p - low) / (high - low);
    const c = Math.min(1 - 1e-9, Math.max(1e-9, t));
    return Math.log(c / (1 - c));
  }
  function toP(u, low, high) { return low + (high - low) * sigmoid(u); }

  function fitLogistic(xOrd, y) {
    const xMin = Math.min(...xOrd);
    const xShifted = xOrd.map(v => v - xMin);
    const yMax = Math.max(...y);
    const upperL = Math.max(100, yMax * 1.5);
    const xMaxShifted = Math.max(...xShifted);
    const sortedX = [...xShifted].sort((a, b) => a - b);
    const median = sortedX.length % 2
      ? sortedX[(sortedX.length - 1) / 2]
      : (sortedX[sortedX.length / 2 - 1] + sortedX[sortedX.length / 2]) / 2;
    const p0 = [yMax * 1.3, 0.005, median];
    const bounds = [[yMax, upperL], [0, 1], [0, xMaxShifted + 3650]];
    const u0 = p0.map((p, i) => toU(p, bounds[i][0], bounds[i][1]));

    const sse = (params) => {
      let s = 0;
      for (let i = 0; i < xShifted.length; i++) {
        const d = logisticEval(xShifted[i], params[0], params[1], params[2]) - y[i];
        s += d * d;
      }
      return s;
    };
    const f = (u) => sse(u.map((uu, i) => toP(uu, bounds[i][0], bounds[i][1])));

    // Nelder-Mead simplex on the unbounded (logit-transformed) space.
    const n = u0.length;
    const alpha = 1, gamma = 2, rho = 0.5, sigma = 0.5;
    let simplex = [u0];
    for (let i = 0; i < n; i++) {
      const v = [...u0];
      v[i] += 0.75;
      simplex.push(v);
    }
    let vals = simplex.map(f);
    for (let iter = 0; iter < 800; iter++) {
      const order = [...Array(n + 1).keys()].sort((a, b) => vals[a] - vals[b]);
      simplex = order.map(i => simplex[i]);
      vals = order.map(i => vals[i]);
      if (Math.max(...vals) - Math.min(...vals) < 1e-10) break;
      const centroid = Array(n).fill(0);
      for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) centroid[j] += simplex[i][j] / n;
      const xr = centroid.map((c, j) => c + alpha * (c - simplex[n][j]));
      const fr = f(xr);
      if (fr < vals[0]) {
        const xe = centroid.map((c, j) => c + gamma * (xr[j] - c));
        const fe = f(xe);
        if (fe < fr) { simplex[n] = xe; vals[n] = fe; }
        else { simplex[n] = xr; vals[n] = fr; }
      } else if (fr < vals[n - 1]) {
        simplex[n] = xr; vals[n] = fr;
      } else {
        let contracted = false;
        if (fr < vals[n]) {
          const xc = centroid.map((c, j) => c + rho * (xr[j] - c));
          const fc = f(xc);
          if (fc <= fr) { simplex[n] = xc; vals[n] = fc; contracted = true; }
        } else {
          const xc = centroid.map((c, j) => c + rho * (simplex[n][j] - c));
          const fc = f(xc);
          if (fc < vals[n]) { simplex[n] = xc; vals[n] = fc; contracted = true; }
        }
        if (!contracted) {
          for (let i = 1; i <= n; i++) {
            simplex[i] = simplex[0].map((v, j) => v + sigma * (simplex[i][j] - v));
            vals[i] = f(simplex[i]);
          }
        }
      }
    }
    const bestU = simplex[vals.indexOf(Math.min(...vals))];
    const popt = bestU.map((uu, i) => toP(uu, bounds[i][0], bounds[i][1]));
    if (!popt.every(v => isFinite(v))) throw new Error('fit failed');
    return { L: popt[0], k: popt[1], x0: popt[2], xMin };
  }

  function renderChart(data) {
    const frontier = computeFrontier(data);

    if (frontier.length < 4) {
      chartContainer.innerHTML = '<p style="color:' + fmt() + ';text-align:center;padding:2rem">' + _('notEnoughData') + '</p>';
      return;
    }

    const xOrd = frontier.map(d => d.releaseOrd);
    const y = frontier.map(d => d.intelligenceIndex);
    const xDates = frontier.map(d => d.releaseDate);

    let fit;
    try {
      fit = fitLogistic(xOrd, y);
    } catch (e) {
      chartContainer.innerHTML = '<p style="color:' + fmt() + ';text-align:center;padding:2rem">' + _('fitFailed') + '</p>';
      return;
    }
    const evalFit = (x) => logisticEval(x - fit.xMin, fit.L, fit.k, fit.x0);
    const yPred = xOrd.map(x => evalFit(x));
    const yMean = y.reduce((a, b) => a + b, 0) / y.length;
    const ssRes = y.reduce((s, yi, i) => s + (yi - yPred[i]) ** 2, 0);
    const ssTot = y.reduce((s, yi) => s + (yi - yMean) ** 2, 0);
    const r2 = 1 - ssRes / ssTot;

    const sixMonthsDays = 183;
    const xMax = Math.max(...xOrd);
    const xSmooth = Array.from({ length: 300 }, (_, i) =>
      xOrd[0] + (xMax + sixMonthsDays - xOrd[0]) * i / 299
    );
    const histMask = xSmooth.map(x => x <= xMax);
    const projMask = xSmooth.map(x => x > xMax);

    const traces = [{
      x: xDates,
      y: y,
      text: frontier.map(d => d.cleanName),
      mode: 'markers+text',
      type: 'scatter',
      name: _('traceFrontier'),
      marker: { size: 10, color: frontier.map(d => creatorColor(d.creator)) },
      textposition: 'top center',
      hovertemplate: '%{text}<br>%{x|%Y-%m-%d}<br>Intel: %{y}<extra></extra>',
    }];

    if (histMask.some(v => v)) {
      traces.push({
        x: xSmooth.filter((_, i) => histMask[i]).map(x => fromOrd(x)),
        y: xSmooth.filter((_, i) => histMask[i]).map(x => evalFit(x)),
        mode: 'lines',
        type: 'scatter',
        name: _('traceTrend'),
        line: { color: 'rgba(200,200,200,0.6)', dash: 'solid', width: 2 },
      });
    }

    if (projMask.some(v => v)) {
      traces.push({
        x: xSmooth.filter((_, i) => projMask[i]).map(x => fromOrd(x)),
        y: xSmooth.filter((_, i) => projMask[i]).map(x => evalFit(x)),
        mode: 'lines',
        type: 'scatter',
        name: _('traceProj'),
        line: { color: 'rgba(255,100,100,0.5)', dash: 'dot', width: 2 },
      });
    }

    const nowOrd = Math.floor(Date.now() / 86400000) + EPOCH_ORD;
    const xEnd = Math.max(xMax + sixMonthsDays, nowOrd);

    Plotly.newPlot('llm-logistic-frontier-chart', traces, {
      height: 750,
      margin: { t: 40, r: 20, b: 50, l: 20 },
      paper_bgcolor: bg,
      plot_bgcolor: bg,
      font: { color: fmt() },
      hovermode: 'closest',
      legend: { orientation: 'h', y: -0.2 },
      title: { text: _('chartTitle') + '  ·  R² = ' + r2.toFixed(3) },
      xaxis: {
        title: _('axisRelease'),
        range: [fromOrd(Math.min(...xOrd)), fromOrd(xEnd)],
      },
      yaxis: { title: _('axisIntel') },
    }, { responsive: true, displayModeBar: false });
  }

  const COLOR_MAP = {};
  const PALETTE = [
    '#4e79a7','#f28e2b','#e15759','#76b7b2','#59a14f','#edc948',
    '#b07aa1','#ff9da7','#9c755f','#bab0ac','#86bcb6','#8cd17d',
    '#b6992d','#499894','#d37295','#f1ce63','#a0cbe8','#ffbe7d',
  ];
  let colorIdx = 0;
  function creatorColor(name) {
    if (!COLOR_MAP[name]) {
      COLOR_MAP[name] = PALETTE[colorIdx % PALETTE.length];
      colorIdx++;
    }
    return COLOR_MAP[name];
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
