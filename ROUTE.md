# The Ghibli Line — route plan

A single railway that never ends. It runs through every Studio Ghibli feature,
one region at a time, and when it reaches the last it returns to the first.

You can ride it from a window seat, sit on the roof, or step off at any stop and
walk. Nothing is a model or a photograph — every region is a set of numbers fed
to the same machine, which is the only reason a world this size fits in a
browser tab.

**On the films themselves:** these are the *places*, not the characters. Figures
in each region are original silhouettes. The tribute is to the landscapes.

## Built

| # | Region | Film | Year | State |
|---|---|---|---|---|
| 1 | **The Sea Railway** — flooded plain, the bathhouse, the torii | Spirited Away | 2001 | ✅ live |

## The line, in order of the ride

Ordered so the land flows — sea into farmland into forest into mountain into
sky and back to the sea — rather than by release date.

| # | Region | Film | Year | The shape of it |
|---|---|---|---|---|
| 1 | The Sea Railway | Spirited Away | 2001 | flooded plain, mirror water, the bathhouse burning across it |
| 2 | The Drowned Road | Ponyo | 2008 | a coast road under the tide, a small boat, waves with something living in them |
| 3 | The Marsh House | When Marnie Was There | 2014 | tidal inlet, reeds, a western house across the water at dusk |
| 4 | Poppy Hill | From Up on Poppy Hill | 2011 | harbour town on a slope, signal flags, ships below |
| 5 | Koriko | Kiki's Delivery Service | 1989 | red roofs stacked to a clock tower, the sea beyond the wall |
| 6 | The Hidden Cove | Porco Rosso | 1992 | limestone cliffs, an Adriatic inlet, a seaplane on the water |
| 7 | Ocean Waves | Ocean Waves | 1993 | a small seaside station, summer haze, a bicycle |
| 8 | The Bus Stop | My Neighbour Totoro | 1988 | rice paddies at night, rain, one lamp, an enormous camphor tree |
| 9 | The Hillside | Grave of the Fireflies | 1988 | a pond at dark, fireflies over the water — quiet, and left quiet |
| 10 | Safflower Fields | Only Yesterday | 1991 | terraced farmland, red safflower at first light |
| 11 | Tama Hills | Pom Poko | 1994 | old woodland running into a cut earth construction site |
| 12 | The Rotary | Whisper of the Heart | 1995 | a suburb on a hill, the antique shop, the overlook at dawn |
| 13 | The Cat Bureau | The Cat Returns | 2002 | a plaza built to a tenth scale, crossroads, tiny lit windows |
| 14 | The Garden | Arrietty | 2010 | the world from four inches up — leaves like sails, dew, a watering can |
| 15 | The Bamboo Grove | The Tale of the Princess Kaguya | 2013 | pale bamboo, ink-wash palette, moonlight, almost no colour |
| 16 | The Cedar Forest | Princess Mononoke | 1997 | mist, a river over stones, trees older than the language |
| 17 | Iron Town | Princess Mononoke | 1997 | palisade and furnace smoke on a lake, torchlight, a scar in the hill |
| 18 | The Meadow | Howl's Moving Castle | 2004 | alpine flowers to the horizon, a lake, something walking on the skyline |
| 19 | Market Chipping | Howl's Moving Castle | 2004 | a European hill town, a hat shop, cobbles |
| 20 | Hort Town | Tales from Earthsea | 2006 | a dusty walled port, a tower on a far island |
| 21 | The Crooked House | Earwig and the Witch | 2020 | rain on an English lane, one lit doorway |
| 22 | The Valley of the Wind | Nausicaä | 1984 | windmills, ochre plain, a forest edge lit from inside by spores |
| 23 | Slag Ravine | Castle in the Sky | 1986 | a mining town in a gorge, a rail viaduct, coal light |
| 24 | Laputa | Castle in the Sky | 1986 | the floating island, the great tree, storm light beneath |
| 25 | The Meadow of 1920 | The Wind Rises | 2013 | long grass, a glider, summer, a girl with an easel |
| 26 | The Tower | The Boy and the Heron | 2023 | the tower in the wood, and the grey sea on the other side |
| 27 | The Sketch | My Neighbors the Yamadas | 1999 | white paper, a few lines, colour only where it matters |

Twenty-four films, twenty-seven stops — Mononoke, Howl's and Laputa each earn
two, because each has two landscapes that are nothing like each other.

## How a region is built

Each region is one file exporting a description, not bespoke code:

```
{ id, film, year, title,
  length,                  // metres of track
  palette,                 // the four sky keys + fog + exposure
  terrain(x, z) -> height, // the ground
  water: { level, colour } | null,
  scatter: [ grass, trees, flowers, rocks ],  // shared generators, tuned
  build(ctx) -> Group      // the two or three things only this region has
}
```

Regions are built when the train comes within range and disposed when it leaves,
so the cost is always three regions, never twenty-seven.

## Phases

1. ✅ **Ride the train.** Window seat, roof, step off. Cloud shadows. Continuous line.
2. **The region system.** Route, streaming, palette cross-fade at the borders.
3. **Regions 8, 22, 18** — the bus stop, the valley of the wind, the meadow.
4. **Regions 5, 24, 16** — Koriko, Laputa, the cedar forest.
5. **Stops.** Stations, stepping off, a whistle that brings the train back.
6. **The rest**, and the loop back to the beginning.
