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
    "",
    `IMPORTANT: ${THETA_FACTS.thetaVsTfuel.value}`,
  ];
  return lines.join("\n");
}
