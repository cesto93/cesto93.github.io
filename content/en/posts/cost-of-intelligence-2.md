---
title: "The true cost of Intelligence"
date: 2026-07-18
description: "Using cost per task as the cost metric, we perform an analysis"
tags:
  - LLM
  - AI
  - data
  - dashboard
  - budget
translationKey: "cheap-intelligence"
---

Following [The Cost of Intelligence]({{< relref "/posts/cost-of-intelligence" >}}), this post uses a new metric to measure the cost of intelligence: cost per task.

This new metric addresses a problem with the previous one — cost per token — which is that various models might cost less per token but use more tokens for a task.

The definition of task is whatever the benchmark provides; we try to take it as a generic data point and accept it as given.
This metric is certainly more accurate than cost per token, even if it's difficult to map to our daily usage.
In the sense that, how many of our tasks does one benchmark task correspond to? It would be impossible to answer today, but we assume a linear relationship between the two.

{{< llm-cheap-task >}}

We can see that for now the true champion of price-performance in the high range is gpt-5.6 sol, which in a specific configuration drops below 55 cents per task while maintaining an intelligence of 55.9.

At around 35 cents per task, there's grok 4.5 with intelligence 53.8.

In the budget range at 4 cents per task, there's deepseek v4 pro with intelligence 44.3 — here we see a significant cost jump that might be worth it.

In the ultra-budget range, there's mimo-v2.5 at 1 cent per task with intelligence 37.2 — we're talking about one-fiftieth the cost of gpt-5.6 sol.

{{< llm-intel-per-cost >}}

In the battle for affordable intelligence, Chinese open-weight models emerge as winners with a good intelligence-performance tradeoff.
Consider that deepseek v4 pro outperforms Claude Sonnet 5 while costing 8-9 times less.
