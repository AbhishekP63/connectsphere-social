import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { Send } from 'lucide-react';
import type { Profile, Message as MessageType, UserStatus } from '../types/database';

interface ConversationUser extends Profile {
  user_status: UserStatus[];
}

export function Messages() {
  const { profile } = useAuth();
  const [friends, setFriends] = useState<ConversationUser[]>([]);
  const [selectedFriend, setSelectedFriend] = useState<ConversationUser | null>(null);
  const [messages, setMessages] = useState<MessageType[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadFriends();
  }, [profile]);

  useEffect(() => {
    if (selectedFriend) {
      loadMessages();
      markMessagesAsRead();

      const channel = supabase
        .channel(`messages-${selectedFriend.id}`)
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'messages',
            filter: `sender_id=eq.${selectedFriend.id},recipient_id=eq.${profile?.id}`,
          },
          () => {
            loadMessages();
            markMessagesAsRead();
          }
        )
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'messages',
            filter: `sender_id=eq.${profile?.id},recipient_id=eq.${selectedFriend.id}`,
          },
          () => loadMessages()
        )
        .subscribe();

      return () => {
        channel.unsubscribe();
      };
    }
  }, [selectedFriend, profile]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  async function loadFriends() {
    if (!profile) return;

    const { data: friendships } = await supabase
      .from('friendships')
      .select('requester_id, recipient_id')
      .eq('status', 'accepted')
      .or(`requester_id.eq.${profile.id},recipient_id.eq.${profile.id}`);

    if (!friendships) return;

    const friendIds = friendships.map((f) =>
      f.requester_id === profile.id ? f.recipient_id : f.requester_id
    );

    const { data: friendProfiles } = await supabase
      .from('profiles')
      .select('*, user_status(*)')
      .in('id', friendIds);

    if (friendProfiles) {
      setFriends(friendProfiles as ConversationUser[]);
    }
  }

  async function loadMessages() {
    if (!profile || !selectedFriend) return;

    const { data } = await supabase
      .from('messages')
      .select('*')
      .or(
        `and(sender_id.eq.${profile.id},recipient_id.eq.${selectedFriend.id}),and(sender_id.eq.${selectedFriend.id},recipient_id.eq.${profile.id})`
      )
      .order('created_at', { ascending: true });

    if (data) setMessages(data);
  }

  async function markMessagesAsRead() {
    if (!profile || !selectedFriend) return;

    await supabase
      .from('messages')
      .update({ is_read: true })
      .eq('sender_id', selectedFriend.id)
      .eq('recipient_id', profile.id)
      .eq('is_read', false);
  }

  async function sendMessage(e: React.FormEvent) {
    e.preventDefault();
    if (!profile || !selectedFriend || !newMessage.trim()) return;

    const { error } = await supabase.from('messages').insert({
      sender_id: profile.id,
      recipient_id: selectedFriend.id,
      content: newMessage.trim(),
    });

    if (error) {
      console.error('Error sending message:', error);
      return;
    }

    await supabase.from('notifications').insert({
      user_id: selectedFriend.id,
      actor_id: profile.id,
      type: 'message',
    });

    setNewMessage('');
  }

  function formatMessageTime(dateString: string) {
    const date = new Date(dateString);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }

  return (
    <div className="max-w-6xl mx-auto py-6 px-4">
      <div className="card overflow-hidden flex" style={{ height: 'calc(100vh - 12rem)' }}>
        <div className="w-80 border-r border-gray-200 dark:border-gray-700 overflow-y-auto">
          <div className="p-4 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-xl font-bold">Messages</h2>
          </div>

          <div className="divide-y divide-gray-200 dark:divide-gray-700">
            {friends.map((friend) => {
              const isOnline = friend.user_status?.[0]?.is_online || false;
              return (
                <button
                  key={friend.id}
                  onClick={() => setSelectedFriend(friend)}
                  className={`w-full p-4 flex items-center space-x-3 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-left ${
                    selectedFriend?.id === friend.id
                      ? 'bg-blue-50 dark:bg-blue-900/20'
                      : ''
                  }`}
                >
                  <div className="relative">
                    {friend.profile_picture ? (
                      <img
                        src={friend.profile_picture}
                        alt={friend.full_name}
                        className="w-12 h-12 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-full bg-gray-300 dark:bg-gray-600" />
                    )}
                    {isOnline && (
                      <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white dark:border-gray-800" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold truncate">{friend.full_name}</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400 truncate">
                      {isOnline ? 'Online' : 'Offline'}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        <div className="flex-1 flex flex-col">
          {selectedFriend ? (
            <>
              <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex items-center space-x-3">
                {selectedFriend.profile_picture ? (
                  <img
                    src={selectedFriend.profile_picture}
                    alt={selectedFriend.full_name}
                    className="w-10 h-10 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-gray-300 dark:bg-gray-600" />
                )}
                <div>
                  <p className="font-semibold">{selectedFriend.full_name}</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {selectedFriend.user_status?.[0]?.is_online ? 'Online' : 'Offline'}
                  </p>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {messages.map((message) => {
                  const isMine = message.sender_id === profile?.id;
                  return (
                    <div
                      key={message.id}
                      className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                          isMine
                            ? 'bg-blue-600 text-white'
                            : 'bg-gray-200 dark:bg-gray-700'
                        }`}
                      >
                        <p>{message.content}</p>
                        <p
                          className={`text-xs mt-1 ${
                            isMine ? 'text-blue-100' : 'text-gray-500 dark:text-gray-400'
                          }`}
                        >
                          {formatMessageTime(message.created_at)}
                        </p>
                      </div>
                    </div>
                  );
                })}
                <div ref={messagesEndRef} />
              </div>

              <form onSubmit={sendMessage} className="p-4 border-t border-gray-200 dark:border-gray-700">
                <div className="flex space-x-2">
                  <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Type a message..."
                    className="input-field"
                  />
                  <button
                    type="submit"
                    disabled={!newMessage.trim()}
                    className="btn-primary"
                  >
                    <Send className="w-5 h-5" />
                  </button>
                </div>
              </form>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-gray-500 dark:text-gray-400">
              Select a friend to start messaging
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
