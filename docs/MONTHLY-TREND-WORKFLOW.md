# Monthly Trend Title Workflow

**Workflow:** `.github/workflows/monthly-trend-titles.yml`
**Script:** `scripts/monthly-trend-titles.js`
**Runs:** 1st of every month at 04:30 UTC (10:00 AM IST) + manual "Run workflow"

---

## Shu Karto Che? (What it does)

Akh month na WordPress-related titles Google mathi build kare che - ane already
publish chayela ke queue ma hoya title **repeat nathi karta**. Ready titles directly
`blog-queue.json` ma append thay che, jya thi Auto Blog Publisher tene automatically
publish kare che. Sathe ma human-readable calendar `docs/TREND-PLAN-YYYY-MM.md`
banay che, jye tame review kari shako.

```
Google Trends + Google News + Autocomplete
              |
              v
   dedupe (published + queued + sitemap)
              |
              v
   30 new titles  --->  blog-queue.json (status: pending)
              |
              v
   docs/TREND-PLAN-YYYY-MM.md (calendar with source of every title)
```

---

## Title Sources (Badha Free, API Key Joie Nathi)

| # | Source | URL | Shu Male |
|---|--------|-----|----------|
| 1 | Google Trends daily trending | `trends.google.com/trending/rss?geo=US/IN/GB` | Aaje shu trend ma che (WordPress related filter) |
| 2 | Google Trends related queries | `trends.google.com/trends/api/explore` | "wordpress" sathe related rising/top queries (best effort - kabhi 429 aave) |
| 3 | Google News | `news.google.com/rss/search?q=wordpress` | Latest WordPress headlines (max 8 distinct stories) |
| 4 | Google Autocomplete | `suggestqueries.google.com/complete/search` | Loko have shu search kar rahe che |
| 5 | Evergreen pool | built-in | 76 WordPress topics - fakr tab j kaam aave jab upar nu na pugay |

**Order matters:** Trends > News > Autocomplete > Evergreen. Trending content month
na first week ma publish thay (fresh hoi), pachi search-demand topics, ane evergreen
fakr gap fill kare.

Gemini (GEMINI_API_KEY) three kaam kare che - badha best-effort che, key na hoy toh
script templates thi pan complete run thay che:

1. **News grouping** - ekaj story 10 outlets par aave, te 1 headline ma collapse
2. **Semantic dedupe** - reworded repeat pakad che (lexical match nathi pakadta):
   *"Bricksforge Critical Vulnerability"* already publish chhe toh
   *"Critical Bricksforge Plugin Flaw"* drop thay
3. **Title polish** - 45-65 character, sharp SEO titles

---

## Dedupe Rules (Repeat Ek Pan Nathi Thashe)

Check thay che:

1. `blog/*.html` - badha **68 published** posts (og:title / `<title>`)
2. `blog-queue.json` - published + pending badha entries
3. `sitemap.xml` - badha slugs

Andar thi check:

- **Normalized title match** - casing/punctuation fark na hoi
- **Slug match** - `slugify(title)` already exist kare toh skip
- **Token overlap (Jaccard >= 0.6)** - "Best WordPress Security Plugins 2026" vs
  "Best WordPress Security Plugins" jem near-dupes pakaday
- **Within-run topic overlap** - aaj na j run ma badha titles vachha
- **Semantic (Gemini)** - same story/vulnerability feature na hova

Jo koi title badha pass kare nathi, toh evergreen pool thi top-up thay che.

---

## Output

### 1. `blog-queue.json`

```json
{
  "id": 43,
  "title": "WordPress Developer Career Roadmap & Essential Skills",
  "slug": "wordpress-developer-career-roadmap-essential-skills",
  "keywords": ["wordpress developer", "career roadmap", "WordPress"],
  "publish_time": "3:00 AM",
  "publish_date": "2026-11-09",
  "status": "pending",
  "source": "autocomplete"
}
```

- Titles month ma **1/day** spread thay che (3 AM / 3 PM alternate)
- `status: "pending"` hoi toh Auto Blog Publisher tene automatically pick kare che
- `source` field mathi khabar pade che ke title kya thi aavyo

### 2. `docs/TREND-PLAN-YYYY-MM.md`

| # | Date | Time | Title | Slug | Source |
|---|------|------|-------|------|--------|
| 1 | 2026-11-01 | 3:00 AM | ... | ... | Google News |

---

## Manual Run

### GitHub (no computer needed):
```
Actions > Monthly Trend Titles > Run workflow
  count  = 30        (ketla titles janavi joie)
  month  = 2026-12   (blank = current month)
  queue  = true      (false = fakr plan document, queue nathi chhute)
```

### Local:
```bash
# Dry run - plan j check karo, kai write nathi thay
node scripts/monthly-trend-titles.js --dry-run

# Plan document only (queue nathi chhute)
node scripts/monthly-trend-titles.js --no-queue

# Full run: 30 titles for December
node scripts/monthly-trend-titles.js --count=30 --month=2026-12
```

| Flag | Default | Shu kare |
|------|---------|----------|
| `--count=N` | 30 | Ketla titles |
| `--month=YYYY-MM` | current month | Kaya month mate |
| `--no-queue` | off | Fakr plan document, queue nathi chhute |
| `--no-gemini` | off | AI polish skip (templates only, turant complete) |
| `--dry-run` | off | Kai write nathi thay |

---

## Cadence Mathu Rakho (Important)

Cadence now **1 post/day = ~30 posts/month** che (3 PM valo cron kadhya pachhi),
ane aa workflow month ma **30 titles** aape che (1/day). Atle:

- **Balance:** 30 titles in, 30 posts out → queue stable, khashtu nathi
- **Refill:** dar mahine 1st na roj nava 30 titles add thay

Jo 2 posts/day joiye toh `auto-blog-publisher.yml` ma cron pachu add karo:

```yaml
    - cron: '30 9 * * *'   # 3:00 AM IST - keep
    - cron: '30 21 * * *'  # 3:00 PM IST - add back for 2 post/day
```

Sathe `--count=60` pan karo (`docs/TREND-PLAN-YYYY-MM.md` ma targets sathe match kare).

---

## Troubleshooting

| Symptom | Karan | Upay |
|---------|-------|------|
| `HTTP 429` on trends explore | Google throttles the explore API | Normal - script baaki sources thi run thay che |
| `Gemini ... skipped` | Quota exhausted / timeout | Templates thi titles banay - run still succeeds |
| `Skipped N duplicate title(s)` | Aa month na titles pahela j exist karta hata | Normal - dedupe exactly ae j karto che |
| Only `evergreen` sources in plan | Live sources down hata | Plan still valid, next run ma live sources aavshé |
| `No pending blogs in queue` | Publisher kai che publish karo | Monthly Trend Titles run karo (ya queue ma title nakavo) |
| Plan ma joi ne repeat lagti hoy | Semantic dedupe miss kari gayi | Title manually queue mathi remove karo |

---

*Created: November 5, 2026*
*Goal: Aakh month nu WordPress content pipeline - trend based, duplicate-free, fully automatic*
