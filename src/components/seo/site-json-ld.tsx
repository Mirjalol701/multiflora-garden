import { getSiteUrl } from "@/lib/site-url";

export function SiteJsonLd() {
  const siteUrl = getSiteUrl();
  const logoUrl = `${siteUrl}/multiflora-logo.svg`;

  const data = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebSite",
        name: "MultiFlora Garden",
        alternateName: ["MultiFlora AI", "MultiFlora"],
        url: siteUrl,
      },
      {
        "@type": "Organization",
        name: "MultiFlora Garden",
        url: siteUrl,
        logo: logoUrl,
      },
    ],
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}
