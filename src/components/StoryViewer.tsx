import { X, ChevronLeft, ChevronRight } from 'lucide-react';
import { useState } from 'react';

interface Story {
  id: string;
  image_url: string;
  user_id: string;
  created_at: string;
}

interface StoryViewerProps {
  stories: Story[];
  initialIndex: number;
  onClose: () => void;
}

export function StoryViewer({ stories, initialIndex, onClose }: StoryViewerProps) {
  const [current, setCurrent] = useState(initialIndex);

  function next() { if (current < stories.length - 1) setCurrent(current + 1); else onClose(); }
  function prev() { if (current > 0) setCurrent(current - 1); }

  return (
    <div className="fixed inset-0 z-50 bg-black flex items-center justify-center" onClick={onClose}>
      <button onClick={onClose} className="absolute top-4 right-4 p-2 bg-white/20 rounded-full z-10">
        <X className="w-6 h-6 text-white" />
      </button>

      {/* Progress bars */}
      <div className="absolute top-4 left-4 right-16 flex space-x-1 z-10">
        {stories.map((_, i) => (
          <div key={i} className="flex-1 h-1 rounded-full bg-white/30">
            <div className={`h-full rounded-full bg-white ${i < current ? 'w-full' : i === current ? 'w-full' : 'w-0'}`} />
          </div>
        ))}
      </div>

      {/* Story image */}
      <img
        src={stories[current].image_url}
        alt="Story"
        className="max-w-sm w-full max-h-screen object-contain"
        onClick={(e) => e.stopPropagation()}
      />

      {/* Prev/Next */}
      {current > 0 && (
        <button onClick={(e) => { e.stopPropagation(); prev(); }} className="absolute left-4 p-2 bg-white/20 rounded-full">
          <ChevronLeft className="w-6 h-6 text-white" />
        </button>
      )}
      {current < stories.length - 1 && (
        <button onClick={(e) => { e.stopPropagation(); next(); }} className="absolute right-4 p-2 bg-white/20 rounded-full">
          <ChevronRight className="w-6 h-6 text-white" />
        </button>
      )}
    </div>
  );
}