export default function PrivacyPolicyPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-8">
      <div className="space-y-3">
        <span className="text-xs font-bold uppercase tracking-widest text-rose-600">
          User Privacy
        </span>
        <h1 className="text-3xl sm:text-5xl font-black text-neutral-900 dark:text-white tracking-tight">
          Privacy Policy
        </h1>
        <p className="text-xs text-neutral-400">Effective Date: January 1, 2026</p>
      </div>

      <div className="prose dark:prose-invert max-w-none text-sm leading-relaxed space-y-6">
        <p>
          Daily Discovery (&ldquo;we&rdquo;, &ldquo;our&rdquo;, or &ldquo;platform&rdquo;) respects user privacy.
          Our platform does not require registration merely to read news, take quizzes, or use online tools.
        </p>

        <h2 className="text-xl font-bold text-neutral-900 dark:text-white">Information We Collect</h2>
        <ul className="list-disc pl-5 space-y-1.5">
          <li><strong>Anonymous Telemetry:</strong> Aggregated page views, reading depth, and anonymous quiz scores to improve editorial relevance.</li>
          <li><strong>Local Browser Storage:</strong> Theme preferences (dark/light), language preference (English/Khmer), and locally saved bookmarks.</li>
          <li><strong>Online Tools Processing:</strong> File compression, QR code generation, and calculator inputs execute strictly client-side on your device without uploading files to our servers.</li>
        </ul>

        <h2 className="text-xl font-bold text-neutral-900 dark:text-white">Third-Party Analytics & Monetization</h2>
        <p>
          We may partner with privacy-conscious analytics services and standard ad networks such as Google AdSense.
          Third-party vendors use cookies to serve ads based on prior visits. You may opt out of personalized advertising by visiting Google Ads Settings.
        </p>
      </div>
    </div>
  );
}
