import { useEffect } from 'react'
import { CircleMarker, MapContainer, TileLayer, useMap, useMapEvents } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'

const RWANDA_CENTER = [-1.9441, 30.0619]

function MapEvents({ onPick }) {
  useMapEvents({
    click: (event) => onPick({ latitude: event.latlng.lat, longitude: event.latlng.lng }),
  })
  return null
}

function Recenter({ position }) {
  const map = useMap()
  useEffect(() => {
    if (position) map.setView([position.latitude, position.longitude], Math.max(map.getZoom(), 15), { animate: true })
  }, [map, position])
  return null
}

export function LocationMap({ position, onPick, onLocate, loading }) {
  const center = position ? [position.latitude, position.longitude] : RWANDA_CENTER
  return (
    <div className="relative mt-3 h-44 overflow-hidden rounded-xl border border-border bg-surface-2">
      <MapContainer center={center} zoom={position ? 15 : 11} scrollWheelZoom className="h-full w-full" aria-label="Choose a delivery area on the map">
        <TileLayer
          attribution="© OpenStreetMap contributors"
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <MapEvents onPick={onPick} />
        <Recenter position={position} />
        {position && <CircleMarker center={[position.latitude, position.longitude]} radius={9} pathOptions={{ color: '#1459c7', fillColor: '#2d7df0', fillOpacity: 0.9, weight: 3 }} />}
      </MapContainer>
      <div className="pointer-events-none absolute inset-x-2 top-2 flex items-start justify-between gap-2">
        <span className="rounded-md bg-white/95 px-2 py-1 text-[11px] font-semibold text-text shadow-card">Tap the map to choose an area</span>
        <button type="button" onClick={onLocate} disabled={loading} className="pointer-events-auto rounded-md bg-white px-2.5 py-1.5 text-[11px] font-bold text-info-fg shadow-card hover:bg-surface disabled:opacity-60">
          {loading ? 'Locating…' : 'Use GPS'}
        </button>
      </div>
    </div>
  )
}
