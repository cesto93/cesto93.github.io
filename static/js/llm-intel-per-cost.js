(function () {
  'use strict';

  var root = document.getElementById('llm-intel-per-cost');
  if (!root) return;

  var chart = document.getElementById('llm-intel-per-cost-chart');
  var status = document.getElementById('llm-intel-per-cost-status');

  var lang = root.dataset.lang === 'it' ? 'it' : 'en';

  var i18n = {
    title:        { en: 'Intelligence vs Cost', it: 'Intelligenza vs Costo' },
    xLabel:       { en: 'Cost per task ($)', it: 'Costo per task ($)' },
    yLabel:       { en: 'Intelligence Index', it: 'Indice di Intelligenza' },
    noData:       { en: 'No data available.', it: 'Nessun dato disponibile.' },
    loadError:    { en: 'Failed to load data:', it: 'Caricamento dati fallito:' },
    sweetSpot:    { en: '★ Sweet Spot', it: '★ Zona ideale' },
  };

  function _(key) { return i18n[key][lang]; }

  var isDark = function () {
    return document.documentElement.dataset.theme !== 'light' &&
      (document.documentElement.dataset.theme === 'dark' ||
        window.matchMedia('(prefers-color-scheme: dark)').matches);
  };

  var fmt = function () { return isDark() ? '#ddd' : '#333'; };
  var bg = 'rgba(0,0,0,0)';

  // --------------- quarter color palette ---------------
  // Chronological gradient: cool → warm (oldest → newest)
  var QUARTER_COLORS = [
    '#9ecae1', // Q oldest — light blue
    '#6baed6', // — medium blue
    '#4292c6', // — stronger blue
    '#2171b5', // — deep blue
    '#fd8d3c', // — orange
    '#e6550d', // — dark orange
    '#a63603', // — burnt orange / brown
    '#7a0177', // — magenta (newest)
  ];

  // --------------- quarter helpers ---------------
  function quarterKey(date) {
    var y = date.getFullYear();
    var q = Math.floor(date.getMonth() / 3) + 1;
    return y + ' Q' + q;
  }

  function quarterSortKey(date) {
    return date.getFullYear() * 4 + Math.floor(date.getMonth() / 3);
  }

  // --------------- Pareto frontier (cost/intel) ---------------
  function computePareto(data) {
    return data.filter(function (d) {
      return !data.some(function (o) {
        return o !== d && o.costPerTask <= d.costPerTask && o.intelIndex >= d.intelIndex &&
          (o.costPerTask < d.costPerTask || o.intelIndex > d.intelIndex);
      });
    });
  }

  // --------------- bubble size scaling ---------------
  function scaleSizes(values, minR, maxR) {
    var lo = Math.min.apply(null, values);
    var hi = Math.max.apply(null, values);
    var range = hi - lo || 1;
    return values.map(function (v) {
      return minR + (maxR - minR) * Math.sqrt((v - lo) / range);
    });
  }

  // --------------- bootstrap ---------------
  function init() {
    fetch(root.dataset.src || '/data/language_models_free_2026-07-18.json')
      .then(function (r) { return r.json(); })
      .then(function (raw) {
        var points = [];

        var maxDate = root.dataset.maxDate;
        raw.data.filter(function(m) { return !maxDate || !m.release_date || m.release_date <= maxDate; }).forEach(function (m) {
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
            intelIndex: idx,
            costPerTask: cpt,
            intelPerCost: idx / cpt,
            qKey: quarterKey(rd),
            qSort: quarterSortKey(rd),
          });
        });

        if (points.length === 0) {
          status.textContent = _('noData');
          return;
        }

        status.textContent = points.length + ' ' + (lang === 'it' ? 'modelli' : 'models');

        var frontier = computePareto(points);
        var frontierSet = new Set(frontier.map(function (d) { return d.name; }));

        // Group by quarter, preserving chronological order
        var quarters = [];
        var qMap = {};
        points.forEach(function (d) {
          if (!qMap[d.qKey]) {
            qMap[d.qKey] = { key: d.qKey, sort: d.qSort, points: [] };
            quarters.push(qMap[d.qKey]);
          }
          qMap[d.qKey].points.push(d);
        });
        quarters.sort(function (a, b) { return a.sort - b.sort; });

        var allSizes = scaleSizes(points.map(function (d) { return d.intelPerCost; }), 8, 60);
        var sizeMap = {};
        points.forEach(function (d, i) { sizeMap[d.name] = allSizes[i]; });

        var traces = [];

        quarters.forEach(function (q, qi) {
          var color = QUARTER_COLORS[qi % QUARTER_COLORS.length];
          var frontInQ = q.points.filter(function (d) { return frontierSet.has(d.name); });
          var otherInQ = q.points.filter(function (d) { return !frontierSet.has(d.name); });

          // Non-frontier first (behind)
          if (otherInQ.length) {
            traces.push({
              x: otherInQ.map(function (d) { return d.costPerTask; }),
              y: otherInQ.map(function (d) { return d.intelIndex; }),
              text: otherInQ.map(function (d) { return d.name; }),
              customdata: otherInQ.map(function (d) {
                return [d.creator, d.intelIndex, d.costPerTask, d.intelPerCost];
              }),
              mode: 'markers', type: 'scatter',
              name: q.key,
              legendgroup: q.key,
              showlegend: false,
              marker: {
                size: otherInQ.map(function (d) { return sizeMap[d.name]; }),
                color: color,
                opacity: 0.4,
                line: { width: 0 },
              },
              hovertemplate: '%{text}<br>%{customdata[0]}<br>Intel: %{customdata[1]}<br>Cost/task: $%{customdata[2]:.4f}<br>Intel/$: %{customdata[3]:.1f}<extra></extra>',
            });
          }

          // Frontier on top
          if (frontInQ.length) {
            traces.push({
              x: frontInQ.map(function (d) { return d.costPerTask; }),
              y: frontInQ.map(function (d) { return d.intelIndex; }),
              text: frontInQ.map(function (d) { return d.name; }),
              customdata: frontInQ.map(function (d) {
                return [d.creator, d.intelIndex, d.costPerTask, d.intelPerCost];
              }),
              mode: 'markers', type: 'scatter',
              name: q.key,
              legendgroup: q.key,
              showlegend: true,
              marker: {
                size: frontInQ.map(function (d) { return sizeMap[d.name]; }),
                color: color,
                opacity: 0.85,
                line: { width: 2, color: isDark() ? '#fff' : '#222' },
              },
              hovertemplate: '%{text}<br>%{customdata[0]}<br>Intel: %{customdata[1]}<br>Cost/task: $%{customdata[2]:.4f}<br>Intel/$: %{customdata[3]:.1f}<extra></extra>',
            });
          }
        });

        // Sweet spot zone
        var xVals = points.map(function (d) { return d.costPerTask; });
        var yVals = points.map(function (d) { return d.intelIndex; });
        var xLogMin = Math.log10(Math.min.apply(null, xVals));
        var xLogMax = Math.log10(Math.max.apply(null, xVals));
        var yMax = Math.max.apply(null, yVals);
        var sweetX = Math.pow(10, xLogMin + (xLogMax - xLogMin) * 0.15);
        var sweetY = yMax * 0.85;

        chart.innerHTML = '';
        Plotly.newPlot(chart, traces, {
          height: 650,
          margin: { t: 50, r: 30, b: 60, l: 70 },
          paper_bgcolor: bg, plot_bgcolor: bg,
          font: { color: fmt() },
          hovermode: 'closest',
          legend: { orientation: 'h', y: -0.18, title: { text: lang === 'it' ? 'Periodo' : 'Period' } },
          title: { text: _('title'), y: 0.97 },
          xaxis: {
            title: _('xLabel'),
            type: 'log',
            gridcolor: isDark() ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)',
          },
          yaxis: {
            title: _('yLabel'),
            gridcolor: isDark() ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)',
          },
          shapes: [
            {
              type: 'rect',
              xref: 'x', yref: 'y',
              x0: Math.pow(10, xLogMin), x1: sweetX,
              y0: sweetY, y1: yMax * 1.05,
              fillcolor: isDark() ? 'rgba(100,220,130,0.06)' : 'rgba(50,180,80,0.06)',
              line: { width: 0 },
            },
          ],
          annotations: [
            {
              x: Math.log10(sweetX) * 0.6 + Math.log10(Math.pow(10, xLogMin)) * 0.4,
              y: sweetY + (yMax * 1.05 - sweetY) * 0.5,
              xref: 'x', yref: 'y',
              text: _('sweetSpot'),
              showarrow: false,
              font: {
                size: 13,
                color: isDark() ? 'rgba(100,220,130,0.5)' : 'rgba(50,150,80,0.45)',
              },
            },
          ],
        }, { responsive: true, displayModeBar: false });
      })
      .catch(function (err) {
        chart.innerHTML = '<p style="color:red;text-align:center;padding:2rem">' + _('loadError') + ' ' + err.message + '</p>';
      });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
