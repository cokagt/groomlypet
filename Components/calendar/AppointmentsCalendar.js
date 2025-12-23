import React, { useState } from "react";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths } from "date-fns";
import { es } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";

export default function AppointmentsCalendar({ appointments }) {
    const [currentMonth, setCurrentMonth] = useState(new Date());

    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(currentMonth);
    const days = eachDayOfInterval({ start: monthStart, end: monthEnd });

    // Pad days to start on Monday
    const startDay = monthStart.getDay();
    const paddingDays = startDay === 0 ? 6 : startDay - 1;
    const paddedDays = Array(paddingDays).fill(null).concat(days);

    const getAppointmentsForDay = (day) => {
        if (!day) return { pending: 0, confirmed: 0, completed: 0 };

        const dayAppts = appointments.filter(apt =>
            isSameDay(new Date(apt.appointment_date), day)
        );

        return {
            pending: dayAppts.filter(a => a.status === 'pending').length,
            confirmed: dayAppts.filter(a => a.status === 'confirmed').length,
            completed: dayAppts.filter(a => a.status === 'completed').length
        };
    };

    const weekDays = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];

    return (
        <div className="clay-card rounded-[24px] bg-white p-4 sm:p-6">
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
                    className="clay-button rounded-full"
                >
                    <ChevronLeft className="w-5 h-5" />
                </Button>

                <h3 className="text-lg font-bold capitalize">
                    {format(currentMonth, 'MMMM yyyy', { locale: es })}
                </h3>

                <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
                    className="clay-button rounded-full"
                >
                    <ChevronRight className="w-5 h-5" />
                </Button>
            </div>

            {/* Legend */}
            <div className="flex flex-wrap gap-3 mb-4 text-xs">
                <div className="flex items-center gap-1">
                    <div className="w-3 h-3 rounded-full bg-yellow-400"></div>
                    <span>Pendiente</span>
                </div>
                <div className="flex items-center gap-1">
                    <div className="w-3 h-3 rounded-full bg-green-500"></div>
                    <span>Confirmada</span>
                </div>
                <div className="flex items-center gap-1">
                    <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                    <span>Completada</span>
                </div>
            </div>

            {/* Week days header */}
            <div className="grid grid-cols-7 gap-1 mb-2">
                {weekDays.map(day => (
                    <div key={day} className="text-center text-xs font-medium text-gray-500 py-2">
                        {day}
                    </div>
                ))}
            </div>

            {/* Calendar grid */}
            <div className="grid grid-cols-7 gap-1">
                {paddedDays.map((day, idx) => {
                    if (!day) {
                        return <div key={`empty-${idx}`} className="aspect-square"></div>;
                    }

                    const dayAppts = getAppointmentsForDay(day);
                    const hasAppts = dayAppts.pending > 0 || dayAppts.confirmed > 0 || dayAppts.completed > 0;
                    const isToday = isSameDay(day, new Date());

                    return (
                        <div
                            key={day.toISOString()}
                            className={`aspect-square p-1 rounded-lg flex flex-col items-center justify-center relative ${isToday ? 'ring-2 ring-[#7B68BE]' : ''
                                } ${hasAppts ? 'clay-inset bg-gray-50' : ''}`}
                        >
                            <span className={`text-sm ${isToday ? 'font-bold text-[#7B68BE]' : 'text-gray-700'}`}>
                                {format(day, 'd')}
                            </span>

                            {hasAppts && (
                                <div className="flex gap-0.5 mt-1">
                                    {dayAppts.pending > 0 && (
                                        <div className="w-2 h-2 rounded-full bg-yellow-400" title={`${dayAppts.pending} pendiente(s)`}></div>
                                    )}
                                    {dayAppts.confirmed > 0 && (
                                        <div className="w-2 h-2 rounded-full bg-green-500" title={`${dayAppts.confirmed} confirmada(s)`}></div>
                                    )}
                                    {dayAppts.completed > 0 && (
                                        <div className="w-2 h-2 rounded-full bg-blue-500" title={`${dayAppts.completed} completada(s)`}></div>
                                    )}
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
}