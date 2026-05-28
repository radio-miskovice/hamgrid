# hamgrid

TypeScript utilities for Amateur Radio WWLOC (Maidenhead) conversions and geodesic calculations.

## Features

- Convert WWLOC (2 to 10 characters) to center coordinates (latitude, longitude)
- Convert coordinates to WWLOC at selectable precision
- Compute great-circle distance between two points
- Compute initial azimuth bearing from one point to another
- Demo program for quick verification from CLI

## Requirements

- Node.js 18+
- npm

## Install

```bash
npm install
```

## Build

```bash
npm run build
```

## Run Demo

```bash
npm run demo
```

The demo source is in src/demo.ts and prints source grid center plus distance and bearing to configured target locators.

## API

Main package exports are re-exported from src/index.ts.

### `wwlocToCoordinates(locator)`

Converts a WWLOC locator to the center of its grid cell.

- Input: locator string with even length from 2 to 10
- Output: `{ latitude: number, longitude: number }`
- Convention: east and north are positive, west and south are negative

Example:

```ts
import { wwlocToCoordinates } from "./dist";

const p = wwlocToCoordinates("JO70FC");
console.log(p.latitude, p.longitude);
```

### `coordinatesToWwloc(latitude, longitude, precision = 10)`

Converts coordinates to WWLOC.

- `precision`: accepts any number
- Fractional part is truncated
- Odd values are promoted to the next even value
- Final precision is clamped to even range `4..10`
- Returns uppercase locator

```ts
import { coordinatesToWwloc } from "./dist";

const loc = coordinatesToWwloc(50.104167, 14.458333, 5.7); // normalized to precision 6
console.log(loc);
```

### `distanceKmBetweenCoordinates(a, b)`

Great-circle distance in kilometers using the Haversine formula.

```ts
import { distanceKmBetweenCoordinates } from "./dist";

const d = distanceKmBetweenCoordinates(
  { latitude: 50.1, longitude: 14.4 },
  { latitude: 49.9, longitude: 14.7 }
);
console.log(d);
```

### `distanceKmBetweenWwloc(first, second)`

Great-circle distance in kilometers between two WWLOC locators.

```ts
import { distanceKmBetweenWwloc } from "./dist";

console.log(distanceKmBetweenWwloc("JO70FC", "JN79IX"));
```

### `bearingDegreesBetweenCoordinates(from, to)`

Initial azimuth bearing in degrees from 0 (inclusive) to 360 (exclusive).

```ts
import { bearingDegreesBetweenCoordinates } from "./dist";

const b = bearingDegreesBetweenCoordinates(
  { latitude: 50.1, longitude: 14.4 },
  { latitude: 49.9, longitude: 14.7 }
);
console.log(b);
```

### `bearingDegreesBetweenWwloc(first, second)`

Initial azimuth bearing in degrees between two WWLOC locators.

```ts
import { bearingDegreesBetweenWwloc } from "./dist";

console.log(bearingDegreesBetweenWwloc("JO70FC", "JN79IX"));
```

## Notes

- Distance is computed on a spherical Earth model.
- Current Earth radius constant in code is 6371.29 km.
- Input validation enforces locator format by pair position:
  - Pair 1: letters A-R
  - Pair 2: digits 0-9
  - Pair 3: letters A-X
  - Pair 4: digits 0-9
  - Pair 5: letters A-X

## Scripts

- `npm run build`: compile TypeScript to dist
- `npm run start`: run compiled demo
- `npm run demo`: build then run demo
- `npm test`: currently same as demo

## License

ISC
