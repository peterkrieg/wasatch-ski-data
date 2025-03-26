import { test, expect } from '@playwright/test';
import { DataPoint } from '../types';

import { dataPointTypes } from '../types';
import rawDataPoints from '../dataPoints.json' assert { type: 'json' };
import { getCalTopoImageName } from '../utils';

const dataPoints = rawDataPoints as DataPoint[];

// login with caltopo is done via google
if (!process.env.CALTOPO_GOOGLE_EMAIL || !process.env.CALTOPO_GOOGLE_PASSWORD) {
  throw new Error(
    'must define CALTOPO_GOOGLE_EMAIL and CALTOPO_GOOGLE_PASSWORD environment variables'
  );
}

console.log(process.env.CALTOPO_GOOGLE_EMAIL);
console.log(process.env.CALTOPO_GOOGLE_PASSWORD);

test('get data', async ({ page }) => {
  // Your existing test logic
  await page.goto('https://caltopo.com/map.html');
  // dismiss cookie banner
  await page.getByRole('button', { name: 'Accept Use' }).click();

  // login
  await page.getByText('Log In').click();
  await page.getByText('Continue with Google').click();

  await page
    .getByRole('textbox', { name: 'Email or phone' })
    .fill(process.env.CALTOPO_GOOGLE_EMAIL || '');

  await page.getByRole('button', { name: 'Next' }).click();

  await page
    .getByRole('textbox', { name: 'Enter your password' })
    .fill(process.env.CALTOPO_GOOGLE_PASSWORD || '');

  await page.getByRole('button', { name: 'Next' }).click();

  //__________________________________________________________
  // 2FA is too hard to automate, so here I need to authenticate into caltopo
  //__________________________________________________________

  await page.pause();

  const AddButton = await page
    .locator('.sidebarSection')
    .getByText('Add', { exact: true });

  //__________________________________________________________
  // create folders where data will go
  //__________________________________________________________
  for (const dataType of dataPointTypes) {
    await AddButton.click();
    await page.getByText('Folder').click();
    await page.locator('input[name="label"]').fill(dataType);

    await page.getByRole('button', { name: 'Save' }).click();
  }

  // iterate through data points and create all the markers!
  for (const dataPoint of dataPoints) {
    let calTopoDescription = dataPoint.description ?? '';

    if (calTopoDescription && dataPoint.moreInfoLink) {
      calTopoDescription += '\n\n';
    }

    if (dataPoint.moreInfoLink) {
      calTopoDescription += `${dataPoint.moreInfoLink}`;
    }

    const { latitude, longitude } = dataPoint.gpsCoordinates;

    await AddButton.click();
    await page.getByText('Marker', { exact: true }).click();
    await page.locator('input[name="label"]').fill(dataPoint.name);
    await page.locator('textarea').fill(calTopoDescription);
    await page
      .locator('input[name="coordinates"]')
      .fill([latitude, longitude].join(','));

    await page
      .locator('form select')
      .first()
      .selectOption(dataPoint.dataPointType);

    // this is just to open the style modal.. really tough to select in DOM
    await page
      .locator('form')
      .filter({ hasText: 'LabelCommentsCoordinates X' })
      .getByRole('img')
      .click();

    const imageName = getCalTopoImageName(dataPoint.dataPointType);

    // for trailheads and other data point types, we just select the point
    // for others, we select a specific type of icon.  caltopo makes the selection a bit difficult
    if (
      dataPoint.dataPointType === 'trailhead' ||
      dataPoint.dataPointType === 'other'
    ) {
      await page.locator('img').first().click();
    } else {
      await page
        .locator('.yui-panel-container')
        .getByRole('img', { name: imageName })
        .click();
    }

    await page.getByRole('button', { name: 'OK' }).click();
  }
});
