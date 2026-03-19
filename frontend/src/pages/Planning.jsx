import React, { useState, useEffect } from 'react';
import { appointmentsAPI, childrenAPI } from '../lib/api';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input, Label } from '../components/ui/input';
import { Badge } from '../components/ui/badge';
import { ChevronLeft, ChevronRight, Calendar, X, Trash2, Edit2, Check } from 'lucide-react';
import { formatTime } from '../lib/utils';
import { supabase } from '../lib/supabase';
import { Link } from 'react-router-dom';

const APPOINTMENT_TYPES = [
  { value: 'seance', label: 'Séance', color: 'bg-primary' },
  { value: 'bilan', label: 'Bilan', color: 'bg-purple-500' },
  { value: 'reunion', label: 'Réunion', color: 'bg-amber-500' },
  { value: 'autre', label: 'Autre', color: 'bg-slate-500' },
];

const Planning = () => {
  const [appointments, setAppointments] = useState([]);
  const [children, setChildren] = useState([]);
  const [currentWeekStart, setCurrentWeekStart] = useState(getWeekStart(new Date()));
  const [loading, setLoading] = useState(true);
  const [selectedApt, setSelectedApt] = useState(null);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({});

  useEffect(() => {
    loadData();
  }, [currentWeekStart]);

  function getWeekStart(date) {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
    return new Date(d.setDate(diff));
  }

  const loadData = async () => {
    try {
      const response = await appointmentsAPI.list();
      setAppointments(response.data || []);
      const childrenRes = await childrenAPI.list();
      setChildren(childrenRes.data || []);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const goToPreviousWeek = () => { const d = new Date(currentWeekStart); d.setDate(d.getDate() - 7); setCurrentWeekStart(d); };
  const goToNextWeek = () => { const d = new Date(currentWeekStart); d.setDate(d.getDate() + 7); setCurrentWeekStart(d); };
  const goToToday = () => setCurrentWeekStart(getWeekStart(new Date()));

  const weekDays = [];
  for (let i = 0; i < 7; i++) {
    const date = new Date(currentWeekStart);
    date.setDate(date.getDate() + i);
    weekDays.push(date);
  }

  const timeSlots = [];
  for (let hour = 7; hour <= 20; hour++) timeSlots.push(hour);

  const getAppointmentsForSlot = (date, hour) => {
    const dateStr = date.toDateString();
    return appointments.filter(apt => {
      const aptDate = new Date(apt.start_datetime);
      return aptDate.toDateString() === dateStr && aptDate.getHours() === hour;
    });
  };

  const calculateAppointmentStyle = (appointment) => {
    const start = new Date(appointment.start_datetime);
    const end = new Date(appointment.end_datetime);
    const startMinutes = start.getMinutes();
    const durationMinutes = (end - start) / (1000 * 60);
    return {
      top: `${(startMinutes / 60) * 100}%`,
      height: `${Math.max((durationMinutes / 60) * 100, 30)}%`,
      minHeight: '30px'
    };
  };

  const getTypeColor = (type) => {
    const found = APPOINTMENT_TYPES.find(t => t.value === type);
    return found?.color || 'bg-primary';
  };

  const getChildName = (childId) => {
    const child = children.find(c => c.id === childId);
    return child ? `${child.first_name} ${child.last_name}` : '';
  };

  const handleClickApt = (apt) => {
    setSelectedApt(apt);
    setEditing(false);
    const start = new Date(apt.start_datetime);
    const end = new Date(apt.end_datetime);
    setFormData({
      title: apt.title,
      appointment_type: apt.appointment_type,
      date: start.toISOString().split('T')[0],
      start_time: `${String(start.getHours()).padStart(2,'0')}:${String(start.getMinutes()).padStart(2,'0')}`,
      end_time: `${String(end.getHours()).padStart(2,'0')}:${String(end.getMinutes()).padStart(2,'0')}`,
      location: apt.location || '',
      notes: apt.notes || '',
    });
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const startDatetime = new Date(`${formData.date}T${formData.start_time}`);
      const endDatetime = new Date(`${formData.date}T${formData.end_time}`);
      await appointmentsAPI.update(selectedApt.id, {
        title: formData.title,
        appointment_type: formData.appointment_type,
        start_datetime: startDatetime.toISOString(),
        end_datetime: endDatetime.toISOString(),
        location: formData.location || null,
        notes: formData.notes || null,
      });
      setSelectedApt(null);
      setEditing(false);
      loadData();
    } catch (error) {
      console.error('Error saving:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Supprimer ce rendez-vous ?')) return;
    try {
      await appointmentsAPI.delete(selectedApt.id);
      setSelectedApt(null);
      loadData();
    } catch (error) {
      console.error('Error deleting:', error);
    }
  };

  const handleDeleteRecurring = async () => {
    if (!window.confirm('Supprimer TOUS les RDV de cette récurrence ?')) return;
    try {
      await supabase.from('appointments').delete().eq('recurring_id', selectedApt.recurring_id);
      setSelectedApt(null);
      loadData();
    } catch (error) {
      console.error('Error deleting recurring:', error);
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
    <div className="space-y-6 animate-in" data-testid="planning-page">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl md:text-4xl font-bold text-slate-800 font-outfit mb-2">Planning</h1>
          <p className="text-foreground-muted">
            Semaine du {currentWeekStart.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" onClick={goToPreviousWeek}><ChevronLeft className="w-4 h-4" /></Button>
          <Button variant="secondary" size="sm" onClick={goToToday}>Aujourd'hui</Button>
          <Button variant="outline" size="sm" onClick={goToNextWeek}><ChevronRight className="w-4 h-4" /></Button>
        </div>
      </div>

      {/* Calendar Grid */}
      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <div className="min-w-[900px]">
            {/* Header */}
            <div className="grid grid-cols-8 border-b border-slate-200">
              <div className="p-3 bg-background-subtle border-r border-slate-200"></div>
              {weekDays.map((day, index) => {
                const isToday = day.toDateString() === new Date().toDateString();
                return (
                  <div key={index} className={`p-3 text-center border-r border-slate-200 last:border-r-0 ${isToday ? 'bg-primary-light' : 'bg-background-subtle'}`}>
                    <div className={`text-xs font-medium uppercase mb-1 ${isToday ? 'text-primary' : 'text-foreground-muted'}`}>
                      {day.toLocaleDateString('fr-FR', { weekday: 'short' })}
                    </div>
                    <div className={`text-xl font-bold ${isToday ? 'text-primary' : 'text-slate-800'}`}>{day.getDate()}</div>
                    <div className="text-xs text-foreground-muted">{day.toLocaleDateString('fr-FR', { month: 'short' })}</div>
                  </div>
                );
              })}
            </div>

            {/* Time slots */}
            <div className="relative">
              {timeSlots.map((hour) => (
                <div key={hour} className="grid grid-cols-8 border-b border-slate-100 last:border-b-0">
                  <div className="p-2 text-xs text-foreground-muted bg-background-subtle border-r border-slate-200 flex items-start justify-end">
                    {hour.toString().padStart(2, '0')}:00
                  </div>
                  {weekDays.map((day, dayIndex) => {
                    const slotAppointments = getAppointmentsForSlot(day, hour);
                    return (
                      <div key={`${hour}-${dayIndex}`} className="relative border-r border-slate-100 last:border-r-0 hover:bg-background-subtle/50 transition-colors" style={{ height: '60px' }}>
                        {slotAppointments.map((apt) => (
                          <div
                            key={apt.id}
                            className={`absolute left-0 right-0 mx-1 p-1 ${getTypeColor(apt.appointment_type)} rounded-lg overflow-hidden cursor-pointer hover:shadow-md hover:scale-[1.02] transition-all border-2 border-white/20`}
                            style={calculateAppointmentStyle(apt)}
                            onClick={() => handleClickApt(apt)}
                            title={`${apt.title} — ${formatTime(apt.start_datetime)} à ${formatTime(apt.end_datetime)}`}
                          >
                            <div className="text-xs font-semibold text-white truncate">{formatTime(apt.start_datetime)}</div>
                            <div className="text-xs text-white/90 font-medium truncate">{apt.title}</div>
                            {apt.child_id && <div className="text-[10px] text-white/80 truncate">👤 {getChildName(apt.child_id)}</div>}
                            {apt.location && <div className="text-[10px] text-white/70 truncate">📍 {apt.location}</div>}
                            {apt.is_recurring && <div className="text-[10px] text-white/70">🔁</div>}
                          </div>
                        ))}
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        </div>
      </Card>

      {/* Summary */}
      <Card className="bg-gradient-to-br from-primary-light to-white border-primary/20">
        <div className="p-6 flex items-center justify-center gap-3">
          <Calendar className="w-8 h-8 text-primary" />
          <div>
            <p className="text-2xl font-bold text-slate-800">{appointments.length}</p>
            <p className="text-sm text-foreground-muted">rendez-vous cette semaine</p>
          </div>
        </div>
      </Card>

      {/* Modal détail RDV */}
      {selectedApt && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="max-w-lg w-full">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>{editing ? 'Modifier le RDV' : 'Détail du RDV'}</CardTitle>
                <button onClick={() => { setSelectedApt(null); setEditing(false); }} className="text-slate-400 hover:text-slate-600">
                  <X className="w-5 h-5" />
                </button>
              </div>
            </CardHeader>
            <CardContent>
              {!editing ? (
                <div className="space-y-4">
                  {/* Infos */}
                  <div className={`p-3 ${getTypeColor(selectedApt.appointment_type)} rounded-xl text-white`}>
                    <p className="font-bold text-lg">{selectedApt.title}</p>
                    <p className="text-sm opacity-90">{formatTime(selectedApt.start_datetime)} — {formatTime(selectedApt.end_datetime)}</p>
                    {selectedApt.is_recurring && <Badge className="mt-1 bg-white/20 text-white">🔁 Récurrent</Badge>}
                  </div>

                  {selectedApt.child_id && (
                    <div className="flex items-center gap-2 p-3 bg-background-subtle rounded-xl">
                      <span className="text-sm font-medium text-slate-600">Enfant :</span>
                      <Link to={`/children/${selectedApt.child_id}/planning`} className="text-primary underline text-sm" onClick={() => setSelectedApt(null)}>
                        {getChildName(selectedApt.child_id)}
                      </Link>
                    </div>
                  )}

                  {selectedApt.location && (
                    <div className="p-3 bg-background-subtle rounded-xl">
                      <span className="text-sm text-slate-600">📍 {selectedApt.location}</span>
                    </div>
                  )}

                  {selectedApt.notes && (
                    <div className="p-3 bg-background-subtle rounded-xl">
                      <p className="text-sm text-slate-600">{selectedApt.notes}</p>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex flex-wrap gap-2 pt-2">
                    <Button onClick={() => setEditing(true)} className="flex-1">
                      <Edit2 className="w-4 h-4 mr-2" />Modifier ce RDV
                    </Button>
                    <Button variant="ghost" className="text-red-500 hover:text-red-700" onClick={handleDelete}>
                      <Trash2 className="w-4 h-4 mr-1" />Ce RDV
                    </Button>
                    {selectedApt.is_recurring && selectedApt.recurring_id && (
                      <Button variant="ghost" className="text-red-700 hover:text-red-900" onClick={handleDeleteRecurring}>
                        <Trash2 className="w-4 h-4 mr-1" />Toute la série
                      </Button>
                    )}
                  </div>
                </div>
              ) : (
                <form onSubmit={handleSave} className="space-y-4">
                  <div>
                    <Label>Titre *</Label>
                    <Input value={formData.title} onChange={(e) => setFormData({...formData, title: e.target.value})} required />
                  </div>
                  <div>
                    <Label>Type</Label>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {APPOINTMENT_TYPES.map(type => (
                        <Button key={type.value} type="button" variant={formData.appointment_type === type.value ? 'primary' : 'outline'} size="sm" onClick={() => setFormData({...formData, appointment_type: type.value})}>
                          {type.label}
                        </Button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <Label>Date</Label>
                    <Input type="date" value={formData.date} onChange={(e) => setFormData({...formData, date: e.target.value})} required />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Heure début</Label>
                      <Input type="time" value={formData.start_time} onChange={(e) => setFormData({...formData, start_time: e.target.value})} required />
                    </div>
                    <div>
                      <Label>Heure fin</Label>
                      <Input type="time" value={formData.end_time} onChange={(e) => setFormData({...formData, end_time: e.target.value})} required />
                    </div>
                  </div>
                  <div>
                    <Label>Lieu</Label>
                    <Input value={formData.location} onChange={(e) => setFormData({...formData, location: e.target.value})} placeholder="Cabinet, domicile..." />
                  </div>
                  <div>
                    <Label>Notes</Label>
                    <textarea value={formData.notes} onChange={(e) => setFormData({...formData, notes: e.target.value})} className="w-full bg-input border-transparent focus:bg-white focus:border-primary rounded-xl px-4 py-3 text-slate-700 outline-none min-h-[80px]" />
                  </div>

                  {selectedApt.is_recurring && (
                    <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-sm text-amber-700">
                      ⚠️ Cette modification ne s'appliquera qu'à ce RDV, pas à toute la série.
                    </div>
                  )}

                  <div className="flex gap-3">
                    <Button type="button" variant="outline" className="flex-1" onClick={() => setEditing(false)}>Annuler</Button>
                    <Button type="submit" className="flex-1" disabled={saving}>
                      <Check className="w-4 h-4 mr-2" />
                      {saving ? 'Enregistrement...' : 'Enregistrer'}
                    </Button>
                  </div>
                </form>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

export default Planning;
