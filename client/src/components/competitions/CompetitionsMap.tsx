import { useState, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet'
import iconUrl from 'leaflet/dist/images/marker-icon.png'
import iconRetinaUrl from 'leaflet/dist/images/marker-icon-2x.png'
import shadowUrl from 'leaflet/dist/images/marker-shadow.png'
import type { Competition } from '@/api/competitions.api'
import { formatDate } from '@/utils/formatDate'
import { PRIORITIES, COMPETITION_TYPES } from '@/utils/constants'
import { geocodeLocations } from '@/utils/geocode'

// Fix icones Leaflet/Vite
delete (L.Icon.Default.prototype as any)._getIconUrl
L.Icon.Default.mergeOptions({
  iconUrl,
  iconRetinaUrl,
  shadowUrl,
})

interface Props {
  competitions: Competition[]
}

function FitBounds({ positions }: { positions: [number, number][] }) {
  const map = useMap()

  useEffect(() => {
    if (positions.length > 0) {
      const bounds = L.latLngBounds(positions.map(p => L.latLng(p[0], p[1])))
      map.fitBounds(bounds, { padding: [30, 30] })
    }
  }, [map, positions])

  return null
}

export default function CompetitionsMap({ competitions }: Props) {
  const [coords, setCoords] = useState<Map<string, [number, number]>>(new Map())
  const [loading, setLoading] = useState(true)
  const lastLocationsRef = useRef<string>('')

  useEffect(() => {
    const locations = competitions
      .map(c => c.location)
      .filter((loc): loc is string => !!loc && loc.trim() !== '')

    const locationsKey = JSON.stringify([...new Set(locations)].sort())

    // Skip si identique
    if (locationsKey === lastLocationsRef.current) {
      return
    }

    lastLocationsRef.current = locationsKey
    setLoading(true)

    geocodeLocations(locations).then(result => {
      setCoords(new Map(result))
      setLoading(false)
    })
  }, [competitions])

  // Prepare markers
  const markers = competitions
    .filter(c => c.location && coords.has(c.location))
    .map(c => ({
      competition: c,
      position: coords.get(c.location!)!,
    }))

  const positions = markers.map(m => m.position)

  if (loading) {
    return (
      <div className="rounded-xl border border-gray-200 overflow-hidden h-[600px] flex items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center gap-3">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
          <p className="text-sm text-gray-500">Localisation des competitions...</p>
        </div>
      </div>
    )
  }

  if (markers.length === 0) {
    return (
      <div className="rounded-xl border border-gray-200 overflow-hidden h-[600px] flex items-center justify-center bg-gray-50">
        <p className="text-gray-500">Aucune competition n'a pu etre localisee</p>
      </div>
    )
  }

  return (
    <div className="rounded-xl border border-gray-200 overflow-hidden h-[600px]">
      <MapContainer
        center={[46.6, 2.3]}
        zoom={6}
        style={{ height: '100%', width: '100%' }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <FitBounds positions={positions} />
        {markers.map(({ competition, position }) => {
          const priority = PRIORITIES.find(p => p.value === competition.priority)
          const type = COMPETITION_TYPES.find(t => t.value === competition.type)

          return (
            <Marker key={competition.id} position={position}>
              <Popup>
                <div className="min-w-[200px]">
                  <Link
                    to={`/competitions/${competition.id}`}
                    className="font-semibold text-blue-600 hover:underline"
                  >
                    {competition.name}
                  </Link>
                  <p className="text-sm text-gray-600 mt-1">
                    {formatDate(competition.date)}
                  </p>
                  <div className="flex items-center gap-2 mt-2">
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-700">
                      {type?.label || competition.type} - {competition.subType}
                    </span>
                    {priority && (
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${priority.color}`}>
                        {priority.value}
                      </span>
                    )}
                  </div>
                </div>
              </Popup>
            </Marker>
          )
        })}
      </MapContainer>
    </div>
  )
}
