---
title: "The build plan first, then the change"
description: "The AI builds apps in the conversation, but not blindly: it proposes a build plan, shows the changes compared with today and reports openly after applying what is missing."
pubDate: 2026-10-05
cover: ./grundriss.jpg
coverAlt: "Architectural floor plan with mechanical pencil, eraser and plan tube"
---

“Build me an app for our complaints.” One sentence is enough, and an AI delivers something. Whether it is the right thing often only shows later: a field is missing, a role sees too much, an existing table was quietly rebuilt. For an application a team works with every day, that is too little control.

## What happens before applying

- **Questions instead of assumptions**: You describe in the conversation what the app should do. The AI hands over to the app builder and asks follow-up questions as buttons instead of quietly filling gaps.
- **A build plan to check**: On the right, the “Workspace” shows a preview. The “Data” tab lists the fields in plain language, and “Changes” shows what the plan changes compared with today.
- **An honest report**: After “Apply”, the card says whether everything was created as planned and what is missing. If the app changed since the plan, “Discard and generate again” creates a plan on the current state.

## Small changes, targeted

Not every adjustment needs a new conversation. Under “Properties”, an app of your own shows its structure as a tree: tables, fields, roles, views and actions, with search and “Who may use this”. There you edit fields with their choice values, roles and access directly. Changes collect in a bar and only take effect after “Check and apply”, again as a checked build plan. A field that already holds data cannot be removed.

Technical and full admins can build. Everyone else can view the preview only. How the path from idea to app works in general is shown in [“From idea to a running app”](/en/insights/from-idea-to-running-app/).

## Where to start?

Let the AI create a build plan for an app you already know, and read the “Changes” tab. That is where you see fastest whether the plan understood what you mean.
