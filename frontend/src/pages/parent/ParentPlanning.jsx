import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import { ChevronLeft, ChevronRight, MapPin, Clock, Plus } from 'lucide-react';
import { format, startOfWeek, endOfWeek, addWeeks, subWeeks, eachDayOfInterval, isSameDay, isPast } from 'date-fns';
import { fr } from 'date-fns/locale';

const APT_COLORS = {
  'seance': { bg: '#E0F2F0', text: '#2E665E', dot: '#4A9B8F' },
  'bilan': { bg: '#DBEAFE', text: '#1E3A8A', dot: '#6B9FD4' },
  'reunion': { bg: '#F3E8FF', text: '#6B21A8', dot: '#A78BCA' },
  'autre': { bg: '#F5F5F4', text: '#57534E', dot: '#94A3B8' },
};

const getColorForType = (type) => APT_COLORS[type] || APT_COLORS['autre'];

const formatTime = (dt) => {
  if (!dt) return '';
  try { return format(new Date(dt), "HH'h'mm"); } catch { return ''; }
};

export default function ParentPlanning() {
  const { user } = useAuth();
  const [currentWeekStart, setCurrentWeekStart] = useState(() => startOfWeek(new Date(), { weekStartsOn: 1 }));
  const [appointments, setAppointments] = useState([]);
  const [scheduleItems, setScheduleItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [childId, setChildId] = useState(null);

  useEffect(() => {
    if (user) loadChildId();
  }, [user]);

  useEffect(() => {
    if (childId) loadData();
  }, [childId, currentWeekStart]);

  const loadChildId = async () => {
    const { data } = await supabase.from('parent_child_links').select('child_id').eq('parent_id', user.id).maybeSingle();
    if (data?.child_id) setChildId(data.child_id);
    else setLoading(false);
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
        <h1 className="page-title">Planning</h1>
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
              className={`flex-shrink-0 flex flex-col items-center gap-1 px-3 py-2 rounded-2xl min-w-[52px] ${isToday ? 'bg-sage-500' : 'bg-white shadow-card'}`}
            >
              <span className={`text-[10px] font-heading font-semibold uppercase ${isToday ? 'text-white/80' : 'text-slate-400'}`}>
                {format(day, 'EEE', { locale: fr }).slice(0, 3)}
              </span>
              <span className={`text-sm font-heading font-bold ${isToday ? 'text-white' : 'text-slate-700'}`}>
                {format(day, 'd')}
              </span>
              {dayApts.length > 0 && (
                <div className={`w-1.5 h-1.5 rounded-full ${isToday ? 'bg-white/60' : 'bg-sage-400'}`} />
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

              {/* Emploi du temps de base */}
              {daySchedule.map((item, i) => (
                <div key={i} className="flex items-center gap-3 px-4 py-2 bg-stone-50 rounded-2xl mb-2 border border-stone-100">
                  <div className="w-2 h-2 rounded-full bg-slate-300 flex-shrink-0" />
                  <span className="text-xs text-slate-500 font-body w-20">{item.start_time?.slice(0,5)} – {item.end_time?.slice(0,5)}</span>
                  <span className="text-xs text-slate-600 font-body">{item.label}</span>
                </div>
              ))}

              {/* RDV */}
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
    </div>
  );
}
