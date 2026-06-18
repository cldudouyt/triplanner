import { useState, useCallback, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import FullCalendar from '@fullcalendar/react'
import dayGridPlugin from '@fullcalendar/daygrid'
import timeGridPlugin from '@fullcalendar/timegrid'
import interactionPlugin from '@fullcalendar/interaction'
import { X, Clock, Route, Zap, BookOpen, CheckCircle, Circle } from 'lucide-react'
import { calendarApi, type CalendarEvent } from '@/api/calendar.api'
import { SESSION_TYPES, INTENSITIES, PRIORITIES, getSportColor } from '@/utils/constants'
import { formatDateLong } from '@/utils/formatDate'
import clsx from 'clsx'

interface PopoverState {
  event: CalendarEvent
  x: number
  y: number
}

function EventPopover({ event, x, y, onClose, onNavigate }: PopoverState & { onClose: () => void; onNavigate: () => void }) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose()
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [onClose])

  // Adjust position so popover stays in viewport
  const style: React.CSSProperties = {
    position: 'fixed',
    left: Math.min(x, window.innerWidth - 340),
    top: Math.min(y + 8, window.innerHeight - 350),
    zIndex: 100,
  }

  const isSession = event.sourceType === 'training_session'
  const isCompetition = event.sourceType === 'competition'

  const typeConfig = SESSION_TYPES.find(t => t.value === event.type)
  const intensityConfig = INTENSITIES.find(i => i.value === event.intensity)
  const priorityConfig = PRIORITIES.find(p => p.value === event.priority)

  return (
    <div
      ref={ref}
      style={style}
      className="w-80 bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-gray-200 dark:border-slate-700 overflow-hidden animate-scale-in"
    >
      {/* Header */}
      <div
        className="px-4 py-3 flex items-start justify-between"
        style={{ backgroundColor: event.color + '20' }}
      >
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            {isSession && typeConfig && (
              <span className="text-lg">{typeConfig.icon}</span>
            )}
            {isCompetition && <span className="text-lg">🏆</span>}
            <h3 className="font-semibold text-gray-900 dark:text-gray-100 truncate">{event.title}</h3>
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400">{formatDateLong(event.start)}</p>
        </div>
        <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 ml-2 mt-0.5">
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Body */}
      <div className="px-4 py-3 space-y-2.5">
        {/* Session details */}
        {isSession && (
          <>
            {event.planName && (
              <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
                <BookOpen className="h-4 w-4 text-gray-400 dark:text-gray-500 shrink-0" />
                <span>Plan : <span className="font-medium">{event.planName}</span></span>
              </div>
            )}

            {typeConfig && (
              <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
                <Zap className="h-4 w-4 text-gray-400 dark:text-gray-500 shrink-0" />
                <span>Type : <span className="font-medium" style={{ color: typeConfig.color }}>{typeConfig.label}</span></span>
              </div>
            )}

            {event.duration != null && event.duration > 0 && (
              <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
                <Clock className="h-4 w-4 text-gray-400 dark:text-gray-500 shrink-0" />
                <span>{event.duration} min</span>
              </div>
            )}

            {event.distance != null && event.distance > 0 && (
              <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
                <Route className="h-4 w-4 text-gray-400 dark:text-gray-500 shrink-0" />
                <span>{(event.distance / 1000).toFixed(1)} km</span>
              </div>
            )}

            {intensityConfig && (
              <div className="flex items-center gap-2 text-sm">
                <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${intensityConfig.color}`}>
                  {intensityConfig.label}
                </span>
              </div>
            )}

            {event.description && (
              <p className="text-sm text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-slate-700 rounded-lg p-2">{event.description}</p>
            )}

            {event.notes && (
              <p className="text-sm text-gray-400 dark:text-gray-500 italic">{event.notes}</p>
            )}

            <div className="flex items-center gap-2 text-sm">
              {event.completed ? (
                <span className="flex items-center gap-1 text-green-600 dark:text-green-400 font-medium">
                  <CheckCircle className="h-4 w-4" /> Terminée
                </span>
              ) : (
                <span className="flex items-center gap-1 text-gray-400 dark:text-gray-500">
                  <Circle className="h-4 w-4" /> A faire
                </span>
              )}
            </div>
          </>
        )}

        {/* Competition details */}
        {isCompetition && (
          <>
            {priorityConfig && (
              <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${priorityConfig.color}`}>
                {priorityConfig.label}
              </span>
            )}
            {event.subType && (
              <p className="text-sm text-gray-600 dark:text-gray-300">Format : <span className="font-medium">{event.subType}</span></p>
            )}
          </>
        )}
      </div>

      {/* Footer */}
      <div className="px-4 py-2.5 border-t border-gray-100 dark:border-slate-700 bg-gray-50 dark:bg-slate-700/50">
        <button
          onClick={onNavigate}
          className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium"
        >
          {isCompetition ? 'Voir la compétition' : "Voir le plan d'entraînement"} →
        </button>
      </div>
    </div>
  )
}

