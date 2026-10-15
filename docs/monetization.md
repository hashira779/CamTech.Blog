# Monetization — Google AdSense

How advertising is wired into `apps/web`, what to do in the AdSense dashboard, and how to prove it
is actually earning.

Everything ad-related is decided in one place, [`apps/web/src/lib/ads.ts`](../apps/web/src/lib/ads.ts).
Account numbers do not live in application code, and `node scripts/ads-checks.mjs` fails the build if
one reappears.

## Current state

| Piece | Status |
| --- | --- |
| Publisher account | Read from `NEXT_PUBLIC_ADSENSE_PUBLISHER_ID`. Supplied by `docker-compose.yml`, overridable from the server's `.env` (`ADSENSE_PUBLISHER_ID=…`). |
| ads.txt | Generated at `/ads.txt` from the same account. There is deliberately no `public/ads.txt`. |
| Loader script | Emitted only when the account validates. Its `?client=` parameter is also what lets **Auto ads** run — see the dashboard step below. |
| Ad slots | Ten named placements. A placement renders **only** if you have given it a numeric ad unit ID; otherwise it produces no markup at all. |
| Local development | Off. `apps/web/.env.example` ships the all-zeros sample account, so nothing is requested and nobody clicks their own ads by accident. |

**The blocker is not code.** Ads only pay on a domain that AdSense has approved and that resolves in
public DNS. At the time of writing `blog.camtech.cam` returns NXDOMAIN from public resolvers while
`camtech.cam` serves the site — see "Pick the domain" below.

## 1. Pick the domain you will register

AdSense approves a **site**, and Google crawls `https://<that-site>/ads.txt`. Register whichever
origin actually serves the site and stays reachable. Right now that is `https://camtech.cam`;
`https://blog.camtech.cam` does not resolve.

Whichever you choose, make the three of them agree, or ads stop paying while every slot still looks
healthy:

- the domain you add in the AdSense dashboard,
- `NEXT_PUBLIC_SITE_URL` (canonical URLs, sitemap, `og:image`),
- the `ads.txt` Google fetches from that host.

`NEXT_PUBLIC_SITE_URL` now reaches the production build through a compose build arg; before this it
was never passed, so the deployed bundle silently used the `blog.camtech.cam` default in
`src/app/layout.tsx` for every canonical tag.

## 2. In the AdSense dashboard

1. **Apply for AdSense** with the domain from step 1, and leave the site verification meta tag
   (`google-adsense-account`) in place — the root layout emits it automatically once a real account
   is configured.
2. **Create ad units** under *Ads → By ad unit → Display ad*. Take the numeric **Ad unit ID** from
   the code snippet Google gives you (the `data-ad-slot="…"` value, not the whole snippet).
3. **Turn Auto ads off** (*Settings → By ad unit → Auto ads → None*). The loader script is what
   enables Auto ads, and Auto ads decides its own placements: it will put units in the header, above
   the fold, and between paragraphs you did not design for ads. Manual units plus Auto ads is also
   how a page ends up over Google's "ads must not exceed content" line.
4. **Set up payment and address verification** — earnings are held until both are complete.
5. If you have readers in the EEA or UK, enable a **consent message** (*Settings → Privacy & terms →
   US state and EEA visitor messages*), or Google restricts personalized ads for those visitors. The
   site's own banner in `src/components/layout/ConsentBanner.tsx` records a choice locally; it is not
   a certified CMP and does not replace that setting.

## 3. Placements

| Placement | Where | Reserved height | Suggested format |
| --- | --- | --- | --- |
| `HOME_TOP` | Home, Cambodia and World pages, under the masthead | 90 px | Horizontal banner |
| `HOME_MID` | Between homepage sections | 250 px | Rectangle |
| `ARTICLE_TOP` | Above the article brief | 90 px | Horizontal |
| `ARTICLE_MID` | Inside the article, only when the body is ≥ 1,800 characters | 250 px | Rectangle / in-article |
| `ARTICLE_BOTTOM` | After the related links | 250 px | Rectangle |
| `SIDEBAR` | Reading-column sidebar | 250 px | Rectangle / vertical |
| `DISCOVERY_MID` | Discovery detail | 250 px | Rectangle |
| `TOOL_BOTTOM` | Under a calculator or converter result | 250 px | Rectangle |
| `GUIDE_BOTTOM` | Travel guide, above the editorial note | 250 px | Rectangle |
| `TRENDING_MID` | Between the trending rails and editor's picks | 250 px | Rectangle |

