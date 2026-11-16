---
title: "Building with your own AI: your subscription, your Git, our checks"
description: "Apps, workflows and free interfaces can now be built from your own AI client, such as Claude Code. SCOPERA checks every plan, applies it as a trial run and calls no model of its own to do so."
pubDate: 2026-11-16
cover: ./hobelbank.jpg
coverAlt: "A workbench in a carpentry workshop in warm backlight, with hand planes, a wooden mallet and a dovetailed wooden frame"
---

Many IT teams have long been working with an AI client of their own. The subscription is paid for, the way of working is established, changes land in their own Git and go through review. Introducing a second assistant with its own quota for yet another platform makes no sense to them. At the same time, no AI, whichever it is, should change an application the organisation works with every day without being checked.

## How a build runs

- **Connect**: The client signs in to SCOPERA over MCP. The person explicitly grants the right “Build apps and interfaces” as part of this.
- **Get context**: The AI receives the structure of your apps and the schema SCOPERA uses to describe apps. Records are not included.
- **Write the plan**: The build plan is a YAML file in your team's Git. If an existing app is to be changed, the AI starts from its exported current state.
- **Check**: SCOPERA checks the plan and applies it as a trial run. The AI corrects it until the plan is valid. Errors show up before applying, not after.
- **Propose and apply**: The plan goes for confirmation in the client or in SCOPERA, or it is applied directly. This creates a new version, and you can go back to an earlier one.

This is how apps, entities and workflows are built. Free interfaces work the same way, with files instead of YAML: a green build produces a version, published with confirmation or directly.

## Who carries what

- **The AI costs**: your own subscription. SCOPERA calls no model for the checks.
- **The checks**: SCOPERA. Every plan goes through checks and a trial run, whichever client wrote it.
- **The history**: your Git holds the plans, SCOPERA the applied versions.
- **The right to build**: admins and technical admins of your organisation.

## Which path for whom

In the [conversation in SCOPERA](/en/insights/build-plan-before-change/), business users describe an app without setting anything up. The model calls run through SCOPERA there. Your own client suits teams that already work with AI in Git and want to treat builds like code: versioned, reviewed, with a traceable origin.

This requires AI connections (MCP). Per call, SCOPERA stores only the tool, outcome, duration and size, no inputs and no answers. More on the [Governance](/en/governance/) page.

## Where to start?

Take a small existing app, put its exported state into your Git and let your AI plan a single change. The result of the check quickly shows how well client and platform work together.
