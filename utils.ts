import { GpsCoordinates, DataPointType } from './types';

export function getCalTopoImageName(dataPointType: DataPointType): string {
  const mapToCalTopoImageName: Record<DataPointType, string> = {
    skiRun: 'Downhill Skiing',
    peak: 'Mountain',
    fatality: 'Danger',
    chairlift: 'Chairlift',
    lake: 'Waterfall',
    trailhead: 'Wilderness',
    other: 'Wilderness',
    drainage: 'Wilderness',
  };
  return mapToCalTopoImageName[dataPointType] ?? 'Wilderness';
}
