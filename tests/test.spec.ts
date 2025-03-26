import { test, expect } from '@playwright/test';
import {
  parseGpsCoordinates,
  parseUrlFromOpenSecondWindow,
  getDataPointType,
} from '../utils';
import { DataPoint } from '../types';

import * as fs from 'fs';

test('get data', async ({ page }) => {
  await page.goto('https://wbskiing.com/desktop.php');

  // wait for runs to be loaded
  await expect(page.getByText('Loading...')).not.toBeVisible();

  const options = await await page.locator('#RunList option').all();

  const dataPoints: DataPoint[] = [];

  console.log(options.length);

  for (const option of options) {
    await option.click();

    // await page.waitForTimeout(200);

    const mapIframe = await page
      .locator('.cesium-infoBox-iframe')
      .contentFrame();

    // wait for this to appear before querying other things
    await mapIframe.locator('.cesium-infoBox-description').textContent();

    const name = await page.locator('.cesium-infoBox-title').textContent();

    const { rawOnClick, description, imageUrl } = await page.evaluate(() => {
      const iframeElement = document.querySelector('.cesium-infoBox-iframe');

      if (!(iframeElement instanceof HTMLIFrameElement)) {
        return {};
      }

      const iframeDocument = iframeElement.contentDocument;

      const rawOnClick = iframeDocument
        ?.querySelector('.cesium-infoBox-description a')
        ?.getAttribute('onclick');

      const description = iframeDocument?.querySelector(
        '.cesium-infoBox-description'
      )?.firstChild?.textContent;

      const imageUrl = (window as any)?.viewer?.selectedEntity?._billboard
        ?._image._value;

      return { rawOnClick, description, imageUrl };
    });

    const moreInfoLink = parseUrlFromOpenSecondWindow(rawOnClick ?? '');

    const infoCellContents = await page.locator('#infoRow').textContent();

    const gpsCoordinates = parseGpsCoordinates(infoCellContents ?? '');

    const dataPointType = getDataPointType(imageUrl ?? '');

    const dataPoint: DataPoint = {
      name: name!,
      description,
      moreInfoLink,
      gpsCoordinates: gpsCoordinates!,
      dataPointType,
    };

    dataPoints.push(dataPoint);
  }

  console.log(dataPoints);

  fs.writeFileSync('./dataPoints.json', JSON.stringify(dataPoints, null, 2));

  await page.pause();
});
