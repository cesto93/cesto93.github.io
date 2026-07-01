(function () {
  'use strict';

  const root = document.getElementById('llm-dashboard');
  if (!root) return;

  const chartContainer = document.getElementById('llm-frontier-chart');

  const lang = root.dataset.lang === 'it' ? 'it' : 'en';

  const i18n = {
    notEnoughData: {
      en: 'Not enough data for frontier (need at least 4 frontier points).',
      it: 'Dati insufficienti per la frontiera (servono almeno 4 punti).',
    },
    traceFrontier: { en: 'Frontier models',            it: 'Modelli frontiera' },
    traceTrend:    { en: 'Exp trend',                   it: 'Trend esponenziale' },
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
    fetch(root.dataset.src || '/data/language_models_free_2026-06-27.json')
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
        chartContainer.innerHTML = '<p style="color:red;text-align:center;padding:2rem">' + _('loadError') + ' ' + err.message + '</p>';
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

  function expFit(x, y) {
    const n = x.length;
    const xMin = Math.min(...x);
    const xShifted = x.map(v => v - xMin);
    const logY = y.map(v => Math.log(v));
    const xMean = xShifted.reduce((a, b) => a + b, 0) / n;
    const yMean = logY.reduce((a, b) => a + b, 0) / n;
    const num = xShifted.reduce((s, xi, i) => s + (xi - xMean) * (logY[i] - yMean), 0);
    const den = xShifted.reduce((s, xi) => s + (xi - xMean) ** 2, 0);
    const b = num / den;
    const logA = yMean - b * xMean;
    return { a: Math.exp(logA), b, xMin };
  }

  function expEval(fit, x) {
    return fit.a * Math.exp(fit.b * (x - fit.xMin));
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

    const fit = expFit(xOrd, y);
    const yPred = xOrd.map(x => expEval(fit, x));
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
        y: xSmooth.filter((_, i) => histMask[i]).map(x => expEval(fit, x)),
        mode: 'lines',
        type: 'scatter',
        name: _('traceTrend'),
        line: { color: 'rgba(200,200,200,0.6)', dash: 'solid', width: 2 },
      });
    }

    if (projMask.some(v => v)) {
      traces.push({
        x: xSmooth.filter((_, i) => projMask[i]).map(x => fromOrd(x)),
        y: xSmooth.filter((_, i) => projMask[i]).map(x => expEval(fit, x)),
        mode: 'lines',
        type: 'scatter',
        name: _('traceProj'),
        line: { color: 'rgba(255,100,100,0.5)', dash: 'dot', width: 2 },
      });
    }

    const nowOrd = Math.floor(Date.now() / 86400000) + EPOCH_ORD;
    const xEnd = Math.max(xMax + sixMonthsDays, nowOrd);

    Plotly.newPlot('llm-frontier-chart', traces, {
      height: 750,
      margin: { t: 40, r: 30, b: 50, l: 50 },
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
