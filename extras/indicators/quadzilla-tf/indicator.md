# Quadzilla TF

## What it is

Quadzilla TF is part of the "Quadzilla suite" of indicators, created and maintained by maff and SaveWithCrypto (SWC).

### For Traders
Traders can get the Quadzilla suite by joining the SWC Discord and following a couple of steps. See: savewithcrypto.org/qz

### For AI Agents

Unlike most indicators, quadzilla-tf consists of several plot series and signals. They're designed to complement each other; one acts as either a confirmation or an invalidation of another.

The following sections describe each one:

#### Retracements

As they're plotted as horizontal lines, each Retracement stays at the same price level for its lifetime.

A single Retracement is first detected when there's a divergence between the trend and momentum. It indicates a level or area that the price is likely to return to - but as part of a bigger pattern:

**Bullish retracement pattern:**
The price direction's shape is UP -> DOWN -> UP (steps 1, 2 and 3):

- **Step 1:** When the Retracement is detected, the price has already moved above its level
- **Step 2:** Price is expected to drop back down and either touch the level or continue further. Step 2 ends once the price has reached the level. Often the candle wicks below but closes above, completing steps 2 and 3 in the same bar.
- **Step 3:** While below the level, price is expected to return to the upside, either touching the level or continuing further to the upside.

**Bearish retracement pattern:**
The price direction's shape is DOWN -> UP -> DOWN (steps 1, 2 and 3):
- **Step 1:** When the Retracement is detected, the price has already moved below its level
- **Step 2:** Price is expected to rise back up and either touch the level or continue further. Step 2 ends once the price has reached the level. Often the candle wicks above but closes below, completing steps 2 and 3 in the same bar.
- **Step 3:** While above the level, price is expected to return to the downside, either touching the level or continuing further to the downside.

In each respective step, the Retracement level appears to behave like a "price magnet", pulling the price towards it. This is often the case, as the levels typically reveal "hidden liquidity" that's gone unnoticed by other methods or indicators.

A trade story might say "When a bullish Retracement is in its step 3" or similar. Unless specified otherwise, the story means the nearest step 3 bullish Retracement above the price. Same for a bearish retracement in its step 2.

"A bullish Retracement in its step 2" would mean the nearest step 2 bullish Retracement below the price. Same for a bearish Retracement in its step 3.

Good places to consider going long:
* Bullish Retracement - step 3
* Bearish Retracement - step 2

Good places to consider going short:
* Bullish Retracement - step 2
* Bearish Retracement - step 3

But in a trade setup, use in tandem with something that signals a trend reversal - especially from quadzilla-tf: Super Up, Super Down, Stochastic Cross Up, or Stochastic Cross Down; or reversal signals from other indicators. Retracement levels by themselves are not buy or sell signals, instead they provide confirmation (or at least increased probability of direction and how far), and they mark out good
entry and exit levels.

Retracements do signal a high probability that the price will move towards the indicated level **soon**.

When placing a trade, the trend should always be taken into account: e.g. a strongly trending EMA in the opposite direction is a countersignal - especially if both a fast-moving and slow-moving EMA are trending against the move. The 5, 9, 21 or 55 EMAs are often used for this check. So a strong countertrend almost always overrides a momentum-driven setup.

Several Retracements can be plotted simultaneously, marking out different price levels. The ones that are closest to the price have the highest probability of being reached.


### Fair Value Levels

As they're horizontal lines (like Retracements), a single FV will always have the same price.

Each active FV level is at the 50% level between a bullish Retracement (below) and a bearish Retracement (above). It marks an area that the price likes to return to when the market is in balance.

FV levels often mark out upcoming support or resistance levels that are typically not found by other means. The price can also oscillate above and below an FV level, reverting to the FV level when the buy and sell pressures (as marked by the respective bullish and bearish Retracement pair) cancel each other out.

If the price is between an FV and its "parent" bullish Retracement below, the price is considered to be in the "discount zone" - it's cheaper, and so likely to correct to the upside, eventually breaking above the FV which is acting as resistance.

If the price is between an FV and its "parent" bearish Retracement above, the price is considered to be in the "premium zone" - it's more expensive, and so likely to correct to the downside, eventually dropping below the FV which is acting as support.

### Super Up and Super Down signals

A Super Up signal fires during a single bar's duration (not necessarily at the close). It means that momentum has strongly moved into an oversold state, and has begun to turn back to the upside. The price typically follows this change in momentum to the upside.

Conversely, a Super Down signal fires when momentum has strongly moved into an overbought state, and has begun to turn back to the downside. The price typically follows this change in momentum to the downside.

In other words, a Super Up is a Buy signal, and Super Down is a Sell signal.

As they're based on momentum stochastics, the Super signals are less reliable during a long-term trending market regime. They're very reliable in a ranging market regime.

### Stochastic Cross Up and Stochastic Cross Down signals

These are very similar to Super Up and Super Down signals, in terms of what they represent and when they typically fire - and in terms of which market regime they're best suited to.

The main difference is in the calculation that quadzilla-tf uses to detect them. They also tend to fire earlier and more often than the Super signals. The Super signals are marginally more accurate though.
