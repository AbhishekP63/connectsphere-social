import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { PostCard } from '../components/posts/PostCard';
import { UserPlus, UserCheck, X } from 'lucide-react';
import type { Profile } from '../types/database';

interface PostData {
  id: string;
  user_id: string;
  content: string;
  image_url: string | null;
  created_at: string;
}

interface UserProfileProps {
  userId: string;
  onClose: () => void;
}

export function UserProfile({ userId, onClose }: UserProfileProps) {
  const { profile: currentUser } = useAuth();
  const [userProfile, setUserProfile] = useState<Profile | null>(null);
  const [posts, setPosts] = useState<PostData[]>([]);
  const [friendStatus, setFriendStatus] = useState<'none' | 'pending' | 'accepted'>('none');

  useEffect(() => {
    loadProfile();
    loadPosts();
    checkFriendStatus();
  }, [userId]);

  async function loadProfile() {
    const { data } = await supabase.from('profiles').select('*').eq('id', userId).maybeSingle();
    if (data) setUserProfile(data);
  }

  async function loadPosts() {
    const { data } = await supabase.from('posts').select('*').eq('user_id', userId).order('created_at', { ascending: false });
    if (data) setPosts(data);
  }

  async function checkFriendStatus() {
    if (!currentUser) return;
    const { data } = await supabase.from('friendships').select('status')
      .or(`and(requester_id.eq.${currentUser.id},recipient_id.eq.${userId}),and(requester_id.eq.${userId},recipient_id.eq.${currentUser.id})`)
      .maybeSingle();
    if (data) setFriendStatus(data.status as any);
  }

  async function sendFriendRequest() {
    if (!currentUser) return;
    await supabase.from('friendships').insert({ requester_id: currentUser.id, recipient_id: userId, status: 'pending' });
    await supabase.from('notifications').insert({ user_id: userId, actor_id: currentUser.id, type: 'friend_request' });
    setFriendStatus('pending');
  }

  if (!userProfile) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white dark:bg-gray-800 rounded-2xl w-full max-w-lg max-h-screen overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        {/* Cover */}
        <div className="relative h-32 bg-gradient-to-r from-blue-400 to-purple-500 rounded-t-2xl">
          {userProfile.cover_photo && <img src={userProfile.cover_photo} alt="Cover" className="w-full h-full object-cover rounded-t-2xl" />}
          <button onClick={onClose} className="absolute top-3 right-3 p-1.5 bg-black/30 rounded-full hover:bg-black/50">
            <X className="w-5 h-5 text-white" />
          </button>
        </div>

        <div className="px-5 pb-5">
          <div className="flex items-end justify-between -mt-12 mb-4">
            {userProfile.profile_picture ? (
              <img src={userProfile.profile_picture} alt={userProfile.full_name} className="w-20 h-20 rounded-full border-4 border-white dark:border-gray-800 object-cover" />
            ) : (
              <div className="w-20 h-20 rounded-full border-4 border-white dark:border-gray-800 bg-gray-300 dark:bg-gray-600" />
            )}

            {currentUser?.id !== userId && (
              <button
                onClick={friendStatus === 'none' ? sendFriendRequest : undefined}
                className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-sm font-medium ${
                  friendStatus === 'accepted' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' :
                  friendStatus === 'pending' ? 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400' :
                  'bg-blue-600 text-white hover:bg-blue-700'
                }`}
              >
                {friendStatus === 'accepted' ? <><UserCheck className="w-4 h-4" /><span>Friends</span></> :
                 friendStatus === 'pending' ? <><UserPlus className="w-4 h-4" /><span>Pending</span></> :
                 <><UserPlus className="w-4 h-4" /><span>Add Friend</span></>}
              </button>
            )}
          </div>

          <h2 className="text-xl font-bold">{userProfile.full_name}</h2>
          <p className="text-gray-500 dark:text-gray-400 text-sm">@{userProfile.username}</p>
          {userProfile.bio && <p className="mt-2 text-gray-700 dark:text-gray-300 text-sm">{userProfile.bio}</p>}
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{posts.length} posts</p>

          <div className="mt-4 space-y-3">
            <h3 className="font-semibold">Posts</h3>
            {posts.length === 0 ? (
              <p className="text-gray-500 text-sm text-center py-4">No posts yet</p>
            ) : (
              posts.map((post) => <PostCard key={post.id} post={post} />)
            )}
          </div>
        </div>
      </div>
    </div>
  );
}