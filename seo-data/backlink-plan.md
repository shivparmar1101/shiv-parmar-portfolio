# Backlink Strategy — Shiv Parmar Portfolio

Site: https://shiv-parmar-portfolio.netlify.app
Tracker: `seo-data/backlinks-tracker.csv` (status: todo → contacted → earned / rejected)

Goal (6 months): 20-30 quality referring domains. Relevance > quantity.

---

## Phase 1 — Profiles & directories (do this week, 1-2 hours)

For every row in the tracker with `type=profile` or `type=directory`:

1. Sign up / claim listing
2. Same name + description everywhere: **"Shiv Parmar — WordPress Developer (WooCommerce, custom themes, performance)"**
3. Website field = `https://shiv-parmar-portfolio.netlify.app`
4. Mark status `earned` in CSV, add anchor text used

Notes:
- **GitHub**: pin the portfolio repo; README first line = site link
- **Dev.to / Hashnode / Medium**: republish 1 old post first, set canonical URL to the original blog post (avoids duplicate-content penalty)
- **GoodFirms / Clutch**: ask 2-3 past clients for a short review — reviews unlock higher listing tier
- **LinkedIn**: About section + Featured section both get the site URL

## Phase 2 — Guest posts (1-2 per month)

Find targets: search `wordpress ("write for us" OR "guest post guidelines")` — start with Kinsta, Cloudways, Themeisle rows in the tracker.

Pitch rules:
- Read 3 recent posts of that blog first; pitch a topic they have NOT covered
- One email, no follow-up spam (1 polite bump after 7 days)
- Expect 20-30% reply rate; low is normal

### Template A — Guest post pitch

```
Subject: Guest post idea for <Blog>: <specific topic>

Hi <Name>,

I'm Shiv Parmar, a WordPress developer (4+ years, WooCommerce + performance focus).
I read your piece on <specific recent article> and noticed you haven't covered <gap>.

I'd like to contribute: "<working title — long-tail, e.g. 'WooCommerce 11.1: Setup Checklist for Store Owners'>".

Draft outline:
- <point 1>
- <point 2>
- <point 3 (original data/screenshots from my client work)>

1,500-2,000 words, original, no rewrites. You get full editorial control;
I'd appreciate a link to my portfolio in the author bio.

Sample of my writing: https://shiv-parmar-portfolio.netlify.app/blog/wordpress-cron-jobs-complete-guide

Interested? I can send the outline or full draft, whichever you prefer.

Thanks,
Shiv Parmar
https://shiv-parmar-portfolio.netlify.app
```

### Template B — Roundup / resource mention

```
Subject: Mention in your <year> <topic> roundup?

Hi <Name>,

I run into your "<roundup/article URL>" while researching <topic>.
I noticed <competitor/tool> is listed but <my post/tool> isn't —
it's a tested comparison (I benchmarked <N> tools, raw numbers here: <URL>).

If it fits your readers, adding it would help them compare options.
Happy to link to your roundup from my resource page in return.

Either way, great article — the <specific tip> was useful.

Thanks,
Shiv
```

### Template C — Client "featured in" backlink

```
Subject: Quick favor — can you credit the project?

Hi <Client>,

Now that <project> is live and performing well, would you add
a credit line / "Development by Shiv Parmar" link to:
https://shiv-parmar-portfolio.netlify.app

A dofollow link from your domain would help my portfolio a lot.
I'll happily feature your case study on my site too (with your OK).

Thanks!
Shiv
```

## Phase 3 — Ongoing signals (30 min/week)

- Answer 2-3 questions/week on r/WordPress + WordPress StackExchange — link a post only when it IS the answer
- Featured.com / Qwoted: reply to 1 journalist request/week (WordPress expert angle)
- Publish 1 new blog post (auto-publisher does this) → then `gh workflow run request-indexing.yml`
- Republish that post on Dev.to + LinkedIn with canonical/original link

## Monthly review (first of month)

1. Update tracker statuses
2. Semrush free backlink-checker: your domain → see new referring domains
3. Competitor gap: check 2 competitor WordPress bloggers' backlinks, pitch same sites with Template B
4. Target: +3-5 earned links/month

## Do NOT

- Buy links, PBNs, "1000 backlinks for $5" Fiverr gigs — penalty risk
- Mass directory spam beyond the curated list above
- Exact-match anchor spam — vary anchors (name, site URL, "Shiv Parmar WordPress developer")
- Link drops in Reddit/StackExchange where it doesn't answer the question

## Quota reality

- GSC "Request indexing" UI: 10 URLs/day (already automated via Indexing API — no limit issue)
- Indexing API: 200/day, 10/min — 61 URLs fine
- Backlinks: patience — Google credits consistent, relevant growth over months
