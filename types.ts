export enum ArtStyle {
  REALISTIC = 'Realistic Photo',
  ILLUSTRATION = 'Illustration',
  PIXEL_ART = 'Pixel Art',
}

export interface GeneratedImage {
  url: string; // Base64 data URL
  prompt: string;
  style: ArtStyle;
  timestamp: number;
}

export interface HandPoint {
  x: number;
  y: number;
}