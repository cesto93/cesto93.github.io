(function () {
  'use strict';

  const root = document.getElementById('llm-efficiency');
  if (!root) return;

  const chart1 = document.getElementById('llm-efficiency-chart1');
  const chart2 = document.getElementById('llm-efficiency-chart2');
  const controls = document.getElementById('llm-efficiency-controls');

  const lang = root.dataset.lang === 'it' ? 'it' : 'en';

  const i18n = {
    maxPrice:      { en: 'Max avg price ($ / 1M tokens):', it: 'Prezzo medio max ($ / 1M token):' },
    frontierTitle: { en: 'Most Intelligent Model Under ${price} / 1M Tokens', it: 'Modello pi\u00f9 intelligente sotto ${price} / 1M token' },
    owTitle:       { en: 'Most Intelligent Open-Weight Model Under ${price} / 1M Tokens', it: 'Modello open-weight pi\u00f9 intelligente sotto ${price} / 1M token' },
    noData:        { en: 'No data available for the selected filters.', it: 'Nessun dato disponibile per i filtri selezionati.' },
    traceOthers:   { en: 'Other models', it: 'Altri modelli' },
    traceFrontier: { en: 'Frontier models', it: 'Modelli frontiera' },
    traceTrend:    { en: 'Poly trend (deg 3)', it: 'Trend polinomiale (gr 3)' },
    traceProj:     { en: 'Projected 6 months', it: 'Proiezione 6 mesi' },
    axisRelease:   { en: 'Release date', it: 'Data di rilascio' },
    axisIntel:     { en: 'Intelligence index', it: 'Indice di intelligenza' },
    loadError:     { en: 'Failed to load data:', it: 'Caricamento dati fallito:' },
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

  // --------------- polynomial fit via normal equations ---------------
  function polyFit(x, y, deg) {
    const n = x.length;
    const m = deg + 1;
    const X = Array.from({ length: n }, (_, i) =>
      Array.from({ length: m }, (_, j) => Math.pow(x[i], j))
    );
    const XtX = Array.from({ length: m }, () => Array(m).fill(0));
    const Xty = Array(m).fill(0);
    for (let i = 0; i < m; i++) {
      for (let j = 0; j < m; j++)
        for (let k = 0; k < n; k++) XtX[i][j] += X[k][i] * X[k][j];
      for (let k = 0; k < n; k++) Xty[i] += X[k][i] * y[k];
    }
    const aug = XtX.map((r, i) => [...r, Xty[i]]);
    for (let col = 0; col < m; col++) {
      let mr = col;
      for (let r = col + 1; r < m; r++)
        if (Math.abs(aug[r][col]) > Math.abs(aug[mr][col])) mr = r;
      [aug[col], aug[mr]] = [aug[mr], aug[col]];
      for (let r = col + 1; r < m; r++) {
        const f = aug[r][col] / aug[col][col];
        for (let j = col; j <= m; j++) aug[r][j] -= f * aug[col][j];
      }
    }
    const c = [];
    for (let i = m - 1; i >= 0; i--) {
      let s = aug[i][m];
      for (let j = i + 1; j < m; j++) s -= aug[i][j] * c[j];
      c[i] = s / aug[i][i];
    }
    return c;
  }

  function polyEval(c, x) {
    let r = 0;
    for (let i = c.length - 1; i >= 0; i--) r = r * x + c[i];
    return r;
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

  // --------------- state ---------------
  let allData = [];

  const CLOSED = new Set(['OpenAI', 'Anthropic', 'Google']);

  // --------------- controls ---------------
  function buildControls() {
    controls.innerHTML =
      '<label>' + _('maxPrice') + ' <strong id="eff-price-label">$3.00</strong></label>' +
      '<input type="range" id="eff-price" min="0.5" max="20" step="0.5" value="3" style="width:100%">';

    document.getElementById('eff-price').addEventListener('input', function () {
      document.getElementById('eff-price-label').textContent = '$' + parseFloat(this.value).toFixed(2);
      update();
    });
  }

  function update() {
    var maxPrice = +document.getElementById('eff-price').value;
    var filtered = allData.filter(function (d) {
      return d.avgPrice < maxPrice;
    });
    renderChart(chart1, filtered, _('frontierTitle').replace('${price}', maxPrice.toFixed(1)));
    var ow = filtered.filter(function (d) { return !CLOSED.has(d.creator); });
    renderChart(chart2, ow, _('owTitle').replace('${price}', maxPrice.toFixed(1)));
  }

  // --------------- chart rendering ---------------
  function renderChart(container, data, title) {
    if (data.length === 0) {
      Plotly.purge(container);
      container.innerHTML = '<p style="color:' + fmt() + ';text-align:center;padding:2rem">' + _('noData') + '</p>';
      return;
    }

    var frontier = computeFrontier(data);
    var otherPoints = data.filter(function (d) { return frontier.indexOf(d) === -1; });
    var traces = [];

    if (otherPoints.length) {
      traces.push({
        x: otherPoints.map(function (d) { return d.releaseDate; }),
        y: otherPoints.map(function (d) { return d.intelligenceIndex; }),
        text: otherPoints.map(function (d) { return d.cleanName; }),
        mode: 'markers', type: 'scatter',
        name: _('traceOthers'),
        marker: { size: 6, color: 'rgba(150,150,150,0.4)' },
        hovertemplate: '%{text}<br>%{x|%Y-%m-%d}<br>Intel: %{y}<extra></extra>',
      });
    }

    if (frontier.length) {
      traces.push({
        x: frontier.map(function (d) { return d.releaseDate; }),
        y: frontier.map(function (d) { return d.intelligenceIndex; }),
        text: frontier.map(function (d) { return d.cleanName; }),
        mode: 'markers+text', type: 'scatter',
        name: _('traceFrontier'),
        marker: { size: 10, color: frontier.map(function (d) { return creatorColor(d.creator); }) },
        textposition: 'top center',
        hovertemplate: '%{text}<br>%{x|%Y-%m-%d}<br>Intel: %{y}<extra></extra>',
      });
    }

    if (frontier.length >= 4) {
      var xOrd = frontier.map(function (d) { return d.releaseOrd; });
      var y = frontier.map(function (d) { return d.intelligenceIndex; });
      var coeffs = polyFit(xOrd, y, 3);
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
          y: xs.filter(function (_, i) { return hist[i]; }).map(function (x) { return polyEval(coeffs, x); }),
          mode: 'lines', type: 'scatter',
          name: _('traceTrend'),
          line: { color: 'rgba(200,200,200,0.6)', dash: 'solid', width: 2 },
        });
      }
      if (proj.some(Boolean)) {
        traces.push({
          x: xs.filter(function (_, i) { return proj[i]; }).map(function (x) { return fromOrd(x); }),
          y: xs.filter(function (_, i) { return proj[i]; }).map(function (x) { return polyEval(coeffs, x); }),
          mode: 'lines', type: 'scatter',
          name: _('traceProj'),
          line: { color: 'rgba(255,100,100,0.5)', dash: 'dot', width: 2 },
        });
      }
    }

    var nowOrd = Math.floor(Date.now() / 86400000) + EPOCH_ORD;
    var allX = data.map(function (d) { return d.releaseOrd; });
    var xMin = Math.min.apply(null, allX);
    var xMax = Math.max.apply(null, allX);

    container.innerHTML = '';
    Plotly.newPlot(container, traces, {
      height: 500,
      margin: { t: 50, r: 120, b: 60, l: 60 },
      paper_bgcolor: bg, plot_bgcolor: bg,
      font: { color: fmt() },
      hovermode: 'closest',
      legend: { orientation: 'h', y: -0.25 },
      title: { text: title },
      xaxis: { title: _('axisRelease'), range: [fromOrd(xMin), fromOrd(Math.max(xMax + 183, nowOrd))] },
      yaxis: { title: _('axisIntel') },
    }, { responsive: true, displayModeBar: false });
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
        allData = raw.data.map(function (m) {
          var rd = m.release_date ? new Date(m.release_date) : null;
          var pi = m.pricing ? m.pricing.price_1m_input_tokens : null;
          var po = m.pricing ? m.pricing.price_1m_output_tokens : null;
          var avg = pi != null && po != null ? (pi + po) / 2 : null;
          return {
            cleanName: m.name.replace(/\s*\(.*?\)/g, '').trim(),
            creator: m.model_creator ? m.model_creator.name : 'Unknown',
            releaseDate: rd,
            releaseOrd: rd ? toOrd(rd) : null,
            intelligenceIndex: m.evaluations ? m.evaluations.artificial_analysis_intelligence_index : null,
            avgPrice: avg,
          };
        }).filter(function (d) {
          return d.releaseOrd != null && d.intelligenceIndex != null && d.avgPrice != null && d.avgPrice > 0;
        });

        buildControls();
        update();
      })
      .catch(function (err) {
        chart1.innerHTML = '<p style="color:red;text-align:center;padding:2rem">' + _('loadError') + ' ' + err.message + '</p>';
      });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
