---
title: "La timeline dell'IA"
date: 2026-10-28
description: "Analizziamo gli eventi importanti nell'IA nell'informatica"
tags:
  - LLM
  - AI
  - data
---

E' difficile capire il progresso dell'IA, si puo' provare a fare dai benchmark ma questo non e' un metodo esatto.
Seppur i benchmark sono numeri e verrebbero comodi per la progressione delle capacita' nell'IA generativa, basta cambiare un benchmark saturato con un altro per vedere i risultati cambiarsi sotto mano.
Questo e' quello che succede per esempio ad ogni versione della suite di benchmark Artificial Analysis che seguo in altri post.

Ma qui vorrei basarmi su degli eventi che hanno (secondo me) dimostrato un cambiamento nei risultati ottenuti dagli LLM.

Faccio una premessa, c'e' un differenza tra quello che e' possibile con un LLM, quello che viene fatto per la prima volta con un LLM e quello che viene fatto dalla maggiorparte delle persone con gli LLM. Qui ci baseremo su quello che viene fatto per la prima volta dagli LLM principalemente.

## Timeline 1: nuove tecnologie per la programmazione

{{< ai-timeline >}}

### Inizio

Tutto inizia con Chatgpt questo ha reso celebre l'IA generativa, da li' si e' pensato di non usare piu' google, o i forum per rispondere alle domande. Da ora in poi si chiedeva a chatgpt.

### + 6 mesi
Viene introdotto il tool use: ora si aveva un vero e proprio agente che poteva usare dei tool.
Come ad esempio la calcolatrice, o il meteo.

### + 2 anni
Viene introdotto MCP, serviva uno standard per integrare gli agenti con i tool.

### + 2 anni e 3 mesi
Dopo 2 anni e 3 mesi e' stato introdotto claude code: da ora in poi il codice si poteva scrivere usando un agente IA.
Non serviva fare copia e incolla e testare il codice e poi copiare gli errori su chatgpt.
Da ora in poi l'agente scriveva il codice, installava le librerie, lanciava il programma e i test.

### + 3 anni e 1 mese
Dopo 3 anni e 1 mese vengono le Skills: le nostre capacita' potevano essere codificate sotto forma di testo nelle skills.
L'agente aveva gli strumenti ma mancava di un modo per apprendere al volo delle capacita'.
Chiaramente si tratta di file markdown non magia, ma questo ha portato davvero ad aggiungere nuove capacita' ai modelli.
Con il progredire dei modelli poi, alcune capacita' sono state internalizzate e non servono piu' alcune skills.

### + 3 anni e 3 mesi
Dopo 3 anni e 3 mesi viene la modalita' remota per claude code: ora non c'e' bisogno di stare al pc ma si puo' fare tutto dal telefono, la programmazione e' diventata scrivere a un agente che cosa deve fare dal telefono.

### + 3 anni e 4 mesi
Viene istituito il progetto glasswing dopo che e' stato rilasciato Mythos. Il modello non viene distribuito al pubblico perche' troppo capace nella cyber security, solo le aziende selezionate possono usarlo per fare hardening dei sistemi. Da qui in poi ogni nuovo modello piu' capace nella cyber security viene rilasciato sentendo il governo americano.

### + 3 anni e 5 mesi
Viene fatto il primo rewrite di un programma open source diffuso usando l'IA.
Bun viene riscritto in rust in poco tempo, quello che una volta richiedeva molto tempo ora l'IA lo fa velocemente e bene.
Ad oggi bun ha migrato a rust e non ci sono stati grandi problemi.

### Riflessione
Tutti questi eventi hanno cambiato il modo in cui usiamo l'IA, chiaramente col tempo queste novita' si sono diffuse e si stanno ancora diffondendo. Ci saranno persone che programmano senza usare un agente IA o senza chiedere a un chatbot IA.
Ci sono aziende invece dove il 90% del codice e' scritto usando agenti IA.

Cosa possiamo prevedere in un futuro?

- Beh possiamo vedere un futuro in cui la maggior parte dei software verranno riscritti in linguaggi efficienti e memory safe.
- Possiamo vedere anche un futuro in cui chi pubblica un software dovra' farlo validare lato security ad un IA.

