import React from "react";

/* Names that only break where a name has a space.

   Browsers cut Khmer lines inside a word (dictionary segmentation), so
   "យាន សុផាន់ណា" could end up as "យាន សុផាន់ / ណា". Each word here is
   kept whole, and each full name is its own inline block, so a line breaks
   first between the two names, and only if one name is still too wide,
   between its surname and given name. A single word wider than the whole
   box (a long title) still wraps inside itself rather than overflow,
   since each word is an inline block and not nowrap. */

export function PersonName({ name, className = "" }: { name: string; className?: string }) {
  const words = (name || "").trim().split(/\s+/).filter(Boolean);
  return (
    <span className={`inline-block max-w-full ${className}`}>
      {words.map((w, i) => (
        <React.Fragment key={i}>
          {i > 0 && " "}
          <span className="inline-block max-w-full">{w}</span>
        </React.Fragment>
      ))}
    </span>
  );
}

export function CoupleNames({ groom, bride, ampClassName = "" }: { groom: string; bride: string; ampClassName?: string }) {
  return (
    <>
      <PersonName name={groom} /> <span className={`inline-block ${ampClassName}`}>&amp;</span> <PersonName name={bride} />
    </>
  );
}
