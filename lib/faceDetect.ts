// Client-side face detection for the verification-photo step, powered by the
// vendored pico.js cascade (public/facefinder). Everything runs in the browser
// — the photo is never sent anywhere just to be checked.

import picoDefault from "@/lib/pico";

type ClassifyRegion = (
  r: number,
  c: number,
  s: number,
  pixels: Uint8Array,
  ldim: number
) => number;
type PicoImage = { pixels: Uint8Array; nrows: number; ncols: number; ldim: number };
type Detection = [number, number, number, number]; // [row, col, size, score]

type PicoLib = {
  unpack_cascade(bytes: Int8Array): ClassifyRegion;
  run_cascade(
    image: PicoImage,
    classify: ClassifyRegion,
    params: {
      shiftfactor: number;
      minsize: number;
      maxsize: number;
      scalefactor: number;
    }
  ): Detection[];
  cluster_detections(dets: Detection[], iouThreshold: number): Detection[];
};

const pico = picoDefault as unknown as PicoLib;

// A clustered face is scored by the SUM of its overlapping detections, so a real
// frontal face lands well above this while stray textures stay far below. Raise
// it to be stricter, lower it to be more permissive. (Chloe still reviews every
// photo, so this only needs to catch "there's clearly no face here".)
//
// Measured on real photos with the params below: a clear frontal selfie scores
// ~100+, a marginal one ~30, and flat non-face images score 0 — so 15 keeps a
// wide safety margin while never rejecting an obvious face.
const SCORE_THRESHOLD = 15.0;

let classifierPromise: Promise<ClassifyRegion> | null = null;

/** Fetch + unpack the facefinder cascade once, then cache it. */
function getClassifier(): Promise<ClassifyRegion> {
  if (!classifierPromise) {
    classifierPromise = fetch("/facefinder")
      .then((res) => {
        if (!res.ok) throw new Error("Could not load the face model.");
        return res.arrayBuffer();
      })
      .then((buf) => pico.unpack_cascade(new Int8Array(buf)))
      .catch((err) => {
        classifierPromise = null; // let the next attempt retry
        throw err;
      });
  }
  return classifierPromise;
}

/** Load an image URL into a decoded <img> element. */
export function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("That file isn't a readable image."));
    img.src = src;
  });
}

/** Downscale + grayscale an image into the buffer pico expects (row-major luma). */
function toGrayscale(img: HTMLImageElement, maxDim = 480): PicoImage {
  const w = img.naturalWidth || img.width;
  const h = img.naturalHeight || img.height;
  const scale = Math.min(1, maxDim / Math.max(w, h));
  const ncols = Math.max(1, Math.round(w * scale));
  const nrows = Math.max(1, Math.round(h * scale));

  const canvas = document.createElement("canvas");
  canvas.width = ncols;
  canvas.height = nrows;
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  if (!ctx) throw new Error("Canvas is unavailable in this browser.");
  ctx.drawImage(img, 0, 0, ncols, nrows);

  const rgba = ctx.getImageData(0, 0, ncols, nrows).data;
  const pixels = new Uint8Array(nrows * ncols);
  for (let i = 0; i < nrows * ncols; i++) {
    const j = i * 4;
    // Rec. 601 luma
    pixels[i] = (rgba[j] * 0.299 + rgba[j + 1] * 0.587 + rgba[j + 2] * 0.114) | 0;
  }
  return { pixels, nrows, ncols, ldim: ncols };
}

export type FaceResult = { ok: boolean; faces: number; bestScore: number };

/**
 * Detect faces in a decoded image. Returns how many faces cleared the
 * confidence threshold and the best score seen (handy for debugging/tuning).
 */
export async function detectFace(img: HTMLImageElement): Promise<FaceResult> {
  const classify = await getClassifier();
  const image = toGrayscale(img);

  const minDim = Math.min(image.nrows, image.ncols);
  const params = {
    // A dense scan is what makes this reliable: pico scores a face by SUMMING
    // every overlapping window that lands on it, so stepping finely (5% of the
    // window instead of 10%) lifts a real face from "barely detected" to
    // "unmistakable". At 0.1 a clear frontal face summed to only ~17 and was
    // wrongly rejected — halving the step roughly quadruples that.
    shiftfactor: 0.05,
    // Allow smaller windows so we don't miss a face that isn't filling the
    // frame; a normal verification selfie still sits well above this floor.
    minsize: Math.max(30, Math.round(0.1 * minDim)),
    maxsize: minDim,
    scalefactor: 1.1,
  };

  const raw = pico.run_cascade(image, classify, params);
  const clusters = pico.cluster_detections(raw, 0.2);

  const strong = clusters.filter((d) => d[3] > SCORE_THRESHOLD);
  const bestScore = clusters.reduce((m, d) => Math.max(m, d[3]), 0);

  if (process.env.NODE_ENV !== "production") {
    // Handy for tuning SCORE_THRESHOLD if a real photo ever gets rejected.
    // eslint-disable-next-line no-console
    console.debug(
      `[faceDetect] bestScore=${bestScore.toFixed(1)} faces=${strong.length} (threshold ${SCORE_THRESHOLD})`
    );
  }

  return { ok: strong.length > 0, faces: strong.length, bestScore };
}
