(function () {
  'use strict';

  const DEFAULTS = [
    "Alibaba", "Anthropic", "DeepSeek", "Google", "Z AI",
    "Kimi", "Meta", "MiniMax", "Mistral", "NVIDIA", "OpenAI", "Xiaomi",
  ];

  let allData = [];
  let filteredData = [];
  let selectedCreators = new Set(DEFAULTS);
  let intelRange = [0, 100];

  const root = document.getElementById('llm-dashboard');
  if (!root) return;

  const isDark = () => document.documentElement.dataset.theme !== 'light' &&
    (document.documentElement.dataset.theme === 'dark' ||
     window.matchMedia('(prefers-color-scheme: dark)').matches);

  const chartFontColor = () => isDark() ? '#ddd' : '#333';
  const chartBg = () => 'rgba(0,0,0,0)';
  const sidebarBg = () => isDark() ? '#1a1a2e' : '#f0f2f5';
  const metricBg = () => isDark() ? '#1a1a2e' : '#f0f2f5';
  const textColor = () => isDark() ? '#ddd' : '#222';
  const labelColor = () => isDark() ? '#aaa' : '#666';
  const metricValueColor = () => isDark() ? '#fff' : '#111';

  const sidebar = root.querySelector('.llm-sidebar');
  const main = root.querySelector('.llm-main');

  function init() {
    renderSidebar();
    fetch(root.dataset.src || '/data/language_models_free.json')
      .then(r => r.json())
      .then(raw => {
        allData = raw.data.map(m => ({
          name: m.name,
          creator: m.model_creator?.name || 'Unknown',
          intelligence_index: m.evaluations?.artificial_analysis_intelligence_index,
          coding_index: m.evaluations?.artificial_analysis_coding_index,
          agentic_index: m.evaluations?.artificial_analysis_agentic_index,
          price_input_1m: m.pricing?.price_1m_input_tokens,
          price_output_1m: m.pricing?.price_1m_output_tokens,
          cache_hit_1m: m.pricing?.price_1m_cache_hit_tokens,
          output_tok_per_s: m.performance?.median_output_tokens_per_second,
          ttft_s: m.performance?.median_time_to_first_token_seconds,
          e2e_response_s: m.performance?.median_end_to_end_response_time_seconds,
        }));
        const maxIntel = Math.max(...allData.map(d => d.intelligence_index).filter(v => v != null));
        intelRange[1] = maxIntel;
        renderSidebar();
        applyFilters();
      })
      .catch(err => {
        main.innerHTML = `<p style="color:red">Failed to load data: ${err.message}</p>`;
      });
  }

  function renderSidebar() {
    const creators = [...new Set(allData.map(d => d.creator).filter(Boolean))].sort();
    const maxIntel = allData.length > 0
      ? Math.max(...allData.map(d => d.intelligence_index).filter(v => v != null))
      : 100;

    sidebar.innerHTML = `
      <h3>Filters</h3>
      <label>Model creator</label>
      <div class="llm-creator-list">
        ${creators.map(c => `
          <label class="llm-checkbox">
            <input type="checkbox" value="${c}" ${selectedCreators.has(c) ? 'checked' : ''}>
            ${c}
          </label>
        `).join('')}
      </div>
      <label>Intelligence index: <span id="llm-range-label">${intelRange[0]} — ${intelRange[1]}</span></label>
      <div class="llm-slider-group">
        <input type="range" class="llm-range-min" min="0" max="${maxIntel}" step="0.1" value="${intelRange[0]}">
        <input type="range" class="llm-range-max" min="0" max="${maxIntel}" step="0.1" value="${intelRange[1]}">
      </div>
    `;

    sidebar.style.background = sidebarBg();

    sidebar.querySelectorAll('input[type="checkbox"]').forEach(cb => {
      cb.addEventListener('change', () => {
        if (cb.checked) selectedCreators.add(cb.value);
        else selectedCreators.delete(cb.value);
        applyFilters();
      });
    });

    const minSlider = sidebar.querySelector('.llm-range-min');
    const maxSlider = sidebar.querySelector('.llm-range-max');
    const label = document.getElementById('llm-range-label');

    function syncSliders() {
      let min = parseFloat(minSlider.value);
      let max = parseFloat(maxSlider.value);
      if (min > max) { [min, max] = [max, min]; }
      intelRange = [min, max];
      minSlider.value = min;
      maxSlider.value = max;
      label.textContent = `${min.toFixed(1)} — ${max.toFixed(1)}`;
      applyFilters();
    }

    minSlider.addEventListener('input', syncSliders);
    maxSlider.addEventListener('input', syncSliders);
  }

  function applyFilters() {
    filteredData = allData.filter(d => {
      if (d.intelligence_index == null) return false;
      if (!selectedCreators.has(d.creator)) return false;
      if (d.intelligence_index < intelRange[0] || d.intelligence_index > intelRange[1]) return false;
      return true;
    });
    renderDashboard();
  }

  function renderDashboard() {
    const d = filteredData;
    const fmt = chartFontColor();
    const bg = chartBg();

    const metrics = [
      { label: 'Total models', value: d.length },
      { label: 'Avg intelligence index', value: d.length > 0 ? (d.reduce((s, r) => s + r.intelligence_index, 0) / d.length).toFixed(1) : '—' },
      { label: 'Median input price (1M tok)', value: d.length > 0 ? '$' + median(d.map(r => r.price_input_1m).filter(v => v != null)).toFixed(2) : '—' },
      { label: 'Median output speed (tok/s)', value: d.length > 0 ? median(d.map(r => r.output_tok_per_s).filter(v => v != null)).toFixed(1) : '—' },
    ];

    main.innerHTML = `
      <h2>🧠 Free Language Models — Artificial Analysis</h2>
      <div class="llm-metrics">${metrics.map(m => `
        <div class="llm-metric" style="background:${metricBg()}">
          <span class="llm-metric-value" style="color:${metricValueColor()}">${m.value}</span>
          <span class="llm-metric-label" style="color:${labelColor()}">${m.label}</span>
        </div>
      `).join('')}</div>
      <div id="llm-chart1" class="llm-chart"></div>
      <div id="llm-chart2" class="llm-chart"></div>
      <div id="llm-chart3" class="llm-chart"></div>
    `;

    const layout = {
      height: 500,
      margin: { t: 50, r: 20, b: 60, l: 60 },
      paper_bgcolor: bg,
      plot_bgcolor: bg,
      font: { color: fmt },
    };

    // Chart 1: Intelligence vs Input Price
    const c1 = d.filter(r => r.intelligence_index != null && r.price_input_1m != null);
    if (c1.length > 0) {
      const reg1 = ols(c1.map(r => r.price_input_1m), c1.map(r => r.intelligence_index));
      const minX1 = Math.min(...c1.map(r => r.price_input_1m));
      const maxX1 = Math.max(...c1.map(r => r.price_input_1m));
      const line1y = [minX1, maxX1].map(x => reg1.slope * x + reg1.intercept);
      Plotly.newPlot('llm-chart1', [{
        x: c1.map(r => r.price_input_1m),
        y: c1.map(r => r.intelligence_index),
        text: c1.map(r => r.name),
        mode: 'markers',
        type: 'scatter',
        marker: { color: c1.map(r => creatorColor(r.creator)), size: 6 },
        hovertemplate: '%{text}<br>$%{x:.2f} / 1M tok<br>Intel: %{y}<extra></extra>',
      }, {
        x: [minX1, maxX1], y: line1y,
        mode: 'lines',
        type: 'scatter',
        line: { color: 'rgba(200,200,200,0.4)', width: 2 },
        hoverinfo: 'skip',
        showlegend: false,
      }], {
        ...layout,
        title: { text: 'Intelligence vs. Input Price' },
        xaxis: { title: 'Input price ($/1M tokens)', type: 'log' },
        yaxis: { title: 'Intelligence index' },
      }, { responsive: true });
    } else {
      document.getElementById('llm-chart1').innerHTML = '<p style="color:' + fmt + ';text-align:center;padding:2rem">No data matches the current filters.</p>';
    }

    // Chart 2: Output Speed vs Intelligence
    const c2 = d.filter(r => r.intelligence_index != null && r.output_tok_per_s != null);
    if (c2.length > 0) {
      const reg2 = ols(c2.map(r => r.intelligence_index), c2.map(r => r.output_tok_per_s));
      const minX2 = Math.min(...c2.map(r => r.intelligence_index));
      const maxX2 = Math.max(...c2.map(r => r.intelligence_index));
      const line2y = [minX2, maxX2].map(x => reg2.slope * x + reg2.intercept);
      Plotly.newPlot('llm-chart2', [{
        x: c2.map(r => r.intelligence_index),
        y: c2.map(r => r.output_tok_per_s),
        text: c2.map(r => r.name),
        mode: 'markers',
        type: 'scatter',
        marker: { color: c2.map(r => creatorColor(r.creator)), size: 6 },
        hovertemplate: '%{text}<br>%{y:.1f} tok/s<br>Intel: %{x}<extra></extra>',
      }, {
        x: [minX2, maxX2], y: line2y,
        mode: 'lines',
        type: 'scatter',
        line: { color: 'rgba(200,200,200,0.4)', width: 2 },
        hoverinfo: 'skip',
        showlegend: false,
      }], {
        ...layout,
        title: { text: 'Output Speed vs. Intelligence' },
        xaxis: { title: 'Intelligence index' },
        yaxis: { title: 'Output tokens / second' },
      }, { responsive: true });
    } else {
      document.getElementById('llm-chart2').innerHTML = '<p style="color:' + fmt + ';text-align:center;padding:2rem">No data matches the current filters.</p>';
    }

    // Chart 3: Top 20 by Intelligence
    const top20 = [...d].sort((a, b) => b.intelligence_index - a.intelligence_index).slice(0, 20);
    if (top20.length > 0) {
      Plotly.newPlot('llm-chart3', [{
        x: top20.map(r => r.intelligence_index),
        y: top20.map(r => r.name),
        orientation: 'h',
        type: 'bar',
        marker: { color: top20.map(r => creatorColor(r.creator)) },
        hovertemplate: '%{y}<br>Intel: %{x}<extra></extra>',
      }], {
        ...layout,
        height: 600,
        margin: { t: 50, r: 20, b: 50, l: 200 },
        title: { text: 'Top 20 Models by Intelligence Index' },
        xaxis: { title: 'Intelligence index' },
        yaxis: { categoryorder: 'total ascending', title: '' },
      }, { responsive: true });
    } else {
      document.getElementById('llm-chart3').innerHTML = '<p style="color:' + fmt + ';text-align:center;padding:2rem">No data matches the current filters.</p>';
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

  function ols(x, y) {
    const n = x.length;
    if (n < 2) return { slope: 0, intercept: 0 };
    const mx = x.reduce((a, b) => a + b, 0) / n;
    const my = y.reduce((a, b) => a + b, 0) / n;
    let num = 0, den = 0;
    for (let i = 0; i < n; i++) {
      num += (x[i] - mx) * (y[i] - my);
      den += (x[i] - mx) ** 2;
    }
    const slope = den ? num / den : 0;
    const intercept = my - slope * mx;
    return { slope, intercept };
  }

  function median(arr) {
    if (arr.length === 0) return 0;
    const s = [...arr].sort((a, b) => a - b);
    const mid = Math.floor(s.length / 2);
    return s.length % 2 ? s[mid] : (s[mid - 1] + s[mid]) / 2;
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
