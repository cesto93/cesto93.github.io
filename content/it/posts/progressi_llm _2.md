---
title: "Analisi progresso LLM 2"
date: 2026-10-14
description: "Un'analisi dei progressi degli LLM sui benchmark di Artificial Analysis, parte 2"
tags:
  - LLM
  - IA
  - dati
  - dashboard
translationKey: "llm-progress-analysis"
---

Questo post è il seguito di [Analisi progresso LLM]({{< relref "/posts/progressi_llm" >}}). Ho pensato di scriverlo perché è passato del tempo e possiamo fare alcune considerazioni sulle previsioni fatte.

Il primo punto è che il benchmark cambia e si evolve per contrastare il benchmaxing, cioè la tendenza a ottimizzare gli LLM solo per i benchmark. Questo fa sì che i valori del post precedente siano superiori a quelli attuali, ma possiamo prendere come riferimento Claude Fable, che avevo considerato il modello di punta.

Come prima previsione avevo detto che ad agosto sarebbe uscito un modello con 10 punti in più, pari a circa +16%.
Il punteggio di Fable 5.0 è 49.6 e il primo settembre è uscito Fable 5.1 con 53.4: un aumento del 7,6%, circa la metà del previsto.

La seconda previsione era che entro agosto sarebbe arrivato un modello open-weight in grado di superare Fable 5.0; a oggi, invece, il miglior modello open-source è Mimo 2.6 Pro con 46.3, ancora al di sotto del punteggio di Fable 5.

Provo quindi a cambiare tipo di regressione e a usare una regressione logistica, per vedere se risulta più realistica.

La regressione esponenziale del post precedente presuppone una crescita infinita, mentre la logistica modella una saturazione: veloce all'inizio, poi rallenta verso un tetto `L`.

```
L / (1 + exp(-k * (x - x0)))
```

con fit vincolato (`L` tra il max osservato e `max(100, max*1.5)`).

Qui la curva stimerebbe un aumento del punteggio di circa il 5% a gennaio e del 10% a metà febbraio (calcolato su Opus 5.5).


{{< llm-logistic >}}


Lo stesso vale per gli open-weight.
Con questa regressione, i modelli open raggiungerebbero il punteggio di Fable 5.0 a metà novembre.
Dopodiché raggiungerebbero Fable 5.1 a gennaio 2027.
Infine raggiungerebbero Opus 5.5, il migliore a oggi, il 18 febbraio.

Questa tempistica è più distesa e potrebbe essere realistica: corrisponderebbe a un ritardo di circa 5 mesi.

Per ora la proiezione vede il recupero dei modelli open-weight a metà 2027, eventualità improbabile a meno di una crisi dei capitali negli Stati Uniti.

{{< llm-open-logistic >}}

A novembre, gennaio e febbraio potremo quindi verificare se queste previsioni si saranno avverate.