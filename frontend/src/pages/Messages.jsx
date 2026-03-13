import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { conversationsAPI, professionalConversationsAPI } from '../lib/api';
import { Card } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Avatar } from '../components/ui/avatar';
import { Badge } from '../components/ui/badge';
import { MessageCircle, Users } from 'lucide-react';
import { formatDateTime, truncate } from '../lib/utils';

const Messages = () => {
  const [conversations, setConversations] = useState([]);
  const [professionalConversations, setProfessionalConversations] = useState([]);
  const [activeTab, setActiveTab] = useState('parents');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadConversations();
  }, []);

  const loadConversations = async () => {
    try {
      const [parentsRes, prosRes] = await Promise.all([
        conversationsAPI.list(),
        professionalConversationsAPI.list()
      ]);
      setConversations(parentsRes.data);
      setProfessionalConversations(prosRes.data);
    } catch (error) {
      console.error('Error loading conversations:', error);
    } finally {
      setLoading(false);
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
    <div className="space-y-6 animate-in" data-testid="messages-page">
      {/* Header */}
      <div>
        <h1 className="text-3xl md:text-4xl font-bold text-slate-800 font-outfit mb-2">
          Messages
        </h1>
        <p className="text-foreground-muted">Vos conversations</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-slate-200">
        <button
          onClick={() => setActiveTab('parents')}
          className={`px-4 py-2 font-medium transition-colors border-b-2 ${
            activeTab === 'parents' 
              ? 'border-primary text-primary' 
              : 'border-transparent text-foreground-muted hover:text-primary'
          }`}
          data-testid="tab-parents"
        >
          Parents ({conversations.length})
        </button>
        <button
          onClick={() => setActiveTab('professionals')}
          className={`px-4 py-2 font-medium transition-colors border-b-2 ${
            activeTab === 'professionals' 
              ? 'border-primary text-primary' 
              : 'border-transparent text-foreground-muted hover:text-primary'
          }`}
          data-testid="tab-professionals"
        >
          Professionnels ({professionalConversations.length})
        </button>
      </div>

      {/* Conversations List */}
      {activeTab === 'parents' ? (
        <div className="space-y-3">
          {conversations.length > 0 ? (
            conversations.map((conv) => (
              <Link
                key={conv.conversation.id}
                to={`/messages/parent/${conv.conversation.id}`}
                data-testid={`conversation-${conv.conversation.id}`}
              >
                <Card interactive>
                  <div className="flex items-start gap-4">
                    <Avatar 
                      firstName={conv.parent?.first_name} 
                      lastName={conv.parent?.last_name}
                      size="lg"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <div>
                          <p className="font-semibold text-slate-700">
                            {conv.parent?.first_name} {conv.parent?.last_name}
                          </p>
                          <p className="text-sm text-foreground-muted">
                            Parent de {conv.child?.first_name}
                          </p>
                        </div>
                        {conv.unread_count > 0 && (
                          <Badge variant="error">{conv.unread_count}</Badge>
                        )}
                      </div>
                      <p className="text-sm text-foreground-muted truncate">
                        {truncate(conv.last_message?.content, 80)}
                      </p>
                      <p className="text-xs text-foreground-light mt-1">
                        {formatDateTime(conv.conversation.last_message_at)}
                      </p>
                    </div>
                  </div>
                </Card>
              </Link>
            ))
          ) : (
            <Card className="text-center py-12">
              <MessageCircle className="w-16 h-16 mx-auto mb-4 text-slate-300" />
              <p className="text-foreground-muted">Aucune conversation avec les parents</p>
            </Card>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {professionalConversations.length > 0 ? (
            professionalConversations.map((conv) => (
              <Link
                key={conv.conversation.id}
                to={`/messages/professional/${conv.conversation.id}`}
                data-testid={`pro-conversation-${conv.conversation.id}`}
              >
                <Card interactive>
                  <div className="flex items-start gap-4">
                    <Avatar 
                      src={conv.other_professional?.avatar_url}
                      firstName={conv.other_professional?.first_name} 
                      lastName={conv.other_professional?.last_name}
                      size="lg"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <div>
                          <p className="font-semibold text-slate-700">
                            {conv.other_professional?.first_name} {conv.other_professional?.last_name}
                          </p>
                          <p className="text-sm text-foreground-muted">
                            {conv.other_professional?.profession} • {conv.child?.first_name}
                          </p>
                        </div>
                        {conv.unread_count > 0 && (
                          <Badge variant="error">{conv.unread_count}</Badge>
                        )}
                      </div>
                      <p className="text-sm text-foreground-muted truncate">
                        {truncate(conv.last_message?.content, 80)}
                      </p>
                      <p className="text-xs text-foreground-light mt-1">
                        {formatDateTime(conv.conversation.last_message_at)}
                      </p>
                    </div>
                  </div>
                </Card>
              </Link>
            ))
          ) : (
            <Card className="text-center py-12">
              <Users className="w-16 h-16 mx-auto mb-4 text-slate-300" />
              <p className="text-foreground-muted">Aucune conversation avec d'autres professionnels</p>
            </Card>
          )}
        </div>
      )}
    </div>
  );
};

export default Messages;
