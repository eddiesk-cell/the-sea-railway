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
| 8 | **The Bus Stop** — rice paddies at night, hard rain, one lamp, the camphor | My Neighbour Totoro | 1988 | ✅ live |
| 15 | **The Ink Country** — karst peaks in mist, a bamboo grove, a pavilion | The Tale of the Princess Kaguya | 2013 | ✅ live |

Ride it (**R**) and the world changes around you over about three hundred
metres, with no seam anywhere: out of the sunset and into the rain, and then
out of the rain and into paper, where the colour drains from every surface, the
haze turns white instead of blue, and a vermilion seal appears in the corner.

**Getting about.** The strip along the bottom is the whole line — twenty-seven
stops, of which the filled ones are laid. **N** takes the train to the next one
and **B** to the last; clicking a lit stop goes straight there. The train runs
the line on its own if you leave it alone, and turns back to the beginning when
it reaches the end of what is built.

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
| 8 | **The Bus Stop** | My Neighbour Totoro | 1988 | rice paddies at night, rain, one lamp, an enormous camphor tree |
| 9 | The Hillside | Grave of the Fireflies | 1988 | a pond at dark, fireflies over the water — quiet, and left quiet |
| 10 | Safflower Fields | Only Yesterday | 1991 | terraced farmland, red safflower at first light |
| 11 | Tama Hills | Pom Poko | 1994 | old woodland running into a cut earth construction site |
| 12 | The Rotary | Whisper of the Heart | 1995 | a suburb on a hill, the antique shop, the overlook at dawn |
| 13 | The Cat Bureau | The Cat Returns | 2002 | a plaza built to a tenth scale, crossroads, tiny lit windows |
| 14 | The Garden | Arrietty | 2010 | the world from four inches up — leaves like sails, dew, a watering can |
| 15 | **The Ink Country** | The Tale of the Princess Kaguya | 2013 | shui-mo: paper white, black ink and water. Bamboo, and mountains that recede into nothing. One vermilion seal. The only region with no colour and no sky. |
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

## The Bus Stop

The one everybody has seen: a country road at night, hard rain, and a single
lamp with nothing else lit for a mile.

The trick it turned out to need was not rain but *ground*. Rice paddies are
flooded fields — so the water the whole world already floats on becomes the
paddies for nothing, and all that has to be built is the earth walls between
them and the raised lane running out to the stop. The rest is one lamp, a
timetable nobody reads, somebody's umbrella left leaning against the post, and
the camphor standing behind it with a straw rope round its waist.

Two things it forced, both of which every later region gets for free:

- **Weather is a region property.** Rain is six thousand strokes in a box that
  travels with the camera, and it fades in and out across the border with
  everything else. Any region can now ask to be rained on.
- **The line became a line.** Until this point the world was reachable only by
  waiting sixty seconds on a moving train, so it read as one bathhouse.

## The Ink Country

Eddie's idea, and it lands on exactly the right film — Kaguya is the one Ghibli
drew as brush and charcoal rather than paint, so an ink-wash region is not a
departure from the tribute, it *is* the tribute.

It needs almost nothing new in the world and everything new in the finish:

- **No sky.** The background is paper — a warm white with tooth and a few
  water stains. Nothing gradient, nothing lit.
- **Distance goes to white, not to haze.** Mountains stack as flat silhouettes,
  each paler than the one in front, until the furthest simply isn't there. That
  single rule is what makes a Song dynasty landscape read as depth.
- **Ink instead of shading.** The Kuwahara pass stays; the finish pass swaps
  colour grading for wet edges — ink pools where a silhouette turns away,
  bleeds along the grain of the paper, and breaks where the brush ran dry.
- **One colour in the whole region.** A vermilion seal, somewhere you have to
  look for it.
- Bamboo the world already knows how to grow — it just stops being green.

## Phases

1. ✅ **Ride the train.** Window seat, roof, step off. Cloud shadows. Continuous line.
2. ✅ **The region system.** Each region owns a stretch of line and declares its
   own air — sky keys, haze, exposure, ink. Everything cross-fades over 280
   metres at the border, so there is no seam anywhere.
3. ✅ **The Ink Country** — and it proved the point: the finish pass can be a
   different medium, not just a different palette.
4. ✅ **The Bus Stop** — and the line became navigable with it: a route map
   along the bottom, stop-to-stop travel, and a free camera no longer leashed
   to the first region. Rain is a region property now, so any later region can
   ask for weather.
5. **Regions 22, 18** — the valley of the wind, the meadow.
6. **Regions 5, 24, 16** — Koriko, Laputa, the cedar forest.
7. **Stops.** Platforms, stepping off, a whistle that brings the train back.
8. **The rest**, and the loop back to the beginning.
