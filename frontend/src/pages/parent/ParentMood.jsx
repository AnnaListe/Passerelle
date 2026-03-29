import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import { ArrowLeft, ChevronLeft, ChevronRight, Plus, X, Sun, Moon } from 'lucide-react';
import { format, subDays, addDays, isSameDay, isToday } from 'date-fns';
import { fr } from 'date-fns/locale';

const MOODS = [
  { level: 5, emoji: '😄', label: 'Très bien', color: '#4A9B8F', bg: '#E0F2F0' },
  { level: 4, emoji: '🙂', label: 'Bien', color: '#68B9B0', bg: '#D4EDEA' },
  { level: 3, emoji: '😐', label: 'Moyen', color: '#E8A838', bg: '#FEF3C7' },
  { level: 2, emoji: '😟', label: 'Difficile', color: '#E8967A', bg: '#FEE2D4' },
  { level: 1, emoji: '😢', label: 'Très difficile', color: '#DC6B6B', bg: '#FEE2E2' },
];

const MoodSelector = ({ value, onChange, label, icon: Icon, color }) => (
  <div className="passerelle-card">
    <div className="flex items-center gap-2 mb-4">
      <Icon size={16} style={{ color }} />
      <p className="text-xs font-heading font-bold uppercase tracking-widest text-slate-500">{label}</p>
    </div>
    <div className="flex justify-between gap-2">
      {MOODS.map(mood => (
        <button
          key={mood.level}
          onClick={() => onChange(mood.level)}
          className={`flex-1 flex flex-col items-center gap-1.5 py-3 rounded-2xl border-2 transition-all ${
            value === mood.level ? 'border-transparent scale-105' : 'border-stone-100 bg-stone-50'
          }`}
          style={value === mood.level ? { backgroundColor: mood.bg, borderColor: mood.color } : {}}>
          <span className="text-xl">{mood.emoji}</span>
          <span className={`text-[9px] font-heading font-semibold text-center leading-tight ${value === mood.level ? 'text-slate-700' : 'text-slate-400'}`}>
            {mood.label}
          </span>
        </button>
      ))}
    </div>
  </div>
);

