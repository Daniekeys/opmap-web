# Phase 5 - Hardening

Read: Build phases > Phase 5, Cost guardrails.

Build:
- checkLimit on every paid action; usage and cost per workspace on an admin page, split into Claude credit and Google calls.
- Eval set of 20 saved leads that reruns after any prompt or model change, with before and after side by side. Include a contact accuracy check (target 90% of shown phones and emails correct).
- Contact points older than 90 days rechecked before use.
- Error states, retries, alerts. Alert when Google usage passes 800 calls in a month.

Done when: a prompt change runs against the eval set and shows a side-by-side, and the admin page shows each workspace's monthly cost.
