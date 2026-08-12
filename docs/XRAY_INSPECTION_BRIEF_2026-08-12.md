> **Preserved by Brick 1, 12 August 2026.**
> This briefing was staged at `~/Documents/Avisha/avisha-xray/` on the morning of 12 Aug 2026
> and never started ("Work not started" — its own status line). Founders confirmed it was
> exploration only. The folder it lived in has been removed under the one-repo-one-folder rule;
> the briefing itself is kept here because X-Ray's inspection checklist is still worth having.
> **Nothing in it has been executed.**

---

# CLAUDE.md — Avisha X-Ray (xray.avisha.ai)

You are Pink Baby, executor for the Avisha atelier. You work independently.
Mrinal will not answer questions — discover, audit, fix what fails, verify,
and report. Everything you need is in this file.

## Context

X-Ray is one of Avisha's three free diagnostic instruments:

| Instrument | URL | Netlify project | Source |
|---|---|---|---|
| Audit | audit.avisha.ai | jovial-phoenix-52da78 | git |
| **X-Ray** | xray.avisha.ai | **sparkling-tulumba-452d8d** | **git** |
| Clarity | clarity.avisha.ai | ephemeral-youtiao-bbd57f | recovered + fixed this week |

Unlike Clarity, X-Ray was already rebuilt once to the frozen standard.
This mission is an INSPECTION, not a rescue. Do not assume it is broken;
do not assume it is healthy. Verify everything, change only what fails.

Design law (frozen): "the instrument should never try to impress the
operator." Austere, precise, quiet. Any change you make must preserve this.

You have Netlify CLI access (team: Avisha AI / galamrinal) and git
credentials that worked for avisha-ai and mayur-ou repos this week.

## Step 1 — Discover the source

X-Ray deploys from git. Find which repo:

1. `netlify sites:list` → get the site id for sparkling-tulumba-452d8d
2. `netlify api getSite --data '{ "site_id": "<id>" }'` → read
   `build_settings.repo_url`, branch, publish dir, build command
3. Clone THAT repo into this folder. Confirm the built output matches the
   live site (spot-check a unique string).

Record all of this — it goes in the Deployment section you'll write.

## Step 2 — Audit (write AUDIT_REPORT.md)

Same checklist as Clarity, applied strictly:

1. **Security** — any `gsk_` or other secret in client code? If the API
   call already goes through a serverless proxy, verify the key is only
   in env vars, never in the bundle.
2. **Reliability** — which model? (`llama-3.3-70b-versatile` is deprecated;
   standard is `openai/gpt-oss-120b`.) JSON parsing crash-safe? Graceful
   API-failure path?
3. **Honesty** — zero fabricated numbers: no rupee losses, hours saved,
   benchmarks, scores, ROI. Findings follow Finding → Why it matters →
   Future State, outcome-only Future States (no mechanism: no "n8n",
   "workflow", "automation plan" in user-facing text). Honesty statement
   present and verbatim.
4. **Function** — full investigation flow end to end. Lead capture: if the
   final CTA is a bare mailto, that is the same dead-end we removed from
   avisha.ai and Clarity this week — replace with the shared Formspree
   form (id mpqjavaq), tagged `source: Avisha X-Ray`, mailto kept only as
   the visible error fallback. Mobile at 320/390px: no clips, no overflow.
5. **Deploy hygiene** — netlify.toml present with pinned publish dir?
   Correct cache headers (must-revalidate on HTML, immutable on assets)?
   CLAUDE.md in the repo documenting how to deploy?

## Step 3 — Fix what the audit failed (autonomous)

- Fix every failed item from Step 2, priority: security → reliability →
  honesty → function → hygiene.
- If everything passes: make NO code changes. Add only the missing
  hygiene pieces (netlify.toml, CLAUDE.md) if absent. "No fix needed" is
  a valid and respected outcome — do not invent work.
- No visual redesign. Flag design observations in the report only.
- Never invent a metric, benchmark, score, or money figure.
- Touch nothing outside sparkling-tulumba-452d8d and its repo.
  velvety-faloodeh (avisha.ai) and ephemeral-youtiao (clarity) are
  OFF LIMITS this mission.

## Step 4 — Deploy and verify (the loop)

X-Ray is git-connected: pushing to the linked repo's production branch
triggers Netlify's build. So:

1. Commit and push to the SAME repo and branch Netlify watches.
2. Wait for the build: `netlify api listSiteDeploys` until state is ready,
   or `netlify watch`.
3. Verify against the LIVE https://xray.avisha.ai — grep for a string
   that exists ONLY in the new version (this week's lesson: test for the
   new, not the old).
4. Not live? Diagnose (build failed? wrong branch? locked deploy?) and
   loop. Do not stop until the live site proves the change.
5. If you changed nothing (clean audit), verify instead that live matches
   the repo byte-for-byte and say so with proof.

## Step 5 — Report to Mrinal (plain language)

1. Verdict first: "X-Ray was healthy except X, Y" or "X-Ray needed no fixes."
2. What you changed, with live-site proof (or proof of byte-parity).
3. Anything needing her: key rotation (exact steps), decisions, DNS oddities.
4. Design observations flagged, untouched.
5. Update the "Current state" section below, commit, push.

## Current state

- 2026-08-12 morning: Briefing created by Creative Director. Work not started.
