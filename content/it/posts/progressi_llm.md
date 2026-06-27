---
title: "Analisi progresso LLM"
date: 2026-06-27
description: "Un'analisi dei progressi degli LLM sui benchmark di Artificial Analysis"
tags:
  - LLM
  - IA
  - dati
  - dashboard
translationKey: "llm-progress-analysis"
---

Sentiamo spesso parlare del progresso degli LLM e oggi ho provato ad usare i dati di [Artificial Analysis](https://artificialanalysis.ai/) per fare delle analisi sul trend.
Questo benchmark è uno dei più utilizzati ed anche uno che misura il numero maggiore di modelli, nel free tier offre anche i
dati a noi comuni mortali.

Partiamo da un trend assoluto: la capacità di intelligenza del migliore modello su scala temporale.
Ci ho aggiunto una regressione polinomiale per provare a stimare il trend e proiettarlo nei prossimi sei mesi,
sebbene non metta la mano sul fuoco su questa analisi vorrei fare delle considerazioni (anche solo per vederle in post e capire
di quanto sbagliavo XD).

{{< llm-dashboard >}}

Facciamo una considerazione sulla situazione attuale: Claude Fable è arrivato a circa 60 con un incremento abbastanza significativo rispetto al modello precedente. Claude Fable al momento è considerato così pericoloso da essere stato bloccato dal governo americano dall'export. Chiaramente non è detto che un altro modello che raggiunga 60 abbia la stessa pericolosità ma cerchiamo di ragionare sui dati che abbiamo.

Seguendo il trend verso Settembre 2026 (al ritorno dalle ferie) dovrebbe uscire un modello che stacca Fable di 5 punti, se il trend continuasse e i nuovi modelli closed uscissero. Verso Novembre 2026 staremmo sui 70, quindi con uno stacco di 10 punti.

È chiaro che questi modelli avrebbero sicuramente un impatto sia a livello di sicurezza che a livello di performance, stiamo parlando di un modello che staccherà Fable del doppio rispetto a quanto Fable ad ora stacca Opus, ci deve essere una qualche conseguenza.

Però potremmo dire che magari il governo americano in qualche modo mette un paletto e dice che tutti i modelli sopra una certa soglia non usciranno.
Quindi ora è interessante vedere come è il trend sui modelli open weight.

{{< llm-open-dashboard >}}

Ta-da il trend dice che gli open weight sono indietro di circa 4 mesi su questo benchmark, si discosta un po' dai 6 mesi che sentiamo spesso. Ed ecco la parte interessante verso la fine di Ottobre dovrebbe arrivare un modello open che ha lo stesso punteggio di Mythos, per cui tra 4 mesi Mythos può essere liberato e dato a tutti.

Ma nel frattempo sarà uscito il nuovo Mythos 5.1.

Ultima nota che vorrei porre è perché il trend potrebbe rallentare, secondo me è più probabile che rallenti il trend dei modelli chiusi, la mossa del governo americano deve aver scoraggiato Anthropic e OpenAI da rilasciare modelli più grandi.
Ad ora non li stanno neanche vendendo, o almeno non come vorrebbero e quanto vorrebbero.
Questi modelli devono ripagarsi in qualche modo, altrimenti conviene investire in modelli più efficienti, meno pericolosi e più vendibili.

Nel trend open weight vedo la stessa velocità del trend closed, a meno che Mythos non rappresenti chissà quale salto di prestazioni. La mia tesi è che non sia così visto che comunque è uscito GPT 5.6 che viene riportato e bloccato come Mythos, ha anche un nome accattivante come Mythos (Sol).

Ed ora vi lascio aspettando un giorno un Mythos tutto mio.
