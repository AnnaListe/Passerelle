import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import { MessageCircle, Plus, X, Send } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

const formatRelative = (dt) => {
  if (!dt) return '';
  try {
    const d = new Date(dt);
    const now = new Date();
    const diff = now - d;
    if (diff < 3600000) return `${Math.floor(diff / 60000)} min`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h`;
    if (diff < 604800000) return `${Math.floor(diff / 86400000)} j`;
    return format(d, 'd MMM', { locale: fr });
  } catch { return ''; }
};

export default function ParentMessages() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showNew, setShowNew] = useState(false);
  const [newMessage, setNewMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [childId, setChildId] = useState(null);

  useEffect(() => {
    if (user) loadData();
  }, [user]);

  const loadData = async () => {
    try {
      const { data: link } = await supabase.from('parent_child_links').select('child_id').eq('parent_id', user.id).maybeSingle();
      if (link?.child_id) setChildId(link.child_id);

      const { data: convs } = await supabase.from('conversations').select('*, children(first_name, last_name)')
        .or(`professional_id.eq.${user.id},parent_id.eq.${user.id}`)
        .order('last_message_at', { ascending: false });

      setConversations(convs || []);
    } catch (error) {
      console.error('Error loading messages:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleNewConversation = async () => {
    if (!newMessage.trim()) return;
    setSending(true);
    try {
      const { data: conv } = await supabase.from('conversations').insert({
        parent_id: user.id,
        child_id: childId || null,
        last_message_at: new Date().toISOString(),
      }).select().single();

      await supabase.from('messages').insert({
        conversation_id: conv.id,
        sender_id: user.id,
        sender_type: 'parent',
        content: newMessage.trim(),
      });

      setShowNew(false);
      setNewMessage('');
      navigate(`/parent/messages/${conv.id}`);
    } catch (error) {
      console.error('Error creating conversation:', error);
    } finally {
      setSending(false);
    }
  };

  if (loading) return (
    <div className="p-5 space-y-3">
      {[1,2,3].map(i => <div key={i} className="h-20 bg-stone-100 rounded-3xl animate-pulse" />)}
    </div>
  );

  return (
    <div className="px-5 pt-5 pb-6">
      <div className="flex items-center justify-between mb-5">
        <h1 className="page-title">Messages</h1>
        <button
          onClick={() => setShowNew(true)}
          className="flex items-center gap-1.5 px-4 py-2 bg-sage-500 text-white rounded-full font-heading font-semibold text-sm shadow-sage"
        >
          <Plus size={15} /> Nouveau
        </button>
      </div>

      {conversations.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="w-16 h-16 rounded-3xl bg-stone-100 flex items-center justify-center mb-4">
            <MessageCircle size={28} className="text-slate-300" />
          </div>
          <p className="font-heading font-semibold text-slate-500">Aucune conversation</p>
          <p className="text-sm text-slate-400 font-body mt-1">Démarrez une conversation avec un professionnel</p>
          <button onClick={() => setShowNew(true)} className="mt-4 px-5 py-2.5 bg-sage-500 text-white rounded-full font-heading font-semibold text-sm shadow-sage">
            Nouveau message
          </button>
        </div>
      ) : (
        <div className="space-y-2">
          {conversations.map(conv => (
            <div
              key={conv.id}
              onClick={() => navigate(`/parent/messages/${conv.id}`)}
              className="passerelle-card cursor-pointer flex items-center gap-4 !p-4"
            >
              <div className="w-12 h-12 rounded-2xl bg-sage-100 flex items-center justify-center flex-shrink-0">
                <MessageCircle size={20} className="text-sage-600" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-heading font-semibold text-sm text-slate-700">
                  {conv.children ? `${conv.children.first_name} ${conv.children.last_name}` : 'Conversation'}
                </p>
                <p className="text-xs text-slate-400 font-body">{formatRelative(conv.last_message_at)}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal nouveau message */}
      {showNew && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-end justify-center">
          <div className="w-full max-w-[480px] bg-white rounded-t-3xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-heading font-bold text-lg text-slate-800">Nouveau message</h3>
              <button onClick={() => setShowNew(false)} className="w-8 h-8 rounded-full bg-stone-100 flex items-center justify-center">
                <X size={16} className="text-slate-500" />
              </button>
            </div>
            <textarea
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Écrivez votre message..."
              rows={4}
              className="w-full px-4 py-3 bg-stone-50 border border-stone-200 rounded-2xl text-sm font-body text-slate-700 resize-none mb-4"
            />
            <button
              onClick={handleNewConversation}
              disabled={!newMessage.trim() || sending}
              className="w-full h-12 bg-sage-500 text-white rounded-2xl font-heading font-semibold flex items-center justify-center gap-2 disabled:opacity-40 shadow-sage"
            >
              {sending ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Send size={16} />}
              Envoyer
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