export default function CalendarPage() {
  const navigate = useNavigate()
  const [events, setEvents] = useState<CalendarEvent[]>([])
  const [popover, setPopover] = useState<PopoverState | null>(null)
  const [filters, setFilters] = useState<Record<string, boolean>>({
    competition: true,
    swim: true,
    bike: true,
    run: true,
    strength: true,
    rest: true,
    brick: true,
  })

  const fetchEvents = useCallback(async (info: any) => {
    try {
      const { data } = await calendarApi.events(info.startStr, info.endStr)
      setEvents(data)
    } catch {
      // silently fail
    }
  }, [])

  const filteredEvents = events
    .filter(e => filters[e.type])
    .map(e => ({
      id: e.id,
      title: e.title,
      start: e.start,
      end: e.end,
      backgroundColor: e.color,
      borderColor: e.color,
      extendedProps: e,
    }))

  const handleEventClick = (info: any) => {
    const rect = info.el.getBoundingClientRect()
    setPopover({
      event: info.event.extendedProps as CalendarEvent,
      x: rect.left,
      y: rect.bottom,
    })
  }

  const handlePopoverNavigate = () => {
    if (!popover) return
    const { sourceType, sourceId } = popover.event
    if (sourceType === 'competition') {
      navigate(`/competitions/${sourceId}`)
    } else {
      // Find planId from the session - navigate to the plan
      navigate(`/training`)
    }
    setPopover(null)
  }

  const toggleFilter = (type: string) => {
    setFilters(prev => ({ ...prev, [type]: !prev[type] }))
  }

  return (
    <div className="animate-fade-in">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Calendrier</h1>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2 mb-4">
        <button
          onClick={() => toggleFilter('competition')}
          className={clsx(
            'px-3 py-1.5 text-xs rounded-full font-medium border transition-colors',
            filters.competition
              ? 'bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300 border-red-200 dark:border-red-800'
              : 'bg-gray-50 dark:bg-slate-800 text-gray-400 dark:text-gray-500 border-gray-200 dark:border-slate-700'
          )}
        >
          🏆 Compétitions
        </button>
        {SESSION_TYPES.map(st => {
          const sportColor = getSportColor(st.value)
          return (
            <button
              key={st.value}
              onClick={() => toggleFilter(st.value)}
              className={clsx(
                'px-3 py-1.5 text-xs rounded-full font-medium border transition-colors',
                filters[st.value]
                  ? sportColor.bgLight + ' ' + sportColor.text + ' ' + sportColor.border
                  : 'bg-gray-50 dark:bg-slate-800 text-gray-400 dark:text-gray-500 border-gray-200 dark:border-slate-700'
              )}
            >
              {st.icon} {st.label}
            </button>
          )
        })}
      </div>

      <div className="calendar-container bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 p-4">
        <FullCalendar
          plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
          initialView="dayGridMonth"
          headerToolbar={{
            left: 'prev,next today',
            center: 'title',
            right: 'dayGridMonth,timeGridWeek,timeGridDay',
          }}
          locale="fr"
          firstDay={1}
          events={filteredEvents}
          datesSet={fetchEvents}
          eventClick={handleEventClick}
          height="auto"
          buttonText={{
            today: "Aujourd'hui",
            month: 'Mois',
            week: 'Semaine',
            day: 'Jour',
          }}
        />
      </div>

      {/* Event popover */}
      {popover && (
        <EventPopover
          event={popover.event}
          x={popover.x}
          y={popover.y}
          onClose={() => setPopover(null)}
          onNavigate={handlePopoverNavigate}
        />
      )}
    </div>
  )
}
