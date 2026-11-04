---
title: "What may the AI do? Approvals over trust"
description: "The AI never sees more than the person asking, and only what has been approved. How approvals and write mode work together in SCOPERA."
pubDate: 2026-11-04
cover: ./gitter-schloss.jpg
coverAlt: "A closed metal lattice gate with a chain and a brass padlock"
---

"Can the AI actually read our payroll data?" Anyone who brings AI into their own processes gets this question sooner or later. A reassuring answer doesn't help much at that point. What helps is a setting you can show.

## Two limits on reading

- **The person's permissions**: The AI works with the permissions of the person asking. What that person may not see, the AI does not see for them either.
- **The approvals**: On top of that, the area has to be approved for the AI. Apps, modules, integrations and areas each have an entry of their own.

Under Administration → AI settings → "Access", technical admins decide what applies.

## A chain that only restricts

Approvals run from the platform through the provider to the tenant. Each level can only restrict, and none can open up what is blocked further up. If an entry is missing, access is off. If there is a fault and the chain can't be read, everything is off as well. When in doubt, the door stays shut.

## Writing is a separate question

Being allowed to read doesn't mean being allowed to change. That is why each category has its own write mode:

- **Off**: The AI changes nothing in this category.
- **Confirm**: The AI proposes the change, a person approves it.
- **Automatic**: The AI carries out the change itself.

In a workflow, "Confirm" counts as denied, because nobody is there to confirm. Denied steps are recorded in the log, so it stays clear why a run failed.

## What reaches the provider

Before a request goes to an AI model, fields of the AI data class "Regulated" are masked, and recognizable patterns such as email addresses and AHV, IBAN, phone and card numbers are removed. Pattern matching doesn't catch every spelling, and individual functions such as transcription need the original content. That is why the approval remains the first limit. More on the [Governance](/en/governance/) page.

## Where to start?

Open "Access" and go through the list once with the person responsible for data protection. Then set to "Confirm" the category where a second check matters most to you.
