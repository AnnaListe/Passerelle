import React, { useState, useEffect } from 'react';
import { appointmentsAPI } from '../lib/api';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Calendar, Clock, MapPin, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '../components/ui/button';
import { formatTime, formatDate } from '../lib/utils';

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

  const weekDays = [];
  for (let i = 0; i < 7; i++) {
    const date = new Date(currentWeekStart);
    date.setDate(date.getDate() + i);
    weekDays.push(date);
  }

  const getAppointmentsForDay = (date) => {
    const dateStr = date.toDateString();
    return appointments.filter(apt => {
      const aptDate = new Date(apt.start_datetime);
      return aptDate.toDateString() === dateStr;
    }).sort((a, b) => new Date(a.start_datetime) - new Date(b.start_datetime));
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
          <p className="text-foreground-muted">Vos rendez-vous de la semaine</p>
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

      {/* Week View */}
      <div className="grid grid-cols-1 md:grid-cols-7 gap-4">
        {weekDays.map((day, index) => {
          const dayAppointments = getAppointmentsForDay(day);
          const isToday = day.toDateString() === new Date().toDateString();
          
          return (
            <Card 
              key={index}
              className={isToday ? 'border-primary border-2' : ''}
              data-testid={`day-${index}`}
            >
              <CardHeader className="pb-3">
                <div className="text-center">
                  <p className="text-xs font-medium text-foreground-muted uppercase mb-1">
                    {day.toLocaleDateString('fr-FR', { weekday: 'short' })}
                  </p>
                  <p className={`text-2xl font-bold ${
                    isToday ? 'text-primary' : 'text-slate-800'
                  }`}>
                    {day.getDate()}
                  </p>
                  <p className="text-xs text-foreground-muted">
                    {day.toLocaleDateString('fr-FR', { month: 'short' })}
                  </p>
                </div>
              </CardHeader>
              <CardContent>
                {dayAppointments.length > 0 ? (
                  <div className="space-y-2">
                    {dayAppointments.map((apt) => (
                      <div 
                        key={apt.id}
                        className="p-3 bg-primary-light rounded-lg border border-primary/20"
                        data-testid={`appointment-${apt.id}`}
                      >
                        <div className="flex items-center gap-1 text-xs font-medium text-primary mb-1">
                          <Clock className="w-3 h-3" />
                          {formatTime(apt.start_datetime)}
                        </div>
                        <p className="text-sm font-medium text-slate-700 mb-1">
                          {apt.title}
                        </p>
                        <p className="text-xs text-foreground-muted">
                          {apt.appointment_type}
                        </p>
                        {apt.location && (
                          <div className="flex items-center gap-1 text-xs text-foreground-muted mt-1">
                            <MapPin className="w-3 h-3" />
                            {apt.location}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-foreground-muted text-center py-4">
                    Aucun rendez-vous
                  </p>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Total appointments count */}
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
    </div>
  );
};

export default Planning;
