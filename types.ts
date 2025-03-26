export const dataPointTypes = [
  'skiRun',
  'peak',
  'fatality',
  'chairlift',
  'lake',
  'trailhead',
  'other',
  'drainage',
] as const;
export type DataPointType = (typeof dataPointTypes)[number];

// Define an interface for the GPS coordinates
export interface GpsCoordinates {
  latitude: number;
  longitude: number;
}

export interface DataPoint {
  name: string;
  description?: string | null;
  moreInfoLink?: string | null;
  gpsCoordinates: GpsCoordinates;
  dataPointType: DataPointType;
}
