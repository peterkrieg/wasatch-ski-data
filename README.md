# Wasatch Backcountry Skiing Map Data Scrape

The purpose of this repo is to:

1.  Scrape all the data (mostly ski runs) from the [Wasatch Backcountry Skiing Map](https://wbskiing.com/desktop.php)
2.  Upload the data to [CalTopo](https://caltopo.com/map.html). I much prefer the map interface of CalTopo.

This is done via playwright.

### Data Collection

To scrape the data, run the following command:

```bash
npx playwright test tests/wasatch-ski-map-scrape.spec.ts --headed
```

This will open up the map in a browser, and run `page.evaluate()` to extract all the info from the page. Wasatach backcountry ski map uses Cesium as the map viewer, and we can extract all the data just from the javascript console. It exports all the data (currently 1,294 data points) to a json file (`dataPoints.json`).

A Data point is either a ski run, a peak, a trailhead, lake, etc. The data point currently has the following shape:

```ts
export interface DataPoint {
  name: string;
  description?: string | null;
  moreInfoLink?: string | null;
  gpsCoordinates: {
    latitude: number;
    longitude: number;
  };
  dataPointType:
    | 'skiRun'
    | 'peak'
    | 'fatality'
    | 'chairlift'
    | 'lake'
    | 'trailhead'
    | 'other'
    | 'drainage';
}
```


### Data Upload

To upload the data to CalTopo, run the following command:

```bash
node --env-file=.env ./node_modules/.bin/playwright test tests/caltopo-upload-data.spec.ts --headed
```

Note the `.env` file being passed in.  It will require environent variables of `CALTOPO_GOOGLE_EMAIL` and `CALTOPO_GOOGLE_PASSWORD` to be set.

Caltopo doesn't support native login, but 3rd party via google.  This authentication would be too difficult to automate, so there are a few manual steps to do once playwright pauses on this file:

1.  Verify 2FA on my phone in gmail app
2.  Create a new caltopo map or navigate to an existing one that is clean slate and has nothing in it. 
3.  Click resume in playwright to continue.

Once playwright continues, it will make folders for each data point type, and then upload the data points to the map.  I discovered caltopo web interface has some serious memory leaks from repeated creation of markers, so this script slows down a ton after a 100-200 data points created.  The DOM nodes and event listeners grows unbounded.  What I did to get past this was exit the script once it slowed down, and delete the entries in `dataPoints.json` that I already uploaded.  Some better future solutions to this could be:

1. Refresh caltopo browser page every ~50-100 data points to clear out the memory leaks?
2.  Use `caltopo_python` to upload data points via an api call and bypass the UI all together.
3.  Import GeoJSON data into caltopo.  I include `wasatach_ski_data.json` in this repo, which is a GeoJSON file of all the data points I exported from caltopo.  What I'm unsure of is how I could recreate this file given there are folder IDs and such.




