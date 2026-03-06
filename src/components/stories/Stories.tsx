import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import { uploadStory } from '../../lib/storage';
import { Plus, X } from 'lucide-react';
import type { Profile } from '../../types/database';

interface StoryData {
  id: string;
  user_id: string;
  image_url: string;
  created_at: string;
  expires_at: string;
  profiles: Profile;
}

export function Stories() {
  const { profile } = useAuth();
  const [stories, setStories] = useState<StoryData[]>([]);
  const [selectedStory, setSelectedStory] = useState<StoryData | null>(null);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    loadStories();

    const channel = supabase
      .channel('stories-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'stories',
        },
        () => loadStories()
      )
      .subscribe();

    return () => {
      channel.unsubscribe();
    };
  }, [profile]);

  async function loadStories() {
    if (!profile) return;

    const { data: friendships } = await supabase
      .from('friendships')
      .select('requester_id, recipient_id')
      .eq('status', 'accepted')
      .or(`requester_id.eq.${profile.id},recipient_id.eq.${profile.id}`);

    const friendIds = friendships?.map((f) =>
      f.requester_id === profile.id ? f.recipient_id : f.requester_id
    ) || [];

    const userIds = [profile.id, ...friendIds];

    const { data } = await supabase
      .from('stories')
      .select('*, profiles(*)')
      .in('user_id', userIds)
      .gt('expires_at', new Date().toISOString())
      .order('created_at', { ascending: false });

    if (data) {
      const groupedStories = data.reduce((acc, story) => {
        const existing = acc.find((s) => s.user_id === story.user_id);
        if (!existing) {
          acc.push(story as StoryData);
        }
        return acc;
      }, [] as StoryData[]);

      setStories(groupedStories);
    }
  }

  async function handleAddStory(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !profile) return;

    setUploading(true);
    try {
      const imageUrl = await uploadStory(profile.id, file);

      const { error } = await supabase.from('stories').insert({
        user_id: profile.id,
        image_url: imageUrl,
      });

      if (error) throw error;
    } catch (error) {
      console.error('Error uploading story:', error);
      alert('Failed to upload story');
    } finally {
      setUploading(false);
    }
  }

  return (
    <>
      <div className="card p-4">
        <div className="flex space-x-4 overflow-x-auto pb-2">
          <div className="flex flex-col items-center flex-shrink-0">
            <label className="cursor-pointer">
              <input
                type="file"
                accept="image/*"
                onChange={handleAddStory}
                className="hidden"
                disabled={uploading}
              />
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white">
                <Plus className="w-8 h-8" />
              </div>
            </label>
            <span className="text-xs mt-1 text-center">Add Story</span>
          </div>

          {stories.map((story) => (
            <div
              key={story.id}
              className="flex flex-col items-center flex-shrink-0 cursor-pointer"
              onClick={() => setSelectedStory(story)}
            >
              <div className="w-16 h-16 rounded-full p-0.5 bg-gradient-to-br from-purple-400 to-pink-600">
                {story.profiles.profile_picture ? (
                  <img
                    src={story.profiles.profile_picture}
                    alt={story.profiles.full_name}
                    className="w-full h-full rounded-full object-cover border-2 border-white dark:border-gray-800"
                  />
                ) : (
                  <div className="w-full h-full rounded-full bg-gray-300 dark:bg-gray-600 border-2 border-white dark:border-gray-800" />
                )}
              </div>
              <span className="text-xs mt-1 text-center max-w-[64px] truncate">
                {story.profiles.username}
              </span>
            </div>
          ))}
        </div>
      </div>

      {selectedStory && (
        <div
          className="fixed inset-0 z-50 bg-black bg-opacity-90 flex items-center justify-center p-4"
          onClick={() => setSelectedStory(null)}
        >
          <button
            onClick={() => setSelectedStory(null)}
            className="absolute top-4 right-4 text-white p-2 hover:bg-white/10 rounded-full"
          >
            <X className="w-6 h-6" />
          </button>

          <div className="max-w-lg w-full">
            <div className="flex items-center space-x-3 mb-4">
              {selectedStory.profiles.profile_picture ? (
                <img
                  src={selectedStory.profiles.profile_picture}
                  alt={selectedStory.profiles.full_name}
                  className="w-10 h-10 rounded-full object-cover"
                />
              ) : (
                <div className="w-10 h-10 rounded-full bg-gray-300" />
              )}
              <div>
                <p className="text-white font-semibold">
                  {selectedStory.profiles.full_name}
                </p>
                <p className="text-gray-300 text-sm">
                  {new Date(selectedStory.created_at).toLocaleString()}
                </p>
              </div>
            </div>

            <img
              src={selectedStory.image_url}
              alt="Story"
              className="w-full rounded-lg"
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        </div>
      )}
    </>
  );
}
