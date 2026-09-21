export interface ProjectPreset {
  id: string;
  name: string;
  category: 'mobile' | 'tablet' | 'desktop' | 'presentation' | 'social' | 'custom';
  width: number;
  height: number;
  description: string;
}

export const PROJECT_PRESETS: ProjectPreset[] = [
  {
    id: 'mobile',
    name: 'Mobile',
    category: 'mobile',
    width: 390,
    height: 844,
    description: 'Standard modern mobile screen (390 × 844)',
  },
  {
    id: 'mobile-large',
    name: 'Mobile Large',
    category: 'mobile',
    width: 430,
    height: 932,
    description: 'Large pro mobile screen (430 × 932)',
  },
  {
    id: 'tablet',
    name: 'Tablet',
    category: 'tablet',
    width: 1024,
    height: 1366,
    description: 'Standard tablet viewport (1024 × 1366)',
  },
  {
    id: 'desktop',
    name: 'Desktop',
    category: 'desktop',
    width: 1440,
    height: 900,
    description: 'Modern desktop layout (1440 × 900)',
  },
  {
    id: 'presentation',
    name: 'Presentation',
    category: 'presentation',
    width: 1920,
    height: 1080,
    description: 'Full HD 16:9 Slide (1920 × 1080)',
  },
  {
    id: 'social-square',
    name: 'Social Square',
    category: 'social',
    width: 1080,
    height: 1080,
    description: '1:1 Square Post (1080 × 1080)',
  },
  {
    id: 'social-portrait',
    name: 'Social Portrait',
    category: 'social',
    width: 1080,
    height: 1350,
    description: '4:5 Feed Portrait (1080 × 1350)',
  },
  {
    id: 'social-landscape',
    name: 'Social Landscape',
    category: 'social',
    width: 1200,
    height: 630,
    description: 'Cover / Sharing Card (1200 × 630)',
  },
];