Create the four or five that matter first — `ARTICLE_TOP`, `ARTICLE_BOTTOM`, `SIDEBAR`,
`GUIDE_BOTTOM`, `TOOL_BOTTOM` — and leave the rest unconfigured. An unconfigured placement is
invisible, not a gap.

Tools and travel guides are worth the effort out of proportion to their traffic: they are read by
international visitors and held for minutes, while a Cambodian news page bounce is worth far less per
thousand views.

## 4. Turn them on

On the server, in the deployment `.env` next to `docker-compose.yml`:

```bash
ADSENSE_PUBLISHER_ID=ca-pub-XXXXXXXXXXXXXXXX
ADSENSE_SLOTS="HOME_TOP=1111111111,ARTICLE_TOP=2222222222,ARTICLE_BOTTOM=3333333333,SIDEBAR=4444444444"
# Optional: split reporting by section.
ADSENSE_CHANNEL=main
```

`NEXT_PUBLIC_*` values are inlined when the image is built, so this needs a rebuild, not a restart:

```bash
docker compose build --no-cache web && docker compose up -d web
```

## 5. Prove it is earning

```bash
# 1. ads.txt is served and names your account
curl -s https://camtech.cam/ads.txt

# 2. the loader and the verification tag are on the page
curl -s https://camtech.cam/ | grep -c 'adsbygoogle.js?client'

# 3. slots carry numeric ids, not placement labels
curl -s https://camtech.cam/ | grep -o 'data-ad-slot="[0-9]*"'

# 4. nothing leaked into the local dev build (must print 0)
curl -s http://localhost:3000/ | grep -c 'adsbygoogle'
```

Then in AdSense: *Blocked ads* should be empty, the site's *Ads.txt status* should read **Verified**
(allow up to a few hours after the change), and *Performance by ad unit* should start showing
requests and impressions per unit. **Requests without impressions** means the unit ID is wrong or the
format does not fit the slot; **impressions without clicks** is a placement question, not a code one.

Run the gate any time you touch this area:

```bash
cd apps/web && npm run ads        # 62 checks
```

## What the component guarantees

`src/components/ads/AdSlot.tsx`:

- renders nothing unless the account validates **and** the placement has a numeric ad unit ID — the
  old build shipped `data-ad-slot="HOME_TOP"`, which is an invalid request that earns nothing and
  leaves an empty dashed frame on the page;
- asks for the ad when the slot is about to enter the viewport (`IntersectionObserver`, 200 px
  margin), not during first paint, so the ad request stops competing with the hero image for the
  Largest Contentful Paint measurement;
- collapses itself when Google writes `data-ad-status="unfilled"` — the documented attribute — so an
  ad blocker or an empty auction returns continuous text instead of a bordered hole;
- reserves the placement's height while the auction is open, so a late-arriving ad does not shove the
  article down;
- pushes exactly once per unit, which is what keeps React's development double-render from producing
  duplicate-request warnings.

## Policy notes that keep the account alive

- Keep the "Advertisement" label. It is part of the component, not optional styling.
- Never click your own ads, and never test by reloading a page with a real account — that is the
  fastest route to suspension. Local development is disabled by default for this reason.
- Do not place a unit so close to a link or button that a tap can be accidental; the sidebar and
  post-article positions were chosen for that reason.
- Do not serve different content to Google's crawler than to readers.
- Keep `/privacy` and `/cookie-policy` accurate: they name advertising providers, and AdSense asks
  for a privacy policy URL when you apply.
