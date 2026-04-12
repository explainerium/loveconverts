export interface ConversionPair {
  pair: string;        // e.g. "webp-to-jpg"
  from: string;        // e.g. "WebP"
  to: string;          // e.g. "JPG"
  fromLower: string;   // e.g. "webp"
  toLower: string;     // e.g. "jpg"
  mime: string;        // e.g. "image/webp"
  title: string;
  description: string;
  h1: string;
  intro: string;
  faqs: { q: string; a: string }[];
  related: string[];   // pair slugs
}

const MIME: Record<string, string> = {
  jpg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
  avif: "image/avif",
  gif: "image/gif",
  tiff: "image/tiff",
  bmp: "image/bmp",
  ico: "image/x-icon",
};

function raw(pair: string): Omit<ConversionPair, "pair" | "from" | "to" | "fromLower" | "toLower" | "mime"> {
  switch (pair) {
    // ── WebP conversions ──
    case "webp-to-jpg":
      return {
        title: "Convert WebP to JPG Free Online - No Signup | LoveConverts",
        description: "Convert WebP to JPG online for free. No signup required. Upload your WebP images and download high-quality JPG files instantly. Batch convert up to 30 files.",
        h1: "WebP to JPG Converter",
        intro: "WebP files offer smaller file sizes but are not supported everywhere. Converting to JPG makes your images compatible with all devices, apps, and social media platforms. Upload your WebP files below and download JPG versions instantly.",
        faqs: [
          { q: "Is it free to convert WebP to JPG?", a: "Yes, completely free. No signup, no watermark, no limits on file count." },
          { q: "Will I lose quality converting WebP to JPG?", a: "JPG uses lossy compression. At high quality settings (80%+) the difference is minimal and not visible to the human eye." },
          { q: "How many files can I convert at once?", a: "Up to 30 files at a time, up to 20MB each." },
          { q: "Does LoveConverts store my files?", a: "No. Files are processed in memory and never stored on our servers." },
        ],
        related: ["png-to-jpg", "webp-to-png", "jpg-to-webp", "avif-to-jpg", "gif-to-jpg"],
      };
    case "webp-to-png":
      return {
        title: "Convert WebP to PNG Free Online - No Signup | LoveConverts",
        description: "Convert WebP to PNG online for free. Keep transparency and get lossless quality. No signup needed. Upload WebP files and download PNG versions instantly.",
        h1: "WebP to PNG Converter",
        intro: "Need lossless quality or transparency support? PNG preserves every pixel without compression artifacts. Converting WebP to PNG is useful when you need to edit images further or require transparent backgrounds.",
        faqs: [
          { q: "Does WebP to PNG conversion keep transparency?", a: "Yes. If your WebP file has transparency, the PNG output will preserve it perfectly." },
          { q: "Will the file size increase?", a: "Usually yes. PNG is lossless so files tend to be larger than WebP, but quality is preserved exactly." },
          { q: "Can I convert multiple WebP files to PNG?", a: "Yes, upload up to 30 files and convert them all at once." },
          { q: "Is there a file size limit?", a: "Each file can be up to 20MB." },
        ],
        related: ["webp-to-jpg", "png-to-webp", "webp-to-avif", "png-to-jpg", "avif-to-png"],
      };
    case "webp-to-avif":
      return {
        title: "Convert WebP to AVIF Free Online - No Signup | LoveConverts",
        description: "Convert WebP to AVIF online for free. Get even smaller file sizes with AVIF format. No signup required. Instant batch conversion up to 30 files.",
        h1: "WebP to AVIF Converter",
        intro: "AVIF delivers better compression than WebP at the same visual quality. If your target audience uses modern browsers, AVIF can reduce file sizes by 20-30% compared to WebP. Upload your files and convert instantly.",
        faqs: [
          { q: "Is AVIF better than WebP?", a: "AVIF generally achieves smaller file sizes than WebP at equivalent quality, but browser support is slightly less widespread." },
          { q: "Do all browsers support AVIF?", a: "Chrome, Firefox, Safari 16+, and Edge all support AVIF. Older browsers may not." },
          { q: "Is the conversion free?", a: "Yes. No signup, no watermarks, no hidden fees." },
          { q: "Can I batch convert WebP to AVIF?", a: "Yes, up to 30 files at once." },
        ],
        related: ["webp-to-jpg", "webp-to-png", "avif-to-jpg", "png-to-avif", "jpg-to-avif"],
      };

    // ── PNG conversions ──
    case "png-to-jpg":
      return {
        title: "Convert PNG to JPG Free Online - No Signup | LoveConverts",
        description: "Convert PNG to JPG online for free. Reduce file size while keeping good quality. No signup required. Batch convert up to 30 PNG files instantly.",
        h1: "PNG to JPG Converter",
        intro: "PNG files are great for quality but often too large for web use or email. Converting to JPG significantly reduces file size while maintaining visual quality. This is the most common image conversion on the web.",
        faqs: [
          { q: "Will I lose transparency converting PNG to JPG?", a: "Yes. JPG does not support transparency. Transparent areas will become white." },
          { q: "How much smaller will the file be?", a: "Typically 50-80% smaller, depending on the image content and quality setting." },
          { q: "Is there a limit on conversions?", a: "No daily limit. Convert as many files as you need, up to 30 at a time." },
          { q: "What quality setting is used?", a: "We use 85% quality by default, which gives an excellent balance of size and visual quality." },
        ],
        related: ["jpg-to-png", "png-to-webp", "png-to-avif", "webp-to-jpg", "gif-to-jpg"],
      };
    case "png-to-webp":
      return {
        title: "Convert PNG to WebP Free Online - No Signup | LoveConverts",
        description: "Convert PNG to WebP online for free. Get 25-35% smaller files with WebP format. No signup required. Instant batch conversion up to 30 files.",
        h1: "PNG to WebP Converter",
        intro: "WebP gives you significantly smaller files than PNG while supporting both lossy and lossless compression, plus transparency. If you are optimizing images for the web, WebP is the modern standard.",
        faqs: [
          { q: "Does WebP support transparency like PNG?", a: "Yes. WebP fully supports alpha transparency, just like PNG." },
          { q: "How much smaller are WebP files vs PNG?", a: "WebP lossless is typically 25-35% smaller than PNG. Lossy WebP can be even smaller." },
          { q: "Will all browsers display WebP?", a: "Yes. All modern browsers including Chrome, Firefox, Safari, and Edge support WebP." },
          { q: "Can I convert back to PNG later?", a: "Yes. Use our WebP to PNG converter anytime." },
        ],
        related: ["webp-to-png", "png-to-jpg", "png-to-avif", "jpg-to-webp", "webp-to-jpg"],
      };
    case "png-to-avif":
      return {
        title: "Convert PNG to AVIF Free Online - No Signup | LoveConverts",
        description: "Convert PNG to AVIF online for free. AVIF offers the smallest file sizes of any modern format. No signup required. Batch convert up to 30 files.",
        h1: "PNG to AVIF Converter",
        intro: "AVIF is the newest image format and delivers the best compression ratios available. Converting PNG to AVIF can shrink your files by 50% or more while maintaining excellent visual quality. Great for websites that need fast load times.",
        faqs: [
          { q: "How much smaller is AVIF than PNG?", a: "AVIF files are typically 50-70% smaller than PNG at visually equivalent quality." },
          { q: "Does AVIF keep transparency?", a: "Yes. AVIF supports alpha transparency just like PNG." },
          { q: "Is AVIF supported everywhere?", a: "Chrome, Firefox, Safari 16+, and Edge support AVIF. For older browsers, consider WebP as a fallback." },
          { q: "Is there any cost?", a: "No. Completely free, no signup needed." },
        ],
        related: ["avif-to-png", "png-to-jpg", "png-to-webp", "jpg-to-avif", "webp-to-avif"],
      };

    // ── JPG conversions ──
    case "jpg-to-png":
      return {
        title: "Convert JPG to PNG Free Online - No Signup | LoveConverts",
        description: "Convert JPG to PNG online for free. Get lossless quality and transparency support. No signup required. Upload JPG files and download PNG instantly.",
        h1: "JPG to PNG Converter",
        intro: "Need to add transparency to an image or want lossless quality? Converting JPG to PNG gives you a format that supports transparent backgrounds and preserves quality during editing. Useful for logos, graphics, and design work.",
        faqs: [
          { q: "Will converting JPG to PNG improve quality?", a: "It will not add detail that was lost during JPG compression, but it prevents further quality loss during future edits." },
          { q: "Can I get a transparent background?", a: "The converted PNG will have the same background as the JPG. Use our Remove Background tool to make it transparent." },
          { q: "Will the file size increase?", a: "Yes, PNG files are typically larger than JPG because PNG uses lossless compression." },
          { q: "How many JPGs can I convert at once?", a: "Up to 30 files at a time, each up to 20MB." },
        ],
        related: ["png-to-jpg", "jpg-to-webp", "jpg-to-avif", "webp-to-png", "gif-to-png"],
      };
    case "jpg-to-webp":
      return {
        title: "Convert JPG to WebP Free Online - No Signup | LoveConverts",
        description: "Convert JPG to WebP online for free. Reduce file size by 25-35% with WebP format. No signup required. Instant batch conversion up to 30 files.",
        h1: "JPG to WebP Converter",
        intro: "WebP produces files 25-35% smaller than JPG at the same visual quality. If you run a website or app, converting JPG to WebP will improve page load times and save bandwidth. All modern browsers support WebP.",
        faqs: [
          { q: "Is WebP better than JPG?", a: "For web use, yes. WebP gives smaller files at the same quality, and supports transparency which JPG does not." },
          { q: "How much space will I save?", a: "Typically 25-35% smaller files compared to JPG at equivalent visual quality." },
          { q: "Do all browsers support WebP?", a: "Yes, all modern browsers support WebP including Chrome, Firefox, Safari, and Edge." },
          { q: "Is this free?", a: "Yes, completely free with no signup required." },
        ],
        related: ["webp-to-jpg", "jpg-to-png", "jpg-to-avif", "png-to-webp", "webp-to-png"],
      };
    case "jpg-to-avif":
      return {
        title: "Convert JPG to AVIF Free Online - No Signup | LoveConverts",
        description: "Convert JPG to AVIF online for free. AVIF offers 50%+ smaller files than JPG. No signup required. Batch convert up to 30 files instantly.",
        h1: "JPG to AVIF Converter",
        intro: "AVIF can reduce JPG file sizes by 50% or more while maintaining the same visual quality. It is the most efficient image format available today. If your audience uses modern browsers, AVIF is the best choice for web images.",
        faqs: [
          { q: "How much smaller is AVIF than JPG?", a: "AVIF files are typically 50%+ smaller than JPG at the same perceived quality." },
          { q: "Is AVIF conversion slow?", a: "AVIF encoding takes slightly longer than JPG, but our server handles it in seconds." },
          { q: "Which browsers support AVIF?", a: "Chrome, Firefox, Safari 16+, and Edge all support AVIF natively." },
          { q: "Are my files stored after conversion?", a: "No. All processing happens in memory and files are never saved to disk." },
        ],
        related: ["avif-to-jpg", "jpg-to-png", "jpg-to-webp", "png-to-avif", "webp-to-avif"],
      };

    // ── AVIF conversions ──
    case "avif-to-jpg":
      return {
        title: "Convert AVIF to JPG Free Online - No Signup | LoveConverts",
        description: "Convert AVIF to JPG online for free. Make your AVIF images compatible with all devices. No signup required. Instant conversion up to 30 files.",
        h1: "AVIF to JPG Converter",
        intro: "AVIF is a newer format that not all software supports yet. Converting to JPG ensures your images work everywhere, from old email clients to image editors that have not added AVIF support. Upload and convert instantly.",
        faqs: [
          { q: "Why convert AVIF to JPG?", a: "JPG is universally supported. If you need to share images with people using older software or devices, JPG is the safest choice." },
          { q: "Will I lose quality?", a: "JPG uses lossy compression, so there is a small quality reduction. At 85% quality the difference is negligible." },
          { q: "Is the conversion instant?", a: "Yes. Upload your file and the converted JPG is ready to download in seconds." },
          { q: "Is there a file count limit?", a: "You can convert up to 30 files at once." },
        ],
        related: ["jpg-to-avif", "avif-to-png", "avif-to-webp", "webp-to-jpg", "png-to-jpg"],
      };
    case "avif-to-png":
      return {
        title: "Convert AVIF to PNG Free Online - No Signup | LoveConverts",
        description: "Convert AVIF to PNG online for free. Get lossless PNG output from your AVIF files. No signup required. Batch convert up to 30 files instantly.",
        h1: "AVIF to PNG Converter",
        intro: "Need a lossless version of your AVIF image? PNG preserves every detail and supports transparency. Converting AVIF to PNG is ideal when you need to edit images in software that does not support AVIF natively.",
        faqs: [
          { q: "Will AVIF to PNG conversion preserve transparency?", a: "Yes. If your AVIF has transparency, the PNG output will keep it." },
          { q: "Will the file be larger?", a: "Yes. PNG is lossless, so files are larger than AVIF, but quality is perfectly preserved." },
          { q: "Can I use this for batch conversion?", a: "Yes, convert up to 30 AVIF files to PNG at once." },
          { q: "Is it free?", a: "Yes, completely free. No signup or payment required." },
        ],
        related: ["png-to-avif", "avif-to-jpg", "avif-to-webp", "webp-to-png", "jpg-to-png"],
      };
    case "avif-to-webp":
      return {
        title: "Convert AVIF to WebP Free Online - No Signup | LoveConverts",
        description: "Convert AVIF to WebP online for free. WebP has wider browser support than AVIF. No signup required. Instant batch conversion up to 30 files.",
        h1: "AVIF to WebP Converter",
        intro: "While AVIF has better compression, WebP has broader browser and software compatibility. Converting AVIF to WebP gives you a good balance of small file size and wide support. Useful as a fallback format for web projects.",
        faqs: [
          { q: "Why convert AVIF to WebP instead of JPG?", a: "WebP offers better compression than JPG while supporting transparency. It is a good middle ground between AVIF and JPG." },
          { q: "Is WebP more compatible than AVIF?", a: "Yes. WebP has been supported in all major browsers since 2020, while AVIF support is more recent." },
          { q: "Is this free to use?", a: "Yes, no cost and no signup required." },
          { q: "Are my files private?", a: "Yes. Files are processed in memory and never stored." },
        ],
        related: ["webp-to-avif", "avif-to-jpg", "avif-to-png", "jpg-to-webp", "png-to-webp"],
      };

    // ── GIF conversions ──
    case "gif-to-jpg":
      return {
        title: "Convert GIF to JPG Free Online - No Signup | LoveConverts",
        description: "Convert GIF to JPG online for free. Extract a static frame from your GIF as a JPG file. No signup required. Batch convert up to 30 files.",
        h1: "GIF to JPG Converter",
        intro: "Need a static image from a GIF? Converting to JPG extracts the first frame and gives you a compact, universally compatible image file. Useful for thumbnails, previews, or when animation is not needed.",
        faqs: [
          { q: "Will I get all frames of the GIF?", a: "No. The converter extracts the first frame as a static JPG image." },
          { q: "Can I choose which frame to extract?", a: "Currently the first frame is used. For specific frames, use our Photo Editor." },
          { q: "How much smaller will the file be?", a: "JPG files are typically much smaller than animated GIFs since they contain only one frame." },
          { q: "Is there any cost?", a: "No. Completely free with no signup." },
        ],
        related: ["gif-to-png", "gif-to-webp", "jpg-to-png", "png-to-jpg", "webp-to-jpg"],
      };
    case "gif-to-png":
      return {
        title: "Convert GIF to PNG Free Online - No Signup | LoveConverts",
        description: "Convert GIF to PNG online for free. Get a high-quality static PNG from your GIF. No signup required. Batch convert up to 30 files instantly.",
        h1: "GIF to PNG Converter",
        intro: "PNG gives you a higher quality static image from your GIF than JPG would. It also preserves any transparency in the original GIF. Use this when you need a clean, lossless snapshot from an animated file.",
        faqs: [
          { q: "Does this preserve GIF transparency?", a: "Yes. If the GIF has transparent areas, the PNG output preserves them." },
          { q: "Is only the first frame extracted?", a: "Yes. The first frame of the GIF is converted to a static PNG image." },
          { q: "Is PNG better than JPG for this?", a: "If you need transparency or lossless quality, yes. If you just need a small file, JPG may be better." },
          { q: "How many GIFs can I convert at once?", a: "Up to 30 files, each up to 20MB." },
        ],
        related: ["gif-to-jpg", "gif-to-webp", "png-to-jpg", "png-to-webp", "jpg-to-png"],
      };
    case "gif-to-webp":
      return {
        title: "Convert GIF to WebP Free Online - No Signup | LoveConverts",
        description: "Convert GIF to WebP online for free. Get smaller file sizes with WebP format. No signup required. Batch convert up to 30 files instantly.",
        h1: "GIF to WebP Converter",
        intro: "WebP supports both animation and static images with better compression than GIF. Converting GIF to WebP gives you a smaller file that loads faster on the web. The first frame is extracted as a static WebP image.",
        faqs: [
          { q: "Does this create an animated WebP?", a: "No. The converter extracts the first frame as a static WebP image." },
          { q: "How much smaller is WebP than GIF?", a: "Static WebP files are typically 50-80% smaller than the equivalent GIF." },
          { q: "Is WebP supported in all browsers?", a: "Yes. All modern browsers support WebP images." },
          { q: "Do I need to create an account?", a: "No. Just upload your files and convert instantly." },
        ],
        related: ["gif-to-jpg", "gif-to-png", "webp-to-jpg", "jpg-to-webp", "png-to-webp"],
      };

    // ── TIFF conversions ──
    case "tiff-to-jpg":
      return {
        title: "Convert TIFF to JPG Free Online - No Signup | LoveConverts",
        description: "Convert TIFF to JPG online for free. Make large TIFF files web-ready. No signup required. Batch convert up to 30 files instantly.",
        h1: "TIFF to JPG Converter",
        intro: "TIFF files are high-quality but often very large and not supported by web browsers. Converting to JPG dramatically reduces file size and makes images shareable via email, social media, and web pages.",
        faqs: [
          { q: "How much smaller will the JPG be?", a: "JPG files are typically 90-95% smaller than TIFF files, depending on the content." },
          { q: "Will I lose quality?", a: "Some quality is lost in JPG compression, but at 85% quality the result looks nearly identical to the original." },
          { q: "Can I convert multi-page TIFF files?", a: "The converter processes the first page. For multi-page documents, use our PDF tools." },
          { q: "Is this service free?", a: "Yes, free with no signup required." },
        ],
        related: ["tiff-to-png", "tiff-to-webp", "jpg-to-png", "png-to-jpg", "bmp-to-jpg"],
      };
    case "tiff-to-png":
      return {
        title: "Convert TIFF to PNG Free Online - No Signup | LoveConverts",
        description: "Convert TIFF to PNG online for free. Get lossless PNG from your TIFF files. No signup required. Batch convert up to 30 files instantly.",
        h1: "TIFF to PNG Converter",
        intro: "PNG gives you a lossless web-compatible version of your TIFF image. Unlike JPG, PNG preserves exact pixel data and supports transparency. Choose PNG when quality matters more than file size.",
        faqs: [
          { q: "Is PNG lossless like TIFF?", a: "Yes. PNG uses lossless compression, so no quality is lost during conversion." },
          { q: "Will the file size decrease?", a: "Usually yes, but not as dramatically as TIFF to JPG. PNG files are still much smaller than uncompressed TIFF." },
          { q: "Does PNG support transparency?", a: "Yes, PNG fully supports alpha transparency." },
          { q: "How many files can I convert?", a: "Up to 30 files at once, each up to 20MB." },
        ],
        related: ["tiff-to-jpg", "tiff-to-webp", "png-to-jpg", "png-to-webp", "bmp-to-png"],
      };
    case "tiff-to-webp":
      return {
        title: "Convert TIFF to WebP Free Online - No Signup | LoveConverts",
        description: "Convert TIFF to WebP online for free. Get small, web-optimized files from your TIFF images. No signup required. Batch convert up to 30 files.",
        h1: "TIFF to WebP Converter",
        intro: "WebP is the best format for publishing TIFF images on the web. It compresses much better than both JPG and PNG while supporting transparency. Convert your large TIFF files to compact WebP for fast-loading web pages.",
        faqs: [
          { q: "Why convert TIFF to WebP?", a: "WebP gives you the smallest web-compatible files while maintaining good quality and transparency support." },
          { q: "Is WebP better than JPG for this?", a: "Yes. WebP produces 25-35% smaller files than JPG at equivalent quality and also supports transparency." },
          { q: "Is the conversion instant?", a: "Yes. Files are converted server-side in seconds." },
          { q: "Do I need to sign up?", a: "No. No account needed." },
        ],
        related: ["tiff-to-jpg", "tiff-to-png", "jpg-to-webp", "png-to-webp", "bmp-to-webp"],
      };

    // ── BMP conversions ──
    case "bmp-to-jpg":
      return {
        title: "Convert BMP to JPG Free Online - No Signup | LoveConverts",
        description: "Convert BMP to JPG online for free. Drastically reduce BMP file sizes. No signup required. Batch convert up to 30 files instantly.",
        h1: "BMP to JPG Converter",
        intro: "BMP files are uncompressed and extremely large. A single BMP image can be 10x the size of the equivalent JPG. Converting to JPG makes files manageable for email, web, and storage without noticeable quality loss.",
        faqs: [
          { q: "How much smaller will the JPG be?", a: "JPG is typically 90-95% smaller than BMP since BMP is uncompressed." },
          { q: "Is any quality lost?", a: "JPG uses lossy compression, so there is a small quality reduction. At 85% quality it is not visible." },
          { q: "Can browsers display BMP files?", a: "Some can, but it is unreliable. JPG is universally supported." },
          { q: "Is this tool free?", a: "Yes, completely free with no signup." },
        ],
        related: ["bmp-to-png", "bmp-to-webp", "jpg-to-png", "tiff-to-jpg", "png-to-jpg"],
      };
    case "bmp-to-png":
      return {
        title: "Convert BMP to PNG Free Online - No Signup | LoveConverts",
        description: "Convert BMP to PNG online for free. Get compressed lossless files from BMP. No signup required. Batch convert up to 30 files instantly.",
        h1: "BMP to PNG Converter",
        intro: "PNG compresses your BMP files without losing any quality. Unlike JPG conversion, BMP to PNG is completely lossless. Your images will look identical but take up much less space. PNG also adds transparency support.",
        faqs: [
          { q: "Is BMP to PNG conversion lossless?", a: "Yes. PNG uses lossless compression, so the converted image is pixel-perfect." },
          { q: "How much will the file shrink?", a: "PNG files are typically 50-80% smaller than BMP since BMP has no compression at all." },
          { q: "Does PNG support transparency?", a: "Yes. If you need transparency, PNG is the right choice over JPG." },
          { q: "Is there a cost?", a: "No. Free to use, no signup required." },
        ],
        related: ["bmp-to-jpg", "bmp-to-webp", "png-to-jpg", "tiff-to-png", "png-to-webp"],
      };
    case "bmp-to-webp":
      return {
        title: "Convert BMP to WebP Free Online - No Signup | LoveConverts",
        description: "Convert BMP to WebP online for free. Get the smallest possible files from your BMP images. No signup required. Batch convert up to 30 files.",
        h1: "BMP to WebP Converter",
        intro: "WebP gives you the best compression for converting BMP files for web use. Your uncompressed BMP images become compact, fast-loading WebP files with excellent quality. WebP also supports transparency if needed.",
        faqs: [
          { q: "Why choose WebP over JPG?", a: "WebP produces 25-35% smaller files than JPG at the same quality, and supports transparency." },
          { q: "How big is the size reduction?", a: "BMP to WebP typically reduces file size by 95% or more since BMP is completely uncompressed." },
          { q: "Is WebP widely supported?", a: "Yes. All modern browsers and most image editors support WebP." },
          { q: "Do I need an account?", a: "No. Upload and convert instantly, no signup needed." },
        ],
        related: ["bmp-to-jpg", "bmp-to-png", "tiff-to-webp", "jpg-to-webp", "png-to-webp"],
      };

    // ── ICO conversions ──
    case "ico-to-png":
      return {
        title: "Convert ICO to PNG Free Online - No Signup | LoveConverts",
        description: "Convert ICO to PNG online for free. Extract high-quality PNG from favicon ICO files. No signup required. Batch convert up to 30 files instantly.",
        h1: "ICO to PNG Converter",
        intro: "ICO files are used for favicons and Windows icons. Converting to PNG gives you a standard image file you can use anywhere. The largest resolution layer in the ICO is extracted as a clean PNG image.",
        faqs: [
          { q: "Which resolution is used from the ICO?", a: "The converter extracts the largest resolution available in the ICO file." },
          { q: "Can I convert favicon.ico to PNG?", a: "Yes. Upload any ICO file and get a PNG version instantly." },
          { q: "Is transparency preserved?", a: "Yes. ICO transparency is preserved in the PNG output." },
          { q: "Is this tool free?", a: "Yes, free with no signup or limits." },
        ],
        related: ["ico-to-jpg", "png-to-jpg", "png-to-webp", "jpg-to-png", "bmp-to-png"],
      };
    case "ico-to-jpg":
      return {
        title: "Convert ICO to JPG Free Online - No Signup | LoveConverts",
        description: "Convert ICO to JPG online for free. Turn favicon ICO files into standard JPG images. No signup required. Batch convert up to 30 files instantly.",
        h1: "ICO to JPG Converter",
        intro: "Need a standard image from an ICO file? Converting to JPG gives you a universally compatible image. Transparent areas become white since JPG does not support transparency. Use ICO to PNG if you need to keep transparency.",
        faqs: [
          { q: "Will transparency be preserved?", a: "No. JPG does not support transparency. Transparent areas will be filled with white." },
          { q: "What resolution will the JPG be?", a: "The largest resolution in the ICO file is used." },
          { q: "Can I convert multiple ICO files?", a: "Yes, up to 30 files at once." },
          { q: "Is it free?", a: "Yes. No signup, no watermarks, no cost." },
        ],
        related: ["ico-to-png", "jpg-to-png", "png-to-jpg", "bmp-to-jpg", "gif-to-jpg"],
      };

    default:
      return {
        title: "Image Converter Free Online | LoveConverts",
        description: "Convert images between formats for free. No signup required.",
        h1: "Image Converter",
        intro: "Convert your images between formats instantly.",
        faqs: [],
        related: [],
      };
  }
}

