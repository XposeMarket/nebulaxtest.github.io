# 🌌 NEBULAX — CURRENT SPECIFICATIONS (UPDATED)

**Date:** November 30, 2025  
**Status:** Latest consolidated specifications from FULL whitepapers

---

## ⚠️ CRITICAL UPDATES & NOTES

### 1. **Platform Trading Fee (UPDATED)**
**Previous:** 1.0% fixed fee per trade  
**CURRENT UPDATE:** 
> "I dont think the 1% fee will happen, I think its too much - I believe it will scare traders - Instead we will add either set trading fee (Such as some platforms do or we will add in a optional "Priority" and "Bribery" fee like Axiom and Photon exchange do, the fee engine will work off these fee's using the same % splits)"

**Implementation Plan:**
- **Option A:** Fixed small fee (like Raydium: 0.25%)
- **Option B:** Optional "Priority" tips (like Axiom/Photon)
- **Option C:** "Bribery" fees for MEV protection
- Fee split percentages remain the same regardless of which option is chosen

**Default Split (regardless of fee model):**
- 35% → Treasury
- 30% → NEBX Stakers
- 20% → Buyback → Burn
- 15% → Store/Utility Fund

---

### 2. **LP Lock Duration (UPDATED)**
**Previous:** 6–12 months mandatory lock  
**CURRENT UPDATE:**
> "Note: Possibly a lot shorter - This will scare devs, Memecoins are not meant to last that long all the time - this should maybe be changed to 3 Days to a week maybe, maybe 1-2 weeks, still planning"

**Proposed Options:**
- **Flexible tiers:** 3 days / 1 week / 2 weeks / 1 month
- **Memecoin-friendly:** Shorter locks for faster-moving projects
- **Penalty stays same:** Early unlock attempts still trigger anti-rug penalties

---

### 3. **Creator Fee Tiers (UPDATED)**

**Current Tier Structure:**

| Market Cap   | Creator | Platform | Remainder | NEBX Global | Token Pool |
|-------------|---------|----------|-----------|-------------|------------|
| **$0–50k**    | 15%     | 15%      | 70%       | 35%         | 35%        |
| **$50–200k**  | 25%     | 15%      | 60%       | 30%         | 30%        |
| **$200–400k** | 40%     | 15%      | 45%       | 22.5%       | 22.5%      |
| **$400–600k** | 55%     | 15%      | 30%       | 15%         | 15%        |
| **$600k–1M**  | 70%     | **1%**   | 29%       | 14.5%       | 14.5%      |
| **$1M–5M**    | 85%     | **1%**   | 14%       | 7%          | 7%         |
| **$5M+**      | 90%     | **1%**   | 9%        | 4.5%        | 4.5%       |

**IMPORTANT UPDATE:**
> "Possibly changed later onto give creators more incentives to launch - May change to:
> 200k-400k -> 40%
> 400k-600k -> 55%
> 600k-1M -> 70%
> 1M-5m -> 85%
> 5m+ -> 90%"

> "For Devs, The % split should only change from the platform as the Dev % gets bigger."

**Key Principle:** As creator percentage increases, platform fee decreases (from 15% → 1%), while remainder automatically adjusts to maintain 100% total.

---

## 📊 COMPLETE TOKENOMICS BREAKDOWN

### **NEBX Core Fee Engine**
When platform fee is applied (regardless of 1% or optional priority model):

```
Total Fee (example: 1.0%) split:
├─ 35% → Treasury (growth, liquidity, marketing, ops)
├─ 30% → NEBX Stakers (rewards)
├─ 20% → Buyback → Burn (price support + scarcity)
└─ 15% → Store/Utility Fund (NFTs, perks, content)
```

### **Launchpad One-Time Fee**
Minimum: $5 USD equivalent in SOL

```
Launch Fee Split:
├─ 30% → Buyback → Burn NEBX
├─ 30% → Buyback → NEBX Stakers
├─ 20% → New Token's Staking Pool (bootstrap day-1 rewards)
└─ 20% → Treasury
```

### **Per-Token Trading Fees**
Each launched token has its own per-trade fee that routes based on MC tier:

