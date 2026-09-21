import { PixoraDocument, PixoraObject, Page } from '../types/document';
import { getBoundingBox } from '../utils/math';

export function exportToSvgString(
  doc: PixoraDocument,
  page: Page,
  selectedIds: string[] = []
): string {
  let targetObjects: PixoraObject[] = [];
  let originX = 0;
  let originY = 0;
  let width = 800;
  let height = 600;

  if (selectedIds.length > 0) {
    targetObjects = selectedIds.map(id => doc.objects[id]).filter(Boolean);
    const bbox = getBoundingBox(targetObjects);
    if (bbox) {
      originX = bbox.x;
      originY = bbox.y;
      width = Math.max(1, bbox.width);
      height = Math.max(1, bbox.height);
    }
  } else {
    // Export all root objects of active page
    targetObjects = page.childIds.map(id => doc.objects[id]).filter(Boolean);
    const bbox = getBoundingBox(targetObjects);
    if (bbox) {
      originX = bbox.x;
      originY = bbox.y;
      width = Math.max(1, bbox.width);
      height = Math.max(1, bbox.height);
    }
  }

  const renderObjectSvg = (obj: PixoraObject): string => {
    if (!obj.visible) return '';
    const cx = obj.x + obj.width / 2;
    const cy = obj.y + obj.height / 2;
    const transform = obj.rotation ? `transform="rotate(${obj.rotation} ${cx} ${cy})"` : '';
    const opacity = obj.opacity < 1 ? `opacity="${obj.opacity}"` : '';

    switch (obj.type) {
      case 'frame': {
        const frame = obj as any;
        const childrenSvg = (frame.childIds || [])
          .map((cId: string) => (doc.objects[cId] ? renderObjectSvg(doc.objects[cId]) : ''))
          .join('\n');

        return `
          <g id="${frame.id}" data-name="${frame.name}" ${transform} ${opacity}>
            <title>${frame.name}</title>
            <rect x="${frame.x}" y="${frame.y}" width="${frame.width}" height="${frame.height}" rx="${frame.cornerRadius || 0}" ry="${frame.cornerRadius || 0}" fill="${frame.fill || '#ffffff'}" stroke="${frame.stroke || 'none'}" stroke-width="${frame.strokeWidth || 0}"/>
            ${childrenSvg}
          </g>
        `;
      }

      case 'rectangle': {
        const rect = obj as any;
        return `<rect id="${rect.id}" x="${rect.x}" y="${rect.y}" width="${rect.width}" height="${rect.height}" rx="${rect.cornerRadius || 0}" ry="${rect.cornerRadius || 0}" fill="${rect.fill || '#6366f1'}" stroke="${rect.stroke || 'none'}" stroke-width="${rect.strokeWidth || 0}" ${transform} ${opacity}/>`;
      }

      case 'ellipse': {
        const ellipse = obj as any;
        return `<ellipse id="${ellipse.id}" cx="${cx}" cy="${cy}" rx="${ellipse.width / 2}" ry="${ellipse.height / 2}" fill="${ellipse.fill || '#38bdf8'}" stroke="${ellipse.stroke || 'none'}" stroke-width="${ellipse.strokeWidth || 0}" ${transform} ${opacity}/>`;
      }

      case 'line': {
        const line = obj as any;
        return `<line id="${line.id}" x1="${line.x}" y1="${cy}" x2="${line.x + line.width}" y2="${cy}" stroke="${line.stroke || '#ffffff'}" stroke-width="${line.strokeWidth || 2}" stroke-linecap="${line.lineCap || 'round'}" ${transform} ${opacity}/>`;
      }

      case 'text': {
        const textObj = obj as any;
        const lines = String(textObj.text || '').split('\n');
        const fontSize = textObj.fontSize || 16;
        const lineHeight = fontSize * (textObj.lineHeight || 1.4);
        const anchor = textObj.textAlign === 'center' ? 'middle' : textObj.textAlign === 'right' ? 'end' : 'start';
        const startX = textObj.textAlign === 'center' ? cx : textObj.textAlign === 'right' ? textObj.x + textObj.width : textObj.x;

        const tspans = lines
          .map((line: string, i: number) => `<tspan x="${startX}" dy="${i === 0 ? 0 : lineHeight}">${line}</tspan>`)
          .join('');

        return `<text id="${textObj.id}" x="${startX}" y="${textObj.y + fontSize}" fill="${textObj.color || '#ffffff'}" font-family="${textObj.fontFamily || 'sans-serif'}" font-size="${fontSize}" font-weight="${textObj.fontWeight || 400}" text-anchor="${anchor}" ${transform} ${opacity}>${tspans}</text>`;
      }

      case 'image': {
        const img = obj as any;
        const asset = doc.assets[img.assetId];
        if (!asset?.dataUrl) return '';
        return `<image id="${img.id}" href="${asset.dataUrl}" x="${img.x}" y="${img.y}" width="${img.width}" height="${img.height}" preserveAspectRatio="xMidYMid slice" ${transform} ${opacity}/>`;
      }

      case 'group': {
        const group = obj as any;
        const groupChildren = (group.childIds || [])
          .map((cId: string) => (doc.objects[cId] ? renderObjectSvg(doc.objects[cId]) : ''))
          .join('\n');
        return `<g id="${group.id}" ${transform} ${opacity}>${groupChildren}</g>`;
      }

      default:
        return '';
    }
  };

  const bodyContent = targetObjects.map(renderObjectSvg).join('\n');

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="${originX} ${originY} ${width} ${height}" width="${width}" height="${height}">
  ${bodyContent}
</svg>`;
}
