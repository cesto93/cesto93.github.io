---
title: "The Cost of Intelligence"
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

This post is a sort of sequel to [llm_progress_analysis]({{< relref "/posts/llm-progress-analysis" >}}), still based on data from [Artificial Analysis](https://artificialanalysis.ai/).
Here I wanted to see the trend of the best model as it changes with the cost constraint.
Note that cost is in millions of tokens per dollar, not based on benchmark cost, because I don't have that metric :(.
As in the other post, we assume the exponential sequence.
What's different from the other post? Well, there we weren't watching the budget — here we are. It's one thing to say that spending more will get you more intelligence, and another to say that spending the same will get you more intelligence.

{{< llm-efficiency >}}

Looking at the trend we can see that this second claim is true!
As the months go by, you will definitely get more intelligence (on this benchmark) than in the past.
This is significant even if limited to a single benchmark — it's possible that in the future we'll have models useful for coding locally without spending exorbitant amounts.
I think this would certainly have economic implications for the big American AI companies.

Let's start from my personal token consumption data: I consume less than a million tokens per day if I'm coding in my free time.
So let's be generous and put a million tokens per day, for 20 working days.
Now let's try to figure out today, if I didn't have opencode's generous free tier, how much I would spend.

Suppose I want an intelligence level of about 50 — for now that's GLM 5.2 (I'm probably getting worse on the free tier).

We can see with the slider that we're around $3/M tokens.
20 days × $3/M tokens × 1M tokens = €60 per month, a sustainable amount for an average company.

If instead we go down to 45, we have DeepSeek v4-pro costing around $1/M tokens.
20 days × $1/M tokens × 1M tokens = €20 per month — sustainable for any company and even for a casual developer.

According to the exponential projection, by September a model with the same score of 60 as Claude Fable would come out at this price.
Though it seems unlikely to say today, a new version of DeepSeekV4.1 would probably have the same cost and a similar score. This would poach many users from American closed AI companies.

Going down to $0.5/M tokens we can see that DeepSeekV4-Flash is there with intelligence 40.
Cost of 10 euros per month — within everyone's reach.
Here the trend seems too generous, but we can think that by September we'll have the same level as GLM5.2 in this price range.

We can say that the cost of intelligence in this range decreases exponentially anyway.
I'll stop here for now on pricing — below this there's too little data. Maybe in the future I'll also look at the 5 euro per month range.
