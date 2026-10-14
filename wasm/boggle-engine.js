async function instantiate(module, imports = {}) {
  const adaptedImports = {
    env: Object.setPrototypeOf({
      abort(message, fileName, lineNumber, columnNumber) {
        // ~lib/builtins/abort(~lib/string/String | null?, ~lib/string/String | null?, u32?, u32?) => void
        message = __liftString(message >>> 0);
        fileName = __liftString(fileName >>> 0);
        lineNumber = lineNumber >>> 0;
        columnNumber = columnNumber >>> 0;
        (() => {
          // @external.js
          throw Error(`${message} in ${fileName}:${lineNumber}:${columnNumber}`);
        })();
      },
      seed() {
        // ~lib/builtins/seed() => f64
        return (() => {
          // @external.js
          return Date.now() * Math.random();
        })();
      },
    }, Object.assign(Object.create(globalThis), imports.env || {})),
  };
  const { exports } = await WebAssembly.instantiate(module, adaptedImports);
  const memory = exports.memory || imports.env.memory;
  const adaptedExports = Object.setPrototypeOf({
    unmaskBuffer(payload) {
      // assembly/index/unmaskBuffer(~lib/typedarray/Uint8Array) => ~lib/typedarray/Uint8Array
      payload = __lowerTypedArray(Uint8Array, 6, 0, payload) || __notnull();
      return __liftTypedArray(Uint8Array, exports.unmaskBuffer(payload) >>> 0);
    },
    calculateTotalScore(wordLengths) {
      // assembly/index/calculateTotalScore(~lib/typedarray/Int32Array) => i32
      wordLengths = __lowerTypedArray(Int32Array, 7, 2, wordLengths) || __notnull();
      return exports.calculateTotalScore(wordLengths);
    },
    isAdjacent(i1, i2, size) {
      // assembly/index/isAdjacent(i32, i32, i32) => bool
      return exports.isAdjacent(i1, i2, size) != 0;
    },
    hasCrossing(path, size) {
      // assembly/index/hasCrossing(~lib/typedarray/Int32Array, i32) => bool
      path = __lowerTypedArray(Int32Array, 7, 2, path) || __notnull();
      return exports.hasCrossing(path, size) != 0;
    },
    wouldCreateCrossing(path, nextIndex, size) {
      // assembly/index/wouldCreateCrossing(~lib/typedarray/Int32Array, i32, i32) => bool
      path = __lowerTypedArray(Int32Array, 7, 2, path) || __notnull();
      return exports.wouldCreateCrossing(path, nextIndex, size) != 0;
    },
    shakeGrid(size, langCode, seed) {
      // assembly/index/shakeGrid(i32, i32, i32) => ~lib/array/Array<~lib/string/String>
      return __liftArray(pointer => __liftString(__getU32(pointer)), 2, exports.shakeGrid(size, langCode, seed) >>> 0);
    },
    findWordPath(gridChars, wordTokens, size, allowCrossing) {
      // assembly/index/findWordPath(~lib/typedarray/Int32Array, ~lib/typedarray/Int32Array, i32, bool) => ~lib/typedarray/Int32Array
      gridChars = __retain(__lowerTypedArray(Int32Array, 7, 2, gridChars) || __notnull());
      wordTokens = __lowerTypedArray(Int32Array, 7, 2, wordTokens) || __notnull();
      allowCrossing = allowCrossing ? 1 : 0;
      try {
        return __liftTypedArray(Int32Array, exports.findWordPath(gridChars, wordTokens, size, allowCrossing) >>> 0);
      } finally {
        __release(gridChars);
      }
    },
  }, exports);
  function __liftString(pointer) {
    if (!pointer) return null;
    const
      end = pointer + new Uint32Array(memory.buffer)[pointer - 4 >>> 2] >>> 1,
      memoryU16 = new Uint16Array(memory.buffer);
    let
      start = pointer >>> 1,
      string = "";
    while (end - start > 1024) string += String.fromCharCode(...memoryU16.subarray(start, start += 1024));
    return string + String.fromCharCode(...memoryU16.subarray(start, end));
  }
  function __liftArray(liftElement, align, pointer) {
    if (!pointer) return null;
    const
      dataStart = __getU32(pointer + 4),
      length = __dataview.getUint32(pointer + 12, true),
      values = new Array(length);
    for (let i = 0; i < length; ++i) values[i] = liftElement(dataStart + (i << align >>> 0));
    return values;
  }
  function __liftTypedArray(constructor, pointer) {
    if (!pointer) return null;
    return new constructor(
      memory.buffer,
      __getU32(pointer + 4),
      __dataview.getUint32(pointer + 8, true) / constructor.BYTES_PER_ELEMENT
    ).slice();
  }
  function __lowerTypedArray(constructor, id, align, values) {
    if (values == null) return 0;
    const
      length = values.length,
      buffer = exports.__pin(exports.__new(length << align, 1)) >>> 0,
      header = exports.__new(12, id) >>> 0;
    __setU32(header + 0, buffer);
    __dataview.setUint32(header + 4, buffer, true);
    __dataview.setUint32(header + 8, length << align, true);
    new constructor(memory.buffer, buffer, length).set(values);
    exports.__unpin(buffer);
    return header;
  }
  const refcounts = new Map();
  function __retain(pointer) {
    if (pointer) {
      const refcount = refcounts.get(pointer);
      if (refcount) refcounts.set(pointer, refcount + 1);
      else refcounts.set(exports.__pin(pointer), 1);
    }
    return pointer;
  }
  function __release(pointer) {
    if (pointer) {
      const refcount = refcounts.get(pointer);
      if (refcount === 1) exports.__unpin(pointer), refcounts.delete(pointer);
      else if (refcount) refcounts.set(pointer, refcount - 1);
      else throw Error(`invalid refcount '${refcount}' for reference '${pointer}'`);
    }
  }
  function __notnull() {
    throw TypeError("value must not be null");
  }
  let __dataview = new DataView(memory.buffer);
  function __setU32(pointer, value) {
    try {
      __dataview.setUint32(pointer, value, true);
    } catch {
      __dataview = new DataView(memory.buffer);
      __dataview.setUint32(pointer, value, true);
    }
  }
  function __getU32(pointer) {
    try {
      return __dataview.getUint32(pointer, true);
    } catch {
      __dataview = new DataView(memory.buffer);
      return __dataview.getUint32(pointer, true);
    }
  }
  return adaptedExports;
}
export const {
  memory,
  unmaskBuffer,
  getScore,
  calculateTotalScore,
  isAdjacent,
  getDiagonalKey,
  getDiagonalType,
  hasCrossing,
  wouldCreateCrossing,
  setSeed,
  nextRandom,
  shakeGrid,
  findWordPath,
} = await (async url => instantiate(
  await (async () => {
    const isNodeOrBun = typeof process != "undefined" && process.versions != null && (process.versions.node != null || process.versions.bun != null);
    if (isNodeOrBun) { return globalThis.WebAssembly.compile(await (await import("node:fs/promises")).readFile(url)); }
    else { return await globalThis.WebAssembly.compileStreaming(globalThis.fetch(url)); }
  })(), {
  }
))(new URL("boggle-engine.wasm", import.meta.url));
