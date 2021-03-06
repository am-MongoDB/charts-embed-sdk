import React, { useRef, useCallback, useState } from "react";

import PrettySlider from "./PrettySlider";
import ChartsEmbedSDK from "@mongodb-js/charts-embed-dom";
import { useEffect } from "react";

const firstOlympicsYear = 1896;
const lastOlympicsYear = 2016;
const timelineInterval = 2000; //ms

const sdk = new ChartsEmbedSDK({
  baseUrl: "https://charts.mongodb.com/charts-data-science-project-aygif", // Optional: ~REPLACE~ with the Base URL from your Embed Chart dialog
});

const columnChart = sdk.createChart({
  chartId: "ff518bbb-923c-4c2c-91f5-4a2b3137f312", // Optional: ~REPLACE~ with the Chart ID from your Embed Chart dialog
});

const geoChart = sdk.createChart({
  chartId: "b1983061-ee44-40ad-9c45-4bb1d4e74884", // Optional: ~REPLACE~ with the Chart ID from your Embed Chart dialog
});

export default function Dashboard() {
  const refColumnChart = useRef(null);
  const refGeoChart = useRef(null);
  const [year, setYear] = useState(lastOlympicsYear);
  const [playing, setPlaying] = useState(false);

  const yearRef = React.useRef(year);
  yearRef.current = year;

  const timerIdRef = React.useRef();
  const replayRef = React.useRef(false);

  const renderColumnChart = useCallback(async (ref) => {
    try {
      await columnChart.render(ref);
    } catch (e) {
      console.error(e);
    }
  }, []);

  const renderGeoChart = useCallback(async (ref) => {
    try {
      await geoChart.render(ref);
    } catch (e) {
      console.error(e);
    }
  }, []);

  const setRefColumnChart = useCallback(
    (ref) => {
      if (ref) {
        renderColumnChart(ref);
      }
      // Save a reference to the node
      refColumnChart.current = ref;
    },
    [renderColumnChart]
  );

  const setRefGeoChart = useCallback(
    (ref) => {
      if (ref) {
        renderGeoChart(ref);
      }
      // Save a reference to the node
      refGeoChart.current = ref;
    },
    [renderGeoChart]
  );

  const handleChange = (_event, newValue) => {
    setYear(newValue);
  };

  const handleChangeCommitted = (_event, newValue) => {
    setYear(newValue);
    getDataFromAllPreviousYears(newValue);
  };

  // This function is creating the filter that will be executed on the data.
  // If you wish to run this example on your data, change it to accomodate your idea or make sure you have a "Year" field in your data source
  const getDataFromAllPreviousYears = (endYear) => {
    let filter = {
      $and: [
        { Year: { $gte: firstOlympicsYear } },
        { Year: { $lte: endYear } },
      ],
    };

    return Promise.all([
      geoChart.setFilter(filter),
      columnChart.setFilter(filter),
    ]);
  };

  const play = () => {
    let currentYear = yearRef.current + 4;

    if (currentYear > lastOlympicsYear) {
      if (replayRef.current) {
        currentYear = firstOlympicsYear;
        replayRef.current = false;
      } else {
        clearInterval(timerIdRef.current);
        setPlaying(false);
        return;
      }
    }
    getDataFromAllPreviousYears(currentYear);
    setYear(currentYear);
  };

  const setTimelineInterval = () => {
    if (playing) {
      // we do this because the first play with setInterval is after the time specified
      // and the first filter should be instantaneous
      play();
      timerIdRef.current = setInterval(play, timelineInterval);
    } else {
      clearInterval(timerIdRef.current);
    }
  };

  const actionTimeline = () => {
    if (yearRef.current === lastOlympicsYear) {
      replayRef.current = true;
    }

    setPlaying(!playing);
  };

  useEffect(() => {
    setTimelineInterval();
  }, [playing]);

  const buttonClass = `action-button ${
    playing ? "pause-button" : "play-button"
  }`;

  return (
    <>
      <header className="header">
        <h1>Building timeline charts with Charts Embedding SDK (MongoDB)</h1>
        <button className={buttonClass} onClick={actionTimeline}></button>
      </header>

      <div className="actions">
        <div className="slider">
          <PrettySlider
            valueLabelDisplay="on"
            aria-label="pretto slider"
            min={firstOlympicsYear}
            max={lastOlympicsYear}
            step={4}
            onChangeCommitted={handleChangeCommitted}
            onChange={handleChange}
            value={year}
            defaultValue={lastOlympicsYear}
          />
        </div>
      </div>

      <div className="charts">
        <div id="columnChart" ref={setRefColumnChart}></div>
        <div id="geoChart" ref={setRefGeoChart}></div>
      </div>
    </>
  );
}
