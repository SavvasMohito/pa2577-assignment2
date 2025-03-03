const emptyLine = /^\s*$/;
const oneLineComment = /\/\/.*/;
const oneLineMultiLineComment = /\/\*.*?\*\//;
const openMultiLineComment = /\/\*+[^\*\/]*$/;
const closeMultiLineComment = /^[\*\/]*\*+\//;

const SourceLine = require("./SourceLine");
const FileStorage = require("./FileStorage");
const Clone = require("./Clone");

const DEFAULT_CHUNKSIZE = 5;

class CloneDetector {
  #myChunkSize = process.env.CHUNKSIZE || DEFAULT_CHUNKSIZE;
  #myFileStore = FileStorage.getInstance();

  constructor() {}

  // Private Methods
  // --------------------
  #filterLines(file) {
    let lines = file.contents.split("\n");
    let inMultiLineComment = false;
    file.lines = [];

    for (let i = 0; i < lines.length; i++) {
      let line = lines[i];

      if (inMultiLineComment) {
        if (-1 != line.search(closeMultiLineComment)) {
          line = line.replace(closeMultiLineComment, "");
          inMultiLineComment = false;
        } else {
          line = "";
        }
      }

      line = line.replace(emptyLine, "");
      line = line.replace(oneLineComment, "");
      line = line.replace(oneLineMultiLineComment, "");

      if (-1 != line.search(openMultiLineComment)) {
        line = line.replace(openMultiLineComment, "");
        inMultiLineComment = true;
      }

      file.lines.push(new SourceLine(i + 1, line.trim()));
    }

    return file;
  }

  #getContentLines(file) {
    return file.lines.filter((line) => line.hasContent());
  }

  #chunkify(file) {
    let chunkSize = this.#myChunkSize;
    let lines = this.#getContentLines(file);
    file.chunks = [];

    for (let i = 0; i <= lines.length - chunkSize; i++) {
      let chunk = lines.slice(i, i + chunkSize);
      file.chunks.push(chunk);
    }
    return file;
  }

  #chunkMatch(first, second) {
    let match = true;

    if (first.length != second.length) {
      match = false;
    }
    for (let idx = 0; idx < first.length; idx++) {
      if (!first[idx].equals(second[idx])) {
        match = false;
      }
    }

    return match;
  }

  #filterCloneCandidates(file, compareFile) {
    // TODO
    // For each chunk in file.chunks, find all #chunkMatch() in compareFile.chunks
    // For each matching chunk, create a new Clone.
    // Store the resulting (flat) array in file.instances.
    //
    // TIP 1: Array.filter to find a set of matches, Array.map to return a new array with modified objects.
    // TIP 2: You can daisy-chain calls to filter().map().filter().flat() etc.
    // TIP 3: Remember that file.instances may have already been created, so only append to it.
    //
    // Return: file, including file.instances which is an array of Clone objects (or an empty array).
    //

    // Ensure file.instances is initialized
    file.instances = file.instances || [];

    // For each chunk in file.chunks, find all matching chunks in compareFile.chunks
    const newInstances = file.chunks
      .map((chunk) => {
        return compareFile.chunks
          .filter((compareChunk) => this.#chunkMatch(chunk, compareChunk))
          .map((matchingChunk) => {
            try {
              return new Clone(file.name, compareFile.name, chunk, matchingChunk);
            } catch (error) {
              console.error("Error creating Clone:", error);
              console.error("chunk:", chunk);
              console.error("matchingChunk:", matchingChunk);
              return null;
            }
          })
          .filter((clone) => clone !== null);
      })
      .flat();

    // Append the new instances to file.instances
    file.instances = file.instances.concat(newInstances);

    // Return the file with updated instances
    return file;
  }

  #expandCloneCandidates(file) {
    // TODO
    // For each Clone in file.instances, try to expand it with every other Clone
    // (using Clone::maybeExpandWith(), which returns true if it could expand)
    //
    // Comment: This should be doable with a reduce:
    //          For every new element, check if it overlaps any element in the accumulator.
    //          If it does, expand the element in the accumulator. If it doesn't, add it to the accumulator.
    //
    // ASSUME: As long as you traverse the array file.instances in the "normal" order, only forward expansion is necessary.
    //
    // Return: file, with file.instances only including Clones that have been expanded as much as they can,
    //         and not any of the Clones used during that expansion.
    //

    file.instances = file.instances.reduce((accumulator, currentClone) => {
      let expanded = false;

      for (let i = 0; i < accumulator.length; i++) {
        if (accumulator[i].maybeExpandWith(currentClone)) {
          expanded = true;
          break;
        }
      }

      if (!expanded) {
        accumulator.push(currentClone);
      }

      return accumulator;
    }, []);

    return file;
  }

  #consolidateClones(file) {
    // TODO
    // For each clone, accumulate it into an array if it is new
    // If it isn't new, update the existing clone to include this one too
    // using Clone::addTarget()
    //
    // TIP 1: Array.reduce() with an empty array as start value.
    //        Push not-seen-before clones into the accumulator
    // TIP 2: There should only be one match in the accumulator
    //        so Array.find() and Clone::equals() will do nicely.
    //
    // Return: file, with file.instances containing unique Clone objects that may contain several targets
    //

    file.instances = file.instances.reduce((accumulator, currentClone) => {
      // Check if the current clone is already in the accumulator
      const existingClone = accumulator.find((clone) => clone.equals(currentClone));

      if (existingClone) {
        // If it is, update the existing clone to include this one
        existingClone.addTarget(currentClone);
      } else {
        // If it isn't, add the current clone to the accumulator
        accumulator.push(currentClone);
      }

      return accumulator;
    }, []);

    return file;
  }

  // Public Processing Steps
  // --------------------
  preprocess(file) {
    return new Promise((resolve, reject) => {
      if (!file.name.endsWith(".java")) {
        reject(file.name + " is not a java file. Discarding.");
      } else if (this.#myFileStore.isFileProcessed(file.name)) {
        reject(file.name + " has already been processed.");
      } else {
        resolve(file);
      }
    });
  }

  transform(file) {
    file = this.#filterLines(file);
    file = this.#chunkify(file);
    return file;
  }

  matchDetect(file) {
    let allFiles = this.#myFileStore.getAllFiles();
    file.instances = file.instances || [];
    for (let f of allFiles) {
      // TODO implement these methods (or re-write the function matchDetect() to your own liking)
      //
      // Overall process:
      //
      // 1. Find all equal chunks in file and f. Represent each matching pair as a Clone.
      //
      // 2. For each Clone with endLine=x, merge it with Clone with endLine-1=x
      //    remove the now redundant clone, rinse & repeat.
      //    note that you may end up with several "root" Clones for each processed file f
      //    if there are more than one clone between the file f and the current
      //
      // 3. If the same clone is found in several places, consolidate them into one Clone.
      //
      file = this.#filterCloneCandidates(file, f);
      file = this.#expandCloneCandidates(file);
      file = this.#consolidateClones(file);
    }

    return file;
  }

  pruneFile(file) {
    delete file.lines;
    delete file.instances;
    return file;
  }

  storeFile(file) {
    this.#myFileStore.storeFile(this.pruneFile(file));
    return file;
  }

  get numberOfProcessedFiles() {
    return this.#myFileStore.numberOfFiles;
  }
}

module.exports = CloneDetector;
