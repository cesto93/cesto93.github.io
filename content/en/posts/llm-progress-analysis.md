---
title: "LLM Progress Analysis"
date: 2026-06-27
description: "An analysis of LLM progress on Artificial Analysis benchmarks"
tags:
  - llm
  - data
  - dashboard
  - english
translationKey: "llm-progress-analysis"
---

We often hear about LLM progress and today I tried using data from [Artificial Analysis](https://artificialanalysis.ai/) to analyze the trend. This benchmark is one of the most widely used and also one that measures the largest number of models — on the free tier it even offers data to us mere mortals.

Let's start with an absolute trend: the intelligence capability of the best model over time. I added a polynomial regression to try to estimate the trend and project it over the next six months. Although I wouldn't bet my life on this analysis, I'd like to make some considerations (if only to see them in a post and realize how wrong I was XD).

{{< llm-dashboard >}}

Let's consider the current situation: Claude Fable has reached about 60 with a fairly significant increase over the previous model. Claude Fable is currently considered so dangerous that the US government has blocked its export. Clearly it's not guaranteed that another model reaching 60 would have the same level of danger, but let's try to reason with the data we have.

Following the trend, by September 2026 (back from summer break) a model should come out that beats Fable by 5 points — if the trend continues and new closed models are released. By November 2026 we'd be around 70, a 10-point gap.

It's clear that these models would certainly have an impact both in terms of safety and performance — we're talking about a model that will outperform Fable by twice as much as Fable currently outperforms Opus. There must be some consequence.

But we could say that maybe the US government will somehow set a threshold and declare that all models above a certain level won't be released. So now it's interesting to look at the trend for open-weight models.

{{< llm-open-dashboard >}}

Ta-da! The trend shows that open-weight models are about 4 months behind on this benchmark — a bit off from the 6 months we often hear about. And here's the interesting part: by late October, an open model should arrive that scores the same as Mythos, meaning in 4 months Mythos can be freed and given to everyone.

But in the meantime, the new Mythos 5.1 will have been released.

One last point I'd like to make is why the trend might slow down. In my opinion, it's more likely that the closed model trend will slow down — the US government's move must have discouraged Anthropic and OpenAI from releasing larger models. As of now, they're not even selling them, or at least not as much as they'd like.

These models need to pay for themselves somehow, otherwise it's better to invest in more efficient, less dangerous, and more marketable models.

In the open-weight trend, I see the same speed as the closed trend — unless Mythos represents some extraordinary leap in performance. My thesis is that it's not the case, since GPT 5.6 was released and reported as being blocked just like Mythos, and it even has a catchy name like Mythos (Sol).

And now I'll leave you, waiting one day for a Mythos of my very own.