export const ALL_PAIRS: string[] = [
  "webp-to-jpg", "webp-to-png", "webp-to-avif",
  "png-to-jpg", "png-to-webp", "png-to-avif",
  "jpg-to-png", "jpg-to-webp", "jpg-to-avif",
  "avif-to-jpg", "avif-to-png", "avif-to-webp",
  "gif-to-jpg", "gif-to-png", "gif-to-webp",
  "tiff-to-jpg", "tiff-to-png", "tiff-to-webp",
  "bmp-to-jpg", "bmp-to-png", "bmp-to-webp",
  "ico-to-png", "ico-to-jpg",
];

export function getPairData(pair: string): ConversionPair | null {
  if (!ALL_PAIRS.includes(pair)) return null;

  const [fromLower, , toLower] = pair.split("-");
  const from = fromLower.toUpperCase();
  const to = toLower.toUpperCase();
  const mime = MIME[fromLower] || "image/*";

  return { pair, from, to, fromLower, toLower, mime, ...raw(pair) };
}

/** Group pairs by source format for the index page */
export function getPairsBySource(): Record<string, ConversionPair[]> {
  const groups: Record<string, ConversionPair[]> = {};
  for (const p of ALL_PAIRS) {
    const data = getPairData(p)!;
    const key = data.from;
    if (!groups[key]) groups[key] = [];
    groups[key].push(data);
  }
  return groups;
}
