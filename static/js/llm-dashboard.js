(function () {
  'use strict';

  const root = document.getElementById('llm-dashboard');
  if (!root) return;

  const chartContainer = document.getElementById('llm-frontier-chart');

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
    fetch(root.dataset.src || '/data/language_models_free.json')
      .then(r => r.json())
      .then(raw => {
        const data = raw.data.map(m => {
          const rd = m.release_date ? new Date(m.release_date) : null;
          return {
            cleanName: m.name.replace(/\s*\(.*?\)/g, '').trim(),
            creator: m.model_creator?.name || 'Unknown',
            releaseDate: rd,
            releaseOrd: rd ? toOrd(rd) : null,
            intelligenceIndex: m.evaluations?.artificial_analysis_intelligence_index,
          };
        }).filter(d => d.releaseOrd != null && d.intelligenceIndex != null);

        renderChart(data);
      })
      .catch(err => {
        chartContainer.innerHTML = '<p style="color:red;text-align:center;padding:2rem">Failed to load data: ' + err.message + '</p>';
      });
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

  function polyFit(x, y, degree) {
    const n = x.length;
    const m = degree + 1;
    const X = Array.from({ length: n }, (_, i) =>
      Array.from({ length: m }, (_, j) => Math.pow(x[i], j))
    );
    const XtX = Array.from({ length: m }, (_, i) =>
      Array.from({ length: m }, (_, j) =>
        X.reduce((s, row) => s + row[i] * row[j], 0)
      )
    );
    const XtY = Array.from({ length: m }, (_, i) =>
      X.reduce((s, row, k) => s + row[i] * y[k], 0)
    );
    return solveLinear(XtX, XtY);
  }

  function solveLinear(A, b) {
    const n = A.length;
    const M = A.map((row, i) => [...row, b[i]]);
    for (let col = 0; col < n; col++) {
      let maxRow = col;
      for (let row = col + 1; row < n; row++) {
        if (Math.abs(M[row][col]) > Math.abs(M[maxRow][col])) maxRow = row;
      }
      [M[col], M[maxRow]] = [M[maxRow], M[col]];
      const pivot = M[col][col];
      for (let j = col; j <= n; j++) M[col][j] /= pivot;
      for (let row = 0; row < n; row++) {
        if (row !== col) {
          const factor = M[row][col];
          for (let j = col; j <= n; j++) M[row][j] -= factor * M[col][j];
        }
      }
    }
    return M.map(row => row[n]);
  }

  function polyEval(coeffs, x) {
    return coeffs.reduce((s, c, i) => s + c * Math.pow(x, i), 0);
  }

  function renderChart(data) {
    const frontier = computeFrontier(data);

    if (frontier.length < 4) {
      chartContainer.innerHTML = '<p style="color:' + fmt() + ';text-align:center;padding:2rem">Not enough data for frontier (need at least 4 frontier points).</p>';
      return;
    }

    const xOrd = frontier.map(d => d.releaseOrd);
    const y = frontier.map(d => d.intelligenceIndex);
    const xDates = frontier.map(d => d.releaseDate);

    const coeffs = polyFit(xOrd, y, 3);
    const yPred = xOrd.map(x => polyEval(coeffs, x));
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
      name: 'Frontier models',
      marker: { size: 10, color: frontier.map(d => creatorColor(d.creator)) },
      textposition: 'top center',
      hovertemplate: '%{text}<br>%{x|%Y-%m-%d}<br>Intel: %{y}<extra></extra>',
    }];

    if (histMask.some(v => v)) {
      traces.push({
        x: xSmooth.filter((_, i) => histMask[i]).map(x => fromOrd(x)),
        y: xSmooth.filter((_, i) => histMask[i]).map(x => polyEval(coeffs, x)),
        mode: 'lines',
        type: 'scatter',
        name: 'Poly trend (deg 3)',
        line: { color: 'rgba(200,200,200,0.6)', dash: 'solid', width: 2 },
      });
    }

    if (projMask.some(v => v)) {
      traces.push({
        x: xSmooth.filter((_, i) => projMask[i]).map(x => fromOrd(x)),
        y: xSmooth.filter((_, i) => projMask[i]).map(x => polyEval(coeffs, x)),
        mode: 'lines',
        type: 'scatter',
        name: 'Projected 6 months',
        line: { color: 'rgba(255,100,100,0.5)', dash: 'dot', width: 2 },
      });
    }

    const nowOrd = Math.floor(Date.now() / 86400000) + EPOCH_ORD;
    const xEnd = Math.max(xMax + sixMonthsDays, nowOrd);

    Plotly.newPlot('llm-frontier-chart', traces, {
      height: 550,
      margin: { t: 50, r: 120, b: 60, l: 60 },
      paper_bgcolor: bg,
      plot_bgcolor: bg,
      font: { color: fmt() },
      hovermode: 'closest',
      legend: { orientation: 'h', y: -0.2 },
      title: { text: `Most Intelligent Model Over Time  ·  R² = ${r2.toFixed(3)}` },
      xaxis: {
        title: 'Release date',
        range: [fromOrd(Math.min(...xOrd)), fromOrd(xEnd)],
      },
      yaxis: { title: 'Intelligence index' },
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
