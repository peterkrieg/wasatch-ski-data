import { test, expect } from '@playwright/test';
import { DataPoint, DataPointType, dataPointTypes } from '../types';

import * as fs from 'fs';

test('get data', async ({ page }) => {
  await page.goto('https://wbskiing.com/desktop.php');

  // wait for runs to be loaded
  await expect(page.getByText('Loading...')).not.toBeVisible();

  const dataPoints: DataPoint[] = await page.evaluate(() => {
    const dataPoints = (window as any).viewer.entities._entities._array.map(
      (entity) => {
        const gpsCoordinates = getCoordinatesFromEntity(entity);

        const name = entity.name;
        const rawEntityDescription = entity._description._value;
        const moreInfoLink = parseUrlFromOpenSecondWindow(rawEntityDescription);

        return {
          name,
          description: extractDescription(rawEntityDescription),
          moreInfoLink,
          gpsCoordinates,
          dataPointType: getDataPointType(entity._billboard._image._value),
        };
      }
    );

    return dataPoints;

    // used to get gps coordinates from cesium entity
    function getCoordinatesFromEntity(entity: any) {
      const Cesium = (window as any).Cesium;

      // Get the Cartesian3 position at the current time
      const cartesian = entity.position.getValue(Cesium.JulianDate.now());

      if (cartesian) {
        // Convert Cartesian3 to Cartographic (radians)
        const cartographic = Cesium.Cartographic.fromCartesian(cartesian);

        // Convert radians to degrees for latitude and longitude
        const longitude = Cesium.Math.toDegrees(cartographic.longitude);
        const latitude = Cesium.Math.toDegrees(cartographic.latitude);
        const height = cartographic.height; // Height in meters above the ellipsoid

        // Create a plain object with GPS coordinates
        const gpsCoordinates = {
          latitude: latitude,
          longitude: longitude,
        };

        // Optionally, convert to JSON
        const jsonString = JSON.stringify(gpsCoordinates, null, 2);
        console.log(jsonString);

        return gpsCoordinates;
      } else {
        console.log('Position is not available for this entity.');
        return null;
      }
    }

    // parses more info link from a raw onclick string that looks like
    // "onclick=openSecondWindow('https://www.google.com')"
    function parseUrlFromOpenSecondWindow(domFunction: string): string | null {
      // Regular expression to match the URL within openSecondWindow()
      const urlPattern = /openSecondWindow\(['"](https?:\/\/[^'"]+)['"]\)/;

      // Execute the regex on the input string
      const match = domFunction.match(urlPattern);

      // If there's a match, return the captured URL (group 1), otherwise return null
      return match ? match[1] : null;
    }

    function extractDescription(inputString) {
      // Find the index of the first '<' character, which marks the start of an HTML tag
      const tagStartIndex = inputString.indexOf('<');

      // If no tag is found, return the entire string
      if (tagStartIndex === -1) {
        return inputString;
      }

      // Extract everything before the first tag and trim any trailing whitespace
      return inputString.substring(0, tagStartIndex).trim();
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
    function getDataPointType(imageUrl: string): DataPointType {
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
  });

  fs.writeFileSync('./dataPoints.json', JSON.stringify(dataPoints, null, 2));
  console.log(
    `successfully wrote ${dataPoints.length} data points to dataPoints.json`
  );

  await page.pause();
});
