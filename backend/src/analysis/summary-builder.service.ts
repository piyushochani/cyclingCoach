import { Injectable } from '@nestjs/common';
import type { ProcessedActivity } from './data-processor.service';

@Injectable()
export class SummaryBuilderService {
  build(processed: ProcessedActivity): string {
    const lines: string[] = [];

    lines.push(`Ride type: ${processed.sessionType}.`);
    lines.push(`Duration: ${processed.movingTimeMin.toFixed(0)} min. Distance: ${processed.distanceKm.toFixed(1)} km. Elevation gain: ${processed.elevationGain} m.`);

    lines.push(`Terrain: ${processed.terrainClass} with ${processed.climbs.count} notable climbs.`);

    lines.push(`Intensity: ${processed.intensityDescription}.`);

    if (processed.hasHrData && processed.hrZoneSeconds) {
      const total = Object.values(processed.hrZoneSeconds).reduce((a, b) => a + b, 0);
      if (total > 0) {
        const z1 = Math.round((processed.hrZoneSeconds.z1 / total) * 100);
        const z2 = Math.round((processed.hrZoneSeconds.z2 / total) * 100);
        const z3 = Math.round((processed.hrZoneSeconds.z3 / total) * 100);
        const z4 = Math.round((processed.hrZoneSeconds.z4 / total) * 100);
        const z5 = Math.round((processed.hrZoneSeconds.z5 / total) * 100);
        const z6 = Math.round((processed.hrZoneSeconds.z6 / total) * 100);
        lines.push(`Heart rate: avg ${processed.avgHeartrate} bpm, max ${processed.maxHeartrate} bpm. Time in zones: Z1 ${z1}%, Z2 ${z2}%, Z3 ${z3}%, Z4 ${z4}%, Z5 ${z5}%, Z6 ${z6}%.`);
      }
    } else {
      lines.push(`Heart rate: avg ${processed.avgHeartrate ?? 'N/A'} bpm, max ${processed.maxHeartrate ?? 'N/A'} bpm.`);
    }

    if (processed.hasPowerData) {
      lines.push(`Power: avg ${processed.avgWatts} W, weighted ${processed.normalizedPower ?? processed.avgWatts} W, max ${processed.maxWatts} W. Pacing: ${processed.pacingDescription}.`);
    } else {
      lines.push(`Power: not available.`);
    }

    lines.push(`Cadence: avg ${processed.avgCadence ?? 'N/A'} rpm. Cadence pattern: ${processed.cadenceDescription}.`);

    lines.push(`Ride outcome: ${processed.rideOutcomeDescription}.`);
    lines.push(`Interpretation: ${processed.coachingSummary}.`);

    return lines.join('\n');
  }
}
