import {
  bearingDegreesBetweenWwloc,
  distanceKmBetweenWwloc,
  wwlocToCoordinates
} from "./wwloc";

const source = "JO70GD";
const targets = ["JO70FD", "JO70GC", "JO70GE", "JO70HD", "JN79IX", "KN08RD", "JO63AM", "JN39PS", "JN85WA"];

const sourceCoordinates = wwlocToCoordinates(source);
console.log(`Source ${source} center: lat=${sourceCoordinates.latitude.toFixed(6)}, lon=${sourceCoordinates.longitude.toFixed(6)}`);
console.log("-");

for (const target of targets) {
  const targetCoordinates = wwlocToCoordinates(target);
  const distanceKm = distanceKmBetweenWwloc(source, target);
  const bearingDeg = bearingDegreesBetweenWwloc(source, target);

  console.log(
    `${source} -> ${target} | distance=${distanceKm.toFixed(2)} km | bearing=${bearingDeg.toFixed(2)} deg | target center lat=${targetCoordinates.latitude.toFixed(6)}, lon=${targetCoordinates.longitude.toFixed(6)}`
  );
}
