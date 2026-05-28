export interface Coordinates {
    latitude: number;
    longitude: number;
}

const EARTH_RADIUS_KM = 6371.29;
const LETTERS_18 = "ABCDEFGHIJKLMNOPQR";
const LETTERS_24 = "ABCDEFGHIJKLMNOPQRSTUVWX";
const PAIR_STEPS = [
    { lon: 20, lat: 10, type: "letters18" },
    { lon: 2, lat: 1, type: "digits" },
    { lon: 1 / 12, lat: 1 / 24, type: "letters24" },
    { lon: 1 / 120, lat: 1 / 240, type: "digits" },
    { lon: 1 / 2880, lat: 1 / 5760, type: "letters24" }
] as const;

function getPairStep(pairIndex: number): (typeof PAIR_STEPS)[number] {
    const step = PAIR_STEPS[pairIndex];
    if (!step) {
        throw new Error(`Unsupported pair index ${pairIndex}.`);
    }
    return step;
}

function getPairChars(locator: string, pairIndex: number): { lonChar: string; latChar: string } {
    const lonChar = locator.charAt(pairIndex * 2);
    const latChar = locator.charAt(pairIndex * 2 + 1);

    if (!lonChar || !latChar) {
        throw new Error(`Invalid locator pair at index ${pairIndex}.`);
    }

    return { lonChar, latChar };
}

function assertValidLocator(locator: string): string {
    const normalized = locator.trim().toUpperCase();

    if (!normalized) {
        throw new Error("Locator must not be empty.");
    }

    if (normalized.length % 2 !== 0 || normalized.length < 2 || normalized.length > 10) {
        throw new Error("Locator length must be an even number between 2 and 10.");
    }

    const pairCount = normalized.length / 2;

    for (let pairIndex = 0; pairIndex < pairCount; pairIndex += 1) {
        const { lonChar, latChar } = getPairChars(normalized, pairIndex);
        const stepInfo = getPairStep(pairIndex);

        if (stepInfo.type === "digits") {
            if (!/[0-9]/.test(lonChar) || !/[0-9]/.test(latChar)) {
                throw new Error(`Invalid locator pair at positions ${pairIndex * 2 + 1}-${pairIndex * 2 + 2}: expected digits.`);
            }
            continue;
        }

        const allowed = stepInfo.type === "letters18" ? LETTERS_18 : LETTERS_24;
        if (!allowed.includes(lonChar) || !allowed.includes(latChar)) {
            throw new Error(
                `Invalid locator pair at positions ${pairIndex * 2 + 1}-${pairIndex * 2 + 2}: expected letters ${allowed[0]}-${allowed[allowed.length - 1]}.`
            );
        }
    }

    return normalized;
}

function normalizeLongitude(longitude: number): number {
    let lon = longitude;
    while (lon < -180) lon += 360;
    while (lon >= 180) lon -= 360;
    return lon;
}

function clampLatitude(latitude: number): number {
    const epsilon = 1e-12;
    if (latitude >= 90) return 90 - epsilon;
    if (latitude < -90) return -90;
    return latitude;
}

function toRadians(degrees: number): number {
    return (degrees * Math.PI) / 180;
}

function toDegrees(radians: number): number {
    return (radians * 180) / Math.PI;
}

/**
 * Converts a WWLOC (Maidenhead) locator to the center coordinates of its grid cell.
 *
 * @param locator WWLOC locator with even length from 2 to 10 characters.
 * @returns Latitude and longitude of the locator cell center in decimal degrees.
 */
export function wwlocToCoordinates(locator: string): Coordinates {
    const normalized = assertValidLocator(locator);
    const pairCount = normalized.length / 2;

    let lon = -180;
    let lat = -90;
    let lonStep = 20;
    let latStep = 10;

    for (let pairIndex = 0; pairIndex < pairCount; pairIndex += 1) {
        const { lonChar, latChar } = getPairChars(normalized, pairIndex);
        const stepInfo = getPairStep(pairIndex);

        lonStep = stepInfo.lon;
        latStep = stepInfo.lat;

        if (stepInfo.type === "digits") {
            lon += Number(lonChar) * lonStep;
            lat += Number(latChar) * latStep;
        } else {
            const alphabet = stepInfo.type === "letters18" ? LETTERS_18 : LETTERS_24;
            lon += alphabet.indexOf(lonChar) * lonStep;
            lat += alphabet.indexOf(latChar) * latStep;
        }
    }

    return {
        longitude: lon + lonStep / 2,
        latitude: lat + latStep / 2
    };
}

