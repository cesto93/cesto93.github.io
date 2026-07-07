(function () {
  'use strict';

  const root = document.getElementById('llm-task-cost');
  if (!root) return;

  const chart = document.getElementById('llm-task-cost-chart');
  const status = document.getElementById('llm-task-cost-status');

  const lang = root.dataset.lang === 'it' ? 'it' : 'en';

  const i18n = {
    title:     { en: 'Cost per Task vs. Token Price — Models Released in Last 6 Months', it: 'Costo per task vs. prezzo per token — Modelli usciti negli ultimi 6 mesi' },
    xLabel:    { en: 'Avg price ($ / 1M tokens)', it: 'Prezzo medio ($ / 1M token)' },
    yLabel:    { en: 'Cost per task ($)', it: 'Costo per task ($)' },
    noData:    { en: 'No models found in the last 6 months with available data.', it: 'Nessun modello trovato negli ultimi 6 mesi con dati disponibili.' },
    loadError: { en: 'Failed to load data:', it: 'Caricamento dati fallito:' },
  };

  function _(key) { return i18n[key][lang]; }

  const isDark = () =>
    document.documentElement.dataset.theme !== 'light' &&
    (document.documentElement.dataset.theme === 'dark' ||
      window.matchMedia('(prefers-color-scheme: dark)').matches);

  const fmt = () => (isDark() ? '#ddd' : '#333');
  const bg = 'rgba(0,0,0,0)';

  const SIX_MONTHS_MS = 183 * 86400000;

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
        var cutoff = new Date(Date.now() - SIX_MONTHS_MS);
        var points = [];

        raw.data.forEach(function (m) {
          var rd = m.release_date ? new Date(m.release_date) : null;
          if (!rd || rd < cutoff) return;

          var pi = m.pricing ? m.pricing.price_1m_input_tokens : null;
          var po = m.pricing ? m.pricing.price_1m_output_tokens : null;
          var avg = pi != null && po != null ? (pi + po) / 2 : null;
          if (avg == null || avg <= 0) return;

          var costData = m.artificial_analysis_intelligence_index_cost;
          var cpt = costData && costData.cost_per_task ? costData.cost_per_task.total_cost : null;
          if (cpt == null || cpt < 0) return;

          var idx = m.evaluations ? m.evaluations.artificial_analysis_intelligence_index : null;
          if (idx == null) return;

          points.push({
            name: m.name.replace(/\s*\(.*?\)/g, '').trim(),
            creator: m.model_creator ? m.model_creator.name : 'Unknown',
            releaseDate: rd,
            avgPrice: avg,
            costPerTask: cpt,
            intelIndex: idx,
          });
        });

        if (points.length === 0) {
          status.textContent = _('noData');
          return;
        }

        status.textContent = points.length + ' ' + (lang === 'it' ? 'modelli' : 'models');

        var traces = [{
          x: points.map(function (d) { return d.avgPrice; }),
          y: points.map(function (d) { return d.costPerTask; }),
          text: points.map(function (d) { return d.name; }),
          customdata: points.map(function (d) { return [d.creator, d.intelIndex]; }),
          mode: 'markers', type: 'scatter',
          marker: {
            size: points.map(function (d) { return 4 + d.intelIndex * 0.25; }),
            color: points.map(function (d) { return creatorColor(d.creator); }),
            line: { color: fmt(), width: 0.5 },
            sizeref: 0.1,
            sizemode: 'area',
          },
          hovertemplate: '%{text}<br>%{customdata[0]}<br>' +
            _('xLabel') + ': $%{x:.2f}<br>' +
            _('yLabel') + ': $%{y:.4f}<br>' +
            'Intel: %{customdata[1]}' +
            '<extra></extra>',
        }];

        chart.innerHTML = '';
        Plotly.newPlot(chart, traces, {
          height: 700,
          margin: { t: 40, r: 20, b: 60, l: 70 },
          paper_bgcolor: bg, plot_bgcolor: bg,
          font: { color: fmt() },
          hovermode: 'closest',
          title: { text: _('title') },
          xaxis: {
            title: _('xLabel'), type: 'log',
            tickprefix: '$', ticksuffix: '',
          },
          yaxis: {
            title: _('yLabel'), type: 'log',
            tickprefix: '$', ticksuffix: '',
          },
          legend: { traceorder: 'normal' },
        }, { responsive: true, displayModeBar: false });
      })
      .catch(function (err) {
        chart.innerHTML = '<p style="color:red;text-align:center;padding:2rem">' + _('loadError') + ' ' + err.message + '</p>';
      });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
