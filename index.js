const https = require('https');
const simulatedDisplay = require("./simulated-display.js");
const {
  DISPLAY_COUNT: displayCount = 1,
  JITTER_MS: jitterMS = 60000,
  SYNC_SIGNAL_URL: syncSignalUrl = "",
  SYNC_SIGNAL_INTERVAL_MS: signalIntervalMS = 5000,
  podname
} = process.env;

const jitterValues = Array.from(Array(Number(displayCount)), ()=>Math.random() * Number(jitterMS));

function connectDisplays() {
  console.log(`Connecting ${displayCount} display${Number(displayCount) === 1 ? "" : "s"}${podname ? " from pod " + podname : ""} over ${jitterMS / 1000} seconds`);

  return jitterValues.map(delay=>{
    return simulatedDisplay.instantiateDisplay()
    .then(display=>{
      setTimeout(display.connect, delay);
      return display;
    });
  });
};

function checkSyncSignal() {
  console.log(`Checking sync signal from pod ${podname}`);

  return new Promise(res=>{
    https.get(syncSignalUrl, resp=>{
      console.log(`Response: ${resp.statusCode}`);
      return res(resp.statusCode === 200);
    })
    .on("error", e=>Promise.reject(e));
  });
}

process.on("error", err=>{
  console.error("Process error", e);
});

if (!syncSignalUrl || !Number(signalIntervalMS)) return connectDisplays();

const interval = setInterval(()=>{
  checkSyncSignal()
  .then(signalled=>{
    if (!signalled) return;

    clearInterval(interval);
    connectDisplays();
  })
  .catch(e=>{
    clearInterval(interval);
    console.error(e);
  });
}, Number(signalIntervalMS));
