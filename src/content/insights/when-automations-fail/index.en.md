---
title: "When automations fail: emergency brake and workflow monitor"
description: "A broken workflow doesn't run on forever, and errors don't stay invisible. What SCOPERA does when an automation fails."
pubDate: 2026-11-04
---

A scheduled workflow sends reminders every night. Since a change to the module, it fails on every run, and nobody notices. Or everybody notices, because each failed attempt sends a message and soon nobody looks anymore. Both are unpleasant, and both can be avoided.

## The emergency brake

If a workflow fails in the background several times in a row, SCOPERA stops it, after five failed runs by default. The interface then shows it as "Paused", along with the reason.

- **One message per series of failures**: The person who created the workflow receives exactly one message. If they have left, it goes to the technical admins.
- **A single hiccup bothers nobody**: A successful run resets the counter.
- **Reactivate**: Once the cause is fixed, you switch the workflow back on. That resets the counter too.

Only what runs in the background is stopped, where nobody sees the error directly. Checks on saving and actions someone is waiting on stay active: there, the step fails visibly. Inbound webhooks aren't paused either. And a deliberate rejection by a validation rule doesn't count as a failure at all.

## The workflow monitor

In the monitor, business and technical admins see what went wrong:

- **One entry per failed run**, with the original error text and the data the run started with. Data from 100 KB upwards is truncated.
- **Filters and a detail view**, so a pattern shows up faster than in individual messages.
- **90 days of retention**, after which entries are deleted automatically.

Anyone who triggers a run themselves also gets a "Failed workflows" message in the bell, one per run. Portal users don't receive such a message.

## Where to start?

Open the monitor and see which workflow shows up most often. Many entries often come down to a single cause, such as a renamed field.
