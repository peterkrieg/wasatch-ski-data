import { GpsCoordinates, DataPointType } from './types';

// parses more info link from a raw onclick string that looks like
// "onclick=openSecondWindow('https://www.google.com')"
export function parseUrlFromOpenSecondWindow(
  domFunction: string
): string | null {
  // Regular expression to match the URL within openSecondWindow()
  const urlPattern = /openSecondWindow\(['"](https?:\/\/[^'"]+)['"]\)/;

  // Execute the regex on the input string
  const match = domFunction.match(urlPattern);

  // If there's a match, return the captured URL (group 1), otherwise return null
  return match ? match[1] : null;
}

// Function to parse GPS coordinates from a string
export function parseGpsCoordinates(input: string): GpsCoordinates | null {
  // Regular expression to match coordinates in the format (lat, lon)
  const regex = /\(([-+]?\d*\.\d+|\d+),\s*([-+]?\d*\.\d+|\d+)/;

  // Execute the regex on the input string
  const match = input.match(regex);

  if (!match) {
    return null; // Return null if no coordinates are found
  }

  // Extract latitude and longitude from the match
  const latitude = parseFloat(match[1]);
  const longitude = parseFloat(match[2]);

  // Validate that the parsed values are valid numbers
  if (isNaN(latitude) || isNaN(longitude)) {
    return null;
  }

  // Return the coordinates as an object
  return {
    latitude,
    longitude,
  };
}

// we inspect the canvas viewer to get the image url
// The current available data points are:
// const availableUrls = [
//   "/images/icons/IconSki.png",
//   "/images/icons/IconSummit.png",
//   "/images/icons/IconAlias.png",
//   "/images/icons/IconArrowSmaller.png",
//   "/images/icons/iconChairlift2.png",
//   "/images/icons/IconDrainage.png",
//   "/images/icons/IconTrailhead.png",
//   "/images/icons/IconGreenArrow.png",
//   "/images/icons/IconLake.png",
//   "/images/icons/AvalancheFatality.png"
// ]
// Which I got from pasting this code in JS console:
// window.viewer.entities._entities._array.map(e =>e._billboard._image._value).filter((str, index, arr) => arr.indexOf(str) === index)
export function getDataPointType(imageUrl: string): DataPointType {
  const mapToDataPointType: Record<string, DataPointType> = {
    '/images/icons/IconSki.png': 'skiRun',
    '/images/icons/IconSummit.png': 'peak',
    '/images/icons/IconAlias.png': 'skiRun',
    '/images/icons/IconArrowSmaller.png': 'other',
    '/images/icons/iconChairlift2.png': 'chairlift',
    '/images/icons/IconDrainage.png': 'drainage',
    '/images/icons/IconTrailhead.png': 'trailhead',
    '/images/icons/IconGreenArrow.png': 'other',
    '/images/icons/IconLake.png': 'lake',
    '/images/icons/AvalancheFatality.png': 'fatality',
  };
  return mapToDataPointType[imageUrl] ?? 'unknown';
}

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
