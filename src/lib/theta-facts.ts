/**
 * Verified Theta Network fundamentals — the authoritative source
 * for facts the AI assistant must NEVER invent or get wrong.
 *
 * These values are protocol constants. They do not change unless
 * Theta upgrades its protocol. Do not edit without checking the
 * source URL listed against each fact.
 *
 * Live values that change daily (current prices, current supply,
 * activity index) are NOT in this file — those come from the
 * existing /api/weekly-summary and /api/metachain endpoints.
 */

export interface ThetaFact {
  value: string;
  source: string;
}

export const THETA_FACTS = {
  // ── Protocol mechanics ──
  blockTime: {
    value: "~6 seconds (target block time)",
    source: "Theta Mainnet 3.0 whitepaper",
  },
  tfuelBlockReward: {
    value:
      "86 TFUEL per block total (38 TFUEL to TFUEL stakers + 48 TFUEL to THETA stakers)",
    source: "Theta Mainnet 3.0 whitepaper",
  },
  dailyTfuelIssuance: {
    value: "1,238,400 TFUEL per day (86 × 14,400 blocks)",
    source: "Derived from block time and block reward",
  },
  burnMechanism: {
    value:
      "25% of TFUEL payments to the Edge Network are burned at the protocol level. Gas fees on the main chain also burn a portion of TFUEL.",
    source: "Theta Mainnet 3.0 update",
  },

  // ── THETA token (governance + staking) ──
  thetaTotalSupply: {
    value:
      "1,000,000,000 THETA — HARD CAPPED, fully in circulation, NEVER minted or inflated",
    source: "Theta whitepaper, fixed at genesis",
  },
  thetaRole: {
    value:
      "Governance token. Used for staking by Validator Nodes (200K min) and Guardian Nodes (1K min). THETA does not pay gas. THETA is never created or destroyed by the protocol.",
    source: "Theta protocol design",
  },

  // ── TFUEL token (utility + gas + rewards) ──
  tfuelInitialSupply: {
    value: "5,000,000,000 TFUEL at genesis",
    source: "Theta whitepaper",
  },
  tfuelRole: {
    value:
      "Utility token. Pays gas fees, settles EdgeCloud payments, and is the reward distributed to validators, guardians, and edge node operators. TFUEL has no hard cap — it is inflationary by block reward and deflationary by burn. Net direction depends on usage.",
    source: "Theta protocol design",
  },

  // ── Validator architecture ──
  validatorSlots: {
    value:
      "Up to 31 active Validator Node slots, ranked by THETA stake. Permissionless to enter (200K THETA + hardware spec) but only the 31 highest-staked are active proposers; lower-staked nodes are 'candidates' that earn no rewards.",
    source: "Theta validator documentation",
  },

  // ── Node tiers and minimum stake to participate ──
  nodeStakeRequirements: {
    value:
      "Four node tiers with different stake floors: (1) Regular Edge Node — NO token stake required, just runs the EdgeCloud client and takes standard jobs. (2) Elite Edge Node — requires at least 10,000 TFUEL staked on the node to qualify for premium jobs and higher rewards. (3) Guardian Node — requires at least 1,000 THETA staked. (4) Validator Node — requires 200,000 THETA staked plus hardware spec.",
    source: "Theta protocol docs + Reward Calculator on thetasimplified.com/earn",
  },

  // ── Edge Node hardware ──
  edgeNodeHardware: {
    value:
      "Theta's official MINIMUM hardware for Edge Node (regular or Elite): 4+ CPU cores, 16+ GB RAM, 64+ GB disk (256+ GB recommended for AI jobs), 5+ Mbps internet up and down, optional Nvidia GPU with CUDA for higher-paying jobs. These are minimums — competitive earning typically needs more (8+ cores, 100+ Mbps, modern GPU). DO NOT quote specific over-specced configurations like '8 vCPU, RTX 3060, 100 Mbps' as if they were protocol requirements — they are NOT. Point users to docs.thetatoken.org/docs/setup-theta-edge-node for the official spec.",
    source: "docs.thetatoken.org/docs/setup-theta-edge-node",
  },

  // ── EdgeCloud pricing (operator-set, NOT protocol-fixed) ──
  edgeCloudPricing: {
    value:
      "EdgeCloud uses dynamic, operator-set pricing — there are NO fixed protocol-level rates for vCPU/hour, GPU/hour, RAM, or storage. Operators set their own rates per node, hardware tier, and workload. DO NOT quote specific TFUEL/hour or TFUEL/GB numbers as if they were standard rates — anything like '850 TFUEL/hour for a regular node', '30 TFUEL/hour for a T4 GPU', or '8 TFUEL per GB-month storage' is fabricated. For real costs, refer users to thetaedgecloud.com/pricing for live operator listings, or thetasimplified.com/use-edgecloud for the comparison vs AWS/Azure/GCP.",
    source: "Theta EdgeCloud documentation",
  },

  // ── Main Chain Activity Index — exact formula and tiers ──
  mainChainIndexFormula: {
    value:
      "Main Chain Activity Index — weighted sum of four components: (1) daily transactions weight 40%, baseline 42,000; (2) TFUEL 24h volume weight 15%, baseline $12M; (3) wallet activity weight 35%, baseline 100% of recent blocks containing user transactions; (4) staking participants weight 10%, baseline 22,000 nodes. Each component score = (observed / baseline) × 100. Final index = 0.40·tx + 0.15·vol + 0.35·wallet + 0.10·nodes. Index is uncapped (can exceed 100). Tiers: 0-50 Quiet, 50-100 Active, 100-300 Elevated. DO NOT invent alternative weights or tier thresholds — these are the exact published values. For full method see thetasimplified.com/methodology.",
    source: "thetasimplified.com/methodology",
  },

  // ── Metachain Utilization Index — exact formula, tiers, POGS status ──
  metachainIndexFormula: {
    value:
      "Metachain Utilization Index — weighted average of subchain scores. Raw weights: Main Chain 1.0, Lavita 0.7, TPulse 0.7, Passaways 0.5, Grove 0.5, POGS 0.3, Ecosystem Growth 0.5. Total raw weight = 4.2. Normalized weights as percentages: Main Chain 23.8%, Lavita 16.7%, TPulse 16.7%, Passaways 11.9%, Grove 11.9%, POGS 7.1%, Ecosystem Growth 11.9%. Tiers: 0-50 Early, 50-100 Growing, 100-250 Thriving, 250-500 Mature. INACTIVITY vs EXCLUSION — these are TWO different states: (a) 'included with low/zero activity' means the chain is active but had a quiet day, score is low but it still counts toward the composite at its full weight; (b) 'excluded' means the chain has been inactive for more than 30 days, in which case it is REMOVED from the composite score and its weight is automatically REDISTRIBUTED proportionally among the remaining active chains. POGS (chain ID tsub9065) is currently EXCLUDED from the composite score: its last block was on March 18, 2026, and as of today it has been offline for more than 30 days. Last known POGS score before exclusion: 24. POGS is shown on /metachain under the 'Previously tracked chains' section and will re-enter the composite automatically if activity resumes. POGS is NOT excluded for being a community-issued token — the only reason it is excluded is the 30-day inactivity rule. DO NOT invent alternative weights like '40% transactions, 30% TFUEL, 20% nodes' — those are fabricated.",
    source: "thetasimplified.com/methodology and /metachain",
  },

  // ── Absorption rate — supply-delta method, NOT burn sampling ──
  absorptionMethod: {
    value:
      "TFUEL absorption rate is computed via the SUPPLY-DELTA method, NOT by sampling on-chain burn logs. Method: read total TFUEL circulating supply from the Theta Explorer API at two timepoints (~24h apart), compute supply growth (delta), derive raw absorption = (fixed daily block issuance of 1,238,400 TFUEL) − (supply growth). Smoothing is two-stage: (1) per-day raw values are smoothed with a 3-DAY CENTERED rolling average (smoothed[N] = average of raw[N-1], raw[N], raw[N+1]) to cancel paired errors caused by snapshot timing drift; the first and last day of the series fall back to a 2-day trailing/leading average since they have no neighbour to centre on; known-artifact days are excluded from their neighbours' windows. (2) The headline figure is then a 7-DAY TRAILING average over the smoothed daily values, with any remaining artifact days (smoothed value still negative) excluded. DO NOT describe absorption as 'sum of burned tokens divided by minted tokens' or 'reading TFUEL burned from on-chain logs' — both are wrong methodology. For full details see thetasimplified.com/methodology.",
    source: "thetasimplified.com/methodology and src/lib/tfuel-economics.ts",
  },

  // ── Common confusions to flag ──
  thetaVsTfuel: {
    value:
      "THETA = governance + staking, hard-capped, never minted. TFUEL = utility + gas + rewards, inflationary by issuance and deflationary by burn. These are TWO SEPARATE tokens with completely different supply behaviour. Do not conflate them.",
    source: "Protocol design",
  },
} as const satisfies Record<string, ThetaFact>;

