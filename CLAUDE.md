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

**Varje stapel märks med det datum då mätningen BLEV KOMPLETT**, inte med
intervallets startdatum.

Konkret: stapeln som visas som "Oct 1" på dashboarden är den burn som mättes
fram till Oct 1:s supply-snapshot — vilket motsvarar vad DB:ns UTC-beräkning
internt kallar `Sep 30` (dagen vars supply växte under intervallet som
avslutades Oct 1 00:05 UTC).

Detta är **medvetet UX-val** — användaren ser gårdagens färdigmätta data
under gårdagens datum, inte två dagar gammalt.

**Regler som följer:**

- **Rätta ALDRIG labels i chartet.** Off-by-one-matchningen är avsiktlig,
  inte en bugg.
- **Vid rapportering till Jacob — i analys, video-slides, post-utkast — använd
  CHARTETS datum, inte raw UTC-dagar.** Allt han publicerar ska matcha det
  läsare ser på dashboarden.
- **Vid DB-pulls:** översätt till chart-datum innan presentation. Raw dag N i
  DB ↔ chart dag N+1. Säg uttryckligen vilken konvention som används om det
  finns risk för missförstånd.

Mapping-exempel:

| DB-rad (raw UTC) | Chart-stapel | Vad det mäter |
|---|---|---|
| `2026-09-30` | **"Oct 1"** | Burn under 09-30 → 10-01 intervallet |
| `2026-09-29` | **"Sep 30"** | Burn under 09-29 → 09-30 intervallet |

### TFUEL absorption chart — "Oct 1 saknas"-läget

Chartets senaste KOMPLETTA stapel är alltid gårdagens UTC. En stapel visas
först när supply-snapshots finns på BÅDA sidor av det intervall den
representerar. Idag renderas inte dagens stapel.

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
