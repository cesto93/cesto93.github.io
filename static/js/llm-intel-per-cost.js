(function () {
  'use strict';

  const root = document.getElementById('llm-intel-per-cost');
  if (!root) return;

  const chart = document.getElementById('llm-intel-per-cost-chart');
  const status = document.getElementById('llm-intel-per-cost-status');

  const lang = root.dataset.lang === 'it' ? 'it' : 'en';

  const i18n = {
    title:     { en: 'Intelligence per Dollar over Time', it: 'Intelligenza per dollaro nel tempo' },
    yLabel:    { en: 'Intelligence index / Cost per task ($)', it: 'Indice di intelligenza / Costo per task ($)' },
    noData:    { en: 'No data available.', it: 'Nessun dato disponibile.' },
    loadError: { en: 'Failed to load data:', it: 'Caricamento dati fallito:' },
    traceFrontier: { en: 'Frontier', it: 'Frontiera' },
    traceOthers:   { en: 'Other models', it: 'Altri modelli' },
    traceTrend:    { en: 'Exp trend', it: 'Trend esponenziale' },
    traceProj:     { en: 'Projected 6 months', it: 'Proiezione 6 mesi' },
    axisRelease:   { en: 'Release date', it: 'Data di rilascio' },
  };

  function _(key) { return i18n[key][lang]; }

  const isDark = () =>
    document.documentElement.dataset.theme !== 'light' &&
    (document.documentElement.dataset.theme === 'dark' ||
      window.matchMedia('(prefers-color-scheme: dark)').matches);

  const fmt = () => (isDark() ? '#ddd' : '#333');
  const bg = 'rgba(0,0,0,0)';

  const EPOCH_ORD = 719163;

  function toOrd(d) {
    return Math.floor(d.getTime() / 86400000) + EPOCH_ORD;
  }
  function fromOrd(ord) {
    return new Date((ord - EPOCH_ORD) * 86400000);
  }

  // --------------- exponential fit ---------------
  function expFit(x, y) {
    const n = x.length;
    const xMin = Math.min.apply(null, x);
    const xShifted = x.map(function (v) { return v - xMin; });
    const logY = y.map(function (v) { return Math.log(v); });
    var xMean = xShifted.reduce(function (a, b) { return a + b; }, 0) / n;
    var yMean = logY.reduce(function (a, b) { return a + b; }, 0) / n;
    var num = 0, den = 0;
    for (var i = 0; i < n; i++) {
      num += (xShifted[i] - xMean) * (logY[i] - yMean);
      den += (xShifted[i] - xMean) * (xShifted[i] - xMean);
    }
    var b = num / den;
    var logA = yMean - b * xMean;
    return { a: Math.exp(logA), b: b, xMin: xMin };
  }

  function expEval(fit, x) {
    return fit.a * Math.exp(fit.b * (x - fit.xMin));
  }

  function computeFrontier(data) {
    const sorted = [...data].sort((a, b) => a.releaseOrd - b.releaseOrd);
    let maxSoFar = -1;
    return sorted.filter(d => {
      if (d.intelPerCost > maxSoFar) {
        maxSoFar = d.intelPerCost;
        return true;
      }
      return false;
    });
  }

  // --------------- palette ---------------
  var COLOR_MAP = {};
  var PALETTE = [
    '#4e79a7','#f28e2b','#e15759','#76b7b2','#59a14f','#edc948',
    '#b07aa1','#ff9da7','#9c755f','#bab0ac','#86bcb6','#8cd17d',
    '#b6992d','#499894','#d37295','#f1ce63','#a0cbe8','#ffbe7d',
  ];
  var colorIdx = 0;
  function creatorColor(name) {
    if (!COLOR_MAP[name]) COLOR_MAP[name] = PALETTE[colorIdx++ % PALETTE.length];
    return COLOR_MAP[name];
  }

  // --------------- bootstrap ---------------
  function init() {
    fetch(root.dataset.src || '/data/language_models_free_2026-06-27.json')
      .then(function (r) { return r.json(); })
      .then(function (raw) {
        var points = [];

        raw.data.forEach(function (m) {
          var rd = m.release_date ? new Date(m.release_date) : null;
          if (!rd) return;

          var costData = m.artificial_analysis_intelligence_index_cost;
          var cpt = costData && costData.cost_per_task ? costData.cost_per_task.total_cost : null;
          if (cpt == null || cpt <= 0) return;

          var idx = m.evaluations ? m.evaluations.artificial_analysis_intelligence_index : null;
          if (idx == null || idx <= 0) return;

          points.push({
            name: m.name.replace(/\s*\(.*?\)/g, '').trim(),
            creator: m.model_creator ? m.model_creator.name : 'Unknown',
            releaseDate: rd,
            releaseOrd: toOrd(rd),
            intelIndex: idx,
            costPerTask: cpt,
            intelPerCost: idx / cpt,
          });
        });

        if (points.length === 0) {
          status.textContent = _('noData');
          return;
        }

        status.textContent = points.length + ' ' + (lang === 'it' ? 'modelli' : 'models');

        var frontier = computeFrontier(points);
        var traces = [];

        if (frontier.length) {
          traces.push({
            x: frontier.map(function (d) { return d.releaseDate; }),
            y: frontier.map(function (d) { return d.intelPerCost; }),
            text: frontier.map(function (d) { return d.name; }),
            customdata: frontier.map(function (d) { return [d.creator, d.intelIndex, d.costPerTask]; }),
            mode: 'markers+text', type: 'scatter',
            name: _('traceFrontier'),
            marker: { size: 10, color: frontier.map(function (d) { return creatorColor(d.creator); }) },
            textposition: 'top center',
            hovertemplate: '%{text}<br>%{customdata[0]}<br>Intel: %{customdata[1]}<br>Cost/task: $%{customdata[2]:.4f}<br>Intel/$: %{y:.1f}<extra></extra>',
          });
        }

        if (frontier.length >= 4) {
          var xOrd = frontier.map(function (d) { return d.releaseOrd; });
          var y = frontier.map(function (d) { return d.intelPerCost; });
          var fit = expFit(xOrd, y);
          var yPred = xOrd.map(function (x) { return expEval(fit, x); });
          var yMean = y.reduce(function (a, b) { return a + b; }, 0) / y.length;
          var ssRes = y.reduce(function (s, yi, i) { return s + (yi - yPred[i]) * (yi - yPred[i]); }, 0);
          var ssTot = y.reduce(function (s, yi) { return s + (yi - yMean) * (yi - yMean); }, 0);
          var r2 = 1 - ssRes / ssTot;

          var sixMonths = 183;
          var xMax = Math.max.apply(null, xOrd);
          var xs = Array.from({ length: 300 }, function (_, i) {
            return xOrd[0] + (xMax + sixMonths - xOrd[0]) * i / 299;
          });
          var hist = xs.map(function (x) { return x <= xMax; });
          var proj = xs.map(function (x) { return x > xMax; });

          if (hist.some(Boolean)) {
            traces.push({
              x: xs.filter(function (_, i) { return hist[i]; }).map(function (x) { return fromOrd(x); }),
              y: xs.filter(function (_, i) { return hist[i]; }).map(function (x) { return expEval(fit, x); }),
              mode: 'lines', type: 'scatter',
              name: _('traceTrend'),
              line: { color: 'rgba(200,200,200,0.6)', dash: 'solid', width: 2 },
            });
          }
          if (proj.some(Boolean)) {
            traces.push({
              x: xs.filter(function (_, i) { return proj[i]; }).map(function (x) { return fromOrd(x); }),
              y: xs.filter(function (_, i) { return proj[i]; }).map(function (x) { return expEval(fit, x); }),
              mode: 'lines', type: 'scatter',
              name: _('traceProj'),
              line: { color: 'rgba(255,100,100,0.5)', dash: 'dot', width: 2 },
            });
          }
        }

        var nowOrd = Math.floor(Date.now() / 86400000) + EPOCH_ORD;
        var allX = points.map(function (d) { return d.releaseOrd; });
        var xMin = Math.min.apply(null, allX);
        var xMax = Math.max.apply(null, allX);

        chart.innerHTML = '';
        Plotly.newPlot(chart, traces, {
          height: 750,
          margin: { t: 40, r: 20, b: 50, l: 70 },
          paper_bgcolor: bg, plot_bgcolor: bg,
          font: { color: fmt() },
          hovermode: 'closest',
          legend: { orientation: 'h', y: -0.25 },
          title: { text: _('title') },
          xaxis: { title: _('axisRelease'), range: [fromOrd(xMin), fromOrd(Math.max(xMax + 183, nowOrd))] },
          yaxis: { title: _('yLabel'), type: 'log' },
        }, { responsive: true, displayModeBar: false });
      })
      .catch(function (err) {
        chart.innerHTML = '<p style="color:red;text-align:center;padding:2rem">' + _('loadError') + ' ' + err.message + '</p>';
      });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