```
1.0% per trade on launched token:
├─ Creator Share (15%–90% by tier)
├─ Platform Share (15% or 1% by tier)
└─ Remainder Split:
    ├─ 50% → NEBX Global Pool (auto-converted)
    └─ 50% → That Token's Staking Pool
```

### **Arcade Revenue Flow**
```
100% of arcade earnings (SOL/USDC) → Market-buy NEBX
├─ 70% → NEBX Stakers (paid in NEBX)
└─ 30% → Treasury Reserve (future perks, events)

❌ NO BURN (preserves utility supply)
```

### **Store Purchases (paid in NEBX)**
```
User spends NEBX:
├─ 50% → Burn (scarcity signal)
├─ 30% → NEBX Stakers (rewards)
└─ 20% → Treasury (sustain content)
```

### **Anti-Rug Penalty Distribution**
```
When dev rug attempt is blocked:
├─ 70% → Burn (price support)
└─ 30% → NEBX Stakers (reward loyal holders)

Result: "Rugs become pumps"
```

---

## 🛡️ ANTI-RUG SYSTEM

### **What Gets Monitored:**
- ✅ LP withdrawal attempts
- ✅ Vesting contract bypass attempts
- ✅ Abnormal dev wallet selling
- ✅ Unauthorized parameter changes
- ✅ Fee increases beyond caps
- ✅ Freeze authority misuse
- ✅ Mint authority calls (should be renounced)

### **Penalty Execution:**
1. Transaction **HALTED** immediately
2. Penalty triggered: 70% burn / 30% to NEBX stakers
3. Event emitted to chain
4. Token flagged/delisted on UI
5. Community notified

### **Result:**
> "On NebulaX, rugs don't exist — rugs = pumps."

---

## 🎮 STAKING MECHANICS

### **NEBX Global Pool (Main Staker Vault)**
- **Epochs:** Weekly snapshots
- **Reward Calculation:** `R = epoch_rewards × (user_stake / total_stake)`
- **Inflows (auto-converted to NEBX/SOL):**
  - 30% of launch fees
  - Per-trade MC-tier remainder share
  - Store NEBX buybacks (30%)
  - Arcade NEBX buybacks (70%)
  - Anti-rug penalties (30%)
- **APY:** Dynamic, grows with platform usage
- **Unstaking:** Anytime (or optional cooldown for boosts)

### **Token-Specific Pools (Per Launched Coin)**
- **Epochs:** Short cycles (3–7 days)
- **Deposit Windows:** Fixed windows at cycle start
- **Rewards:** Paid in native token
- **Default Split:** 80% to stakers / 20% to NEBX buyback
- **Boosts:** Optional if user also stakes NEBX
- **Convert-on-claim:** Optional feature to auto-swap to NEBX

---

## 🚀 LAUNCHPAD SAFETY TEMPLATE

### **Launch Checklist (Enforced by Smart Contract):**
1. ✅ **Safe Token Template:** SPL Token-2022 with extensions
2. ✅ **LP Lock:** Time-locked escrow (3 days–2 weeks configurable)
3. ✅ **Vesting Enforced:** Team tokens in linear vesting contract
4. ✅ **Mint Renounced:** No infinite mint possible
5. ✅ **Anti-Bot Window:** Max wallet/tx limits on launch
6. ✅ **Auto-Staking Pool:** 20% of launch fee seeds pool
7. ✅ **MC-Tiered Fees:** Creator rewards scale with growth
8. ✅ **Anti-Rug Armed:** Monitors active from day 1
9. ✅ **Dashboard Transparency:** All data on-chain + visible

### **"Hidden Bond" Mechanic:**
- Minimum liquidity requirement = collateral
- Feels like "normal launch liquidity"
- Functions as bond if rug attempted
- Early unlock = auto-slashed + penalty

---

## 💎 HOLDER BENEFITS SUMMARY

### **If You Hold a Launched Token:**
- ✅ Backed by locked LP (no rug possible)
- ✅ Team tokens vested (no dumps)
- ✅ Access to token's staking pool
- ✅ If dev rugs → supply burns = price support
- ✅ Loyalty perks (snapshots, NFTs, presale access)

