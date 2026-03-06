import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { uploadProfilePicture, uploadCoverPhoto } from '../lib/storage';
import { Camera, CreditCard as Edit2, Save, X } from 'lucide-react';
import { PostCard } from '../components/posts/PostCard';

interface PostData {
  id: string;
  user_id: string;
  content: string;
  image_url: string | null;
  created_at: string;
}

export function Profile() {
  const { profile, updateProfile } = useAuth();
  const [posts, setPosts] = useState<PostData[]>([]);
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    full_name: '',
    bio: '',
  });

  useEffect(() => {
    if (profile) {
      setFormData({
        full_name: profile.full_name,
        bio: profile.bio,
      });
      loadUserPosts();
    }
  }, [profile]);

  async function loadUserPosts() {
    if (!profile) return;

    const { data } = await supabase
      .from('posts')
      .select('*')
      .eq('user_id', profile.id)
      .order('created_at', { ascending: false });

    if (data) setPosts(data);
  }

  async function handleProfilePictureUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !profile) return;

    setLoading(true);
    try {
      const url = await uploadProfilePicture(profile.id, file);
      await updateProfile({ profile_picture: url });
    } catch (error) {
      console.error('Error uploading profile picture:', error);
      alert('Failed to upload profile picture');
    } finally {
      setLoading(false);
    }
  }

  async function handleCoverPhotoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !profile) return;

    setLoading(true);
    try {
      const url = await uploadCoverPhoto(profile.id, file);
      await updateProfile({ cover_photo: url });
    } catch (error) {
      console.error('Error uploading cover photo:', error);
      alert('Failed to upload cover photo');
    } finally {
      setLoading(false);
    }
  }

  async function handleSaveProfile() {
    setLoading(true);
    try {
      await updateProfile(formData);
      setIsEditing(false);
    } catch (error) {
      console.error('Error updating profile:', error);
      alert('Failed to update profile');
    } finally {
      setLoading(false);
    }
  }

  if (!profile) return null;

  return (
    <div className="max-w-4xl mx-auto">
      <div className="card overflow-hidden">
        <div className="relative h-48 bg-gradient-to-r from-blue-400 to-purple-500">
          {profile.cover_photo && (
            <img
              src={profile.cover_photo}
              alt="Cover"
              className="w-full h-full object-cover"
            />
          )}
          <label className="absolute bottom-4 right-4 p-2 bg-white dark:bg-gray-800 rounded-full cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 shadow-lg">
            <input
              type="file"
              accept="image/*"
              onChange={handleCoverPhotoUpload}
              className="hidden"
              disabled={loading}
            />
            <Camera className="w-5 h-5" />
          </label>
        </div>

        <div className="px-6 pb-6">
          <div className="flex items-end justify-between -mt-16 mb-4">
            <div className="relative">
              {profile.profile_picture ? (
                <img
                  src={profile.profile_picture}
                  alt={profile.full_name}
                  className="w-32 h-32 rounded-full border-4 border-white dark:border-gray-800 object-cover"
                />
              ) : (
                <div className="w-32 h-32 rounded-full border-4 border-white dark:border-gray-800 bg-gray-300 dark:bg-gray-600" />
              )}
              <label className="absolute bottom-0 right-0 p-2 bg-white dark:bg-gray-800 rounded-full cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 shadow-lg">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleProfilePictureUpload}
                  className="hidden"
                  disabled={loading}
                />
                <Camera className="w-4 h-4" />
              </label>
            </div>

            <button
              onClick={() => (isEditing ? setIsEditing(false) : setIsEditing(true))}
              className="btn-secondary flex items-center space-x-2"
            >
              {isEditing ? (
                <>
                  <X className="w-4 h-4" />
                  <span>Cancel</span>
                </>
              ) : (
                <>
                  <Edit2 className="w-4 h-4" />
                  <span>Edit Profile</span>
                </>
              )}
            </button>
          </div>

          {isEditing ? (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Full Name</label>
                <input
                  type="text"
                  value={formData.full_name}
                  onChange={(e) =>
                    setFormData({ ...formData, full_name: e.target.value })
                  }
                  className="input-field"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Bio</label>
                <textarea
                  value={formData.bio}
                  onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                  className="input-field resize-none"
                  rows={3}
                  placeholder="Tell us about yourself..."
                />
              </div>

              <button
                onClick={handleSaveProfile}
                disabled={loading}
                className="btn-primary flex items-center space-x-2"
              >
                <Save className="w-4 h-4" />
                <span>{loading ? 'Saving...' : 'Save Changes'}</span>
              </button>
            </div>
          ) : (
            <div>
              <h1 className="text-2xl font-bold">{profile.full_name}</h1>
              <p className="text-gray-600 dark:text-gray-400">@{profile.username}</p>
              {profile.bio && (
                <p className="mt-3 text-gray-700 dark:text-gray-300">{profile.bio}</p>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="mt-6">
        <h2 className="text-xl font-bold mb-4 px-4">Posts</h2>
        <div className="space-y-4">
          {posts.length === 0 ? (
            <div className="card p-8 text-center">
              <p className="text-gray-500 dark:text-gray-400">No posts yet</p>
            </div>
          ) : (
            posts.map((post) => <PostCard key={post.id} post={post} />)
          )}
        </div>
      </div>
    </div>
  );
}