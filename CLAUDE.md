# Projekt-CLAUDE.md — thetasimplified.com

Standing conventions, arbetsregler och felbank för detta projekt.
Globala arbetsregler ligger i `~/.claude/CLAUDE.md`.

## Läsordning för en ny session

1. `README.md` — vad projektet är, hur det körs
2. Denna fil — konventioner som INTE är uppenbara från koden
3. `src/lib/tfuel-economics.ts` top-level docstring — absorption-metodologins
   historik (varför smoothing togs bort, vad artefakt-flaggan gör)

(`docs/arkitektur.md` och `docs/beslutslogg.md` finns inte än — skapas när
behovet uppstår, inte tomma.)

## Konventioner

### TFUEL absorption chart — datum-konvention

**Chart-stapel märks med det UTC-dygn då burnen hände. Direct mapping,
ingen off-by-one.**

Snapshot-cron läser supply vid ~00:05 UTC varje dygn och skriver en row med
`date` = snapshot-dagen till `theta_activity_history`. Verifierat 2026-10-02:
row `date=2026-10-01` har `tfuel_supply_snapshot_at=2026-10-01 00:05:24 UTC`.

I `src/lib/tfuel-economics.ts:155-180` labelas chart-entry med **START-datum
för intervallet** (`entry.date = sorted[i].date`). Chartet renderar det direkt
via `new Date(entry.date).toLocaleDateString("en-US", {month, day})` —
`MetachainDashboard.tsx:735`.

Mekanik för chart "Oct 1" (= 23.95% på live-sajten 2026-10-02):
- `supply(10-01 00:05) = 7,483,480,361`
- `supply(10-02 00:05) = 7,484,422,119`
- växt under 10-01 UTC-dygnet = 941,758 TFUEL
- raw abs = 1,238,400 − 941,758 = 296,642 (23.95%)

**Regel:** DB-datum = chart-datum = det UTC-dygn burnen hände. Ingen
översättning behövs vid rapportering, slides eller post-utkast.

### TFUEL absorption chart — senaste stapel

Senast visade stapel = gårdagens UTC-dygn. Entries med `entry.date >= todayUtc`
filtras bort i `tfuel-economics.ts:162`. Idag renderas inte dagens stapel —
även om snapshot för dagens 00:05 UTC finns, saknas nästa dygns snapshot som
behövs för att beräkna växt.

### Daily bars är ALLTID råa — ingen smoothing

Sedan 2026-06-29 (commit `70f746e`) är staplarna råa enkeldags-mätningar.
Enda smoothing i hela pipelinen är 7-dagars trailing average på headline-
siffran. Om du läser gammalt kod-kommentar eller methodology-referens om
"3-day centered rolling average" — det är historisk kontext som förklarar
borttagandet, inte en nuvarande beräkning.

### Prod-säkerhet (gäller på toppen av globala regler)

- Push till `main` triggar Vercel-deploy automatiskt. Behandla `git push`
  som "deployar till prod" — bekräfta explicit innan.
- Cron-tier är Hobby = 1 daily cron max + 10s serverless timeout. Vid design
  av nya cron-steg: respektera 10s-budgeten eller skippa med guard
  (se `/api/cron/activity` för mönstret).
- `metachain_bridge_tx_log` + `metachain_bridge_backfill` populeras av en
  långsam backfill (~36 dagar för TFuelTokenBank). Rör inte tabellerna
  manuellt om du inte har specifik anledning.

## Kända fällor (felbank)

### Konventioner codifieras från koden, inte från sammanfattning

**2026-10-02** — Datum-konventionen för TFUEL absorption chart skrevs
tidigare samma dag från en konversations-sammanfattning som påstod off-by-one
(chart "Oct 1" ↔ DB raw "Sep 30"). Det var fel. Koden i
`src/lib/tfuel-economics.ts:155-180` labelar entry med START-datum för
intervallet och chartet renderar det direkt — ingen översättning. Verifierat
via DB-pull: `tfuel_supply_snapshot_at` för row `date=2026-10-01` är
`2026-10-01 00:05:24 UTC`, så row-date = snapshot-tid, och chart-stapel "Oct
1" visar växt mellan 10-01 och 10-02 snapshots = burn under 10-01 UTC.

**Lärdom:** En konvention codifieras aldrig från minne eller sammanfattning.
Läs den definierande koden, kör en DB-query mot en timestamp-kolumn, visa
evidensen innan påståendet skrivs ned.

### Lita inte på minnet om live-HTML — curla och verifiera

**2026-10-02** — En stale screenshot antydde att 3-day-footnoten
(*"Each bar is a 3-day centered average..."*) fortfarande var live på
sajten. Jacob trodde den redan var borttagen. Vid curl mot
`thetasimplified.com/metachain` bekräftades att han hade rätt — HTML:en som
skickas ut säger *"Bars are the raw single-day absorption. Muted grey bars
are flagged data artifacts..."* Footnoten togs bort i commit `3c2df96`
2026-07-17.

**Lärdom:** när ett påstående om vad live-sajten säger kommer från en
screenshot eller minne — **curla produktion först**, grep efter den exakta
textsträngen i raw HTML, och jämför mot källkod. Inget "jag tror det är så"
— verifiera båda sidor.

### Supply-API svarar aldrig på "vem brände"

Supply-endpoint ger en skalär (total circulating supply) per snapshot. Du
kan beräkna hur mycket som brändes totalt, men inte vem som brände eller
varifrån det kom. Vid koncentrations-frågor (särskilt efter oväntade burn-
spikes): peka på detta tydligt, föreslå alternativ källa (`/accounttx` för
Edge Network reward-kontrakt, eller `/blocks/top_blocks` + aggregera fees),
och säg om det är billigt eller dyrt att köra.

### Daily tx-count flat samtidigt som absorption spikar = NON-gas-driven burn

Observerat **Sep 29 – Oct 1** (chart-datum): absorption hoppade från ~14%
till ~21-24% samtidigt som daily_txs var platt kring 13.5–15K. **~125K
extra TFuel bränt per dag** (jämfört med en normal ~14%-dag) kan omöjligt
komma från 14K user-txs × 0.1-0.2 TFuel gas (= 1.4-2.8K totalt).
Kandidater: Edge Network reward payout (burn mechanism unverified),
engångs-contract-burn, eller upstream supply-API-artefakt. **När denna
divergens dyker upp — Jacob behöver veta det innan han attribuerar
burn-rörelsen till "ökad aktivitet".**
