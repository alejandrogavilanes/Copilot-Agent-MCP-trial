import MetaScraper from 'metascraper';
import metascraperTitle from 'metascraper-title';
import metascraperDescription from 'metascraper-description';
import { validateLink } from './link-validator';

const scraper = MetaScraper([
  metascraperTitle(),
  metascraperDescription()
]);

function extractFallbackTitle(html: string, url: string): string {
  // Try Open Graph title
  const ogMatch = html.match(/<meta[^>]*property="og:title"[^>]*content="([^"]+)"[^>]*>/i);
  if (ogMatch?.[1]) return ogMatch[1];

  // Try Twitter card title
  const twitterMatch = html.match(/<meta[^>]*name="twitter:title"[^>]*content="([^"]+)"[^>]*>/i);
  if (twitterMatch?.[1]) return twitterMatch[1];

  // Try h1
  const h1Match = html.match(/<h1[^>]*>([^<]+)<\/h1>/i);
  if (h1Match?.[1]) return h1Match[1];

  // Fallback to URL path
  try {
    const urlObj = new URL(url);
    const path = urlObj.pathname.split('/').pop() || '';
    return path.replace(/-/g, ' ').replace(/\.[^/.]+$/, ''); // Remove extension
  } catch {
    return '';
  }
}

function extractFallbackDescription(html: string): string {
  // Try Open Graph description
  const ogMatch = html.match(/<meta[^>]*property="og:description"[^>]*content="([^"]+)"[^>]*>/i);
  if (ogMatch?.[1]) return ogMatch[1];

  // Try Twitter card description
  const twitterMatch = html.match(/<meta[^>]*name="twitter:description"[^>]*content="([^"]+)"[^>]*>/i);
  if (twitterMatch?.[1]) return twitterMatch[1];

  // Try first paragraph
  const pMatch = html.match(/<p[^>]*>([^<]+)<\/p>/i);
  if (pMatch?.[1]) return pMatch[1];

  return '';
}

function extractFavicon(html: string, baseUrl: string): string | null {
  // Try favicon link tags
  const faviconMatches = html.match(/<link[^>]*rel="(?:shortcut )?icon"[^>]*href="([^"]+)"[^>]*>/i);
  if (faviconMatches?.[1]) {
    try {
      return new URL(faviconMatches[1], baseUrl).toString();
    } catch {
      return null;
    }
  }
  
  // Try root favicon
  try {
    const urlObj = new URL(baseUrl);
    return new URL('/favicon.ico', urlObj.origin).toString();
  } catch {
    return null;
  }
}

function extractOgImage(html: string, baseUrl: string): string | null {
  const ogImageMatch = html.match(/<meta[^>]*property="og:image"[^>]*content="([^"]+)"[^>]*>/i);
  if (ogImageMatch?.[1]) {
    try {
      return new URL(ogImageMatch[1], baseUrl).toString();
    } catch {
      return null;
    }
  }
  return null;
}

export async function fetchUrlMetadata(url: string) {
  try {
    // First validate the link
    const { status } = await validateLink(url);
    if (status === 'error') {
      return {
        title: url,
        description: '',
        favicon_url: null,
        og_image_url: null,
        content_type: null,
        status: 'error',
        last_validated_at: new Date()
      };
    }

    const response = await fetch(url);
    const html = await response.text();
    const contentType = response.headers.get('content-type');
    
    // Try metascraper first
    const metadata = await scraper({ html, url });
    const faviconUrl = extractFavicon(html, url);
    const ogImageUrl = extractOgImage(html, url);

    return {
      title: metadata.title || extractFallbackTitle(html, url),
      description: metadata.description || extractFallbackDescription(html),
      favicon_url: faviconUrl,
      og_image_url: ogImageUrl,
      content_type: contentType,
      status,
      last_validated_at: new Date()
    };
  } catch (error) {
    console.error('Failed to fetch URL metadata:', error);
    // Return clean URL as title if everything fails
    try {
      const urlObj = new URL(url);
      return {
        title: urlObj.hostname + urlObj.pathname,
        description: '',
        favicon_url: null,
        og_image_url: null,
        content_type: null,
        status: 'error',
        last_validated_at: new Date()
      };
    } catch {
      return {
        title: url,
        description: '',
        favicon_url: null,
        og_image_url: null,
        content_type: null,
        status: 'invalid',
        last_validated_at: new Date()
      };
    }
  }
}