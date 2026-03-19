import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { childrenAPI } from '../lib/api';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input, Label } from '../components/ui/input';
import { Avatar } from '../components/ui/avatar';
import { Badge } from '../components/ui/badge';
import { MessageCircle, Plus, Send, X, ArrowLeft, ChevronRight } from 'lucide-react';
import { supabase } from '../lib/supabase';

const Messages = () => {
  const { user } = useAuth();
  const [conversations, setConversations] = useState([]);
  const [selectedConv, setSelectedConv] = useState(null);
  const [messages, setMessages] = useState([]);
  const [children, setChildren] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showNewModal, setShowNewModal] = useState(false);
  const [newMessage, setNewMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [newConvData, setNewConvData] = useState({ child_id: '', parent_name: '', parent_email: '', message: '' });
  const messagesEndRef = useRef(null);

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (selectedConv) loadMessages(selectedConv.id);
  }, [selectedConv]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const loadData = async () => {
    try {
      const { data: convs } = await supabase
        .from('conversations')
        .select('*, children(first_name, last_name)')
        .eq('professional_id', user.id)
        .order('last_message_at', { ascending: false });

      const childrenRes = await childrenAPI.list();
      setConversations(convs || []);
      setChildren(childrenRes.data || []);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadMessages = async (convId) => {
    const { data } = await supabase
      .from('messages')
      .select('*')
      .eq('conversation_id', convId)
      .order('created_at', { ascending: true });
    setMessages(data || []);

    // Marquer comme lus
    await supabase.from('messages').update({ read_at: new Date().toISOString() })
      .eq('conversation_id', convId).eq('sender_type', 'parent').is('read_at', null);
  };

  const handleSend = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedConv) return;
    setSending(true);
    try {
      await supabase.from('messages').insert({
        conversation_id: selectedConv.id,
        sender_id: user.id,
        sender_type: 'professional',
        content: newMessage.trim(),
      });
      await supabase.from('conversations').update({ last_message_at: new Date().toISOString() }).eq('id', selectedConv.id);
      setNewMessage('');
      loadMessages(selectedConv.id);
      loadData();
    } catch (error) {
      console.error('Error sending message:', error);
    } finally {
      setSending(false);
    }
  };

  const handleCreateConversation = async (e) => {
    e.preventDefault();
    setSending(true);
    try {
      // Créer la conversation
      const { data: conv, error } = await supabase.from('conversations').insert({
        child_id: newConvData.child_id || null,
        professional_id: user.id,
        parent_id: null,
        last_message_at: new Date().toISOString(),
      }).select().single();

      if (error) throw error;

      // Envoyer le premier message
      if (newConvData.message.trim()) {
        await supabase.from('messages').insert({
          conversation_id: conv.id,
          sender_id: user.id,
          sender_type: 'professional',
          content: newConvData.message.trim(),
        });
      }

      setShowNewModal(false);
      setNewConvData({ child_id: '', parent_name: '', parent_email: '', message: '' });
      await loadData();
      setSelectedConv(conv);
    } catch (error) {
      console.error('Error creating conversation:', error);
    } finally {
      setSending(false);
    }
  };

  const getChildName = (conv) => {
    if (conv.children) return `${conv.children.first_name} ${conv.children.last_name}`;
    return 'Sans enfant associé';
  };

  const formatTime = (dateStr) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    const now = new Date();
    const isToday = date.toDateString() === now.toDateString();
    if (isToday) return date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
    return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="animate-in" data-testid="messages-page">
      <div className="flex h-[calc(100vh-120px)] gap-4">

        {/* Liste des conversations */}
        <div className={`${selectedConv ? 'hidden md:flex' : 'flex'} flex-col w-full md:w-80 flex-shrink-0`}>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-2xl font-bold text-slate-800 font-outfit">Messages</h1>
              <p className="text-sm text-foreground-muted">Vos conversations</p>
            </div>
            <Button size="sm" onClick={() => setShowNewModal(true)}>
              <Plus className="w-4 h-4 mr-1" />
              Nouveau
            </Button>
          </div>

          <div className="space-y-2 overflow-y-auto flex-1">
            {conversations.length === 0 ? (
              <Card className="text-center py-12">
                <MessageCircle className="w-12 h-12 mx-auto mb-3 text-slate-300" />
                <p className="text-foreground-muted text-sm mb-4">Aucune conversation</p>
                <Button size="sm" onClick={() => setShowNewModal(true)}>
                  <Plus className="w-4 h-4 mr-1" />
                  Démarrer une conversation
                </Button>
              </Card>
            ) : (
              conversations.map((conv) => (
                <div
                  key={conv.id}
                  onClick={() => setSelectedConv(conv)}
                  className={`p-4 rounded-xl cursor-pointer transition-colors ${selectedConv?.id === conv.id ? 'bg-primary-light border border-primary/20' : 'bg-white border border-slate-200 hover:border-primary/30'}`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-primary-light rounded-full flex items-center justify-center flex-shrink-0">
                      <MessageCircle className="w-5 h-5 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-slate-700 text-sm truncate">{getChildName(conv)}</p>
                      <p className="text-xs text-foreground-muted">{formatTime(conv.last_message_at)}</p>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-300 flex-shrink-0" />
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Zone de conversation */}
        {selectedConv ? (
          <div className="flex-1 flex flex-col bg-white rounded-2xl border border-slate-200 overflow-hidden">
            {/* Header conversation */}
            <div className="flex items-center gap-3 p-4 border-b border-slate-200 bg-background-subtle">
              <button onClick={() => setSelectedConv(null)} className="md:hidden text-slate-400 hover:text-slate-600">
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div className="w-10 h-10 bg-primary-light rounded-full flex items-center justify-center">
                <MessageCircle className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="font-semibold text-slate-700">{getChildName(selectedConv)}</p>
                <p className="text-xs text-foreground-muted">Conversation</p>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {messages.length === 0 ? (
                <div className="text-center py-12 text-foreground-muted text-sm">
                  Aucun message — écrivez le premier !
                </div>
              ) : (
                messages.map((msg) => {
                  const isMe = msg.sender_type === 'professional';
                  return (
                    <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[70%] px-4 py-3 rounded-2xl text-sm ${isMe ? 'bg-primary text-white rounded-br-sm' : 'bg-background-subtle text-slate-700 rounded-bl-sm'}`}>
                        <p>{msg.content}</p>
                        <p className={`text-xs mt-1 ${isMe ? 'text-white/70' : 'text-foreground-muted'}`}>
                          {formatTime(msg.created_at)}
                        </p>
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input message */}
            <form onSubmit={handleSend} className="p-4 border-t border-slate-200 flex gap-3">
              <input
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Écrivez votre message..."
                className="flex-1 bg-input rounded-xl px-4 py-2 text-slate-700 outline-none focus:ring-2 focus:ring-primary/20"
              />
              <Button type="submit" disabled={!newMessage.trim() || sending}>
                <Send className="w-4 h-4" />
              </Button>
            </form>
          </div>
        ) : (
          <div className="hidden md:flex flex-1 items-center justify-center bg-white rounded-2xl border border-slate-200">
            <div className="text-center">
              <MessageCircle className="w-16 h-16 mx-auto mb-4 text-slate-200" />
              <p className="text-foreground-muted">Sélectionnez une conversation</p>
            </div>
          </div>
        )}
      </div>

      {/* Modal nouvelle conversation */}
      {showNewModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="max-w-md w-full">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Nouvelle conversation</CardTitle>
                <button onClick={() => setShowNewModal(false)} className="text-slate-400 hover:text-slate-600">
                  <X className="w-5 h-5" />
                </button>
              </div>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleCreateConversation} className="space-y-4">
                <div>
                  <Label>Enfant concerné (optionnel)</Label>
                  <select
                    value={newConvData.child_id}
                    onChange={(e) => setNewConvData({...newConvData, child_id: e.target.value})}
                    className="w-full bg-input border-transparent focus:bg-white focus:border-primary rounded-xl px-4 py-3 text-slate-700 outline-none mt-1"
                  >
                    <option value="">-- Aucun enfant spécifique --</option>
                    {children.map(child => (
                      <option key={child.id} value={child.id}>
                        {child.first_name} {child.last_name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <Label>Premier message *</Label>
                  <textarea
                    value={newConvData.message}
                    onChange={(e) => setNewConvData({...newConvData, message: e.target.value})}
                    className="w-full bg-input border-transparent focus:bg-white focus:border-primary focus:ring-2 focus:ring-primary/20 rounded-xl px-4 py-3 text-slate-700 outline-none min-h-[100px] mt-1"
                    placeholder="Bonjour, je souhaitais vous informer..."
                    required
                  />
                </div>

                <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-sm text-amber-700">
                  💡 La messagerie avec les parents sera pleinement opérationnelle quand l'univers Parent sera activé.
                </div>

                <div className="flex gap-3">
                  <Button type="button" variant="outline" className="flex-1" onClick={() => setShowNewModal(false)}>
                    Annuler
                  </Button>
                  <Button type="submit" className="flex-1" disabled={sending || !newConvData.message.trim()}>
                    <Send className="w-4 h-4 mr-2" />
                    Créer
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

export default Messages;
