import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import { Send, ArrowLeft } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

const formatTime = (dt) => {
  try {
    const utcDt = dt.includes('Z') || dt.includes('+') ? dt : dt.replace(' ', 'T') + 'Z';
    return new Date(utcDt).toLocaleTimeString('fr-FR', {
      hour: '2-digit',
      minute: '2-digit',
      timeZone: 'Europe/Paris',
      hour12: false
    });
  } catch { return ''; }
};


const formatDateLabel = (dt) => {
  try { return format(new Date(dt), "EEEE d MMMM", { locale: fr }); } catch { return ''; }
};

export default function ParentConversation() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const fromPro = new URLSearchParams(location.search).get('from') === 'pro';
  const proId = new URLSearchParams(location.search).get('proId');
  const proName = new URLSearchParams(location.search).get('proName');
  const [messages, setMessages] = useState([]);
  const [content, setContent] = useState('');
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const [convProName, setConvProName] = useState('');
  const messagesEndRef = useRef(null);

  useEffect(() => {
    loadMessages();
  }, [id]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const loadMessages = async () => {
    const { data } = await supabase.from('messages').select('*').eq('conversation_id', id).order('created_at', { ascending: true });
    setMessages(data || []);
    const { data: conv } = await supabase.from('conversations').select('pro_name').eq('id', id).maybeSingle();
    if (conv?.pro_name) setConvProName(conv.pro_name);
    setLoading(false);
  };

  const sendMessage = async () => {
    if (!content.trim()) return;
    setSending(true);
    try {
      await supabase.from('messages').insert({
        conversation_id: id,
        sender_id: user.id,
        sender_type: 'parent',
        content: content.trim(),
      });
      await supabase.from('conversations').update({ last_message_at: new Date().toISOString() }).eq('id', id);
      setContent('');
      loadMessages();
    } catch (error) {
      console.error('Error sending:', error);
    } finally {
      setSending(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); }
  };

  if (loading) return (
    <div className="flex items-center justify-center py-20">
      <div className="w-8 h-8 border-2 border-stone-200 border-t-sage-500 rounded-full animate-spin" />
    </div>
  );

  let lastDateLabel = null;

  return (
    <div className="flex flex-col" style={{ height: 'calc(100vh - 140px)' }}>
      {/* Header */}
      <div className="px-5 py-3 bg-white border-b border-stone-100 flex items-center gap-3 flex-shrink-0">
        <button onClick={() => fromPro ? navigate(`/parent/professionnels/${proId}`) : navigate('/parent/messages')} className="text-slate-400 hover:text-slate-600">
          <ArrowLeft size={20} />
        </button>
        <div className="w-10 h-10 rounded-2xl bg-sage-100 flex items-center justify-center">
          <span className="text-sage-600 font-heading font-bold text-sm">P</span>
        </div>
        <p className="font-heading font-semibold text-sm text-slate-800">{proName ? decodeURIComponent(proName) : convProName || 'Conversation'}</p>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-5 py-4 space-y-2" style={{ paddingBottom: '80px' }}>
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <p className="text-slate-400 font-body text-sm">Aucun message — commencez la conversation !</p>
          </div>
        )}
        {messages.map((msg) => {
          const dateLabel = formatDateLabel(msg.created_at);
          const showDate = dateLabel !== lastDateLabel;
          lastDateLabel = dateLabel;
          const isMe = msg.sender_type === 'parent';
          return (
            <div key={msg.id}>
              {showDate && (
                <div className="flex items-center justify-center my-4">
                  <span className="text-[11px] text-slate-400 font-body bg-stone-100 px-3 py-1 rounded-full capitalize">{dateLabel}</span>
                </div>
              )}
              <div className={`flex ${isMe ? 'justify-end' : 'justify-start'} mb-2`}>
                <div className={`max-w-[80%] flex flex-col gap-1 ${isMe ? 'items-end' : 'items-start'}`}>
                  <div className={`px-4 py-3 text-sm font-body leading-relaxed ${isMe ? 'bubble-parent' : 'bubble-pro'}`}>
                    {msg.content}
                  </div>
                  <span className="text-[10px] text-slate-300 font-body px-1">{formatTime(msg.created_at)}</span>
                </div>
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="fixed bottom-20 left-0 right-0 max-w-md mx-auto bg-white border-t border-stone-100 px-4 py-3 z-50">
        <div className="flex items-end gap-2">
          <textarea
            value={content}
            onChange={e => setContent(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Votre message..."
            rows={1}
            className="flex-1 px-4 py-2.5 bg-stone-50 border border-stone-200 rounded-2xl text-sm font-body text-slate-700 placeholder-slate-300 resize-none max-h-24"
            style={{ minHeight: '40px' }}
          />
          <button
            onClick={sendMessage}
            disabled={!content.trim() || sending}
            className="w-10 h-10 rounded-full flex items-center justify-center text-white flex-shrink-0 disabled:opacity-40" style={{backgroundColor: '#4A9B8F'}}
          >
            {sending ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Send size={16} />}
          </button>
        </div>
      </div>
    </div>
  );
}
