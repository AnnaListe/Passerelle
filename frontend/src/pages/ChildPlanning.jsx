import React, { useState, useEffect, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { appointmentsAPI, childrenAPI, schoolHolidaysAPI } from '../lib/api';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Input, Label } from '../components/ui/input';
import { Avatar } from '../components/ui/avatar';
import { 
  ChevronLeft, ChevronRight, Calendar, Plus, Edit2, Trash2, 
  ArrowLeft, Settings, X, Check, Sun
} from 'lucide-react';
import { formatTime, formatDate } from '../lib/utils';
import { supabase } from '../lib/supabase';

const APPOINTMENT_TYPES = [
  { value: 'seance', label: 'Séance', color: 'bg-primary' },
  { value: 'ecole', label: 'École', color: 'bg-blue-500' },
  { value: 'activite', label: 'Activité', color: 'bg-green-500' },
  { value: 'autre', label: 'Autre', color: 'bg-slate-500' },
];

const ZONES = [
  { value: 'A', label: 'Zone A (Lyon, Bordeaux, Clermont...)' },
  { value: 'B', label: 'Zone B (Rennes, Nantes, Orléans...)' },
  { value: 'C', label: 'Zone C (Paris, Montpellier, Toulouse...)' },
];

const SCHOOL_HOLIDAYS_2025_2026 = {
  A: [
    { name: 'Toussaint', start: '2025-10-18', end: '2025-11-03' },
    { name: 'Noël', start: '2025-12-20', end: '2026-01-05' },
    { name: 'Hiver', start: '2026-02-07', end: '2026-02-23' },
    { name: 'Printemps', start: '2026-04-11', end: '2026-04-27' },
    { name: 'Été', start: '2026-07-04', end: '2026-09-01' },
  ],
  B: [
    { name: 'Toussaint', start: '2025-10-18', end: '2025-11-03' },
    { name: 'Noël', start: '2025-12-20', end: '2026-01-05' },
    { name: 'Hiver', start: '2026-02-21', end: '2026-03-09' },
    { name: 'Printemps', start: '2026-04-18', end: '2026-05-04' },
    { name: 'Été', start: '2026-07-04', end: '2026-09-01' },
  ],
  C: [
    { name: 'Toussaint', start: '2025-10-18', end: '2025-11-03' },
    { name: 'Noël', start: '2025-12-20', end: '2026-01-05' },
    { name: 'Hiver', start: '2026-02-14', end: '2026-03-02' },
    { name: 'Printemps', start: '2026-04-04', end: '2026-04-20' },
    { name: 'Été', start: '2026-07-04', end: '2026-09-01' },
  ],
};

function getWeekStart(date) {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  return new Date(d.setDate(diff));
}

