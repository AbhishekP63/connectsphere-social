import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { UserPlus, UserCheck, UserX, Search } from 'lucide-react';
import type { Profile, Friendship } from '../types/database';

interface FriendshipWithProfile extends Friendship {
  requester_profile?: Profile;
  recipient_profile?: Profile;
}

export function Friends() {
  const { profile } = useAuth();
  const [activeTab, setActiveTab] = useState<'friends' | 'requests' | 'search'>('friends');
  const [friends, setFriends] = useState<Profile[]>([]);
  const [pendingRequests, setPendingRequests] = useState<FriendshipWithProfile[]>([]);
  const [sentRequests, setSentRequests] = useState<FriendshipWithProfile[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadFriends();
    loadRequests();

    const friendshipsChannel = supabase
      .channel('friendships-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'friendships',
        },
        () => {
          loadFriends();
          loadRequests();
        }
      )
      .subscribe();

    return () => {
      friendshipsChannel.unsubscribe();
    };
  }, [profile]);

  async function loadFriends() {
    if (!profile) return;

    const { data } = await supabase
      .from('friendships')
      .select('requester_id, recipient_id, requester_profile:profiles!friendships_requester_id_fkey(*), recipient_profile:profiles!friendships_recipient_id_fkey(*)')
      .eq('status', 'accepted')
      .or(`requester_id.eq.${profile.id},recipient_id.eq.${profile.id}`);

    if (data) {
      const friendProfiles = data.map((f: FriendshipWithProfile) =>
        f.requester_id === profile.id ? f.recipient_profile! : f.requester_profile!
      );
      setFriends(friendProfiles);
    }
  }

  async function loadRequests() {
    if (!profile) return;

    const { data: received } = await supabase
      .from('friendships')
      .select('*, requester_profile:profiles!friendships_requester_id_fkey(*)')
      .eq('recipient_id', profile.id)
      .eq('status', 'pending');

    const { data: sent } = await supabase
      .from('friendships')
      .select('*, recipient_profile:profiles!friendships_recipient_id_fkey(*)')
      .eq('requester_id', profile.id)
      .eq('status', 'pending');

    if (received) setPendingRequests(received as FriendshipWithProfile[]);
    if (sent) setSentRequests(sent as FriendshipWithProfile[]);
  }

  async function handleSearch() {
    if (!searchQuery.trim() || !profile) return;

    setLoading(true);
    try {
      const { data } = await supabase
        .from('profiles')
        .select('*')
        .or(`username.ilike.%${searchQuery}%,full_name.ilike.%${searchQuery}%`)
        .neq('id', profile.id)
        .limit(10);

      setSearchResults(data || []);
    } catch (error) {
      console.error('Error searching users:', error);
    } finally {
      setLoading(false);
    }
  }

  async function sendFriendRequest(userId: string) {
    if (!profile) return;

    try {
      const { error } = await supabase.from('friendships').insert({
        requester_id: profile.id,
        recipient_id: userId,
        status: 'pending',
      });

      if (error) throw error;

      await supabase.from('notifications').insert({
        user_id: userId,
        actor_id: profile.id,
        type: 'friend_request',
      });

      await loadRequests();
      setSearchResults(searchResults.filter((u) => u.id !== userId));
    } catch (error) {
      console.error('Error sending friend request:', error);
    }
  }

  async function acceptRequest(requestId: string, senderId: string) {
    try {
      const { error } = await supabase
        .from('friendships')
        .update({ status: 'accepted' })
        .eq('id', requestId);

      if (error) throw error;

      await supabase.from('notifications').insert({
        user_id: senderId,
        actor_id: profile!.id,
        type: 'friend_accept',
      });

      await loadFriends();
      await loadRequests();
    } catch (error) {
      console.error('Error accepting request:', error);
    }
  }

  async function rejectRequest(requestId: string) {
    try {
      const { error } = await supabase
        .from('friendships')
        .delete()
        .eq('id', requestId);

      if (error) throw error;

      await loadRequests();
    } catch (error) {
      console.error('Error rejecting request:', error);
    }
  }

  async function cancelRequest(requestId: string) {
    try {
      const { error } = await supabase
        .from('friendships')
        .delete()
        .eq('id', requestId);

      if (error) throw error;

      await loadRequests();
    } catch (error) {
      console.error('Error canceling request:', error);
    }
  }

  function isAlreadyFriend(userId: string) {
    return friends.some((f) => f.id === userId);
  }

  function hasPendingRequest(userId: string) {
    return sentRequests.some((r) => r.recipient_id === userId);
  }

  return (
    <div className="max-w-4xl mx-auto py-6 px-4">
      <div className="card p-6">
        <div className="flex space-x-4 mb-6 border-b border-gray-200 dark:border-gray-700">
          <button
            onClick={() => setActiveTab('friends')}
            className={`pb-3 px-2 font-medium transition-colors ${
              activeTab === 'friends'
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-600 dark:text-gray-400'
            }`}
          >
            Friends ({friends.length})
          </button>
          <button
            onClick={() => setActiveTab('requests')}
            className={`pb-3 px-2 font-medium transition-colors ${
              activeTab === 'requests'
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-600 dark:text-gray-400'
            }`}
          >
            Requests ({pendingRequests.length})
          </button>
          <button
            onClick={() => setActiveTab('search')}
            className={`pb-3 px-2 font-medium transition-colors ${
              activeTab === 'search'
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-600 dark:text-gray-400'
            }`}
          >
            Search
          </button>
        </div>

        {activeTab === 'friends' && (
          <div className="space-y-3">
            {friends.length === 0 ? (
              <p className="text-center text-gray-500 dark:text-gray-400 py-8">
                No friends yet. Search for people to connect with!
              </p>
            ) : (
              friends.map((friend) => (
                <div
                  key={friend.id}
                  className="flex items-center justify-between p-3 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg"
                >
                  <div className="flex items-center space-x-3">
                    {friend.profile_picture ? (
                      <img
                        src={friend.profile_picture}
                        alt={friend.full_name}
                        className="w-12 h-12 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-full bg-gray-300 dark:bg-gray-600" />
                    )}
                    <div>
                      <p className="font-semibold">{friend.full_name}</p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        @{friend.username}
                      </p>
                    </div>
                  </div>
                  <UserCheck className="w-5 h-5 text-green-600" />
                </div>
              ))
            )}
          </div>
        )}

        {activeTab === 'requests' && (
          <div className="space-y-6">
            {pendingRequests.length > 0 && (
              <div>
                <h3 className="font-semibold mb-3">Received Requests</h3>
                <div className="space-y-3">
                  {pendingRequests.map((request) => (
                    <div
                      key={request.id}
                      className="flex items-center justify-between p-3 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg"
                    >
                      <div className="flex items-center space-x-3">
                        {request.requester_profile?.profile_picture ? (
                          <img
                            src={request.requester_profile.profile_picture}
                            alt={request.requester_profile.full_name}
                            className="w-12 h-12 rounded-full object-cover"
                          />
                        ) : (
                          <div className="w-12 h-12 rounded-full bg-gray-300 dark:bg-gray-600" />
                        )}
                        <div>
                          <p className="font-semibold">
                            {request.requester_profile?.full_name}
                          </p>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            @{request.requester_profile?.username}
                          </p>
                        </div>
                      </div>
                      <div className="flex space-x-2">
                        <button
                          onClick={() => acceptRequest(request.id, request.requester_id)}
                          className="btn-primary text-sm"
                        >
                          Accept
                        </button>
                        <button
                          onClick={() => rejectRequest(request.id)}
                          className="btn-secondary text-sm"
                        >
                          Decline
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {sentRequests.length > 0 && (
              <div>
                <h3 className="font-semibold mb-3">Sent Requests</h3>
                <div className="space-y-3">
                  {sentRequests.map((request) => (
                    <div
                      key={request.id}
                      className="flex items-center justify-between p-3 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg"
                    >
                      <div className="flex items-center space-x-3">
                        {request.recipient_profile?.profile_picture ? (
                          <img
                            src={request.recipient_profile.profile_picture}
                            alt={request.recipient_profile.full_name}
                            className="w-12 h-12 rounded-full object-cover"
                          />
                        ) : (
                          <div className="w-12 h-12 rounded-full bg-gray-300 dark:bg-gray-600" />
                        )}
                        <div>
                          <p className="font-semibold">
                            {request.recipient_profile?.full_name}
                          </p>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            @{request.recipient_profile?.username}
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={() => cancelRequest(request.id)}
                        className="btn-secondary text-sm"
                      >
                        Cancel
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {pendingRequests.length === 0 && sentRequests.length === 0 && (
              <p className="text-center text-gray-500 dark:text-gray-400 py-8">
                No pending requests
              </p>
            )}
          </div>
        )}

        {activeTab === 'search' && (
          <div>
            <div className="flex space-x-2 mb-4">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                placeholder="Search by name or username..."
                className="input-field"
              />
              <button onClick={handleSearch} disabled={loading} className="btn-primary">
                <Search className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3">
              {searchResults.map((user) => (
                <div
                  key={user.id}
                  className="flex items-center justify-between p-3 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg"
                >
                  <div className="flex items-center space-x-3">
                    {user.profile_picture ? (
                      <img
                        src={user.profile_picture}
                        alt={user.full_name}
                        className="w-12 h-12 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-full bg-gray-300 dark:bg-gray-600" />
                    )}
                    <div>
                      <p className="font-semibold">{user.full_name}</p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        @{user.username}
                      </p>
                    </div>
                  </div>

                  {isAlreadyFriend(user.id) ? (
                    <div className="flex items-center space-x-2 text-green-600">
                      <UserCheck className="w-5 h-5" />
                      <span className="text-sm">Friends</span>
                    </div>
                  ) : hasPendingRequest(user.id) ? (
                    <span className="text-sm text-gray-500">Request Sent</span>
                  ) : (
                    <button
                      onClick={() => sendFriendRequest(user.id)}
                      className="btn-primary text-sm flex items-center space-x-2"
                    >
                      <UserPlus className="w-4 h-4" />
                      <span>Add Friend</span>
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
