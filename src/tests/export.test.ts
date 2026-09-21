import { describe, it, expect } from 'vitest';
import { createSampleProject } from '../document/defaultProject';
import { exportToSvgString } from '../export/svgExporter';

describe('Export Functions', () => {
  it('generates valid SVG output for the sample project', () => {
    const doc = createSampleProject();
    const page = doc.pages[0];
    const svgStr = exportToSvgString(doc, page);

    expect(svgStr).toContain('<svg');
    expect(svgStr).toContain('</svg>');
    expect(svgStr).toContain('viewBox=');
    expect(svgStr).toContain('Mobile App Concept');
  });

  it('exports only selected objects when selection is provided', () => {
    const doc = createSampleProject();
    const page = doc.pages[0];
    // Pick the first frame
    const frameId = page.childIds[0];

    const svgStr = exportToSvgString(doc, page, [frameId]);
    expect(svgStr).toContain(frameId);
    expect(svgStr).toContain('<svg');
  });
});