### **If You Stake the Launched Token:**
- ✅ Earn from token's auto-funded pool
- ✅ 80% of per-trade remainder share
- ✅ NEBX boosts if you dual-stake

### **If You Stake NEBX:**
- ✅ Earn from **ALL** launched tokens' fee shares
- ✅ Platform trading fees
- ✅ Launch fee buybacks (30%)
- ✅ Arcade revenue (70%)
- ✅ Store purchases (30%)
- ✅ Anti-rug penalty redistributions (30%)
- ✅ Governance voting rights
- ✅ APY boosts & loyalty perks

---

## 🏗️ SYSTEM ARCHITECTURE

### **Solana Program Stack:**

1. **FeeRouter**
   - Handles all trading fee routing
   - Enforces platform splits
   - Integrates MC-tier logic
   - Routes to buyback executor

2. **AntiRugGuard**
   - Monitors LP withdrawals
   - Detects vesting bypass
   - Tracks dev selling patterns
   - Executes 70/30 penalties

3. **BuybackExecutor**
   - TWAP-based NEBX purchases
   - Slippage protection
   - Routes to burn/stakers/treasury

4. **Oracle**
   - TWAP price feeds
   - Market cap calculation
   - Creator tier determination
   - Real-time updates to FeeRouter

5. **StakingVaultNEBX**
   - Main NEBX staking system
   - Weekly epoch snapshots
   - Auto-converted inflows
   - Pro-rata reward distribution

6. **TokenStakingVaultFactory**
   - Creates per-token pools
   - Deploys on launch
   - Manages lifecycle

7. **TokenStakingVault<TOKEN>**
   - Per-token deposits/withdrawals
   - 3–7 day epochs
   - Reward claims
   - NEBX boost integration

### **Security:**
- ✅ Multisig administration
- ✅ Timelock for all upgrades (24–48h)
- ✅ Public events for transparency
- ✅ Audited templates
- ✅ On-chain verification

---

## 📈 ECONOMIC FLYWHEEL

```
┌─────────────────────────────────────────────────────┐
│           NEBULAX VALUE CIRCULATION                 │
└─────────────────────────────────────────────────────┘

[Platform Trades] ──► Fee Split ──► Stakers + Burn + Treasury + Store
                                      │
[Launchpad Fee] ────► Buyback ─────► │
                                      │
[Arcade Revenue] ───► Buy NEBX ────► │
                                      │
[Store Purchases] ──► 50% Burn ────► │
                      30% Rewards ──► │
                                      │
[Rug Attempts] ─────► 70% Burn ────► │
                      30% Stakers ──► │
                                      │
                                      ▼
                            NEBX Price Support
                            + Staker Yield
                            + Scarcity
```

---

## 🎯 COMPETITIVE ADVANTAGES

| vs Pump.fun | vs Generic Launchpads | vs Casino Culture |
|-------------|----------------------|-------------------|
| ❌ Rugs possible | ❌ LP often unlocked | ❌ Pure speculation |
| ❌ No holder rewards | ❌ No staking pools | ❌ No long-term value |
| ❌ Dev dumps common | ❌ No anti-rug system | ❌ Trust = zero |
| **✅ NebulaX: Impossible to rug** | **✅ Auto staking on launch** | **✅ Holders always win** |
| **✅ Devs rewarded for growth** | **✅ Rug attempts = pumps** | **✅ Culture of holding** |

---

## 🗺️ ROADMAP

### **Phase 1 — Foundation** (Q1 2026)
- [ ] Deploy NEBX token (multisig + timelock)
- [ ] Core fee engine implementation
- [ ] NEBX staking vaults
- [ ] Transparency dashboard MVP
- [ ] Website + documentation

### **Phase 2 — Launchpad v1** (Q2 2026)
- [ ] Rug-proof token template
- [ ] LP lock + vesting system
- [ ] MC-tier fee routing
- [ ] Auto-staking pool creation
- [ ] Anti-rug penalty system
- [ ] Public beta launches

### **Phase 3 — Ecosystem Expansion** (Q3 2026)
- [ ] NebulaX Arcade (NEBX buyback engine)
- [ ] NebulaX Store (theme market)
- [ ] Loyalty NFTs + perks
- [ ] Holding streak rewards
- [ ] Presale access system

