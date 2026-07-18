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

Questa nuova metrica risolve un problema della precedente, il costo per token, cioè che vari modelli potrebbero costare meno per token ma utilizzare più token per un task.

La definizione di task è quella che dà il benchmark, cerchiamo di prenderla come un dato generico e di prenderla per buona.
Sicuramente questa metrica è più precisa del costo per token, anche se è poi difficile mapparla al nostro uso quotidiano.
Nel senso un task del benchmark a quanti nostri task corrisponde? Sarebbe impossibile ad oggi rispondere, ma supponiamo ci sia un andamento lineare tra i due.

{{< llm-cheap-task >}}

Possiamo vedere che per ora il vero campione di rapporto prezzo prestazioni nella fascia alta è gpt-5.6 sol che in una specifica configurazione scende sotto 55 centesimi al task mantenendo un'intelligenza di 55.9.

Sui 35 centesimi a task invece c'è grok 4.5 con intelligenza 53.8.

Nella fascia economica a 4 centesimi a task c'è deepseek v4 pro con intelligenza 44.3, qui siamo a un bel salto di costo che potrebbe valere la pena.

Nella fascia ultra economica c'è mimo-v2.5 a 1 centesimo a task e intelligenza 37.2, parliamo di un cinquantesimo del costo di gpt-5.6 sol.

{{< llm-intel-per-cost >}}

Nella battaglia per l'intelligenza economica i modelli cinesi open weight si attestano vincitori con un buon compromesso intelligenza prestazioni.
Consideriamo che il valore di deepseek v4 pro è superiore a Claude Sonnet 5 costando 8 9 volte meno.

