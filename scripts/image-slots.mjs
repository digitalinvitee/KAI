/**
 * The single list of image slots. Used by scripts/optimize-images.mjs and
 * documented in README.md. Each file lives in assets/images/.
 */
export const IMAGE_SLOTS = [
  { id: 'kai-hero', width: 2400, height: 1350, ratio: '16:9', quality: 74, use: 'Hero, tablet and desktop', brief: 'Cinematic restaurant hero' },
  { id: 'kai-hero-mobile', width: 1080, height: 1350, ratio: '4:5', quality: 74, use: 'Hero on phones', brief: 'Portrait crop of the hero', fallbackFrom: 'kai-hero' },
  { id: 'kai-signature-dish', width: 1600, height: 2000, ratio: '4:5', quality: 78, use: 'Philosophy, Fig. 01', brief: 'Premium Japanese food photography' },
  { id: 'kai-detail', width: 1600, height: 1600, ratio: '1:1', quality: 78, use: 'Philosophy, Fig. 02', brief: 'Minimalist atmospheric detail' },
  { id: 'kai-omakase', width: 1600, height: 2000, ratio: '4:5', quality: 78, use: 'Menu, Fig. 03', brief: 'Omakase dining experience' },
  { id: 'kai-interior', width: 2400, height: 1600, ratio: '3:2', quality: 76, use: 'The Space, Fig. 04', brief: 'Architectural restaurant interior' },
  { id: 'kai-chef', width: 1500, height: 2000, ratio: '3:4', quality: 78, use: 'The Space, Fig. 05', brief: 'Chef craftsmanship' },
  { id: 'kai-gallery-01', width: 1500, height: 2000, ratio: '3:4', quality: 78, use: 'The Space, Fig. 06', brief: 'Gallery visual: light and material' },
  { id: 'kai-gallery-02', width: 2400, height: 1500, ratio: '16:10', quality: 76, use: 'The Space, Fig. 07', brief: 'Gallery visual: dining room' },
  { id: 'kai-private', width: 2400, height: 1600, ratio: '3:2', quality: 78, use: 'Private dining, Fig. 08', brief: 'Evening atmosphere: a table set for a private evening' },
];