/**
 * Render the fact card as a plain-text block suitable for inserting
 * into a system prompt. Formatted so the model can scan it and
 * quote values exactly without paraphrasing.
 */
export function formatFactsForPrompt(): string {
  const lines: string[] = [
    "VERIFIED THETA NETWORK FACTS — these are protocol constants, never invent or paraphrase numbers:",
    "",
    `- Block time: ${THETA_FACTS.blockTime.value}`,
    `- TFUEL block reward: ${THETA_FACTS.tfuelBlockReward.value}`,
    `- Daily TFUEL issuance: ${THETA_FACTS.dailyTfuelIssuance.value}`,
    `- TFUEL burn mechanism: ${THETA_FACTS.burnMechanism.value}`,
    `- THETA total supply: ${THETA_FACTS.thetaTotalSupply.value}`,
    `- THETA role: ${THETA_FACTS.thetaRole.value}`,
    `- TFUEL initial supply: ${THETA_FACTS.tfuelInitialSupply.value}`,
    `- TFUEL role: ${THETA_FACTS.tfuelRole.value}`,
    `- Validator architecture: ${THETA_FACTS.validatorSlots.value}`,
    `- Node stake requirements: ${THETA_FACTS.nodeStakeRequirements.value}`,
    `- Edge Node hardware: ${THETA_FACTS.edgeNodeHardware.value}`,
    `- EdgeCloud pricing: ${THETA_FACTS.edgeCloudPricing.value}`,
    `- Main Chain Activity Index formula: ${THETA_FACTS.mainChainIndexFormula.value}`,
    `- Metachain Utilization Index formula: ${THETA_FACTS.metachainIndexFormula.value}`,
    `- Absorption rate methodology: ${THETA_FACTS.absorptionMethod.value}`,
    "",
    `IMPORTANT: ${THETA_FACTS.thetaVsTfuel.value}`,
  ];
  return lines.join("\n");
}