/**
 * Converts geographic coordinates to a WWLOC (Maidenhead) locator.
 *
 * @param latitude Latitude in decimal degrees (north positive, south negative).
 * @param longitude Longitude in decimal degrees (east positive, west negative).
 * @param precision Locator length (even number from 2 to 10, default 6).
 * @returns WWLOC locator in uppercase.
 */
export function coordinatesToWwloc(latitude: number, longitude: number, precision: 6 | 8 | 10 | 2 | 4 = 6): string {
    if (precision % 2 !== 0 || precision < 2 || precision > 10) {
        throw new Error("Precision must be an even number between 2 and 10.");
    }

    let lat = clampLatitude(latitude);
    let lon = normalizeLongitude(longitude);

    let lonOffset = lon + 180;
    let latOffset = lat + 90;
    const pairCount = precision / 2;
    let result = "";

    for (let pairIndex = 0; pairIndex < pairCount; pairIndex += 1) {
        const stepInfo = getPairStep(pairIndex);

        const lonValue = Math.floor(lonOffset / stepInfo.lon);
        const latValue = Math.floor(latOffset / stepInfo.lat);

        if (stepInfo.type === "digits") {
            result += String(lonValue);
            result += String(latValue);
        } else {
            const alphabet = stepInfo.type === "letters18" ? LETTERS_18 : LETTERS_24;
            result += alphabet[lonValue];
            result += alphabet[latValue];
        }

        lonOffset -= lonValue * stepInfo.lon;
        latOffset -= latValue * stepInfo.lat;
    }

    return result;
}

/**
 * Computes great-circle distance between two coordinates using the Haversine formula.
 *
 * @param a First point as latitude/longitude in decimal degrees.
 * @param b Second point as latitude/longitude in decimal degrees.
 * @returns Surface distance in kilometers.
 */
export function distanceKmBetweenCoordinates(a: Coordinates, b: Coordinates): number {
    const lat1 = toRadians(a.latitude);
    const lat2 = toRadians(b.latitude);
    const dLat = lat2 - lat1;
    const dLon = toRadians(b.longitude - a.longitude);

    const sinHalfLat = Math.sin(dLat / 2);
    const sinHalfLon = Math.sin(dLon / 2);
    const hav = sinHalfLat * sinHalfLat + Math.cos(lat1) * Math.cos(lat2) * sinHalfLon * sinHalfLon;
    const centralAngle = 2 * Math.atan2(Math.sqrt(hav), Math.sqrt(1 - hav));

    return EARTH_RADIUS_KM * centralAngle;
}

/**
 * Computes great-circle distance between two WWLOC locators.
 *
 * @param first First WWLOC locator.
 * @param second Second WWLOC locator.
 * @returns Surface distance in kilometers.
 */
export function distanceKmBetweenWwloc(first: string, second: string): number {
    const a = wwlocToCoordinates(first);
    const b = wwlocToCoordinates(second);
    return distanceKmBetweenCoordinates(a, b);
}

/**
 * Computes the initial great-circle bearing from one coordinate to another.
 *
 * @param from Start point as latitude/longitude in decimal degrees.
 * @param to Destination point as latitude/longitude in decimal degrees.
 * @returns Initial azimuth in degrees in range 0 to less than 360.
 */
export function bearingDegreesBetweenCoordinates(from: Coordinates, to: Coordinates): number {
    const lat1 = toRadians(from.latitude);
    const lat2 = toRadians(to.latitude);
    const dLon = toRadians(to.longitude - from.longitude);

    const y = Math.sin(dLon) * Math.cos(lat2);
    const x = Math.cos(lat1) * Math.sin(lat2) - Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLon);
    const initialBearing = toDegrees(Math.atan2(y, x));

    return (initialBearing + 360) % 360;
}

/**
 * Computes the initial great-circle bearing from one WWLOC locator to another.
 *
 * @param first Start WWLOC locator.
 * @param second Destination WWLOC locator.
 * @returns Initial azimuth in degrees in range 0 to less than 360.
 */
export function bearingDegreesBetweenWwloc(first: string, second: string): number {
    const from = wwlocToCoordinates(first);
    const to = wwlocToCoordinates(second);
    return bearingDegreesBetweenCoordinates(from, to);
}

/**
 * Calculates QSO points as 1 plus truncated distance in kilometers.
 *
 * @param source Source WWLOC locator.
 * @param target Target WWLOC locator.
 * @returns QSO points according to 1 + trunc(distanceKm).
 */
export function qsoPoints(source: string, target: string): number {
    return (1 + Math.trunc(distanceKmBetweenWwloc(source, target)));
}