import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import { ChevronRight, Calendar, MessageCircle, FileText, Receipt, Heart, SmilePlus, Smile, Meh, Frown, Angry, Plus, Users } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

const MOOD_CONFIG = {
  5: { label: 'Très bien', color: '#4A9B8F', bg: '#E0F2F0', Icon: SmilePlus },
  4: { label: 'Bien', color: '#68B9B0', bg: '#D4EDEA', Icon: Smile },
  3: { label: 'Moyen', color: '#E8A838', bg: '#FEF3C7', Icon: Meh },
  2: { label: 'Difficile', color: '#E8967A', bg: '#FEE2D4', Icon: Frown },
  1: { label: 'Très difficile', color: '#DC6B6B', bg: '#FEE2E2', Icon: Angry },
};

const formatRelative = (dt) => {
  if (!dt) return '';
  try {
    const d = new Date(dt);
    const now = new Date();
    const diff = now - d;
    if (diff < 3600000) return `il y a ${Math.floor(diff / 60000)} min`;
    if (diff < 86400000) return `il y a ${Math.floor(diff / 3600000)}h`;
    if (diff < 604800000) return `il y a ${Math.floor(diff / 86400000)} j`;
    return format(d, 'd MMM', { locale: fr });
  } catch { return ''; }
};

export default function ParentDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [parent, setParent] = useState(null);
  const [child, setChild] = useState(null);
  const [todayMood, setTodayMood] = useState(null);
  const [nextApt, setNextApt] = useState(null);
  const [recentConversations, setRecentConversations] = useState([]);
  const [recentInvoices, setRecentInvoices] = useState([]);

  useEffect(() => {
    if (user) loadData();
  }, [user]);

  const loadData = async () => {
    try {
      // Charger le profil parent
      const { data: parentData } = await supabase.from('parents').select('*').eq('id', user.id).maybeSingle();
      setParent(parentData);

      // Charger l'enfant lié
      const { data: linkData } = await supabase.from('parent_child_links').select('child_id').eq('parent_id', user.id).maybeSingle();
      
      if (linkData?.child_id) {
        const { data: childData } = await supabase.from('children').select('*').eq('id', linkData.child_id).maybeSingle();
        setChild(childData);

        // Prochain RDV
        const { data: apts } = await supabase.from('appointments').select('*')
          .eq('child_id', linkData.child_id)
          .gte('start_datetime', new Date().toISOString())
          .order('start_datetime')
          .limit(1);
        setNextApt(apts?.[0] || null);

        // Mood aujourd'hui
        const today = new Date().toISOString().split('T')[0];
        const { data: moodData } = await supabase.from('child_moods')
          .select('*')
          .eq('child_id', linkData.child_id)
          .eq('date', today)
          .maybeSingle();
        setTodayMood(moodData);
      }

      // Conversations récentes
      const { data: convs } = await supabase.from('conversations').select('*, children(first_name, last_name)')
        .eq('professional_id', user.id)
        .order('last_message_at', { ascending: false })
        .limit(2);
      setRecentConversations(convs || []);

      // Factures récentes
      if (linkData?.child_id) {
        const { data: invs } = await supabase.from('invoices').select('*')
          .eq('child_id', linkData.child_id)
          .order('created_at', { ascending: false })
          .limit(2);
        setRecentInvoices(invs || []);
      }
    } catch (error) {
      console.error('Error loading parent dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const getAge = (birthDate) => {
    if (!birthDate) return '';
    const birth = new Date(birthDate);
    const today = new Date();
    let age = today.getFullYear() - birth.getFullYear();
    const m = today.getMonth() - birth.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
    return age;
  };

  const todayFr = format(new Date(), "EEEE d MMMM", { locale: fr });
  const moodCfg = todayMood ? MOOD_CONFIG[todayMood.mood_level] : null;

  if (loading) return (
    <div className="p-6 space-y-4">
      {[1,2,3,4].map(i => <div key={i} className="h-24 bg-stone-100 rounded-3xl animate-pulse" />)}
    </div>
  );

  return (
    <div className="px-5 pt-5 pb-4 space-y-5">

      {/* Greeting */}
      <div>
        <p className="text-xs text-slate-400 font-body capitalize">{todayFr}</p>
        <h1 className="text-2xl font-heading font-bold text-slate-800 mt-0.5">
          Bonjour, {parent?.first_name || 'vous'} 👋
        </h1>
      </div>

      {/* Child Card */}
      {child ? (
        <div
          onClick={() => navigate('/parent/enfant')}
          className="passerelle-card cursor-pointer"
          style={{ background: 'linear-gradient(135deg, #4A9B8F 0%, #2E665E 100%)' }}
        >
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-white/20 flex items-center justify-center text-white font-heading font-bold text-2xl flex-shrink-0">
              {child.first_name?.[0]}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-white/70 text-xs font-body mb-0.5">Mon enfant</p>
              <h2 className="text-white font-heading font-bold text-lg leading-tight">{child.first_name} {child.last_name}</h2>
              <p className="text-white/80 text-sm font-body">{getAge(child.birth_date)} ans · TSA</p>
            </div>
            <div className="flex items-center gap-1 text-white/80">
              <span className="text-xs font-heading font-semibold">Voir la fiche</span>
              <ChevronRight size={16} />
            </div>
          </div>
        </div>
      ) : (
        <div className="passerelle-card text-center py-8">
          <Heart size={32} className="mx-auto mb-3 text-slate-300" />
          <p className="font-heading font-semibold text-slate-500 mb-1">Aucun enfant lié</p>
          <p className="text-sm text-slate-400 font-body">Un professionnel doit vous inviter sur Passerelle</p>
        </div>
      )}

      {/* Mood + Prochain RDV */}
      {child && (
        <div className="grid grid-cols-2 gap-3">
          {/* Mood */}
          <div
            onClick={() => navigate('/parent/mood')}
            className="passerelle-card cursor-pointer"
            style={{ backgroundColor: moodCfg ? moodCfg.bg : '#F5F5F4' }}
          >
            <p className="section-label mb-2">Mood du jour</p>
            {moodCfg ? (
              <div className="flex flex-col items-center gap-1.5">
                <div className="w-12 h-12 rounded-full flex items-center justify-center" style={{ backgroundColor: moodCfg.color }}>
                  <moodCfg.Icon size={26} className="text-white" />
                </div>
                <p className="font-heading font-semibold text-sm text-slate-700 text-center leading-tight">{moodCfg.label}</p>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-2">
                <div className="w-12 h-12 rounded-full bg-stone-100 flex items-center justify-center">
                  <Plus size={22} className="text-slate-400" />
                </div>
                <p className="text-xs text-slate-500 font-body text-center">Renseigner le mood</p>
              </div>
            )}
          </div>

          {/* Prochain RDV */}
          <div
            onClick={() => navigate('/parent/planning')}
            className="passerelle-card cursor-pointer"
          >
            <p className="section-label mb-2">Prochain RDV</p>
            {nextApt ? (
              <div>
                <div className="w-10 h-10 rounded-xl bg-sage-100 flex items-center justify-center mb-2">
                  <Calendar size={18} className="text-sage-600" />
                </div>
                <p className="font-heading font-semibold text-sm text-slate-700 leading-tight">{nextApt.title}</p>
                <p className="text-xs text-slate-400 font-body mt-1">
                  {format(new Date(nextApt.start_datetime), "EEE d MMM 'à' HH'h'mm", { locale: fr })}
                </p>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-2 mt-2">
                <Calendar size={22} className="text-slate-300" />
                <p className="text-xs text-slate-400 font-body text-center">Aucun RDV à venir</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Actions rapides */}
      <div>
        <p className="section-label mb-3">Actions rapides</p>
        <div className="grid grid-cols-4 gap-2">
          {[
            { icon: Calendar, label: 'Planning', path: '/parent/planning', color: '#6B9FD4' },
            { icon: MessageCircle, label: 'Messages', path: '/parent/messages', color: '#4A9B8F' },
            { icon: FileText, label: 'Documents', path: '/parent/documents', color: '#A78BCA' },
            { icon: Receipt, label: 'Factures', path: '/parent/factures', color: '#E8967A' },
          ].map(({ icon: Icon, label, path, color }) => (
            <button
              key={path}
              onClick={() => navigate(path)}
              className="flex flex-col items-center gap-2 p-3 bg-white rounded-2xl shadow-card"
            >
              <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: `${color}20` }}>
                <Icon size={18} style={{ color }} />
              </div>
              <span className="text-[11px] font-heading font-semibold text-slate-600">{label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Messages récents */}
      {recentConversations.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <p className="section-label">Messages récents</p>
            <button onClick={() => navigate('/parent/messages')} className="text-sage-600 font-heading font-semibold text-xs flex items-center gap-1">
              Voir tout <ChevronRight size={14} />
            </button>
          </div>
          <div className="space-y-2">
            {recentConversations.map(conv => (
              <div
                key={conv.id}
                onClick={() => navigate(`/parent/messages/${conv.id}`)}
                className="passerelle-card cursor-pointer flex items-center gap-3 !p-4"
              >
                <div className="w-10 h-10 rounded-2xl bg-sage-100 flex items-center justify-center flex-shrink-0">
                  <MessageCircle size={18} className="text-sage-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-heading font-semibold text-sm text-slate-700 truncate">
                    {conv.children?.first_name} {conv.children?.last_name}
                  </p>
                  <p className="text-xs text-slate-400 font-body">{formatRelative(conv.last_message_at)}</p>
                </div>
                <ChevronRight size={16} className="text-slate-300" />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Factures récentes */}
      {recentInvoices.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <p className="section-label">Factures récentes</p>
            <button onClick={() => navigate('/parent/factures')} className="text-sage-600 font-heading font-semibold text-xs flex items-center gap-1">
              Voir tout <ChevronRight size={14} />
            </button>
          </div>
          <div className="space-y-2">
            {recentInvoices.map(inv => {
              const statusColors = { 'payee': 'text-sage-600 bg-sage-50', 'en_attente_paiement': 'text-orange-600 bg-orange-50', 'brouillon': 'text-slate-500 bg-slate-50' };
              const statusLabels = { 'payee': 'Payée', 'en_attente_paiement': 'En attente', 'brouillon': 'Brouillon' };
              return (
                <div
                  key={inv.id}
                  onClick={() => navigate(`/parent/factures/${inv.id}`)}
                  className="passerelle-card cursor-pointer flex items-center gap-3 !p-4"
                >
                  <div className="w-10 h-10 rounded-xl bg-orange-50 flex items-center justify-center flex-shrink-0">
                    <Receipt size={18} className="text-orange-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-heading font-semibold text-sm text-slate-700 truncate">{inv.invoice_number}</p>
                    <p className="text-xs text-slate-400 font-body">{inv.amount_total}€</p>
                  </div>
                  <span className={`text-[11px] font-heading font-semibold px-2 py-1 rounded-full flex-shrink-0 ${statusColors[inv.status] || 'text-slate-500 bg-slate-50'}`}>
                    {statusLabels[inv.status] || inv.status}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Mon équipe */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <p className="section-label">Mon équipe</p>
          <button onClick={() => navigate('/parent/professionnels')} className="text-sage-600 font-heading font-semibold text-xs flex items-center gap-1">
            Gérer <ChevronRight size={14} />
          </button>
        </div>
        <div
          className="passerelle-card cursor-pointer !p-4 flex items-center gap-3"
          onClick={() => navigate('/parent/professionnels')}
        >
          <div className="w-10 h-10 rounded-xl bg-sage-50 flex items-center justify-center flex-shrink-0">
            <Users size={18} className="text-sage-600" />
          </div>
          <div className="flex-1">
            <p className="font-heading font-semibold text-sm text-slate-700">Professionnels de mon enfant</p>
            <p className="text-xs text-slate-400 font-body">Gérer l'équipe de suivi</p>
          </div>
          <ChevronRight size={16} className="text-slate-300" />
        </div>
      </div>
      <div className="h-4" />
    </div>
  );
}
