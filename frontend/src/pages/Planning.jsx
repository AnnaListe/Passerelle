import React, { useState, useEffect } from 'react';
import { appointmentsAPI } from '../lib/api';
import { Card } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { ChevronLeft, ChevronRight, Calendar } from 'lucide-react';
import { formatTime } from '../lib/utils';

const Planning = () => {
  const [appointments, setAppointments] = useState([]);
  const [currentWeekStart, setCurrentWeekStart] = useState(getWeekStart(new Date()));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAppointments();
  }, [currentWeekStart]);

  function getWeekStart(date) {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
    return new Date(d.setDate(diff));
  }

  const loadAppointments = async () => {
    try {
      const weekEnd = new Date(currentWeekStart);
      weekEnd.setDate(weekEnd.getDate() + 7);
      
      const response = await appointmentsAPI.list({
        start_date: currentWeekStart.toISOString(),
        end_date: weekEnd.toISOString()
      });
      setAppointments(response.data);
    } catch (error) {
      console.error('Error loading appointments:', error);
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

  // Generate week days
  const weekDays = [];
  for (let i = 0; i < 7; i++) {
    const date = new Date(currentWeekStart);
    date.setDate(date.getDate() + i);
    weekDays.push(date);
  }

  // Generate time slots (8h - 20h)
  const timeSlots = [];
  for (let hour = 8; hour <= 20; hour++) {
    timeSlots.push(hour);
  }

  // Function to get appointments for a specific day and hour
  const getAppointmentsForSlot = (date, hour) => {
    const dateStr = date.toDateString();
    return appointments.filter(apt => {
      const aptDate = new Date(apt.start_datetime);
      const aptHour = aptDate.getHours();
      return aptDate.toDateString() === dateStr && aptHour === hour;
    });
  };

  // Calculate appointment position and height
  const calculateAppointmentStyle = (appointment) => {
    const start = new Date(appointment.start_datetime);
    const end = new Date(appointment.end_datetime);
    const startMinutes = start.getMinutes();
    const durationMinutes = (end - start) / (1000 * 60);
    
    return {
      top: `${(startMinutes / 60) * 100}%`,
      height: `${(durationMinutes / 60) * 100}%`,
      minHeight: '40px'
    };
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
          <h1 className="text-3xl md:text-4xl font-bold text-slate-800 font-outfit mb-2">
            Planning
          </h1>
          <p className="text-foreground-muted">
            Semaine du {currentWeekStart.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
          </p>
        </div>

        {/* Week Navigation */}
        <div className="flex items-center gap-3">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={goToPreviousWeek}
            data-testid="prev-week"
          >
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <Button 
            variant="secondary" 
            size="sm" 
            onClick={goToToday}
            data-testid="today-button"
          >
            Aujourd'hui
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={goToNextWeek}
            data-testid="next-week"
          >
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Calendar Grid */}
      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <div className="min-w-[900px]">
            {/* Header with days */}
            <div className="grid grid-cols-8 border-b border-slate-200">
              {/* Empty corner cell */}
              <div className="p-3 bg-background-subtle border-r border-slate-200"></div>
              
              {/* Day headers */}
              {weekDays.map((day, index) => {
                const isToday = day.toDateString() === new Date().toDateString();
                return (
                  <div 
                    key={index}
                    className={`p-3 text-center border-r border-slate-200 last:border-r-0 ${
                      isToday ? 'bg-primary-light' : 'bg-background-subtle'
                    }`}
                  >
                    <div className={`text-xs font-medium uppercase mb-1 ${
                      isToday ? 'text-primary' : 'text-foreground-muted'
                    }`}>
                      {day.toLocaleDateString('fr-FR', { weekday: 'short' })}
                    </div>
                    <div className={`text-xl font-bold ${
                      isToday ? 'text-primary' : 'text-slate-800'
                    }`}>
                      {day.getDate()}
                    </div>
                    <div className="text-xs text-foreground-muted">
                      {day.toLocaleDateString('fr-FR', { month: 'short' })}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Time slots grid */}
            <div className="relative">
              {timeSlots.map((hour) => (
                <div key={hour} className="grid grid-cols-8 border-b border-slate-100 last:border-b-0">
                  {/* Time label */}
                  <div className="p-2 text-xs text-foreground-muted bg-background-subtle border-r border-slate-200 flex items-start justify-end">
                    {hour.toString().padStart(2, '0')}:00
                  </div>
                  
                  {/* Day cells */}
                  {weekDays.map((day, dayIndex) => {
                    const slotAppointments = getAppointmentsForSlot(day, hour);
                    return (
                      <div 
                        key={`${hour}-${dayIndex}`}
                        className="relative border-r border-slate-100 last:border-r-0 min-h-[60px] hover:bg-background-subtle/50 transition-colors"
                        style={{ height: '60px' }}
                      >
                        {slotAppointments.map((apt) => {
                          const style = calculateAppointmentStyle(apt);
                          return (
                            <div
                              key={apt.id}
                              className="absolute left-0 right-0 mx-1 p-2 bg-primary rounded-lg border border-primary-hover overflow-hidden cursor-pointer hover:shadow-md transition-all"
                              style={style}
                              data-testid={`appointment-${apt.id}`}
                              title={`${apt.title} - ${formatTime(apt.start_datetime)} à ${formatTime(apt.end_datetime)}`}
                            >
                              <div className="text-xs font-semibold text-white truncate">
                                {formatTime(apt.start_datetime)}
                              </div>
                              <div className="text-xs text-white/90 font-medium truncate">
                                {apt.title}
                              </div>
                              <div className="text-[10px] text-white/80 truncate">
                                {apt.appointment_type}
                              </div>
                              {apt.location && (
                                <div className="text-[10px] text-white/70 truncate">
                                  📍 {apt.location}
                                </div>
                              )}
                            </div>
                          );
                        })}
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
        <div className="p-6">
          <div className="flex items-center justify-center gap-3">
            <Calendar className="w-8 h-8 text-primary" />
            <div>
              <p className="text-2xl font-bold text-slate-800">{appointments.length}</p>
              <p className="text-sm text-foreground-muted">rendez-vous cette semaine</p>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default Planning;
