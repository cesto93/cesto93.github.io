---
title: "Analisi progresso LLM"
date: 2026-06-27
description: "Un'analisi dei progressi degli LLM sui benchmark di Artificial Analysis"
tags:
  - llm
  - dati
  - dashboard
  - italiano
translationKey: "free-llm-dashboard"
---

Sentiamo spesso del progresso degli LLM e oggi ho provato ad usare i dati di [Artificial Analysis](https://artificialanalysis.ai/) per fare delle analisi sul trend.
Questo benchmark e' uno dei piu' utilizzati ed anche uno che misura il numero maggiore di modelli, nel free tier offre anche i
dati a noi comuni mortali.

Partiamo da un trend assoluto la capacita' di intelligenza del migliore modello su scala temporale.
Ci ho aggiunto una regressione polinomiale per provare a stimare il trend e proittarlo nei prossimi sei mesi,
sebbene non metto la mano sul fuoco su questa analisi vorrei fare delle considerazioni (anche solo per vederle in post e capire
di quanto sbagliavo XD).

{{< llm-dashboard >}}

Facciamo una considerazione sulla situazione attuale, Claude Fable e' arrivato a circa 60 con un incremento abbastanza significativo rispetto al modello precedente. Claude Fable al momento e' considerato cosi' pericoloso da essere stato bloccato dal governo americano nell'export. Chiaramente non e' detto che un altro modello che raggiunga 60 abbia la stessa pericolosita' ma cerchiamo di ragionare sui dati che abbiamo.

Seguendo il trend verso Settembre 2026 (al ritorno dalle ferie) dovrebbe uscire un modello che stacca Fable di 5 punti, se il trend continuasse e i nuovi modelli closed uscissero. Verso Novembre 2026 staremmo sui 70 quindi con uno stacco di 10 punti.