import React, { useState } from 'react';
import { ImageOff } from 'lucide-react';

interface EvidenceImageProps {
  src?: string;
  alt?: string;
  className?: string;
  fallbackText?: string;
}

export const EvidenceImage: React.FC<EvidenceImageProps> = ({
  src,
  alt = 'Evidence image',
  className = 'w-full h-48 object-cover rounded-xl',
  fallbackText = 'Evidence image unavailable',
}) => {
  const [hasError, setHasError] = useState(false);

  if (!src || hasError) {
    return (
      <div
        className={`flex flex-col items-center justify-center p-4 bg-slate-100 border border-slate-200 text-slate-500 rounded-xl ${className}`}
      >
        <ImageOff className="w-6 h-6 text-slate-400 mb-1" />
        <span className="text-[11px] font-semibold text-slate-500 text-center">
          {fallbackText}
        </span>
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      className={className}
      onError={() => setHasError(true)}
    />
  );
};
