import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import { Heart, MessageCircle, Share2, Send, Trash2 } from 'lucide-react';
import type { Profile } from '../../types/database';

interface PostData {
  id: string;
  user_id: string;
  content: string;
  image_url: string | null;
  created_at: string;
}

interface PostCardProps {
  post: PostData;
}

interface CommentData {
  id: string;
  content: string;
  created_at: string;
  user_id: string;
  profiles: Profile;
}

export function PostCard({ post }: PostCardProps) {
  const { profile } = useAuth();
  const [author, setAuthor] = useState<Profile | null>(null);
  const [likes, setLikes] = useState<string[]>([]);
  const [comments, setComments] = useState<CommentData[]>([]);
  const [showComments, setShowComments] = useState(false);
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(false);
  const [shareMsg, setShareMsg] = useState('');

  const isLiked = profile ? likes.includes(profile.id) : false;

  useEffect(() => {
    loadPostData();

    const likesChannel = supabase
      .channel(`post-likes-${post.id}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'likes', filter: `post_id=eq.${post.id}` }, () => loadLikes())
      .subscribe();

    const commentsChannel = supabase
      .channel(`post-comments-${post.id}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'comments', filter: `post_id=eq.${post.id}` }, () => loadComments())
      .subscribe();

    return () => {
      likesChannel.unsubscribe();
      commentsChannel.unsubscribe();
    };
  }, [post.id]);

  async function loadPostData() {
    await Promise.all([loadAuthor(), loadLikes(), loadComments()]);
  }

  async function loadAuthor() {
    const { data } = await supabase.from('profiles').select('*').eq('id', post.user_id).maybeSingle();
    if (data) setAuthor(data);
  }

  async function loadLikes() {
    const { data } = await supabase.from('likes').select('user_id').eq('post_id', post.id);
    if (data) setLikes(data.map((like: { user_id: string }) => like.user_id));
  }

  async function loadComments() {
    const { data } = await supabase.from('comments').select('*, profiles(*)').eq('post_id', post.id).order('created_at', { ascending: true });
    if (data) setComments(data as CommentData[]);
  }

  async function toggleLike() {
    if (!profile) return;
    // Optimistic update — instant UI change no refresh needed
    if (isLiked) {
      setLikes((prev) => prev.filter((id) => id !== profile.id));
      await supabase.from('likes').delete().eq('post_id', post.id).eq('user_id', profile.id);
    } else {
      setLikes((prev) => [...prev, profile.id]);
      await supabase.from('likes').insert({ post_id: post.id, user_id: profile.id });
      if (post.user_id !== profile.id) {
        await supabase.from('notifications').insert({ user_id: post.user_id, actor_id: profile.id, type: 'like', post_id: post.id });
      }
    }
  }

  async function handleComment(e: React.FormEvent) {
    e.preventDefault();
    if (!profile || !newComment.trim()) return;
    setLoading(true);
    try {
      const { error } = await supabase.from('comments').insert({ post_id: post.id, user_id: profile.id, content: newComment.trim() });
      if (error) throw error;
      if (post.user_id !== profile.id) {
        await supabase.from('notifications').insert({ user_id: post.user_id, actor_id: profile.id, type: 'comment', post_id: post.id });
      }
      setNewComment('');
    } catch (error) {
      console.error('Error posting comment:', error);
    } finally {
      setLoading(false);
    }
  }


  async function deletePost() {
    if (!profile || post.user_id !== profile.id) return;
    if (!confirm('Delete this post?')) return;
    await supabase.from('posts').delete().eq('id', post.id);
  }

  function handleShare() {
    const shareText = post.content || 'Check out this post on ConnectSphere!';
    if (navigator.share) {
      navigator.share({ title: 'ConnectSphere Post', text: shareText, url: window.location.href }).catch(() => {});
    } else {
      navigator.clipboard.writeText(window.location.href).then(() => {
        setShareMsg('Link copied!');
        setTimeout(() => setShareMsg(''), 2000);
      });
    }
  }

  function formatDate(dateString: string) {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMs = now.getTime() - date.getTime();
    const diffInMins = Math.floor(diffInMs / 60000);
    const diffInHours = Math.floor(diffInMins / 60);
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInMins < 1) return 'Just now';
    if (diffInMins < 60) return `${diffInMins}m ago`;
    if (diffInHours < 24) return `${diffInHours}h ago`;
    if (diffInDays < 7) return `${diffInDays}d ago`;
    return date.toLocaleDateString();
  }

  if (!author) return null;

  return (
    <div className="card p-4">
      <div className="flex items-start space-x-3">
        {author.profile_picture ? (
          <img src={author.profile_picture} alt={author.full_name} className="w-10 h-10 rounded-full object-cover" />
        ) : (
          <div className="w-10 h-10 rounded-full bg-gray-300 dark:bg-gray-600" />
        )}

        <div className="flex-1 min-w-0">
          <div className="flex items-center space-x-2">
            <span className="font-semibold">{author.full_name}</span>
            <span className="text-sm text-gray-500 dark:text-gray-400">@{author.username}</span>
            <span className="text-sm text-gray-500 dark:text-gray-400">·</span>
            <span className="text-sm text-gray-500 dark:text-gray-400">{formatDate(post.created_at)}</span>
          </div>

          {post.content && (
            <p className="mt-2 text-gray-900 dark:text-gray-100 whitespace-pre-wrap">{post.content}</p>
          )}

          {post.image_url && (
            <img src={post.image_url} alt="Post content" className="mt-3 rounded-lg max-h-96 object-contain w-full" />
          )}

          <div className="flex items-center space-x-6 mt-4">
            {/* Like Button */}
            <button
              onClick={toggleLike}
              className={`flex items-center space-x-2 transition-colors ${isLiked ? 'text-red-500' : 'text-gray-600 dark:text-gray-400 hover:text-red-500'}`}
            >
              <Heart className={`w-5 h-5 ${isLiked ? 'fill-current' : ''}`} />
              <span className="text-sm">{likes.length}</span>
            </button>

            {/* Comment Button */}
            <button
              onClick={() => setShowComments(!showComments)}
              className="flex items-center space-x-2 text-gray-600 dark:text-gray-400 hover:text-blue-500 transition-colors"
            >
              <MessageCircle className="w-5 h-5" />
              <span className="text-sm">{comments.length}</span>
            </button>

            {/* Delete Button - only for post owner */}
            {profile?.id === post.user_id && (
              <button onClick={deletePost} className="flex items-center space-x-2 text-gray-600 dark:text-gray-400 hover:text-red-500 transition-colors ml-auto">
                <Trash2 className="w-5 h-5" />
              </button>
            )}

            {/* Share Button - Fixed */}
            <div className="relative">
              <button
                onClick={handleShare}
                className="flex items-center space-x-2 text-gray-600 dark:text-gray-400 hover:text-green-500 transition-colors"
              >
                <Share2 className="w-5 h-5" />
              </button>
              {shareMsg && (
                <span className="absolute -top-8 left-0 bg-gray-800 text-white text-xs px-2 py-1 rounded whitespace-nowrap">
                  {shareMsg}
                </span>
              )}
            </div>
          </div>

          {showComments && (
            <div className="mt-4 space-y-3 border-t border-gray-200 dark:border-gray-700 pt-4">
              {comments.map((comment) => (
                <div key={comment.id} className="flex items-start space-x-2">
                  {comment.profiles.profile_picture ? (
                    <img src={comment.profiles.profile_picture} alt={comment.profiles.full_name} className="w-8 h-8 rounded-full object-cover" />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-gray-300 dark:bg-gray-600" />
                  )}
                  <div className="flex-1 bg-gray-100 dark:bg-gray-700 rounded-lg p-2">
                    <div className="flex items-center space-x-2">
                      <span className="font-semibold text-sm">{comment.profiles.full_name}</span>
                      <span className="text-xs text-gray-500 dark:text-gray-400">{formatDate(comment.created_at)}</span>
                    </div>
                    <p className="text-sm mt-1">{comment.content}</p>
                  </div>
                </div>
              ))}

              <form onSubmit={handleComment} className="flex items-center space-x-2">
                <input
                  type="text"
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder="Write a comment..."
                  className="input-field text-sm"
                />
                <button
                  type="submit"
                  disabled={loading || !newComment.trim()}
                  className="p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Send className="w-4 h-4" />
                </button>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}