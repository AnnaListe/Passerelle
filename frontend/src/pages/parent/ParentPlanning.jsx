import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import { ChevronLeft, ChevronRight, MapPin, Clock, Plus, X, Check } from 'lucide-react';
import { format, startOfWeek, endOfWeek, addWeeks, subWeeks, eachDayOfInterval, isSameDay, isPast } from 'date-fns';
import { fr } from 'date-fns/locale';

const APT_COLORS = {
  'seance': { bg: '#E0F2F0', text: '#2E665E', dot: '#4A9B8F' },
  'ecole': { bg: '#DBEAFE', text: '#1E3A8A', dot: '#6B9FD4' },
  'activite': { bg: '#F3E8FF', text: '#6B21A8', dot: '#A78BCA' },
  'autre': { bg: '#F5F5F4', text: '#57534E', dot: '#94A3B8' },
};

const APPOINTMENT_TYPES = [
  { value: 'seance', label: 'Séance' },
  { value: 'ecole', label: 'École' },
  { value: 'activite', label: 'Activité' },
  { value: 'autre', label: 'Autre' },
];

const getColorForType = (type) => APT_COLORS[type] || APT_COLORS['autre'];

const formatTime = (dt) => {
  if (!dt) return '';
  try {
    const utcDt = dt.includes('Z') || dt.includes('+') ? dt : dt.replace(' ', 'T') + 'Z';
    return new Date(utcDt).toLocaleTimeString('fr-FR', {
      hour: '2-digit',
      minute: '2-digit',
      timeZone: 'Europe/Paris',
      hour12: false
    }).replace(':', 'h');
  } catch { return ''; }
};

