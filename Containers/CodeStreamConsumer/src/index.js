const express = require("express");
const formidable = require("formidable");
const fs = require("fs/promises");
const app = express();
const PORT = 3000;
const path = require("path");

const Timer = require("./Timer");
const CloneDetector = require("./CloneDetector");
const CloneStorage = require("./CloneStorage");
const FileStorage = require("./FileStorage");

let timersTotal = [];
let timersMatch = [];

function calculateStatistics(timers) {
  const totalFiles = timers.length;
  const last100Files = timers.slice(-100);
  const last1000Files = timers.slice(-1000);
  const averageTimePer100 = [];

  const averageTime = Number(timers.reduce((acc, timer) => acc + timer)) / totalFiles || 0;
  const averageTimeLast100 = Number(last100Files.reduce((acc, timer) => acc + timer)) / last100Files.length || 0;
  const averageTimeLast1000 = Number(last1000Files.reduce((acc, timer) => acc + timer)) / last1000Files.length || 0;
  for (let i = 0; i < timers.length - 99; i += 100) {
    const chunk = timers.slice(i, i + 100);
    const avg = chunk.reduce((acc, timer) => acc + timer, 0) / chunk.length;
    averageTimePer100.push(avg);
  }

  return {
    averageTime,
    averageTimePer100,
    averageTimeLast100,
    averageTimeLast1000,
    totalFiles,
  };
}

// Express and Formidable stuff to receice a file for further processing
// --------------------
const form = formidable({ multiples: false });

app.post("/", fileReceiver);
function fileReceiver(req, res, next) {
  form.parse(req, (err, fields, files) => {
    fs.readFile(files.data.filepath, { encoding: "utf8" }).then((data) => {
      return processFile(fields.name, data);
    });
  });
  return res.end("");
}

app.get("/", viewClones);

// Add /timers route to display statistics
app.get("/timers", (req, res) => {
  const statsTotal = calculateStatistics(timersTotal);
  const statsMatch = calculateStatistics(timersMatch);
  res.render("timers", { statsTotal, statsMatch });
});

// Set the view engine to EJS
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "./views"));

const server = app.listen(PORT, () => {
  console.log("Listening for files on port", PORT);
});

// Page generation for viewing current progress
// --------------------
function getStatistics() {
  let cloneStore = CloneStorage.getInstance();
  let fileStore = FileStorage.getInstance();
  let output = "Processed " + fileStore.numberOfFiles + " files containing " + cloneStore.numberOfClones + " clones.";
  return output;
}

function lastFileTimersHTML() {
  if (!lastFile) return "";
  output = "<p>Timers for last file processed:</p>\n<ul>\n";
  let timers = Timer.getTimers(lastFile);
  for (t in timers) {
    output += "<li>" + t + ": " + timers[t] / 1000n + " µs\n";
  }
  output += "</ul>\n";
  return output;
}

function listClonesHTML() {
  let cloneStore = CloneStorage.getInstance();
  let output = "";

  cloneStore.clones.forEach((clone) => {
    output += "<hr>\n";
    output += "<h2>Source File: " + clone.sourceName + "</h2>\n";
    output += "<p>Starting at line: " + clone.sourceStart + " , ending at line: " + clone.sourceEnd + "</p>\n";
    output += "<ul>";
    clone.targets.forEach((target) => {
      output += "<li>Found in " + target.name + " starting at line " + target.startLine + "\n";
    });
    output += "</ul>\n";
    output += "<h3>Contents:</h3>\n<pre><code>\n";
    output += clone.originalCode;
    output += "</code></pre>\n";
  });

  return output;
}

function listProcessedFilesHTML() {
  let fs = FileStorage.getInstance();
  let output = "<HR>\n<H2>Processed Files</H2>\n";
  output += fs.filenames.reduce((out, name) => {
    out += "<li>" + name + "\n";
    return out;
  }, "<ul>\n");
  output += "</ul>\n";
  return output;
}

function viewClones(req, res, next) {
  let page = "<HTML><HEAD><TITLE>CodeStream Clone Detector</TITLE></HEAD>\n";
  page += "<BODY><H1>CodeStream Clone Detector</H1>\n";
  page += "<P>" + getStatistics() + "</P>\n";
  page += lastFileTimersHTML() + "\n";
  page += listClonesHTML() + "\n";
  page += listProcessedFilesHTML() + "\n";
  page += "</BODY></HTML>";
  res.send(page);
}

// Some helper functions
// --------------------
// PASS is used to insert functions in a Promise stream and pass on all input parameters untouched.
PASS = (fn) => (d) => {
  try {
    fn(d);
    return d;
  } catch (e) {
    throw e;
  }
};

const STATS_FREQ = 100;
const URL = process.env.URL || "http://localhost:8080/";
var lastFile = null;

function maybePrintStatistics(file, cloneDetector, cloneStore) {
  if (0 == cloneDetector.numberOfProcessedFiles % STATS_FREQ) {
    console.log("Processed", cloneDetector.numberOfProcessedFiles, "files and found", cloneStore.numberOfClones, "clones.");
    let timers = Timer.getTimers(file);
    let str = "Timers for last file processed: ";
    for (t in timers) {
      str += t + ": " + timers[t] / 1000n + " µs ";
    }
    console.log(str);
    console.log("List of found clones available at", URL);
  }

  return file;
}

function normalizeTime(totalTime, numberOfRows) {
  if (numberOfRows === 0) {
    return 0; // Avoid division by zero
  }
  return Number(totalTime) / numberOfRows;
}

// Processing of the file
// --------------------
function processFile(filename, contents) {
  let cd = new CloneDetector();
  let cloneStore = CloneStorage.getInstance();
  let fileLines = 0;

  return (
    Promise.resolve({ name: filename, contents: contents })
      //.then( PASS( (file) => console.log('Processing file:', file.name) ))
      .then((file) => Timer.startTimer(file, "total"))
      .then((file) => cd.preprocess(file))
      .then((file) => {
        cd.transform(file);
        fileLines = file.lines.length;
        return file;
      })
      .then((file) => Timer.startTimer(file, "match"))
      .then((file) => cd.matchDetect(file))
      .then((file) => cloneStore.storeClones(file))
      .then((file) => Timer.endTimer(file, "match"))
      .then((file) => cd.storeFile(file))
      .then((file) => {
        const timer = Timer.endTimer(file, "total");
        timersTotal.push(normalizeTime(timer.timers["total"], fileLines));
        timersMatch.push(normalizeTime(timer.timers["match"], fileLines));
        return file;
      })
      .then(PASS((file) => (lastFile = file)))
      .then(PASS((file) => maybePrintStatistics(file, cd, cloneStore)))
      // TODO Store the timers from every file (or every 10th file), create a new landing page /timers
      // and display more in depth statistics there. Examples include:
      // average times per file, average times per last 100 files, last 1000 files.
      // Perhaps throw in a graph over all files.
      .catch(console.log)
  );
}

/*
1. Preprocessing: Remove uninteresting code, determine source and comparison units/granularities
2. Transformation: One or more extraction and/or transformation techniques are applied to the preprocessed code to obtain an intermediate representation of the code.
3. Match Detection: Transformed units (and/or metrics for those units) are compared to find similar source units.
4. Formatting: Locations of identified clones in the transformed units are mapped to the original code base by file location and line number.
5. Post-Processing and Filtering: Visualisation of clones and manual analysis to filter out false positives
6. Aggregation: Clone pairs are aggregated to form clone classes or families, in order to reduce the amount of data and facilitate analysis.
*/
