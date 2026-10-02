import React, { useState } from 'react';
import { Disc3 } from 'lucide-react';

interface CoverImageProps {
  src: string;
  alt: string;
  accentHue?: string;
  className?: string;
}

export const CoverImage: React.FC<CoverImageProps> = ({
  src,
  alt,
  accentHue = '#FF0033',
  className = '',
}) => {
  const [hasError, setHasError] = useState(false);

  if (!src || hasError) {
    return (
      <div
        className={`relative flex flex-col items-center justify-center overflow-hidden bg-[#141418] text-neutral-300 select-none ${className}`}
        style={{
          backgroundImage: `radial-gradient(circle at 30% 25%, ${accentHue}33 0%, transparent 65%), radial-gradient(circle at 80% 80%, #ffffff0d 0%, transparent 50%)`,
        }}
      >
        <Disc3 className="w-10 h-10 text-neutral-400 opacity-70 mb-1.5" />
        <span className="px-3 text-center text-[11px] font-medium text-neutral-400 line-clamp-2">
          {alt}
        </span>
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      referrerPolicy="no-referrer"
      onError={() => setHasError(true)}
      className={`object-cover ${className}`}
    />
  );
};
