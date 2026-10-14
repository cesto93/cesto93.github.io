---
title: "LLM Progress Analysis 2"
date: 2026-10-14
description: "An analysis of LLM progress on Artificial Analysis benchmarks, part 2"
tags:
  - LLM
  - AI
  - data
  - dashboard
translationKey: "llm-progress-analysis-2"
---

This post is a follow-up to [LLM Progress Analysis]({{< relref "/posts/llm-progress-analysis" >}}). I decided to write it because some time has passed and we can reflect on the predictions I made.

The first point is that the benchmark changes and evolves to counter benchmaxing, that is the tendency to optimize LLMs only for benchmarks. As a result, the scores in the previous post are higher than the current ones, but we can use Claude Fable as a reference, which I had considered the leading model.

As a first prediction, I said that in August a model would come out scoring 10 points higher, about +16%.
Fable 5.0 scores 49.6, and on September 1st Fable 5.1 was released with 53.4: a 7.6% increase, about half of what was predicted.

The second prediction was that by August an open-weight model would arrive capable of beating Fable 5.0; as of today, instead, the best open-source model is Mimo 2.6 Pro with 46.3, still below Fable 5's score.

So I want to try a different type of regression and use a logistic regression, to see if it turns out to be more realistic.

The exponential regression in the previous post assumes infinite growth, while the logistic one models saturation: fast at first, then slowing down toward a ceiling `L`.

```
L / (1 + exp(-k * (x - x0)))
```

with a constrained fit (`L` between the observed max and `max(100, max*1.5)`).

Here the curve would estimate a score increase of about 5% in January and 10% in mid-February (calculated on Opus 5.5).


{{< llm-logistic >}}


The same applies to open-weight models.
With this regression, open models would reach Fable 5.0's score in mid-November.
Then they would reach Fable 5.1 in January 2027.
Finally, they would reach Opus 5.5, the best to date, on February 18.

This timeline is more relaxed and could be realistic: it corresponds to a lag of about 5 months.

For now, the projection shows open-weight models catching up in mid-2027, an unlikely scenario barring a funding crisis in the United States.

{{< llm-open-logistic >}}

In November, January, and February we will therefore be able to check whether these predictions came true.