### **Phase 4 — Governance & Scaling** (Q4 2026)
- [ ] NEBX staker governance
- [ ] Parameter voting system
- [ ] Multi-chain exploration
- [ ] Partner integrations
- [ ] Community DAO

---

## 🔑 KEY PRINCIPLES

1. **Rugs = Impossible**
   - LP locked, vesting enforced, mint renounced
   - Attempts blocked and penalized

2. **Holders = Always Win**
   - Staking rewards from multiple sources
   - Supply burns on rug attempts
   - Loyalty perks and governance

3. **Devs = Aligned Incentives**
   - Earn more only as MC grows
   - Can't profit from rugging
   - Visibility boost at higher tiers

4. **NEBX = Ecosystem Glue**
   - Every product feeds value back
   - Buybacks, burns, staking rewards
   - Deflationary yet utility-preserving

5. **Trust = Default**
   - Full transparency on-chain
   - Real-time dashboard
   - Community-first culture

---

## 📝 IMPLEMENTATION NOTES

### **Dynamic Burn Policy:**
- **Burn Cap:** Max 40% of total NEBX supply
- **Slider:** Auto-adjusts as supply shrinks
  - Circ > 70% of genesis → normal burns (20%)
  - 70–60% → reduce burn by 25%
  - <60% → reduce burn by 50%
- **Purpose:** Protect utility supply for store/rewards

### **Wash Trading Prevention:**
- TWAP pricing (not spot)
- Minimum liquidity requirements
- Anomaly detection algorithms
- Time-weighted MC calculations

### **Governance Safety:**
- All changes via timelock (24–48h notice)
- NEBX staker voting required
- Multisig execution
- Public event emissions

---

## 🎯 SUCCESS METRICS

### **For Creators:**
- Time to launch: <5 minutes
- Fee transparency: 100% on-chain
- MC tier progression visible
- Higher earnings at scale

### **For Holders:**
- Rug rate: 0%
- Staking APY: Dynamic (platform-driven)
- Reward sources: 6+ streams
- Trust score: Maximum

### **For Platform:**
- Launch volume growth
- NEBX staking participation
- Arcade/Store engagement
- Community retention

---

## 💡 NARRATIVE & MESSAGING

**Tagline:** *"Where Rugs Become Pumps"*

**Core Message:**
> "NebulaX isn't just a launchpad — it's a trust engine. We've engineered memecoin launches where devs can't rug, holders always win, and the ecosystem grows stronger with every trade, launch, game, and purchase. NEBX ties it all together."

**Community Memes:**
- "Rug attempt? That's a burn party! 🔥"
- "Devs win when holders win"
- "HODL culture is back"
- "Every launch = new staking pool"
- "Your rug is our pump"

---

## 🚨 REMAINING DECISIONS

### **1. Platform Fee Model** (URGENT)
- [ ] Fixed small fee (0.25%)?
- [ ] Optional priority tips?
- [ ] Bribery/MEV protection fees?
- [ ] Hybrid model?

### **2. LP Lock Duration** (HIGH PRIORITY)
- [ ] 3 days minimum?
- [ ] 1 week standard?
- [ ] 2 weeks for "verified"?
- [ ] Tiered options for devs?

### **3. Creator Tier Adjustment** (MEDIUM PRIORITY)
- [ ] Keep current structure?
- [ ] Flatten lower tiers (200k–1M)?
- [ ] Add more granular tiers?

---

## 📚 REFERENCE DOCUMENTS

This specification consolidates:
- ✅ NebulaX_Hybrid_Whitepaper_FULL.txt
- ✅ NebulaX_Technical_Documentation_FULL.txt
- ✅ NEBULAX — FULL PLATFORM OVERVIEW.txt
- ✅ All "Updated" and "Note" sections

**Version:** 1.0 (Current as of Nov 30, 2025)  
**Status:** Ready for implementation planning  
**Next Step:** Finalize fee model & LP lock duration decisions

---

*"On NebulaX, trust isn't optional — it's guaranteed."* 🌌
