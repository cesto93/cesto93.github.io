(function () {
  'use strict';

  const root = document.getElementById('llm-open-dashboard');
  if (!root) return;

  const chartContainer = document.getElementById('llm-open-frontier-chart');
  const catchupContainer = document.getElementById('llm-open-catchup');

  const CLOSED_CREATORS = new Set(['OpenAI', 'Anthropic', 'Google', 'xAI']);

  const lang = root.dataset.lang === 'it' ? 'it' : 'en';

  const i18n = {
    notEnoughData: {
      en: 'Not enough open-weight data for frontier (need at least 4 frontier points).',
      it: 'Dati open-weight insufficienti per la frontiera (servono almeno 4 punti).',
    },
    traceOw:        { en: 'Open-weight frontier',    it: 'Frontiera open-weight' },
    traceTrend:     { en: 'Exp trend',               it: 'Trend esponenziale' },
    traceProj:      { en: 'Projected 6 months',      it: 'Proiezione 6 mesi' },
    chartTitle:     { en: 'Open-Weight Frontier',    it: 'Frontiera Open-Weight' },
    axisRelease:    { en: 'Release date',            it: 'Data di rilascio' },
    axisIntel:      { en: 'Intelligence index',      it: 'Indice di intelligenza' },
    catchupNoData:  { en: 'Not enough data for a catch-up prediction.', it: 'Dati insufficienti per una previsione.' },
    catchupReach:   { en: 'Open-weight models are predicted to reach',  it: 'I modelli open-weight raggiungeranno' },
    catchupIntel:   { en: 'intelligence index of',   it: "con indice d'intelligenza di" },
    catchupBy:      { en: 'by',                      it: 'entro il' },
    catchupDays:    { en: 'days from now',           it: 'giorni da oggi' },
    catchupNever:   { en: 'Open-weight models are not predicted to catch up to the current best closed model within the next 10 years.', it: 'I modelli open-weight non raggiungeranno il miglior modello closed nei prossimi 10 anni.' },
    loadError:      { en: 'Failed to load data:',    it: 'Caricamento dati fallito:' },
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
        const allData = raw.data.map(m => {
          const rd = m.release_date ? new Date(m.release_date) : null;
          return {
            cleanName: m.name.replace(/\s*\(.*?\)/g, '').trim(),
            creator: m.model_creator?.name || 'Unknown',
            releaseDate: rd,
            releaseOrd: rd ? toOrd(rd) : null,
            intelligenceIndex: m.evaluations?.artificial_analysis_intelligence_index,
          };
        }).filter(d => d.releaseOrd != null && d.intelligenceIndex != null);

        const owData = allData.filter(d => !CLOSED_CREATORS.has(d.creator));
        const closedData = allData.filter(d => CLOSED_CREATORS.has(d.creator));

        renderOwChart(owData);
        renderCatchup(computeFrontier(owData), computeFrontier(closedData));
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

  function renderOwChart(data) {
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
      name: _('traceOw'),
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

    Plotly.newPlot('llm-open-frontier-chart', traces, {
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

  function renderCatchup(owFrontier, closedFrontier) {
    if (!catchupContainer) return;

    if (owFrontier.length < 4 || closedFrontier.length === 0) {
      catchupContainer.innerHTML = '<p style="color:' + fmt() + ';text-align:center;padding:1rem">' + _('catchupNoData') + '</p>';
      return;
    }

    const bestClosed = closedFrontier.reduce((a, b) =>
      a.intelligenceIndex > b.intelligenceIndex ? a : b
    );
    const bestClosedVal = bestClosed.intelligenceIndex;
    const bestClosedName = bestClosed.cleanName;

    const owX = owFrontier.map(d => d.releaseOrd);
    const owY = owFrontier.map(d => d.intelligenceIndex);
    const owFit = expFit(owX, owY);

    const nowOrd = Math.floor(Date.now() / 86400000) + EPOCH_ORD;
    const searchOrd = Array.from({ length: 5000 }, (_, i) =>
      nowOrd + (365 * 10) * i / 4999
    );

    let catchupOrd = null;
    for (let i = 0; i < searchOrd.length; i++) {
      if (expEval(owFit, searchOrd[i]) >= bestClosedVal) {
        catchupOrd = searchOrd[i];
        break;
      }
    }

    if (catchupOrd !== null) {
      const catchupDate = fromOrd(Math.round(catchupOrd));
      const yearsFromNow = (catchupOrd - nowOrd) / 365.0;
      const dateStr = catchupDate.toISOString().split('T')[0];
      catchupContainer.innerHTML =
        '<div style="padding:1rem;background:rgba(0,200,100,0.1);border-radius:8px;text-align:center;color:' + fmt() + '">' +
        '<strong>' + _('catchupReach') + '</strong> <strong>' + bestClosedName +
        '</strong> ' + _('catchupIntel') + ' <strong>' + bestClosedVal.toFixed(1) +
        '</strong> ' + _('catchupBy') + ' <strong>' + dateStr +
        '</strong> (' + Math.round((catchupOrd - nowOrd)) + ' ' + _('catchupDays') + ').' +
        '</div>';
    } else {
      catchupContainer.innerHTML =
        '<div style="padding:1rem;background:rgba(200,100,0,0.1);border-radius:8px;text-align:center;color:' + fmt() + '">' +
        _('catchupNever') +
        '</div>';
    }
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
