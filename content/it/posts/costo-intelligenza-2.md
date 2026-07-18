---
title: "Il reale costo dell'intelligenza"
date: 2026-07-18
description: "Usando come metrica del costo il costo per task andiamo a fare un'analisi"
tags:
  - LLM
  - AI
  - data
  - dashboard
  - budget
translationKey: "cheap-intelligence"
---

Seguendo [Il costo dell'intelligenza]({{< relref "/posts/costo-intelligenza" >}}), questo post utilizza una nuova metrica per misurare il costo dell'intelligenza, il costo per task.

Questa nuova metrica risolve un problema della precedente, il costo per token, cioe' che vari modelli potrebbero costare meno per token ma utilizzare piu' token per un task.

La definizione di task e' quella che da il benchmark, cerchiamo di prenderla come un dato generico e di prenderla per buona.
Sicuramente questa metrica e' piu' precisa del costo per token, anche se e' poi difficile mapparla al nostro uso quotidiano.
Nel senso un task del benchmark a quanti nostri task corrisponde? Sarebbe impossibile ad oggi rispondere, ma supponiamo ci sia un andamento lineare tra i due.

{{< llm-cheap-task >}}

{{< llm-intel-per-cost >}}
