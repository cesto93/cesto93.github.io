---
title: "Software development with AI"
date: 2026-07-21
description: "Reflections on how software development changes with AI"
tags:
  - LLM
  - AI
  - software
translationKey: "sofware-develop-with-AI"
---

With the rise of AI-based tools for code development (Claude Code, Codex, OpenCode, etc.), programming has begun outsourcing important parts of code writing to AI. Today many programmers, even low-level programmers like Salvatore Sanfilippo, say you don't need to read the code the AI writes.

I wonder then whether these tools, which are CLIs that show code diffs, are the right instruments for code development, or whether sooner or later they will be changed to become more independent.

Claude Code has already launched an app for use on a smartphone, clearly pushing asynchronous execution of tasks (I don't think anyone reads code from their phone).

So I ask myself what the best interface is in which these semi-autonomous AI agents will work.

Is managing these agents like managing developers? If so, I'd say you could adopt an agile dashboard, a kanban board. On this board you specify the tasks, then assign them to an agent and follow their status (at a high level). Additionally, there could be notifications, whether in case of doubts or in case of completion or failure.

Another question is whether the economy will come to distribute tasks across different agents with different costs and intelligence. I believe so: for example, git commit messages are certainly less important than the code itself and could be written by less advanced models. Maybe it's not like that today, but in the future, with progress, why waste an advanced model to write a log message.