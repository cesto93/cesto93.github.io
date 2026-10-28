(function () {
  'use strict';

  const root = document.getElementById('ai-timeline');
  if (!root) return;

  const chartEl = document.getElementById('ai-timeline-chart');
  const lang = root.dataset.lang === 'it' ? 'it' : 'en';

  const i18n = {
    approx:    { en: 'approximate date', it: 'data approssimativa' },
    afterPrev: { en: 'after', it: 'dopo' },
    noChart:   { en: 'Chart unavailable.', it: 'Grafico non disponibile.' },
  };

  function _(key) { return i18n[key][lang]; }

  const PALETTE = ['#6366f1', '#0ea5e9', '#10b981', '#f59e0b', '#ef4444', '#a855f7', '#14b8a6', '#ec4899'];

  // Milestones per timeline. `precision: 'month'` means only the month is known:
  // the day is a placeholder used for positioning and is never displayed.
  const TIMELINES = {
    'dev-tools': {
      title: {
        en: 'AI milestones for software development',
        it: 'Le tappe dell\'IA per lo sviluppo software',
      },
      events: [
        { y: 2022, m: 11, d: 30, precision: 'day',   name: 'ChatGPT' },
        { y: 2023, m: 6,  d: 15, precision: 'month', name: 'Tool Use<br>(Function Calling)' },
        { y: 2024, m: 11, d: 25, precision: 'day',   name: 'MCP<br>(Model Context Protocol)' },
        { y: 2025, m: 2,  d: 24, precision: 'day',   name: 'Claude Code' },
        { y: 2025, m: 12, d: 15, precision: 'month', name: 'Skills<br>(Agent Skills)' },
        { y: 2026, m: 2,  d: 15, precision: 'month', name: 'Claude Code<br>remote control' },
        { y: 2026, m: 4,  d: 15, precision: 'month', name: 'Project Glasswing' },
        { y: 2026, m: 5,  d: 15, precision: 'month', name: 'Bun<br>(Rust rewrite)' },
      ],
    },
  };

  const isDark = () => document.documentElement.dataset.theme !== 'light' &&
    (document.documentElement.dataset.theme === 'dark' ||
     window.matchMedia('(prefers-color-scheme: dark)').matches);

  const BG = 'rgba(0,0,0,0)';
  const FONT = 'system-ui, -apple-system, sans-serif';
  const ink = () => isDark() ? '#ddd' : '#333';
  const muted = () => isDark() ? '#9aa0a6' : '#6b7280';
  const stemColor = () => isDark() ? '#4b5563' : '#d1d5db';
  const strokeColor = () => isDark() ? '#111' : '#fff';

  // Background used to plate the labels, so leader lines pass behind the text
  // instead of crossing it. Read from the page to follow the theme palette.
  function pageBg() {
    const bgColor = getComputedStyle(document.body).backgroundColor;
    if (bgColor && bgColor !== 'rgba(0, 0, 0, 0)' && bgColor !== 'transparent') return bgColor;
    return isDark() ? '#1d1e20' : '#fff';
  }

  // --------------- dates ---------------

  function utcDate(ev) { return new Date(Date.UTC(ev.y, ev.m - 1, ev.d)); }
  function isoDate(ev) { return utcDate(ev).toISOString().slice(0, 10); }
  function shiftDays(ev, days) {
    return new Date(utcDate(ev).getTime() + days * 86400000).toISOString().slice(0, 10);
  }
  function daysBetween(a, b) { return Math.round((utcDate(b) - utcDate(a)) / 86400000); }

  function dateLabel(ev) {
    const locale = lang === 'it' ? 'it-IT' : 'en-GB';
    const opts = ev.precision === 'month'
      ? { month: 'long', year: 'numeric', timeZone: 'UTC' }
      : { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' };
    return new Intl.DateTimeFormat(locale, opts).format(utcDate(ev));
  }

  function humanizeGap(days) {
    const months = Math.max(1, Math.round(days / 30.4375));
    const years = Math.floor(months / 12);
    const rest = months % 12;
    const parts = [];
    if (years) {
      parts.push(lang === 'it'
        ? (years === 1 ? '1 anno' : years + ' anni')
        : (years === 1 ? '1 year' : years + ' years'));
    }
    if (rest) {
      parts.push(lang === 'it'
        ? (rest === 1 ? '1 mese' : rest + ' mesi')
        : (rest === 1 ? '1 month' : rest + ' months'));
    }
    return parts.join(lang === 'it' ? ' e ' : ' and ');
  }

  const plain = (html) => html.replace(/<br\s*\/?>/g, ' ').replace(/<[^>]+>/g, '');

  function hoverText(ev, prev) {
    let text = '<b>' + plain(ev.name) + '</b><br>' + dateLabel(ev);
    if (ev.precision === 'month') text += '<br><i>' + _('approx') + '</i>';
    if (prev) {
      text += '<br>' + humanizeGap(daysBetween(prev, ev)) + ' ' +
        _('afterPrev') + ' ' + plain(prev.name);
    }
    return text;
  }

  // --------------- chart ---------------

  function render() {
    const def = TIMELINES[root.dataset.timeline] || TIMELINES['dev-tools'];
    const events = def.events;

    const dates = events.map(isoDate);

    // baseline
    const shapes = [{
      type: 'line', xref: 'x', yref: 'y',
      x0: dates[0], x1: dates[dates.length - 1], y0: 0, y1: 0,
      line: { color: stemColor(), width: 3 },
      layer: 'below',
    }];

    const annotations = [];
    const hover = [];

    // ---- label placement ----
    // Labels alternate above/below the axis. Text width is measured so that,
    // when two labels on the same side would overlap (close dates), a second
    // row on that same side is used instead of letting them collide.
    const LABEL_SIZE = 11;
    const ROW_BASE = 0.2;
    const ROW_STEP = 0.46;

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext ? canvas.getContext('2d') : null;

    function measure(text, bold) {
      if (!ctx) return text.length * 6;
      ctx.font = (bold ? 'bold ' : '') + LABEL_SIZE + 'px ' + FONT;
      return ctx.measureText(text).width;
    }

    function labelWidth(ev) {
      const date = dateLabel(ev);
      return ev.name.split(/<br\s*\/?>/).reduce(function (w, line) {
        return Math.max(w, measure(plain(line), true));
      }, measure(date, false));
    }

    const startMs = utcDate(events[0]).getTime();
    const dayOf = (ev) => Math.round((utcDate(ev).getTime() - startMs) / 86400000);
    const plotWidth = Math.max(chartEl.clientWidth - 48, 240);
    const spanDays = dayOf(events[events.length - 1]);

    // Pad the ends so the first/last labels (centered on their marker) fit
    // inside the plot area instead of being clipped by the chart edge.
    let padLeft = 70;
    let padRight = 70;
    let pxPerDay;
    for (let k = 0; k < 4; k++) {
      pxPerDay = plotWidth / (spanDays + padLeft + padRight);
      padLeft = Math.max(70, (labelWidth(events[0]) / 2 + 8) / pxPerDay);
      padRight = Math.max(70,
        (labelWidth(events[events.length - 1]) / 2 + 8) / pxPerDay);
    }

    const dateMin = shiftDays(events[0], -Math.ceil(padLeft));
    const dateMax = shiftDays(events[events.length - 1], Math.ceil(padRight));
    const gapDays = 6 / pxPerDay;

    const rowEnd = {};      // "side:row" -> right edge (days) of the last label put there
    const placements = [];

    events.forEach(function (ev, i) {
      const half = labelWidth(ev) / 2 / pxPerDay;
      const center = dayOf(ev);
      const sides = i % 2 === 0 ? [1, -1] : [-1, 1];
      let chosen = null;

      for (let row = 1; row <= 3 && !chosen; row++) {
        for (const side of sides) {
          const key = side + ':' + row;
          const last = rowEnd[key];
          if (last === undefined || center - half >= last + gapDays) {
            chosen = { side: side, row: row };
            break;
          }
        }
      }
      chosen = chosen || { side: sides[0], row: 3 };

      rowEnd[chosen.side + ':' + chosen.row] = center + half;
      placements.push(chosen);
    });

    const maxRow = placements.reduce(function (m, p) { return Math.max(m, p.row); }, 1);
    const yTop = ROW_BASE + (maxRow - 1) * ROW_STEP + 0.42;

    events.forEach(function (ev, i) {
      const p = placements[i];
      const labelY = (ROW_BASE + (p.row - 1) * ROW_STEP) * p.side;
      const stemY = (ROW_BASE - 0.06 + (p.row - 1) * ROW_STEP) * p.side;

      shapes.push({
        type: 'line', xref: 'x', yref: 'y',
        x0: dates[i], x1: dates[i], y0: 0, y1: stemY,
        line: {
          color: stemColor(),
          width: 1.5,
          // outer rows use a dashed leader so it reads as passing behind
          // the labels of the inner row
          dash: p.row > 1 ? 'dot' : 'solid',
        },
        layer: 'below',
      });

      annotations.push({
        x: dates[i],
        y: labelY,
        text: '<b>' + ev.name + '</b><br>' + dateLabel(ev),
        showarrow: false,
        xanchor: 'center',
        yanchor: p.side > 0 ? 'bottom' : 'top',
        align: 'center',
        bgcolor: pageBg(),
        font: { size: LABEL_SIZE, family: FONT, color: ink() },
      });

      // tooltip uses the same convention as the post headings:
      // elapsed time since the first milestone, rounded to months.
      hover.push(hoverText(ev, i > 0 ? events[0] : null));
    });

    const trace = {
      type: 'scatter',
      mode: 'markers',
      x: dates,
      y: events.map(function () { return 0; }),
      marker: {
        size: 13,
        color: events.map(function (_, i) { return PALETTE[i % PALETTE.length]; }),
        line: { color: strokeColor(), width: 2 },
      },
      customdata: hover,
      hovertemplate: '%{customdata}<extra></extra>',
      hoverlabel: {
        bgcolor: isDark() ? '#1f2328' : '#fff',
        bordercolor: stemColor(),
        font: { family: FONT, size: 12, color: ink() },
      },
      cliponaxis: false,
      showlegend: false,
    };

    const layout = {
      paper_bgcolor: BG,
      plot_bgcolor: BG,
      margin: { l: 24, r: 24, t: 54, b: 26 },
      height: 340 + (maxRow - 1) * 95,
      hovermode: 'closest',
      dragmode: false,
      title: {
        text: '<b>' + def.title[lang] + '</b>',
        font: { size: 14, family: FONT, color: ink() },
        x: 0, xanchor: 'left', y: 0.98, yanchor: 'top',
      },
      xaxis: {
        type: 'date',
        range: [dateMin, dateMax],
        tickformat: '%Y',
        dtick: 'M12',
        tickfont: { size: 11, family: FONT, color: muted() },
        tickcolor: muted(),
        showgrid: false,
        zeroline: false,
        showline: false,
        fixedrange: true,
      },
      yaxis: {
        visible: false,
        range: [-yTop, yTop],
        fixedrange: true,
      },
      shapes: shapes,
      annotations: annotations,
      showlegend: false,
    };

    Plotly.react(chartEl, [trace], layout, {
      displayModeBar: false,
      responsive: true,
      scrollZoom: false,
    });
  }

  if (typeof Plotly === 'undefined') {
    chartEl.innerHTML = '<p style="text-align:center;padding:2rem;color:#888">' +
      _('noChart') + '</p>';
    return;
  }

  render();

  // Re-render on theme toggle so the chart follows the site palette.
  new MutationObserver(function (mutations) {
    for (const m of mutations) {
      if (m.attributeName === 'data-theme') { render(); return; }
    }
  }).observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });

  // Label rows depend on the available width: re-place them when it changes.
  let lastWidth = chartEl.clientWidth;
  let resizeTimer = null;
  window.addEventListener('resize', function () {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(function () {
      if (Math.abs(chartEl.clientWidth - lastWidth) > 20) {
        lastWidth = chartEl.clientWidth;
        render();
      }
    }, 200);
  });
})();