export default function ParentPlanning() {
  const { user } = useAuth();
  const [currentWeekStart, setCurrentWeekStart] = useState(() => startOfWeek(new Date(), { weekStartsOn: 1 }));
  const [appointments, setAppointments] = useState([]);
  const [scheduleItems, setScheduleItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [childId, setChildId] = useState(null);
  const [linkedPros, setLinkedPros] = useState([]);

  // Modal
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    appointment_type: 'seance',
    date: '',
    start_time: '09:00',
    end_time: '10:00',
    location: '',
    notes: '',
    pro_id: '',
  });

  useEffect(() => {
    if (user) loadChildId();
  }, [user]);

  useEffect(() => {
    if (childId) loadData();
  }, [childId, currentWeekStart]);

  const loadChildId = async () => {
    const { data } = await supabase.from('parent_child_links').select('child_id').eq('parent_id', user.id).maybeSingle();
    if (data?.child_id) {
      setChildId(data.child_id);
      // Charger les pros liés
      const { data: pros } = await supabase.from('child_professionals').select('*').eq('child_id', data.child_id);
      setLinkedPros(pros?.filter(p => p.is_on_passerelle) || []);
    } else {
      setLoading(false);
    }
  };

  const loadData = async () => {
    setLoading(true);
    try {
      const start = format(currentWeekStart, 'yyyy-MM-dd');
      const end = format(endOfWeek(currentWeekStart, { weekStartsOn: 1 }), 'yyyy-MM-dd');

      const [aptsRes, schedRes] = await Promise.all([
        supabase.from('appointments').select('*').eq('child_id', childId)
          .gte('start_datetime', `${start}T00:00:00`)
          .lte('start_datetime', `${end}T23:59:59`)
          .order('start_datetime'),
        supabase.from('child_weekly_schedule').select('*').eq('child_id', childId),
      ]);

      setAppointments(aptsRes.data || []);
      setScheduleItems(schedRes.data || []);
    } catch (error) {
      console.error('Error loading planning:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!formData.title || !formData.date || !formData.start_time || !formData.end_time) return;
    setSaving(true);
    try {
      const startDatetime = `${formData.date}T${formData.start_time}:00`;
      const endDatetime = `${formData.date}T${formData.end_time}:00`;

      if (formData.appointment_type === 'seance' && formData.pro_id) {
        // Demande de RDV au pro → notification
        const { data: { user: currentUser } } = await supabase.auth.getUser();
        await supabase.from('notifications').insert({
          user_id: formData.pro_id,
          type: 'rdv_demande',
          title: 'Demande de rendez-vous',
          message: `Le parent de ${childId} demande un rendez-vous : "${formData.title}" le ${format(new Date(formData.date), 'dd/MM/yyyy', { locale: fr })} de ${formData.start_time} à ${formData.end_time}.`,
          data: JSON.stringify({
            child_id: childId,
            title: formData.title,
            start_datetime: startDatetime,
            end_datetime: endDatetime,
            location: formData.location || null,
            notes: formData.notes || null,
          }),
          read: false,
        });
        alert('Demande envoyée au professionnel ! Il recevra une notification pour valider le rendez-vous.');
      } else {
        // Ajout direct pour école, activité, autre
        await supabase.from('appointments').insert({
          child_id: childId,
          title: formData.title,
          appointment_type: formData.appointment_type,
          start_datetime: startDatetime,
          end_datetime: endDatetime,
          location: formData.location || null,
          notes: formData.notes || null,
        });
        await loadData();
      }

      setShowModal(false);
      setFormData({
        title: '',
        appointment_type: 'seance',
        date: '',
        start_time: '09:00',
        end_time: '10:00',
        location: '',
        notes: '',
        pro_id: '',
      });
    } catch (error) {
      console.error('Error creating appointment:', error);
    } finally {
      setSaving(false);
    }
  };

  const days = eachDayOfInterval({
    start: currentWeekStart,
    end: endOfWeek(currentWeekStart, { weekStartsOn: 1 })
  });

  const weekLabel = `${format(currentWeekStart, 'd')} – ${format(endOfWeek(currentWeekStart, { weekStartsOn: 1 }), 'd MMM yyyy', { locale: fr })}`;

  const DAY_MAP = { lundi: 1, mardi: 2, mercredi: 3, jeudi: 4, vendredi: 5, samedi: 6, dimanche: 0 };

  const getAppointmentsForDay = (day) =>
    appointments.filter(apt => {
      try { return isSameDay(new Date(apt.start_datetime), day); } catch { return false; }
    });

  const getScheduleForDay = (day) =>
    scheduleItems.filter(item => DAY_MAP[item.day_of_week] === day.getDay());

  const totalThisWeek = appointments.length;

  if (loading) return (
    <div className="p-5 space-y-3">
      {[1,2,3].map(i => <div key={i} className="h-20 bg-stone-100 rounded-3xl animate-pulse" />)}
    </div>
  );

  return (
    <div className="px-5 pt-5 pb-6 space-y-5">
      {/* Header */}
      <div>
        <div className="flex items-center justify-between">
          <h1 className="page-title">Planning</h1>
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-1.5 px-4 py-2 rounded-full font-heading font-semibold text-sm text-white"
            style={{ backgroundColor: '#4A9B8F' }}
          >
            <Plus size={15} /> Ajouter
          </button>
        </div>
        <div className="flex items-center justify-between mt-3">
          <button
            onClick={() => setCurrentWeekStart(prev => subWeeks(prev, 1))}
            className="w-9 h-9 rounded-full bg-white shadow-card flex items-center justify-center text-slate-600"
          >
            <ChevronLeft size={18} />
          </button>
          <div className="text-center">
            <p className="font-heading font-semibold text-slate-700 capitalize">{weekLabel}</p>
            {totalThisWeek > 0 && (
              <p className="text-xs text-slate-400 font-body">{totalThisWeek} rendez-vous cette semaine</p>
            )}
          </div>
          <button
            onClick={() => setCurrentWeekStart(prev => addWeeks(prev, 1))}
            className="w-9 h-9 rounded-full bg-white shadow-card flex items-center justify-center text-slate-600"
          >
            <ChevronRight size={18} />
          </button>
        </div>
      </div>

      {/* Pills jours */}
      <div className="flex gap-2 overflow-x-auto pb-1" style={{ scrollbarWidth: 'none' }}>
        {days.map(day => {
          const dayApts = getAppointmentsForDay(day);
          const isToday = isSameDay(day, new Date());
          return (
            <div
              key={day.toISOString()}
              className="flex-shrink-0 flex flex-col items-center gap-1 px-3 py-2 rounded-2xl min-w-[52px] shadow-card"
              style={isToday ? { backgroundColor: '#2E7A6F' } : { backgroundColor: 'white' }}
            >
              <span className={`text-[10px] font-heading font-semibold uppercase ${isToday ? 'text-white' : 'text-slate-400'}`}>
                {format(day, 'EEE', { locale: fr }).slice(0, 3)}
              </span>
              <span className={`text-sm font-heading font-bold ${isToday ? 'text-white' : 'text-slate-700'}`}>
                {format(day, 'd')}
              </span>
              {dayApts.length > 0 && (
                <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: isToday ? 'rgba(255,255,255,0.6)' : '#4A9B8F' }} />
              )}
            </div>
          );
        })}
      </div>

      {/* Liste des jours */}
      <div className="space-y-4">
        {days.map(day => {
          const dayApts = getAppointmentsForDay(day);
          const daySchedule = getScheduleForDay(day);
          const isToday = isSameDay(day, new Date());
          const dayLabel = format(day, 'EEEE d MMMM', { locale: fr });

          return (
            <div key={day.toISOString()}>
              <div className="flex items-center gap-2 mb-2">
                <p className={`text-sm font-heading font-semibold capitalize ${isToday ? 'text-sage-600' : 'text-slate-500'}`}>
                  {dayLabel}
                  {isToday && <span className="ml-2 text-[10px] bg-sage-100 text-sage-700 px-2 py-0.5 rounded-full">Aujourd'hui</span>}
                </p>
              </div>

              {daySchedule.map((item, i) => (
                <div key={i} className="flex items-center gap-3 px-4 py-2 bg-stone-50 rounded-2xl mb-2 border border-stone-100">
                  <div className="w-2 h-2 rounded-full bg-slate-300 flex-shrink-0" />
                  <span className="text-xs text-slate-500 font-body w-20">{item.start_time?.slice(0,5)} – {item.end_time?.slice(0,5)}</span>
                  <span className="text-xs text-slate-600 font-body">{item.label}</span>
                </div>
              ))}

              {dayApts.length === 0 && daySchedule.length === 0 ? (
                <div className="flex items-center gap-3 px-4 py-3 bg-stone-50 rounded-2xl border border-stone-100">
                  <p className="text-sm text-slate-300 font-body italic">Aucun rendez-vous</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {dayApts.map(apt => {
                    const colors = getColorForType(apt.appointment_type);
                    const past = isPast(new Date(apt.end_datetime));
                    return (
                      <div
                        key={apt.id}
                        className="rounded-2xl p-4 flex items-start gap-3"
                        style={{ backgroundColor: colors.bg, opacity: past ? 0.65 : 1 }}
                      >
                        <div className="w-3 h-3 rounded-full mt-1 flex-shrink-0" style={{ backgroundColor: colors.dot }} />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <p className="font-heading font-semibold text-sm" style={{ color: colors.text }}>{apt.title}</p>
                            {past && <span className="text-[10px] font-heading font-semibold text-slate-400 bg-white/60 px-2 py-0.5 rounded-full flex-shrink-0">Passé</span>}
                          </div>
                          <div className="flex items-center gap-3 mt-1.5">
                            <div className="flex items-center gap-1 text-xs text-slate-500 font-body">
                              <Clock size={11} />
                              {formatTime(apt.start_datetime)} – {formatTime(apt.end_datetime)}
                            </div>
                            {apt.location && (
                              <div className="flex items-center gap-1 text-xs text-slate-400 font-body truncate">
                                <MapPin size={11} />
                                <span className="truncate">{apt.location}</span>
                              </div>
                            )}
                          </div>
                          {apt.notes && <p className="text-xs text-slate-400 font-body mt-1 italic">{apt.notes}</p>}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Modal ajout RDV */}
      {showModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-[480px] bg-white rounded-3xl p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-heading font-bold text-lg text-slate-800">Ajouter un rendez-vous</h3>
              <button onClick={() => setShowModal(false)} className="w-8 h-8 rounded-full bg-stone-100 flex items-center justify-center">
                <X size={16} className="text-slate-500" />
              </button>
            </div>

            <div className="space-y-4">
              {/* Titre */}
              <div>
                <label className="text-xs text-slate-500 font-heading font-semibold mb-1 block">Titre *</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={e => setFormData({...formData, title: e.target.value})}
                  placeholder="Ex: Séance orthophonie"
                  className="w-full h-11 px-4 bg-stone-50 border border-stone-200 rounded-2xl text-sm font-body text-slate-700"
                />
              </div>

              {/* Type */}
              <div>
                <label className="text-xs text-slate-500 font-heading font-semibold mb-2 block">Type *</label>
                <div className="flex gap-2 flex-wrap">
                  {APPOINTMENT_TYPES.map(type => (
                    <button
                      key={type.value}
                      onClick={() => setFormData({...formData, appointment_type: type.value, pro_id: ''})}
                      className="px-4 py-2 rounded-full text-sm font-heading font-semibold border transition-all"
                      style={formData.appointment_type === type.value
                        ? { backgroundColor: '#4A9B8F', color: 'white', borderColor: '#4A9B8F' }
                        : { backgroundColor: 'white', color: '#64748b', borderColor: '#e2e8f0' }
                      }
                    >
                      {type.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Choix du pro si séance */}
              {formData.appointment_type === 'seance' && linkedPros.length > 0 && (
                <div>
                  <label className="text-xs text-slate-500 font-heading font-semibold mb-2 block">Professionnel</label>
                  <div className="space-y-2">
                    {linkedPros.map(pro => (
                      <button
                        key={pro.id}
                        onClick={() => setFormData({...formData, pro_id: pro.professional_id})}
                        className="w-full flex items-center gap-3 p-3 rounded-2xl border transition-all"
                        style={formData.pro_id === pro.professional_id
                          ? { borderColor: '#4A9B8F', backgroundColor: '#E0F2F0' }
                          : { borderColor: '#e2e8f0', backgroundColor: '#fafaf9' }
                        }
                      >
                        <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: '#E0F2F0' }}>
                          <span className="font-heading font-bold text-xs" style={{ color: '#4A9B8F' }}>
                            {pro.professional_name?.[0] || 'P'}
                          </span>
                        </div>
                        <div className="text-left">
                          <p className="text-sm font-heading font-semibold text-slate-700">{pro.professional_name}</p>
                          <p className="text-xs text-slate-400 font-body">{pro.profession}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Date */}
              <div>
                <label className="text-xs text-slate-500 font-heading font-semibold mb-1 block">Date *</label>
                <input
                  type="date"
                  value={formData.date}
                  onChange={e => setFormData({...formData, date: e.target.value})}
                  className="w-full h-11 px-4 bg-stone-50 border border-stone-200 rounded-2xl text-sm font-body text-slate-700"
                />
              </div>

              {/* Heures */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-slate-500 font-heading font-semibold mb-1 block">Début *</label>
                  <input
                    type="time"
                    value={formData.start_time}
                    onChange={e => setFormData({...formData, start_time: e.target.value})}
                    className="w-full h-11 px-4 bg-stone-50 border border-stone-200 rounded-2xl text-sm font-body text-slate-700"
                  />
                </div>
                <div>
                  <label className="text-xs text-slate-500 font-heading font-semibold mb-1 block">Fin *</label>
                  <input
                    type="time"
                    value={formData.end_time}
                    onChange={e => setFormData({...formData, end_time: e.target.value})}
                    className="w-full h-11 px-4 bg-stone-50 border border-stone-200 rounded-2xl text-sm font-body text-slate-700"
                  />
                </div>
              </div>

              {/* Lieu */}
              <div>
                <label className="text-xs text-slate-500 font-heading font-semibold mb-1 block">Lieu</label>
                <input
                  type="text"
                  value={formData.location}
                  onChange={e => setFormData({...formData, location: e.target.value})}
                  placeholder="Ex: Cabinet Dr. Martin"
                  className="w-full h-11 px-4 bg-stone-50 border border-stone-200 rounded-2xl text-sm font-body text-slate-700"
                />
              </div>

              {/* Notes */}
              <div>
                <label className="text-xs text-slate-500 font-heading font-semibold mb-1 block">Notes</label>
                <textarea
                  value={formData.notes}
                  onChange={e => setFormData({...formData, notes: e.target.value})}
                  placeholder="Notes supplémentaires..."
                  rows={3}
                  className="w-full px-4 py-3 bg-stone-50 border border-stone-200 rounded-2xl text-sm font-body text-slate-700 resize-none"
                />
              </div>

              {/* Bouton */}
              <button
                onClick={handleSubmit}
                disabled={!formData.title || !formData.date || saving}
                className="w-full h-12 rounded-2xl font-heading font-semibold text-sm text-white flex items-center justify-center gap-2 disabled:opacity-40"
                style={{ backgroundColor: '#4A9B8F' }}
              >
                {saving
                  ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  : <><Check size={16} /> {formData.appointment_type === 'seance' && formData.pro_id ? 'Envoyer la demande' : 'Ajouter'}</>
                }
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