export default function ParentMood() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [childId, setChildId] = useState(null);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [moodMatin, setMoodMatin] = useState(null);
  const [commentMatin, setCommentMatin] = useState('');
  const [moodSoir, setMoodSoir] = useState(null);
  const [commentSoir, setCommentSoir] = useState('');
  const [events, setEvents] = useState([]);
  const [showAddEvent, setShowAddEvent] = useState(false);
  const [newEvent, setNewEvent] = useState({ title: '', description: '' });
  const [saving, setSaving] = useState(false);
  const [savingEvent, setSavingEvent] = useState(false);
  const [loading, setLoading] = useState(true);
  const [history, setHistory] = useState([]);
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (user) loadData();
  }, [user]);

  useEffect(() => {
    if (childId) loadMoodsForDate(selectedDate);
  }, [selectedDate, childId]);

  const loadData = async () => {
    try {
      const { data: link } = await supabase.from('parent_child_links').select('child_id').eq('parent_id', user.id).maybeSingle();
      if (link?.child_id) {
        setChildId(link.child_id);
        const { data: historyMoods } = await supabase.from('child_moods')
          .select('*')
          .eq('child_id', link.child_id)
          .gte('date', format(subDays(new Date(), 13), 'yyyy-MM-dd'))
          .order('date', { ascending: false });
        setHistory(historyMoods || []);
      }
    } catch (error) {
      console.error('Error loading mood:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadMoodsForDate = async (date) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    const { data: moods } = await supabase.from('child_moods')
      .select('*')
      .eq('child_id', childId)
      .eq('date', dateStr);

    const matin = moods?.find(m => m.mood_type === 'matin');
    const soir = moods?.find(m => m.mood_type === 'soir');
    setMoodMatin(matin?.mood_level || null);
    setCommentMatin(matin?.comment || '');
    setMoodSoir(soir?.mood_level || null);
    setCommentSoir(soir?.comment || '');

    const { data: evts } = await supabase.from('child_mood_events')
      .select('*')
      .eq('child_id', childId)
      .eq('date', dateStr)
      .order('created_at');
    setEvents(evts || []);
  

    const { data: historyMoods } = await supabase.from('child_moods')
      .select('*')
      .eq('child_id', childId)
      .gte('date', format(subDays(date, 6), 'yyyy-MM-dd'))
      .lte('date', format(date, 'yyyy-MM-dd'))
      .order('date', { ascending: false });
    setHistory(historyMoods || []);

  };  

  const saveMoods = async () => {
    if (!moodMatin && !moodSoir) return;
    setSaving(true);
    try {
      const dateStr = format(selectedDate, 'yyyy-MM-dd');
      if (moodMatin) {
        await supabase.from('child_moods').upsert({
          child_id: childId,
          date: dateStr,
          mood_type: 'matin',
          mood_level: moodMatin,
          comment: commentMatin || null,
          created_by: user.id,
        }, { onConflict: 'child_id,date,mood_type' });
      }
      if (moodSoir) {
        await supabase.from('child_moods').upsert({
          child_id: childId,
          date: dateStr,
          mood_type: 'soir',
          mood_level: moodSoir,
          comment: commentSoir || null,
          created_by: user.id,
        }, { onConflict: 'child_id,date,mood_type' });
      }
      setMessage('Mood enregistré !');
      setTimeout(() => setMessage(''), 2000);
      loadData();
    } catch (error) {
      console.error('Error saving mood:', error);
    } finally {
      setSaving(false);
    }
  };

  const addEvent = async () => {
    if (!newEvent.title.trim()) return;
    setSavingEvent(true);
    try {
      await supabase.from('child_mood_events').insert({
        child_id: childId,
        date: format(selectedDate, 'yyyy-MM-dd'),
        title: newEvent.title.trim(),
        description: newEvent.description.trim() || null,
        created_by: user.id,
      });
      setNewEvent({ title: '', description: '' });
      setShowAddEvent(false);
      loadMoodsForDate(selectedDate);
    } catch (error) {
      console.error('Error adding event:', error);
    } finally {
      setSavingEvent(false);
    }
  };

  const deleteEvent = async (id) => {
    await supabase.from('child_mood_events').delete().eq('id', id);
    loadMoodsForDate(selectedDate);
  };

  const getDayMoodLevel = (date) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    const dayMoods = history.filter(m => m.date === dateStr);
    if (dayMoods.length === 0) return null;
    return Math.round(dayMoods.reduce((sum, m) => sum + m.mood_level, 0) / dayMoods.length);
  };

  const last7Days = Array.from({ length: 7 }, (_, i) => subDays(selectedDate, 6 - i));

  if (loading) return (
    <div className="p-5 space-y-4">
      {[1,2,3].map(i => <div key={i} className="h-20 bg-stone-100 rounded-3xl animate-pulse" />)}
    </div>
  );

  return (
    <div className="px-5 pt-5 pb-6 space-y-4">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button onClick={() => navigate('/parent/dashboard')} className="text-slate-400">
          <ArrowLeft size={20} />
        </button>
        <h1 className="page-title">Mood du jour</h1>
      </div>

      {/* Historique 7 jours */}
      <div className="flex gap-1.5">
        {last7Days.map(day => {
          const level = getDayMoodLevel(day);
          const moodConfig = level ? MOODS.find(m => m.level === level) : null;
          const isSelected = isSameDay(day, selectedDate);
          return (
            <button
              key={day.toISOString()}
              onClick={() => setSelectedDate(day)}
              className={`flex-1 flex flex-col items-center gap-1 py-2.5 rounded-2xl border-2 transition-all ${isSelected ? 'border-sage-400 shadow-sm' : 'border-stone-100'}`}
              style={moodConfig ? { backgroundColor: moodConfig.bg } : { backgroundColor: '#F5F5F4' }}>
              <span className="text-[10px] text-slate-400 font-heading font-semibold capitalize">
                {format(day, 'EEE', { locale: fr }).slice(0, 3)}
              </span>
              <span className="text-base">{moodConfig ? moodConfig.emoji : '○'}</span>
              <span className="text-[10px] text-slate-500 font-heading">{format(day, 'd')}</span>
            </button>
          );
        })}
      </div>

      {/* Date sélectionnée */}
      <div className="flex items-center justify-between">
        <button onClick={() => setSelectedDate(d => subDays(d, 1))}
          className="w-9 h-9 rounded-full bg-white shadow-card flex items-center justify-center">
          <ChevronLeft size={18} className="text-slate-600" />
        </button>
        <p className="font-heading font-bold text-slate-700 capitalize">
          {isToday(selectedDate) ? "Aujourd'hui" : format(selectedDate, "EEEE d MMMM", { locale: fr })}
        </p>
        <button
          onClick={() => setSelectedDate(d => addDays(d, 1))}
          disabled={isToday(selectedDate)}
          className="w-9 h-9 rounded-full bg-white shadow-card flex items-center justify-center disabled:opacity-30">
          <ChevronRight size={18} className="text-slate-600" />
        </button>
      </div>

      {/* Mood matin */}
      <MoodSelector
        value={moodMatin}
        onChange={setMoodMatin}
        label="Début de journée"
        icon={Sun}
        color="#E8A838"
      />
      {moodMatin && (
        <div className="passerelle-card" style={{ backgroundColor: MOODS.find(m => m.level === moodMatin)?.bg }}>
          <textarea value={commentMatin} onChange={e => setCommentMatin(e.target.value)}
            placeholder="Note sur le matin..."
            rows={2} className="w-full px-4 py-3 bg-white/70 border border-white rounded-xl text-sm font-body text-slate-700 resize-none placeholder-slate-300" />
        </div>
      )}

      {/* Mood soir */}
      <MoodSelector
        value={moodSoir}
        onChange={setMoodSoir}
        label="Fin de journée"
        icon={Moon}
        color="#6B9FD4"
      />
      {moodSoir && (
        <div className="passerelle-card" style={{ backgroundColor: MOODS.find(m => m.level === moodSoir)?.bg }}>
          <textarea value={commentSoir} onChange={e => setCommentSoir(e.target.value)}
            placeholder="Note sur la journée..."
            rows={2} className="w-full px-4 py-3 bg-white/70 border border-white rounded-xl text-sm font-body text-slate-700 resize-none placeholder-slate-300" />
        </div>
      )}

      {/* Événements */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <p className="text-xs font-heading font-bold uppercase tracking-widest text-slate-400">Événements du jour</p>
          <button onClick={() => setShowAddEvent(true)}
            className="flex items-center gap-1 text-sage-600 font-heading font-semibold text-xs">
            <Plus size={13} /> Ajouter
          </button>
        </div>

        {events.length === 0 && !showAddEvent && (
          <div className="passerelle-card text-center py-5">
            <p className="text-sm text-slate-400 font-body italic">Aucun événement — une sortie, un incident, une réussite...</p>
          </div>
        )}

        <div className="space-y-2">
          {events.map(evt => (
            <div key={evt.id} className="passerelle-card !p-4 flex items-start gap-3">
              <div className="flex-1">
                <p className="font-heading font-semibold text-sm text-slate-700">{evt.title}</p>
                {evt.description && <p className="text-xs text-slate-400 font-body mt-1">{evt.description}</p>}
              </div>
              <button onClick={() => deleteEvent(evt.id)} className="text-slate-300 hover:text-red-400">
                <X size={14} />
              </button>
            </div>
          ))}
        </div>

        {showAddEvent && (
          <div className="passerelle-card mt-2 space-y-3">
            <input type="text" value={newEvent.title} onChange={e => setNewEvent(p => ({...p, title: e.target.value}))}
              placeholder="Titre de l'événement *"
              className="w-full h-10 px-3 bg-stone-50 border border-stone-200 rounded-xl text-sm font-body" />
            <textarea value={newEvent.description} onChange={e => setNewEvent(p => ({...p, description: e.target.value}))}
              placeholder="Description (optionnel)"
              rows={2} className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl text-sm font-body resize-none" />
            <div className="flex gap-2">
              <button onClick={() => { setShowAddEvent(false); setNewEvent({ title: '', description: '' }); }}
                className="flex-1 h-9 bg-stone-100 text-slate-600 rounded-xl font-heading font-semibold text-sm">
                Annuler
              </button>
              <button onClick={addEvent} disabled={savingEvent || !newEvent.title.trim()}
                className="flex-1 h-9 rounded-xl font-heading font-semibold text-sm disabled:opacity-40"
                style={{ backgroundColor: '#4A9B8F', color: 'white' }}>
                {savingEvent ? '...' : 'Ajouter'}
              </button>
            </div>
          </div>
        )}
      </div>

      {message && (
        <div className="p-3 bg-sage-50 border border-sage-200 rounded-2xl text-sm text-sage-700 font-heading font-semibold text-center">
          ✓ {message}
        </div>
      )}

      {/* Bouton sauvegarder */}
      <button onClick={saveMoods} disabled={(!moodMatin && !moodSoir) || saving}
        className="w-full h-12 rounded-2xl font-heading font-semibold text-sm disabled:opacity-40 flex items-center justify-center gap-2"
        style={{ backgroundColor: '#4A9B8F', color: 'white' }}>
        {saving ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : '💾 Enregistrer les moods'}
      </button>
    </div>
  );
}
