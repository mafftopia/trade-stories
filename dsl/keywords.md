# Keywords and what they mean

Each keyword at the beginning of a clause represents a question to
the trader.

```
Story       What are you calling this setup?
Trading     What instrument/market and timeframe is this for?
Sources     Which indicators, chart patterns or plotted series does the setup use?

  Given     What must already be true for the trade to be considered?
            (market is in a consolidation range, in an uptrend, price is currently above the 9 EMA or VWAP, that sort of thing)
  When      What event or signal triggers entry?
  Except    What invalidates entry even if the trigger fires?
  Then      What action does the trade take?
  With      What's the position size? Fixed amount or %? Any leverage?
  SL        Where's the stop-loss?
  Until     What level (or self-contained set of levels)
            should the trade be closed at?
  Taking    How much profit to take at each level?
            (Must add up to 100% of the position)
  Unless    What condition, arising early, exits before target?

Notes:
  What context helps a reader, without being acted on?
```

If one of the keywords genuinely doesn't apply, put a meaningful catch-all such as "Any market regime" for `Given`.

If you don't yet know what detail to add, write TBD.
