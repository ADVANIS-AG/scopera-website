---
title: "The same company three times over: data quality as a standing task"
description: "Validation rules, comparison against the source and detection of duplicate entries. How a data set gets clean in the project and stays clean in daily use."
pubDate: 2026-09-25
cover: ./karteikasten.jpg
coverAlt: "A hand pulling a card from a card catalogue"
---

The same company sits in the system three times, twice with a typo in the name. A postcode is missing, an invoice date falls before the order date, a contact left the company two years ago. Each detail on its own costs little. Together they cost trust in the reporting, and sooner or later someone recalculates in a spreadsheet.

## What we check in the project

We work this out with you before the migration, depending on your data:

- **Completeness**: Mandatory fields left empty, and records with no link to a customer, project or order.
- **Format**: Phone numbers, IBANs, postcodes, countries and legal forms. Written consistently, so filters and reports work at all.
- **Plausibility**: Values that look right on their own and do not fit in context. A contract end date before the start date, for example.
- **Duplicate entries**: Two records that mean the same company or person, even though no field matches exactly. Similarity is scored across several fields together.
- **Timeliness**: Addresses, roles and responsibilities that no longer apply. Data protection law expects inaccurate data to be corrected or deleted.
- **Comparison against the source**: What a register, the ERP or the document itself says is held against the record. Scanned paperwork is read along by text recognition.

This applies to customer and supplier data as much as to items, contracts, receipts or the free-text fields where everything has ended up over the years.

## Once is not enough

A clean-up before go-live is mandatory groundwork. The real part starts afterwards. Every import, every interface and every manual entry brings new deviations. In the platform, field rules check new entries as they are made, before the error is in the data set. For business partners, the duplicate check helps find repeated entries. Where it pays off, we agree in the project which checks should recur and who receives the result.

## Who decides

You approve the clean-up rules before we apply them. Anything ambiguous goes to an authorized person as a suggestion. Merging two customer records always belongs there: it is logged, and it cannot be undone at the push of a button. That is why a person decides.

## Where to start?

Take the field your monthly report relies on. Once every figure there holds up, the path for the rest is clear.
