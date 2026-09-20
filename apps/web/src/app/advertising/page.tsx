export default function AdvertisingPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-8">
      <h1 className="text-3xl sm:text-4xl font-black text-neutral-900 dark:text-white">
        Advertising & Monetization Policy
      </h1>
      <div className="prose dark:prose-invert max-w-none text-sm leading-relaxed space-y-4">
        <p>
          Daily Discovery is supported by transparent advertising and affiliate partnerships. However, editorial content and user utility are our primary product.
        </p>
        <h2 className="text-lg font-bold">Our Advertising Commitments</h2>
        <ul className="list-disc pl-5 space-y-1.5">
          <li><strong>No Deceptive Placements:</strong> We never create fake download buttons, deceptive navigation links, or pop-up traps designed to force accidental clicks.</li>
          <li><strong>Clear Labeling:</strong> All promotional placements are clearly demarcated with &ldquo;Advertisement&rdquo; or &ldquo;Sponsored&rdquo; badges.</li>
          <li><strong>Editorial Independence:</strong> Advertisers have zero influence over editorial coverage, fact checking, or scientific discovery evaluations.</li>
        </ul>
      </div>
    </div>
  );
}
