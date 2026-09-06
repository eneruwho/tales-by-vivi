# Tales by Vivi Edge Request Protection Handoff

Date: 2026-09-06

## Current Situation

The active problem is Vercel Edge Request quota exhaustion, not Firestore or Cloudinary.

Firestore and Cloudinary were previously investigated and optimized separately. Current screenshots show the Vercel project receiving high cached traffic, especially from `meta-externalagent`. Cached traffic still counts against Vercel Edge Requests, so the site can be technically healthy while the free Vercel quota is still being consumed.

Observed Vercel data from the user:

- Edge Requests: about `62K` in the last 12 hours in the latest screenshot.
- Main bot: `meta-externalagent`, about `60K` requests, `99.8%` cached.
- Top routes:
  - `/projects`: about `32K`, `99.2%` cached.
  - `/contact`: about `6.8K`, `99.8%` cached.
  - `/about`: about `6.2K`, `99.8%` cached.
  - `/artists`: about `6.1K`, `99.7%` cached.
  - `/logo.png`: about `5.1K`, `99.9%` cached.
  - `/`: about `4.8K`, `96.3%` cached.
- Earlier Vercel screenshot showed about `1.28M / 1M` Edge Requests, with about `93.7%` routed through Vercel's Cleveland edge region.

The Cleveland concentration is likely a Vercel edge/PoP routing artifact for bot/crawler infrastructure. It does not prove the actual requester is a normal visitor physically located in Cleveland.

## What This Means

The current issue is quota burn before the app logic matters.

Code-level rate limiting inside Next.js would happen after the request reaches Vercel, so it can protect Firestore and server work, but it cannot fully prevent Edge Request usage. Vercel Firewall/WAF must be used for this immediate edge quota problem.

The best approach is not to broadly rate-limit all visitors first. Broad visitor limits can hide the portfolio from real users. Instead:

1. Rate-limit or temporarily deny aggressive known bots.
2. Protect expensive API routes separately.
3. Only add a gentle global visitor limit as a final safety net.
4. Use Attack Challenge Mode during active spikes.

## Recommended Vercel Firewall Setup

### Rule 1: Meta Crawler Throttle

Purpose: stop `meta-externalagent` from burning cached page-view quota.

In Vercel Dashboard:

1. Open the `tales-by-vivi` project.
2. Go to `Firewall`.
3. Click `Configure` or `New Rule`.
4. Name the rule `Throttle Meta crawler`.
5. Add condition: `Bot Name` equals `meta-externalagent`.
6. If traffic is mainly `/projects`, add another condition: `Path` starts with `/projects`.
7. Set action to `Rate Limit`.
8. Start with `60 requests per 10 minutes`.
9. Save, review, and publish.

If Edge Requests are still climbing too fast, remove the path condition so the rule applies to all `meta-externalagent` requests.

Emergency option: change the action from `Rate Limit` to `Deny` temporarily. Do not leave this as the permanent default unless the client accepts broken Facebook/Instagram link previews.

### Rule 2: Facebook Preview Bot Throttle

Purpose: catch related Meta preview crawling.

1. Create another rule if the plan allows it.
2. Name it `Throttle Facebook preview bot`.
3. Add condition: `Bot Name` equals `facebookexternalhit`.
4. Set action to `Rate Limit`.
5. Use `60 requests per 10 minutes`.
6. Publish.

If the Hobby plan only allows one custom rule, prioritize `meta-externalagent`, because it is the top visible source.

### Rule 3: API Protection

Purpose: keep Firestore safe if attackers switch to APIs.

1. Create a rule named `Protect public API`.
2. Add condition: `Path` starts with `/api/`.
3. Set action to `Rate Limit`.
4. Use `30 requests per IP per minute`.
5. Publish.

This is useful, but it is not the main fix for cached page spam because the screenshots show public pages being requested, not primarily Firestore-backed API routes.

### Rule 4: Gentle Global Visitor Safety Net

Purpose: stop extreme abuse without blocking normal browsing.

Use this only after bot-specific rules, or if Vercel allows multiple rules and priority ordering.

