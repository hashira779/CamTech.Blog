export const TOOL_GUIDES: Record<string, { intro: string; steps: string[]; note: string }> = {
  "cv-builder": {
    intro: "Build a job-focused CV in English, Khmer, or both languages without creating an account. Runs independently from the news and CMS APIs for uninterrupted availability.",
    steps: [
      "Enter your contact details, a short profile, and relevant experience. Write the text for each language you want to include.",
      "Choose one of 30 free templates and review the live preview. List the most recent experience first and leave out unnecessary sensitive information.",
      "Choose Print / save PDF (or Send to Telegram / QR to deliver via @CamTech_Blog_bot), select Save as PDF and A4 paper, and download before leaving or refreshing.",
    ],
    note: "Drafts exist only in the open page. No account or database storage is used. When you tap Send to Telegram, a single-session temporary PDF is held in isolated memory cache for up to 15 minutes until your Telegram / QR handoff completes.",
  },
  "universal-video-downloader": {
    intro: "Download high-definition videos (1080p, 720p, 480p) or extract clean MP3 audio from TikTok (no watermark), YouTube, Facebook, Instagram Reels, Twitter/X, and Douyin.",
    steps: [
      "Copy the share link of any video from TikTok, YouTube, Facebook, or Instagram.",
      "Paste the link into the field above and tap “Analyze & Extract Media”.",
      "Preview the video in the embedded player, select your desired resolution (1080p Full HD, 720p HD, or MP3 Audio), and click Download.",
    ],
    note: "All extraction is processed privately without permanent server storage. Please respect content creators' copyrights and platform terms of service.",
  },
  "cambodia-property-tax-calculator": {
    intro: "Calculate Cambodian GDT real estate transfer taxes, 4% Stamp Duty (ពន្ធប្រថាប់ត្រា), direct-relative exemptions, and cadastral registration fees for Hard Title (L-MAP) and Soft Title.",
    steps: [
      "Select your property valuation in USD ($) or KHR (៛).",
      "Choose your transaction category: Standard Sale, Direct Relative Gift (ឪពុកម្តាយ-កូន / ប្តី-ប្រពន្ធ), or Inheritance (100% Tax Exempt).",
      "Review the automated breakdown for Stamp Duty, eligible tax deductions, Cadastre survey fees, and Seller's Capital Gains Tax (20%).",
      "Click 'Copy Breakdown' or 'Print Worksheet' to keep an official estimate for your title transfer paperwork.",
    ],
    note: "Calculated in accordance with Cambodian General Department of Taxation (GDT) regulations and the Law on Financial Management. Consult official GDT officers or your local Cadastre department for final parcel base rate assessments.",
  },
  "word-counter": {
    intro: "Check the length of a draft, a short bio, a caption, or an article before you publish it.",
    steps: ["Replace the example with your own text. The counts update as you type.", "Compare the character count with the limit of the place you are publishing.", "Use reading time as a rough planning estimate. Clear the text when you are finished."],
    note: "Words are counted using spaces. Languages such as Khmer may need language-aware segmentation for a precise word count. Reading and speaking times are estimates, not measured durations.",
  },
  "json-formatter": {
    intro: "Turn a compact JSON response into readable data, or find a syntax problem before using it in your project.",
    steps: ["Paste JSON into the input. Remove passwords, access tokens, and private customer data first.", "Format or validate it, then check any error message for the location of a syntax problem.", "Copy the formatted result back into your editor. Check the values as well as the syntax."],
    note: "Valid JSON can still contain incorrect data. Formatting does not verify an API response or make unknown data safe to execute.",
  },
  "image-compressor": {
    intro: "Make a photo smaller before attaching it to a message or adding it to a website.",
    steps: ["Select an image from your device and choose the available compression settings.", "Preview the result and compare image detail, especially small text and faces.", "Download the compressed version. Keep your original if you may need to edit or print it later."],
    note: "Smaller files may lose detail. The best settings depend on the image and where you plan to use it; inspect the downloaded file before publishing.",
  },
  "qr-code-generator": {
    intro: "Make a scannable shortcut to a website or a short piece of information.",
    steps: ["Enter the destination or text you want the code to contain. Check website addresses carefully.", "Generate and download the code at a suitable size for your design.", "Scan the downloaded code with another device before printing or sharing it. Keep a clear margin around it."],
    note: "A QR code does not verify the destination. This general QR generator is different from a bank-approved payment QR service.",
  },
  "uuid-generator": {
    intro: "Create identifiers for sample data, project records, or development tasks.",
    steps: ["Choose an available identifier format and how many identifiers you need.", "Generate the identifiers and inspect the format before copying or exporting them.", "Use the result in the field your application expects, and enforce uniqueness in your database."],
    note: "An identifier is not an authentication secret. Do not use a UUID in place of a password, access control, or a secure session token.",
  },
};
