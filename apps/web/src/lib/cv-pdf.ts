"use client";

import { domToCanvas } from "modern-screenshot";
import { jsPDF } from "jspdf";

const A4_WIDTH_MM = 210;
const A4_HEIGHT_MM = 297;
const A4_WIDTH_PX = 794;
const CAPTURE_SCALE = 2;

async function waitForNodeAssets(root: HTMLElement): Promise<void> {
  if ("fonts" in document) {
    await Promise.race([
      document.fonts.ready,
      new Promise((resolve) => setTimeout(resolve, 6000)),
    ]);
  }
  const images = Array.from(root.querySelectorAll("img"));
  await Promise.race([
    Promise.all(
      images.map((img) => {
        if (img.complete && img.naturalWidth > 0) return img.decode().catch(() => {});
        return new Promise<void>((resolve) => {
          img.addEventListener("load", () => resolve(), { once: true });
          img.addEventListener("error", () => resolve(), { once: true });
        });
      }),
    ),
    new Promise((resolve) => setTimeout(resolve, 6000)),
  ]);
}

function renderPdfFromCanvas(canvas: HTMLCanvasElement, jpegQuality: number): Blob {
  const pdf = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
    compress: true,
  });

  const pageSliceHeightPx = Math.round(canvas.width * (A4_HEIGHT_MM / A4_WIDTH_MM));
  const totalHeightPx = canvas.height;
  const pageCount = Math.max(1, Math.ceil((totalHeightPx - 16) / pageSliceHeightPx));

  const sliceCanvas = document.createElement("canvas");
  sliceCanvas.width = canvas.width;
  const sliceCtx = sliceCanvas.getContext("2d");
  if (!sliceCtx) {
    throw new Error("2D canvas context unavailable");
  }

  for (let index = 0; index < pageCount; index++) {
    const sy = index * pageSliceHeightPx;
    const remaining = totalHeightPx - sy;
    const sh = Math.min(pageSliceHeightPx, Math.max(1, remaining));

    sliceCanvas.height = pageSliceHeightPx;
    sliceCtx.fillStyle = "#ffffff";
    sliceCtx.fillRect(0, 0, sliceCanvas.width, sliceCanvas.height);
    sliceCtx.drawImage(canvas, 0, sy, canvas.width, sh, 0, 0, canvas.width, sh);

    const imgData = sliceCanvas.toDataURL("image/jpeg", jpegQuality);
    if (index > 0) {
      pdf.addPage("a4", "portrait");
    }
    pdf.addImage(imgData, "JPEG", 0, 0, A4_WIDTH_MM, A4_HEIGHT_MM, undefined, "FAST");
  }

  return pdf.output("blob");
}

/** Render an exact offscreen clone of `<article data-cv-document>` into an A4 PDF Blob. */
export async function buildCvPdfBlob(articleNode: HTMLElement): Promise<Blob> {
  const host = document.createElement("div");
  host.setAttribute("aria-hidden", "true");
  host.className = "light";
  Object.assign(host.style, {
    position: "fixed",
    left: "-10000px",
    top: "0",
    width: `${A4_WIDTH_PX}px`,
    background: "#ffffff",
    color: "#111827",
    pointerEvents: "none",
    zIndex: "-1",
  });

  const clone = articleNode.cloneNode(true) as HTMLElement;
  clone.style.boxShadow = "none";
  clone.style.transform = "none";
  clone.style.margin = "0";
  host.appendChild(clone);
  document.body.appendChild(host);

  try {
    await waitForNodeAssets(clone);
    const canvas = await domToCanvas(clone, {
      scale: CAPTURE_SCALE,
      backgroundColor: "#ffffff",
      width: A4_WIDTH_PX,
      height: Math.max(1123, clone.scrollHeight),
    });

    let blob = renderPdfFromCanvas(canvas, 0.92);
    if (blob.size > 4.6 * 1024 * 1024) {
      blob = renderPdfFromCanvas(canvas, 0.78);
    }
    return blob;
  } finally {
    host.remove();
  }
}
