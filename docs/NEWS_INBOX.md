# News Inbox

Auto-collected inbox of news, upstream updates, security fixes, and ideas relevant to this repo, appended daily by News Bot.
A Cursor planning agent should review these items and fold the useful ones into BUILD_PLAN; entries are append-only, newest at the bottom.


## 2026-11-13

**News and updates**

- Modern Web Guidance 1.0 from Chrome, Edge, Firefox and MDN: an official coding-agent skill plus `legacy-scan` that flags legacy JS/CSS. [source](https://github.com/GoogleChrome/modern-web-guidance/releases/tag/v1.0.0)

**Tasks for the planning agent**

- [ ] Run Modern Web Guidance legacy-scan on the web app — Flags legacy JS/CSS with native replacements. Label: `[AGENT][LOCAL]` · Priority: P3 · https://github.com/GoogleChrome/modern-web-guidance/releases/tag/v1.0.0

### Game news (added 11:00 AST)

**News and updates**

- Version 1.11 (October 22, 2026) fixes Story Pack 2 and rebalances Loveless, Amon, Harlowe, Rafa, and Vex, including numbers such as Rafa's Barrage at 13% splash (up from 7%) and Peacebreaker Cannon damage up 50%. [source](https://support.borderlands.com/hc/en-us/articles/56652595228051-Borderlands-4-Version-1-11-October-22-2026)
- The same patch changes drop sources and item behavior: Murmur now drops from Genone, Skully from The Immortal Boneface, Ducky drops Phosphene Devourer instead of Phosphene Rainmaker, and Enumeration SMG no longer rolls CoV magazines. [source](https://support.borderlands.com/hc/en-us/articles/56652595228051-Borderlands-4-Version-1-11-October-22-2026)
- Gearbox said the Year 1 roadmap is wrapped and more Borderlands 4 content is in the works for next year, with no pack or date named yet. [source](https://store.steampowered.com/news/app/1285190/view/705535362075723834)
- This week's official rotation (November 12–19) is Big Encore boss Pango & Bango and wildcard mission His Vile Sanctum with a guaranteed Boomslang (Jakobs sniper). [source](https://store.steampowered.com/news/app/1285190/view/693151734943449328)
- A community Nexus item/save editor was updated November 11, 2026, and its listing says the web editor includes data for 1.10, Loveless, Story Pack 2, Bounty Pack 5, and Vault Card 5. [source](https://www.nexusmods.com/borderlands4/mods/216)
- Community testers and SteamDB depot diffs reported that the 1.11 PC executable appears to have dropped Denuvo; official notes do not mention this, and it remains unconfirmed by Gearbox/2K. [source](https://gameiswave.com/news/borderlands-4-denuvo-removal-fps-audit/)

**Tasks for the planning agent**

- [ ] Re-ingest Version 1.11 skill and balance data into the solver packs — Official notes buff Loveless, Amon, Harlowe, Rafa, and Vex, while most repo skill effects are still unparsed and the Rafa experimental pack predates these numbers. Label: `[AGENT][LOCAL]` · Priority: P1 · https://support.borderlands.com/hc/en-us/articles/56652595228051-Borderlands-4-Version-1-11-October-22-2026
- [ ] Refresh drop tables and farm routes for the 1.11 legendary source changes — Murmur, Skully, and Phosphene Devourer were not in the current items.json compiled from drops.json. Label: `[AGENT][LOCAL]` · Priority: P1 · https://support.borderlands.com/hc/en-us/articles/56652595228051-Borderlands-4-Version-1-11-October-22-2026
- [ ] Watch official Year 2 content announcements before adding new DLC gates — Gearbox wrapped Year 1 and is working on more Borderlands 4 content, but has not named the next pack or date. Label: `[HUMAN]` · Priority: P3 · https://store.steampowered.com/news/app/1285190/view/705535362075723834
- [ ] Note the November 12–19 Boomslang wildcard as a temporary farm route — The official weekly guarantees Boomslang this week; the item already has a permanent boss source in items.json. Label: `[AGENT][LOCAL]` · Priority: P3 · https://store.steampowered.com/news/app/1285190/view/693151734943449328

## 2026-11-14

**News and updates**

- wfx-loot campaign pushed a CI secret stealer into 17,000+ public repos using stolen GitHub credentials since Nov 10; an npm postinstall hook slipped past GitHub's workflow hold. IOCs: wfx-docs branch, .ci-xxxxxx.sh files, build-audit-*.yml workflows. [source](https://blog.gitguardian.com/wfx-loot-a-ci-secret-stealer-pushed-with-stolen-github-credentials/)

**Tasks for the planning agent**

- [ ] Audit the repo for wfx-loot IOCs — Checks for the wfx-docs branch/PR, .ci-*.sh files, build-audit-*.yml workflows and new npm lifecycle hooks, since the campaign steals CI secrets and Cursor credentials. Label: `[AGENT][LOCAL]` · Priority: P1 · https://blog.gitguardian.com/wfx-loot-a-ci-secret-stealer-pushed-with-stolen-github-credentials/
