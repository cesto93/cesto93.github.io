---
title: "La timeline dell'IA"
date: 2026-10-28
description: "Analizziamo gli eventi più importanti dell'IA nell'informatica"
tags:
  - LLM
  - AI
  - data
translationKey: "ai-timeline"
---

È difficile capire il progresso dell'IA: si può provare a usare i benchmark, ma non è un metodo esatto.
Seppur i benchmark siano numeri e sarebbero comodi per misurare la progressione delle capacità nell'IA generativa, basta sostituire un benchmark saturato con un altro per vedere i risultati cambiare da un momento all'altro.
Questo è quello che succede, per esempio, a ogni versione della suite di benchmark Artificial Analysis che seguo in altri post.

Ma qui vorrei basarmi su eventi che, secondo me, hanno dimostrato un cambiamento nei risultati ottenuti dagli LLM.

Faccio una premessa: c'è una differenza tra ciò che è possibile con un LLM, ciò che viene fatto per la prima volta con un LLM e ciò che viene fatto dalla maggior parte delle persone con gli LLM. Qui ci baseremo principalmente su ciò che viene fatto per la prima volta dagli LLM.

## Timeline 1: nuove tecnologie per la programmazione

{{< ai-timeline >}}

### Inizio

Tutto inizia con ChatGPT: è stato lui a rendere celebre l'IA generativa. Da lì si è iniziato a non usare più Google o i forum per rispondere alle domande: da quel momento in poi si chiedeva a ChatGPT.

### + 6 mesi
Viene introdotto il tool use: ora si aveva un vero e proprio agente che poteva usare dei tool, come la calcolatrice o il meteo.

### + 2 anni
Viene introdotto MCP: serviva uno standard per integrare gli agenti con i tool.

### + 2 anni e 3 mesi
Dopo 2 anni e 3 mesi viene introdotto Claude Code: da quel momento in poi il codice si poteva scrivere usando un agente IA.
Non serviva più fare copia e incolla, testare il codice e poi copiare gli errori su ChatGPT.
Da ora in poi l'agente scriveva il codice, installava le librerie, lanciava il programma e i test.

### + 3 anni e 1 mese
Dopo 3 anni e 1 mese arrivano le Skills: le nostre capacità potevano essere codificate sotto forma di testo nelle skills.
L'agente aveva gli strumenti, ma gli mancava un modo per apprendere al volo nuove capacità.
Chiaramente si tratta di file markdown, non di magia, ma questo ha portato davvero ad aggiungere nuove capacità ai modelli.
Con il progredire dei modelli, poi, alcune capacità sono state internalizzate e non servono più alcune skills.

### + 3 anni e 3 mesi
Dopo 3 anni e 3 mesi arriva la modalità remota per Claude Code: ora non c'è bisogno di stare al PC, ma si può fare tutto dal telefono; programmare è diventato scrivere a un agente che cosa deve fare, dal telefono.

### + 3 anni e 4 mesi
Viene istituito il progetto Glasswing dopo il rilascio di Mythos. Il modello non viene distribuito al pubblico perché è troppo capace nella cyber security: solo le aziende selezionate possono usarlo per fare hardening dei sistemi. Da qui in poi ogni nuovo modello più capace nella cyber security viene rilasciato dopo aver consultato il governo americano.

### + 3 anni e 5 mesi
Viene fatto il primo rewrite di un programma open source diffuso usando l'IA.
Bun viene riscritto in Rust in poco tempo: quello che una volta richiedeva molto tempo, ora l'IA lo fa velocemente e bene.
Ad oggi Bun è migrato a Rust e non ci sono stati grandi problemi.

### Riflessione
Tutti questi eventi hanno cambiato il modo in cui usiamo l'IA; chiaramente, col tempo queste novità si sono diffuse e si stanno ancora diffondendo. Ci sarà chi programma senza usare un agente IA o senza chiedere a un chatbot IA.
Ci sono invece aziende in cui il 90% del codice è scritto usando agenti IA.

Cosa possiamo prevedere in un futuro?

- Possiamo vedere un futuro in cui la maggior parte dei software verrà riscritta in linguaggi efficienti e memory safe.
- Possiamo vedere anche un futuro in cui chi pubblica un software dovrà farlo validare lato security da un'IA.
