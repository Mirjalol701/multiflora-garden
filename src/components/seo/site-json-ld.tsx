import { getSiteUrl } from "@/lib/site-url";
import { siteConfig } from "@/config/site";

export function SiteJsonLd() {
  const siteUrl = getSiteUrl();
  const logoUrl = `${siteUrl}${siteConfig.brand.logo}`;

  const data = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebSite",
        name: siteConfig.brand.name,
        alternateName: [siteConfig.brand.shortName],
        url: siteUrl,
      },
      {
        "@type": "Organization",
        name: siteConfig.brand.name,
        url: siteUrl,
        logo: logoUrl,
        email: siteConfig.contact.email,
        telephone: siteConfig.contact.phone,
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
