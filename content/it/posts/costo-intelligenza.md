---
title: "Il costo dell'intelligenza"
date: 2026-06-28
description: "Trovare il modello più intelligente per un dato budget usando i dati di Artificial Analysis"
tags:
  - LLM
  - AI
  - data
  - dashboard
  - efficienza
translationKey: "efficiency-frontier"
---

Questo post e' una sorta di sequel di progressi_llm, basato sempre sui dati di [Artificial Analysis](https://artificialanalysis.ai/).
Qui volevo vedere il trend del modello migliore come cambia al vincolo del costo.
Nota il costo e' in milioni di token al dollaro, non in base al costo del benchmark, perche' non ho questa metrica :(.
Come nell'altro post supponiamo la sequenza esponenziale.
Cosa cambia dall'altro post? Beh li non si badava a spese, qui si', una cosa e' dire che spendendo di piu' si avra' piu' intelligenza, un'altra e' dire che spendendo ugualmente si avra' piu' intelligenza.


{{< llm-efficiency >}}

Guardando il trend possiamo vedere che questa secondo affermazione e' vera!
Aspettando si avra' sicuramente piu' intelligenza (in questo benchmark) rispetto al passato.
Questo e' significativo anche se limitato ad un benchmark, possibile che in un futuro avremo modelli utili alla programmazione in locale senza spendere cifre esorbitanti.
Penso che questo avrebbe sicuramente delle implicazioni economiche per le grande aziende americane dell'IA.

Partiamo da dei miei dati personali sul consumo di token, ne consumo meno di un milione al giorno se sviluppo nel tempo libero.
Quindi teniamoci larghi e mettiamo un milione di token al giorno, per 20 giorni lavorativi.
Ora cerchiamo di capire ad oggi, se non avessi il generoso free tier di opencode quanto spenderei.

Supponiamo che voglia un livello di intelligenza di circa 50, per ora parliamo di GLM 5.2 (probabilmente nel free tier ho di peggio).

Possiamo vedere con lo slider che siamo circa a 3$/M token.
20*3*1 = 60 euro al mese, una cifra sostenibile da un'azienda media.

Se invece scendiamo a 45 abbiamo DeepSeek v4-pro che costa sui 1$/M token.
20*1*1 = 20 euro al mese, questa cifra e' stostenibile da qualsiasi azienda e anche da uno sviluppatore casual.

Secondo la proiezione esponenziale a Settembre uscirebbe un modello che ha lo stesso score 60 di Claude Fable a questo prezzo.
Seppur sembra improbabile a dirsi oggi, probabilmente una nuova versione di DeepSeekV4.1 avrebbe lo stesso costo e uno score similare. Questo andrebbe ad instaccare molti utenti di aziende Americane di IA chiusa.

Andando a riduerra a 0.5S/M token possiamo vedere che c'e' DeepSeekV4-Flash con intelligenza 40.
Costo 10 euro al mese, alla portata di chiunque.
Qui il trend sembra davvero troppo generoso, ma possiamo pensare che per Settembre si avra' lo stesso livello di GLM5.2 su questa fascia di prezzo.

Possiamo dire che il costo di intelligenza in questa fascia scende comunque esponenzialmente.
Per ora mi fermo qui come prezzo, sotto penso ci siano troppi poco dati, magari in futuro vedro' anche le fasce di 5 euro al mese.