const ChildPlanning = () => {
  const { childId } = useParams();
  const [child, setChild] = useState(null);
  const [appointments, setAppointments] = useState([]);
  const [currentWeekStart, setCurrentWeekStart] = useState(getWeekStart(new Date()));
  const [loading, setLoading] = useState(true);
  const [selectedZone, setSelectedZone] = useState('C');
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editingAppointment, setEditingAppointment] = useState(null);
  const [showSettings, setShowSettings] = useState(false);
  const [showRecurringModal, setShowRecurringModal] = useState(false);
  const [recurringForm, setRecurringForm] = useState({
  title: '',
  appointment_type: 'seance',
  day_of_week: 'lundi',
  start_time: '09:00',
  end_time: '10:00',
  location: '',
  start_date: new Date().toISOString().split('T')[0],
  end_date: '',
  });

  const [formData, setFormData] = useState({
    title: '',
    appointment_type: 'seance',
    date: '',
    start_time: '09:00',
    end_time: '10:00',
    location: '',
    notes: '',
  });

  useEffect(() => {
    loadData();
  }, [childId, currentWeekStart]);

  const loadData = async () => {
    try {
      const weekEnd = new Date(currentWeekStart);
      weekEnd.setDate(weekEnd.getDate() + 7);
      weekEnd.setHours(23, 59, 59);

      const [childRes, appointmentsRes] = await Promise.all([
        childrenAPI.detail(childId),
        appointmentsAPI.listByChild(childId).catch(() => ({ data: [] }))
      ]);

      setChild(childRes.data);
      setAppointments(appointmentsRes.data || []);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const goToPreviousWeek = () => {
    const newDate = new Date(currentWeekStart);
    newDate.setDate(newDate.getDate() - 7);
    setCurrentWeekStart(newDate);
  };

  const goToNextWeek = () => {
    const newDate = new Date(currentWeekStart);
    newDate.setDate(newDate.getDate() + 7);
    setCurrentWeekStart(newDate);
  };

  const goToToday = () => {
    setCurrentWeekStart(getWeekStart(new Date()));
  };

  const weekDays = useMemo(() => {
    const days = [];
    for (let i = 0; i < 7; i++) {
      const date = new Date(currentWeekStart);
      date.setDate(date.getDate() + i);
      days.push(date);
    }
    return days;
  }, [currentWeekStart]);

  const isHoliday = (date) => {
    const dateStr = date.toISOString().split('T')[0];
    const holidays = SCHOOL_HOLIDAYS_2025_2026[selectedZone] || [];
    return holidays.find(h => dateStr >= h.start && dateStr <= h.end);
  };

  // Planning de base de la fiche enfant (emploi du temps récurrent)
  const getScheduleForDay = (date) => {
    if (!child?.weekly_schedule) return [];
    const dayName = date.toLocaleDateString('fr-FR', { weekday: 'long' }).toLowerCase();
    return child.weekly_schedule.filter(s => s.day_of_week === dayName);
  };

  // RDV ponctuels ajoutés par la pro
  const getAppointmentsForDay = (date) => {
    const dateStr = date.toISOString().split('T')[0];
    return appointments.filter(apt => {
      const aptDate = new Date(apt.start_datetime).toISOString().split('T')[0];
      return aptDate === dateStr;
    }).sort((a, b) => new Date(a.start_datetime) - new Date(b.start_datetime));
  };

  const handleOpenModal = (date, appointment = null) => {
    if (appointment) {
      setEditingAppointment(appointment);
      const startDate = new Date(appointment.start_datetime);
      const endDate = new Date(appointment.end_datetime);
      setFormData({
        title: appointment.title,
        appointment_type: appointment.appointment_type,
        date: startDate.toISOString().split('T')[0],
        start_time: startDate.toTimeString().slice(0, 5),
        end_time: endDate.toTimeString().slice(0, 5),
        location: appointment.location || '',
        notes: appointment.notes || '',
      });
    } else {
      setEditingAppointment(null);
      setFormData({
        title: '',
        appointment_type: 'seance',
        date: date ? date.toISOString().split('T')[0] : '',
        start_time: '09:00',
        end_time: '10:00',
        location: '',
        notes: '',
      });
    }
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (saving) return;
    setSaving(true);
    try {
      const startDatetime = new Date(`${formData.date}T${formData.start_time}`);
      const endDatetime = new Date(`${formData.date}T${formData.end_time}`);

      const payload = {
        child_id: childId,
        title: formData.title,
        appointment_type: formData.appointment_type,
        start_datetime: startDatetime.toISOString(),
        end_datetime: endDatetime.toISOString(),
        location: formData.location || null,
        notes: formData.notes || null,
      };

      if (editingAppointment) {
        await appointmentsAPI.update(editingAppointment.id, payload);
      } else {
        await appointmentsAPI.create(payload);
      }

      setShowModal(false);
      loadData();
    } catch (error) {
      console.error('Error saving appointment:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (appointmentId) => {
    if (!window.confirm('Supprimer ce rendez-vous ?')) return;
    try {
      await appointmentsAPI.delete(appointmentId);
      setShowModal(false);
      loadData();
    } catch (error) {
      console.error('Error deleting appointment:', error);
    }
  };

  const handleDeleteRecurring = async (recurringId) => {
    if (!window.confirm('Supprimer TOUS les RDV de cette récurrence ?')) return;
    try {
      await supabase.from('appointments').delete().eq('recurring_id', recurringId);
      setShowModal(false);
      loadData();
    } catch (error) {
      console.error('Error deleting recurring:', error);
    }
  };
  
  const handleCreateRecurring = async (e) => {
    e.preventDefault();
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const [y, m, d] = recurringForm.start_date.split('-').map(Number);
      const startDate = new Date(y, m - 1, d);
      const endDate = recurringForm.end_date 
        ? (() => { const [ey, em, ed] = recurringForm.end_date.split('-').map(Number); return new Date(ey, em - 1, ed); })()
        : new Date(startDate.getFullYear(), startDate.getMonth() + 3, startDate.getDate());      
      const dayMap = { dimanche: 0, lundi: 1, mardi: 2, mercredi: 3, jeudi: 4, vendredi: 5, samedi: 6 };
      const targetDay = dayMap[recurringForm.day_of_week];

      const aptList = [];
      const current = new Date(startDate);

      // Aller au premier jour cible SANS dépasser
      let daysToAdd = (targetDay - current.getDay() + 7) % 7;
      current.setDate(current.getDate() + daysToAdd);
      
      // Aller au premier jour cible
      while (current.getDay() !== targetDay) {
        current.setDate(current.getDate() + 1);
      }
      
      const recurringId = crypto.randomUUID();
      
      while (current <= endDate) {
        const dateStr = `${current.getFullYear()}-${String(current.getMonth()+1).padStart(2,'0')}-${String(current.getDate()).padStart(2,'0')}`;
        aptList.push({
          child_id: childId,
          professional_id: user.id,
          title: recurringForm.title,
          appointment_type: recurringForm.appointment_type,
          start_datetime: `${dateStr}T${recurringForm.start_time}:00`,
          end_datetime: `${dateStr}T${recurringForm.end_time}:00`,
          location: recurringForm.location || null,
          recurring_id: recurringId,
          is_recurring: true,
        });
        current.setDate(current.getDate() + 7);
      }
      
      await supabase.from('appointments').insert(aptList);
      setShowRecurringModal(false);
      loadData();
    } catch (error) {
      console.error('Error creating recurring appointments:', error);
      alert('Erreur lors de la création des RDV récurrents');
    }
  };

  const getTypeColor = (type) => {
    const found = APPOINTMENT_TYPES.find(t => t.value === type);
    return found?.color || 'bg-slate-500';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in" data-testid="child-planning">
      <Link to={`/children/${childId}`}>
        <Button variant="ghost" data-testid="back-button">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Retour à la fiche
        </Button>
      </Link>

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          {child && (
            <>
              <Avatar 
                src={child.child?.photo_url} 
                firstName={child.child?.first_name} 
                lastName={child.child?.last_name}
                size="lg"
              />
              <div>
                <h1 className="text-2xl md:text-3xl font-bold text-slate-800 font-outfit">
                  Planning de {child.child?.first_name}
                </h1>
                <p className="text-foreground-muted">
                  Semaine du {currentWeekStart.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
                </p>
              </div>
            </>
          )}
        </div>

        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" onClick={() => setShowSettings(!showSettings)} data-testid="settings-button">
            <Settings className="w-4 h-4" />
          </Button>
          <Button variant="outline" size="sm" onClick={goToPreviousWeek} data-testid="prev-week">
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <Button variant="secondary" size="sm" onClick={goToToday} data-testid="today-button">
            Aujourd'hui
          </Button>
          <Button variant="primary" size="sm" onClick={() => setShowRecurringModal(true)}>
            <Plus className="w-4 h-4 mr-1" />
            RDV récurrent 
          </Button>
          <Button variant="outline" size="sm" onClick={goToNextWeek} data-testid="next-week">
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {showSettings && (
        <Card className="bg-background-subtle">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-slate-700">Paramètres du planning</h3>
              <Button variant="ghost" size="sm" onClick={() => setShowSettings(false)}>
                <X className="w-4 h-4" />
              </Button>
            </div>
            <div>
              <Label>Zone de vacances scolaires</Label>
              <div className="flex flex-wrap gap-2 mt-2">
                {ZONES.map(zone => (
                  <Button
                    key={zone.value}
                    variant={selectedZone === zone.value ? 'primary' : 'outline'}
                    size="sm"
                    onClick={() => setSelectedZone(zone.value)}
                    data-testid={`zone-${zone.value}`}
                  >
                    {zone.label}
                  </Button>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Légende */}
      <Card>
        <CardContent className="pt-4">
          <div className="flex flex-wrap gap-4">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-slate-200 border border-slate-300 rounded"></div>
              <span className="text-sm text-slate-600">Emploi du temps (fiche enfant)</span>
            </div>
            {APPOINTMENT_TYPES.map(type => (
              <div key={type.value} className="flex items-center gap-2">
                <div className={`w-4 h-4 ${type.color} rounded`}></div>
                <span className="text-sm text-slate-600">{type.label}</span>
              </div>
            ))}
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-amber-200 rounded"></div>
              <span className="text-sm text-slate-600">Vacances scolaires</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Calendrier semaine */}
      <Card className="overflow-hidden">
        <div className="grid grid-cols-7 divide-x divide-slate-200">
          {weekDays.map((day, index) => {
            const isToday = day.toDateString() === new Date().toDateString();
            const holiday = isHoliday(day);
            const scheduleItems = getScheduleForDay(day);
            const dayAppointments = getAppointmentsForDay(day);

            return (
              <div
                key={index}
                className={`min-h-[300px] ${holiday ? 'bg-amber-50' : ''}`}
              >
                {/* En-tête du jour */}
                <div className={`p-3 text-center border-b border-slate-200 ${isToday ? 'bg-primary-light' : 'bg-background-subtle'}`}>
                  <div className={`text-xs font-medium uppercase mb-1 ${isToday ? 'text-primary' : 'text-foreground-muted'}`}>
                    {day.toLocaleDateString('fr-FR', { weekday: 'short' })}
                  </div>
                  <div className={`text-xl font-bold ${isToday ? 'text-primary' : 'text-slate-800'}`}>
                    {day.getDate()}
                  </div>
                  <div className="text-xs text-foreground-muted">
                    {day.toLocaleDateString('fr-FR', { month: 'short' })}
                  </div>
                  {holiday && (
                    <Badge variant="warning" className="mt-1 text-xs">
                      <Sun className="w-3 h-3 mr-1" />
                      {holiday.name}
                    </Badge>
                  )}
                </div>

                {/* Contenu du jour */}
                <div className="p-2 space-y-1">
                  {/* Emploi du temps de base (grisé) */}
                  {scheduleItems.map((item, i) => (
                    <div
                      key={`schedule-${i}`}
                      className="bg-slate-100 border border-slate-200 text-slate-500 p-2 rounded-lg text-xs"
                      title="Emploi du temps récurrent"
                    >
                      <div className="font-medium truncate">
                        {item.start_time} - {item.end_time}
                      </div>
                      <div className="truncate">{item.label}</div>
                      {item.location && (
                        <div className="truncate opacity-70 text-[10px]">{item.location}</div>
                      )}
                    </div>
                  ))}

                  {/* RDV ponctuels (en couleur) */}
                  {dayAppointments.map(apt => (
                    <div
                      key={apt.id}
                      className={`${getTypeColor(apt.appointment_type)} text-white p-2 rounded-lg text-xs cursor-pointer hover:opacity-90 transition-opacity`}
                      onClick={() => handleOpenModal(day, apt)}
                      data-testid={`appointment-${apt.id}`}
                    >
                      <div className="font-semibold truncate">
                        {formatTime(apt.start_datetime)} - {formatTime(apt.end_datetime)}
                      </div>
                      <div className="truncate">{apt.title}</div>
                      {apt.location && (
                        <div className="truncate opacity-80 text-[10px]">{apt.location}</div>
                      )}
                    </div>
                  ))}

                  {/* Bouton ajouter */}
                  <button
                    onClick={() => handleOpenModal(day)}
                    className="w-full p-2 border-2 border-dashed border-slate-200 rounded-lg text-slate-400 hover:border-primary hover:text-primary transition-colors flex items-center justify-center gap-1 text-xs"
                    data-testid={`add-appointment-${day.toISOString().split('T')[0]}`}
                  >
                    <Plus className="w-3 h-3" />
                    Ajouter
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </Card>

      {/* Résumé */}
      <Card className="bg-gradient-to-br from-primary-light to-white border-primary/20">
        <CardContent className="pt-6">
          <div className="flex items-center justify-center gap-3">
            <Calendar className="w-8 h-8 text-primary" />
            <div>
              <p className="text-2xl font-bold text-slate-800">{appointments.length}</p>
              <p className="text-sm text-foreground-muted">rendez-vous cette semaine</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Modal ajout/édition RDV */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="max-w-lg w-full">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>
                  {editingAppointment ? 'Modifier le rendez-vous' : 'Nouveau rendez-vous'}
                </CardTitle>
                {editingAppointment && (
                  <div className="flex gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-red-500 hover:text-red-700"
                      onClick={() => handleDelete(editingAppointment.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                      Ce RDV
                    </Button>
                    {editingAppointment.is_recurring && editingAppointment.recurring_id && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-red-700 hover:text-red-900"
                        onClick={() => handleDeleteRecurring(editingAppointment.recurring_id)}
                      >
                        <Trash2 className="w-4 h-4" />
                        Toute la série
                      </Button>
                    )}
                  </div>
                )}
              </div>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="title">Titre *</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => setFormData({...formData, title: e.target.value})}
                    placeholder="Ex: Séance orthophoniste"
                    required
                  />
                </div>

                <div>
                  <Label>Type</Label>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {APPOINTMENT_TYPES.map(type => (
                      <Button
                        key={type.value}
                        type="button"
                        variant={formData.appointment_type === type.value ? 'primary' : 'outline'}
                        size="sm"
                        onClick={() => setFormData({...formData, appointment_type: type.value})}
                      >
                        {type.label}
                      </Button>
                    ))}
                  </div>
                </div>

                <div>
                  <Label htmlFor="date">Date *</Label>
                  <Input
                    id="date"
                    type="date"
                    value={formData.date}
                    onChange={(e) => setFormData({...formData, date: e.target.value})}
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="start_time">Heure début *</Label>
                    <Input
                      id="start_time"
                      type="time"
                      value={formData.start_time}
                      onChange={(e) => setFormData({...formData, start_time: e.target.value})}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="end_time">Heure fin *</Label>
                    <Input
                      id="end_time"
                      type="time"
                      value={formData.end_time}
                      onChange={(e) => setFormData({...formData, end_time: e.target.value})}
                      required
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="location">Lieu</Label>
                  <Input
                    id="location"
                    value={formData.location}
                    onChange={(e) => setFormData({...formData, location: e.target.value})}
                    placeholder="Ex: Cabinet Dr. Martin"
                  />
                </div>

                <div>
                  <Label htmlFor="notes">Notes</Label>
                  <textarea
                    id="notes"
                    value={formData.notes}
                    onChange={(e) => setFormData({...formData, notes: e.target.value})}
                    className="w-full bg-input border-transparent focus:bg-white focus:border-primary focus:ring-2 focus:ring-primary/20 rounded-xl px-4 py-3 text-slate-700 outline-none min-h-[80px]"
                    placeholder="Notes supplémentaires..."
                  />
                </div>

                <div className="flex gap-3 pt-4">
                  <Button type="button" variant="outline" className="flex-1" onClick={() => setShowModal(false)}>
                    Annuler
                  </Button>
                    <Button type="submit" className="flex-1" disabled={saving}>
                       <Check className="w-4 h-4 mr-2" />
                       {editingAppointment ? 'Enregistrer' : 'Créer'}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}
      {/* Modal RDV récurrent */}
      {showRecurringModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="max-w-lg w-full">
            <CardHeader>
              <CardTitle>Créer un RDV récurrent</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleCreateRecurring} className="space-y-4">
                <div>
                  <Label>Titre *</Label>
                  <Input value={recurringForm.title} onChange={(e) => setRecurringForm({...recurringForm, title: e.target.value})} placeholder="Ex: Séance orthophonie" required />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Jour de la semaine *</Label>
                    <select value={recurringForm.day_of_week} onChange={(e) => setRecurringForm({...recurringForm, day_of_week: e.target.value})} className="w-full bg-input border-transparent focus:bg-white focus:border-primary rounded-xl px-4 py-3 text-slate-700 outline-none">
                      {['lundi','mardi','mercredi','jeudi','vendredi','samedi','dimanche'].map(d => (
                        <option key={d} value={d}>{d.charAt(0).toUpperCase() + d.slice(1)}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <Label>Type</Label>
                    <select value={recurringForm.appointment_type} onChange={(e) => setRecurringForm({...recurringForm, appointment_type: e.target.value})} className="w-full bg-input border-transparent focus:bg-white focus:border-primary rounded-xl px-4 py-3 text-slate-700 outline-none">
                      <option value="seance">Séance</option>
                      <option value="ecole">École</option>
                      <option value="activite">Activité</option>
                      <option value="autre">Autre</option>
                    </select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Heure début *</Label>
                    <Input type="time" value={recurringForm.start_time} onChange={(e) => setRecurringForm({...recurringForm, start_time: e.target.value})} required />
                  </div>
                  <div>
                    <Label>Heure fin *</Label>
                    <Input type="time" value={recurringForm.end_time} onChange={(e) => setRecurringForm({...recurringForm, end_time: e.target.value})} required />
                  </div>
                </div>
                <div>
                  <Label>Lieu (optionnel)</Label>
                  <Input value={recurringForm.location} onChange={(e) => setRecurringForm({...recurringForm, location: e.target.value})} placeholder="Ex: Cabinet" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Date de début *</Label>
                    <Input type="date" value={recurringForm.start_date} onChange={(e) => setRecurringForm({...recurringForm, start_date: e.target.value})} required />
                  </div>
                  <div>
                    <Label>Date de fin (optionnel)</Label>
                    <Input type="date" value={recurringForm.end_date} onChange={(e) => setRecurringForm({...recurringForm, end_date: e.target.value})} />
                  </div>
                </div>
                <div className="flex gap-3 pt-4">
                  <Button type="button" variant="outline" className="flex-1" onClick={() => setShowRecurringModal(false)}>Annuler</Button>
                  <Button type="submit" className="flex-1">Créer les RDV</Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

export default ChildPlanning;
