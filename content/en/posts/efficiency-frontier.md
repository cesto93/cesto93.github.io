---
title: "Model Efficiency Frontier"
date: 2026-06-28
description: "Finding the most intelligent model for a given budget using Artificial Analysis data"
tags:
  - LLM
  - AI
  - data
  - dashboard
  - efficiency
translationKey: "efficiency-frontier"
---

Not all intelligence costs the same. Some models punch way above their price point, while others charge a premium for marginal gains. This dashboard lets you explore the **efficiency frontier**: the most intelligent model available at any given budget.

Use the slider to set your maximum budget (avg price per 1M tokens), and the chart will show the Pareto frontier of intelligence over time — which models give you the most bang for your buck.

{{< llm-efficiency >}}

The frontier is computed by taking all models under the selected price ceiling and keeping only those that surpass every earlier model in intelligence. The degree-3 polynomial trend gives a rough sense of how the ceiling is rising, with a 6-month projection into the future.

Notice how certain creators consistently sit on the frontier across different price points — DeepSeek and Alibaba often deliver competitive intelligence at lower prices, while OpenAI, Anthropic, and Google tend to push the absolute ceiling when budget permits.

The second chart removes the most expensive closed providers to show the **open-weight frontier**. Open-weight models are closing the gap fast — depending on your budget, you might find that an open model released just a couple months ago matches the intelligence of a closed model that costs 10× more.
