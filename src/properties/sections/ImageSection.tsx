import React, { useRef } from 'react';
import { Upload } from 'lucide-react';
import { ImageObject } from '../../types/document';
import { useDocument } from '../../document/documentContext';
import { importImageFile } from '../../import/imageImporter';

interface ImageSectionProps {
  object: ImageObject;
}

export const ImageSection: React.FC<ImageSectionProps> = ({ object }) => {
  const { document, updateObjectProperties } = useDocument();
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const asset = document.assets[object.assetId];

  const handleFitChange = (fit: 'cover' | 'contain' | 'fill') => {
    updateObjectProperties(object.id, { fit }, 'Change image fit');
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const { asset: newAsset } = await importImageFile(file, object.x, object.y);
      updateObjectProperties(object.id, { assetId: newAsset.id }, 'Replace image', newAsset);
    } catch (err: any) {
      alert(err.message || 'Failed to replace image.');
    }
    e.target.value = '';
  };

  return (
    <div className="border-b border-pixora-border p-3 space-y-3">
      <input
        ref={fileInputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp,image/svg+xml"
        className="hidden"
        onChange={handleFileChange}
      />

      <div className="text-xs font-semibold text-pixora-text-muted uppercase tracking-wider">
        Image
      </div>

      {/* Fit Mode */}
      <div className="flex items-center justify-between text-xs">
        <span className="text-pixora-text-dim">Fit Mode</span>
        <select
          value={object.fit || 'cover'}
          onChange={e => handleFitChange(e.target.value as any)}
          className="bg-pixora-elevated text-pixora-text border border-pixora-border rounded px-2 py-1 outline-none text-xs"
        >
          <option value="cover">Cover</option>
          <option value="contain">Contain</option>
          <option value="fill">Fill</option>
        </select>
      </div>

      {/* Replace Image Button */}
      <button
        onClick={() => fileInputRef.current?.click()}
        className="w-full flex items-center justify-center space-x-1.5 py-1.5 bg-pixora-elevated hover:bg-pixora-hover text-xs font-medium text-pixora-text rounded border border-pixora-border transition-colors"
      >
        <Upload size={13} />
        <span>Replace Image</span>
      </button>

      {asset && (
        <div className="text-[11px] text-pixora-text-dim text-center">
          Original: {asset.width} × {asset.height} px
        </div>
      )}
    </div>
  );
};
