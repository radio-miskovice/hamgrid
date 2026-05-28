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

## Browser Usage

This package is compiled as CommonJS for Node.js. To use it in a browser, use one of these approaches.

### Option 1: Use a bundler (recommended)

Use Vite, Webpack, Parcel, or similar tooling.

```bash
npm install hamgrid
```

```ts
import { distanceKmBetweenWwloc, bearingDegreesBetweenWwloc } from "hamgrid";

const from = "JO70FC";
const to = "JN79IX";

console.log(distanceKmBetweenWwloc(from, to));
console.log(bearingDegreesBetweenWwloc(from, to));
```

### Option 2: GitHub bundle deployment (no npm dependency)

If you prefer GitHub-hosted distribution, publish a browser bundle in your repository and load it from a
version-pinned GitHub CDN URL.

1. Build a browser ESM bundle (for example `hamgrid.browser.mjs`).
2. Commit it under a stable path such as `bundle/hamgrid.browser.mjs`.
3. Create a release tag (for example `v1.0.0`).
4. Import using jsDelivr GitHub mode pinned to that tag.

```html
<!doctype html>
<html>
  <body>
    <script type="module">
      import {
        distanceKmBetweenWwloc,
        bearingDegreesBetweenWwloc
      } from "https://cdn.jsdelivr.net/gh/jvavruska/hamgrid@v1.0.0/bundle/hamgrid.browser.mjs";

      const from = "JO70FC";
      const to = "JN79IX";

      console.log("distance km", distanceKmBetweenWwloc(from, to));
      console.log("bearing deg", bearingDegreesBetweenWwloc(from, to));
    </script>
  </body>
</html>
```

Notes:

- Always pin a tag (`@v1.0.0`), not a branch, for reproducible builds.
- Keep old bundle files available for existing versions.
- jsDelivr serves GitHub content from its edge cache and is generally suitable for static asset delivery.

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
- `npm run bundle:build`: build browser ESM bundle at `bundle/hamgrid.browser.mjs`
- `npm run bundle:deploy`: rebuild browser bundle, commit it, and push to current branch
- `npm run start`: run compiled demo
- `npm run demo`: build then run demo
- `npm test`: currently same as demo

## License

ISC
