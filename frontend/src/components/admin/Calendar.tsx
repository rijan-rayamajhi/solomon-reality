'use client';

import { useState } from 'react';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from 'lucide-react';
import { motion } from 'framer-motion';

interface CalendarProps {
  onDateSelect?: (date: Date) => void;
  appointments?: Array<{ date: Date; title: string }>;
}

export function Calendar({ onDateSelect, appointments = [] }: CalendarProps) {
  const [currentDate, setCurrentDate] = useState(new Date());

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const firstDayOfMonth = new Date(year, month, 1);
  const lastDayOfMonth = new Date(year, month + 1, 0);
  const daysInMonth = lastDayOfMonth.getDate();
  const startingDayOfWeek = firstDayOfMonth.getDay();

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  const goToPreviousMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const goToNextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  const hasAppointment = (day: number) => {
    const date = new Date(year, month, day);
    return appointments.some(apt => 
      apt.date.getDate() === date.getDate() &&
      apt.date.getMonth() === date.getMonth() &&
      apt.date.getFullYear() === date.getFullYear()
    );
  };

  const handleDateClick = (day: number) => {
    const date = new Date(year, month, day);
    if (onDateSelect) {
      onDateSelect(date);
    }
  };

  return (
    <div className="card-luxury p-6">
      <div className="flex items-center justify-between mb-6">
        <button
          onClick={goToPreviousMonth}
          className="p-2 hover:bg-surface-muted rounded-lg transition-colors"
        >
          <ChevronLeft size={20} className="text-text-secondary" />
        </button>
        <h2 className="text-xl font-display font-bold text-text-primary flex items-center gap-2">
          <CalendarIcon size={24} className="text-accent-primary" />
          {monthNames[month]} {year}
        </h2>
        <button
          onClick={goToNextMonth}
          className="p-2 hover:bg-surface-muted rounded-lg transition-colors"
        >
          <ChevronRight size={20} className="text-text-secondary" />
        </button>
      </div>

      <div className="grid grid-cols-7 gap-2">
        {dayNames.map(day => (
          <div
            key={day}
            className="text-center text-sm font-semibold text-text-secondary py-2"
          >
            {day}
          </div>
        ))}

        {Array.from({ length: startingDayOfWeek }).map((_, index) => (
          <div key={`empty-${index}`} className="h-10" />
        ))}

        {Array.from({ length: daysInMonth }).map((_, index) => {
          const day = index + 1;
          const hasApt = hasAppointment(day);
          const isToday = 
            day === new Date().getDate() &&
            month === new Date().getMonth() &&
            year === new Date().getFullYear();

          return (
            <motion.button
              key={day}
              onClick={() => handleDateClick(day)}
              className={`h-10 rounded-lg transition-all ${
                isToday
                  ? 'bg-accent-primary text-white font-semibold'
                  : hasApt
                  ? 'bg-success/20 text-success hover:bg-success/30'
                  : 'hover:bg-surface-muted text-text-secondary'
              }`}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              {day}
            </motion.button>
          );
        })}
      </div>

      {appointments.length > 0 && (
        <div className="mt-6 pt-6 border-t border-border">
          <h3 className="text-lg font-semibold text-text-primary mb-4">
            Upcoming Appointments
          </h3>
          <div className="space-y-2">
            {appointments.slice(0, 5).map((apt, index) => (
              <div
                key={index}
                className="flex items-center gap-3 p-3 bg-surface-muted rounded-lg"
              >
                <div className="w-2 h-2 bg-success rounded-full" />
                <div className="flex-1">
                  <p className="text-sm font-semibold text-text-primary">{apt.title}</p>
                  <p className="text-xs text-text-secondary">
                    {apt.date.toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    })}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

