import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { conversationsAPI } from '../lib/api';
import { Card } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Avatar } from '../components/ui/avatar';
import { ArrowLeft, Send } from 'lucide-react';
import { formatDateTime } from '../lib/utils';
import { useAuth } from '../contexts/AuthContext';

const ConversationDetail = () => {
  const { conversationId } = useParams();
  const { user } = useAuth();
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);

  useEffect(() => {
    loadMessages();
  }, [conversationId]);

  const loadMessages = async () => {
    try {
      const response = await conversationsAPI.messages(conversationId);
      setMessages(response.data);
    } catch (error) {
      console.error('Error loading messages:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSend = async (e) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    setSending(true);
    try {
      await conversationsAPI.sendMessage(conversationId, newMessage);
      setNewMessage('');
      await loadMessages();
    } catch (error) {
      console.error('Error sending message:', error);
    } finally {
      setSending(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in" data-testid="conversation-detail">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link to="/messages">
          <Button variant="ghost" data-testid="back-button">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Retour
          </Button>
        </Link>
      </div>

      {/* Messages */}
      <Card className="h-[600px] flex flex-col">
        {/* Messages List */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {messages.map((message) => {
            const isMe = message.sender_type === 'professional';
            return (
              <div 
                key={message.id}
                className={`flex gap-3 ${isMe ? 'flex-row-reverse' : 'flex-row'}`}
                data-testid={`message-${message.id}`}
              >
                <Avatar 
                  src={isMe ? user?.avatar_url : null}
                  firstName={isMe ? user?.first_name : 'P'} 
                  lastName={isMe ? user?.last_name : 'P'}
                  size="sm"
                />
                <div className={`flex-1 max-w-[70%] ${isMe ? 'items-end' : 'items-start'}`}>
                  <div 
                    className={`rounded-2xl px-4 py-3 ${
                      isMe 
                        ? 'bg-primary text-white' 
                        : 'bg-background-subtle text-slate-700'
                    }`}
                  >
                    <p className="text-sm">{message.content}</p>
                  </div>
                  <p className="text-xs text-foreground-light mt-1 px-2">
                    {formatDateTime(message.created_at)}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Message Input */}
        <div className="border-t border-slate-100 p-4">
          <form onSubmit={handleSend} className="flex gap-3">
            <Input
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Écrire un message..."
              disabled={sending}
              data-testid="message-input"
              className="flex-1"
            />
            <Button 
              type="submit" 
              disabled={sending || !newMessage.trim()}
              data-testid="send-button"
            >
              <Send className="w-4 h-4" />
            </Button>
          </form>
        </div>
      </Card>
    </div>
  );
};

export default ConversationDetail;