1. Create a rule named `Global visitor safety net`.
2. Condition: apply to all paths.
3. Exclude paths that must stay freely accessible only if Vercel's UI supports exclusions.
4. Action: `Rate Limit`.
5. Start with `120 requests per IP per 10 minutes`.
6. If legitimate users report blocking, loosen to `240 requests per IP per 10 minutes`.

This should be a safety net, not the primary strategy. Real visitors might request many assets on first load, especially mobile users with retries, so too-low global limits can damage UX.

## During Active Attack

If the graph is actively spiking:

1. Enable Vercel `Attack Challenge Mode`.
2. Add a temporary `Deny` rule for the abusive bot name, IP, ASN, JA4 fingerprint, or user agent found in Observability.
3. Watch Edge Requests for 10-15 minutes.
4. Once the spike drops, switch permanent rules back to rate limits instead of hard denies.

Do not block the entire Cleveland region. The region is where Vercel served the traffic, not necessarily the real source identity.

## Instagram Embeds

The embeds are likely related to mobile lag and heavy client-side rendering, but they are not the direct source of the Vercel Edge Request spike shown in the latest screenshots.

Why:

- Instagram embed JavaScript mainly loads third-party resources from Meta/Instagram domains.
- The Vercel Edge Requests shown are requests to the Vercel-hosted site itself.
- The bot table directly identifies `meta-externalagent`, which is a crawler/requester, not a normal visitor running embeds in a browser.

The right embed strategy is:

1. Show lightweight placeholders by default.
2. Load the actual Instagram embed only when the user scrolls near it or taps it.
3. Limit the number of live embeds initially rendered.
4. Prefer static thumbnails/cards linking to Instagram for older or less important posts.

This protects mobile performance, but Vercel Firewall protects Edge Request quota.

## Immediate Decision Tree

If Edge Requests are rising fast:

- Turn on Attack Challenge Mode.
- Temporarily deny `meta-externalagent`.
- After the spike drops, change deny to rate limit.

If traffic is stable but still high:

- Rate-limit `meta-externalagent` to `60 / 10 min`.
- Add `facebookexternalhit` if possible.
- Add `/api/` protection.

If legitimate previews matter a lot:

- Avoid permanent deny.
- Use rate limits.
- Ensure OpenGraph metadata is complete so crawlers can fetch fewer resources.

If the Hobby plan only allows one firewall rule:

- Use the single rule on `meta-externalagent`.
- During emergencies, switch that rule to `Deny`.
- Otherwise keep it as `Rate Limit`.

## What Not To Do Yet

- Do not migrate to Supabase just for this issue.
- Do not add Redis for the edge quota issue. Redis can help app/API rate limiting, but requests still reach Vercel first.
- Do not broadly block an entire region based on the Cleveland graph.
- Do not assume Cloudinary or Firestore is still the current bottleneck.

## Phase 2

After the immediate Vercel firewall rule is active:

1. Check Vercel Observability by `Paths`, `Bot Name`, `User Agent`, `JA4`, and `IP`.
2. Identify whether the crawler is hitting many unique project URLs or repeatedly hitting only list pages.
3. Verify OpenGraph metadata for `/`, `/projects`, `/projects/[slug]`, `/artists`, `/about`, and `/contact`.
4. Add or confirm `robots.txt` policy.
5. Consider serving static preview images and metadata for social crawlers instead of letting them walk heavy pages.

## Phase 3

Longer-term hardening:

1. Add Vercel firewall rules for abusive fingerprints discovered during the incident.
2. Add server-side API rate limiting only for expensive API endpoints.
3. Keep Firestore paginated and cached.
4. Keep Instagram embeds lazy or click-to-load.
5. Add monitoring alerts around Edge Requests before the free tier is exhausted.
6. Consider Cloudflare in front only if Vercel Hobby firewall controls are too limited for repeated crawler abuse.

## Current Recommendation

For this client and budget, the best immediate setup is:

- Vercel Firewall rule for `meta-externalagent`: `60 requests / 10 minutes`.
- Emergency switch to `Deny` if quota is actively draining.
- `/api/` route rate limit: `30 requests / IP / minute`, if another rule is available.
- Keep the current Firestore and Cloudinary optimizations.
- Do not migrate database or add Redis for this specific edge-request problem.

