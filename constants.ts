import { ArtStyle } from './types';
import { Palette, Camera, Grid } from 'lucide-react';

export const STYLE_ICONS = {
  [ArtStyle.REALISTIC]: Camera,
  [ArtStyle.ILLUSTRATION]: Palette,
  [ArtStyle.PIXEL_ART]: Grid,
};

export const STYLE_PROMPTS = {
  [ArtStyle.REALISTIC]: "photorealistic, 8k, highly detailed, cinematic lighting, photography",
  [ArtStyle.ILLUSTRATION]: "digital illustration, vibrant colors, detailed, artistic, smooth lighting, creative concept art, high quality",
  [ArtStyle.PIXEL_ART]: "pixel art, 16-bit, retro game style, dithering, limited palette",
};