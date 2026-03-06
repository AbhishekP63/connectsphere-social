import { X } from 'lucide-react';

interface LightboxProps {
  src: string;
  alt: string;
  onClose: () => void;
}

export function Lightbox({ src, alt, onClose }: LightboxProps) {
  return (
    <div className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4" onClick={onClose}>
      <button onClick={onClose} className="absolute top-4 right-4 p-2 bg-white/20 rounded-full hover:bg-white/30">
        <X className="w-6 h-6 text-white" />
      </button>
      <img
        src={src}
        alt={alt}
        className="max-w-full max-h-screen object-contain rounded-lg"
        onClick={(e) => e.stopPropagation()}
      />
    </div>
  );
}