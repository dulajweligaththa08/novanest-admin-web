import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Layers, Compass, Sparkles, Building2, Check, ArrowRight } from 'lucide-react'

export default function GeneratedMasterFloorPlan({ floor, buildingName }) {
  const [selectedUnitId, setSelectedUnitId] = useState(null)

  if (!floor) return null

  const apartments = floor.apartments || []
  const totalArea = apartments.reduce((acc, a) => acc + (Number(a.areaSqft) || 0), 0)
  const availableCount = apartments.filter(a => a.status === 'AVAILABLE').length
  const reservedCount = apartments.filter(a => a.status === 'RESERVED').length
  const soldCount = apartments.filter(a => a.status === 'SOLD').length

  const selectedUnit = apartments.find(a => a.id === selectedUnitId) || apartments[0]

  return (
    <div className="space-y-6 my-4">
      {/* Header bar */}
      <div className="bg-navy-900/5 p-4 rounded-2xl border border-navy-900/10 flex flex-wrap items-center justify-between gap-4">
        <div>
          <span className="text-xs font-semibold text-gold-600 uppercase tracking-wide">
            {buildingName || 'Building'} · Floor {floor.floorNumber}
          </span>
          <h3 className="text-lg font-bold text-navy-900">Auto-Generated Master Floor Plan</h3>
          <p className="text-xs text-gray-500 mt-0.5">Automatically generated from the apartments added to this floor.</p>
        </div>

        <span className="text-xs font-semibold px-3 py-1.5 rounded-full bg-navy-900 text-white">
          {apartments.length} {apartments.length === 1 ? 'Unit' : 'Units'} on Floor
        </span>
      </div>

      {/* Stats summary */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
        <div className="p-3 bg-white rounded-xl border border-gray-100 shadow-sm">
          <p className="text-xs text-gray-500 font-medium">Total Floor Area</p>
          <p className="text-sm font-bold text-navy-900">{totalArea ? `${totalArea.toLocaleString()} sqft` : '—'}</p>
        </div>
        <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-100 shadow-sm">
          <p className="text-xs text-emerald-700 font-medium">Available Units</p>
          <p className="text-sm font-bold text-emerald-800">{availableCount}</p>
        </div>
        <div className="p-3 bg-amber-50 rounded-xl border border-amber-100 shadow-sm">
          <p className="text-xs text-amber-700 font-medium">Reserved Units</p>
          <p className="text-sm font-bold text-amber-800">{reservedCount}</p>
        </div>
        <div className="p-3 bg-red-50 rounded-xl border border-red-100 shadow-sm">
          <p className="text-xs text-red-700 font-medium">Sold Units</p>
          <p className="text-sm font-bold text-red-800">{soldCount}</p>
        </div>
      </div>

      {apartments.length > 0 ? (
        <div className="space-y-6">
          {/* Architectural Layout Blueprint Diagram */}
          <div className="bg-navy-950 p-5 rounded-2xl text-white shadow-lg border border-navy-800 relative overflow-hidden">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-white/10">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-gold-400" />
                <span className="font-bold text-xs tracking-wide uppercase text-gold-400">
                  Architectural Layout Blueprint · Floor {floor.floorNumber}
                </span>
              </div>
              <div className="flex items-center gap-3 text-xs">
                <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block" /> Available</span>
                <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-amber-500 inline-block" /> Reserved</span>
                <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-rose-500 inline-block" /> Sold</span>
              </div>
            </div>

            {/* Central Corridor & Room Layout Grid */}
            <div className="space-y-4">
              {/* Central Building Services Core */}
              <div className="bg-navy-900/90 border border-white/15 p-2.5 rounded-xl flex items-center justify-around text-center text-xs text-white/70">
                <span className="flex items-center gap-1 font-semibold text-gold-300">🛗 Elevator Lobby</span>
                <span className="text-white/20">|</span>
                <span className="flex items-center gap-1 font-semibold text-gold-300">🚪 Main Access Corridor</span>
                <span className="text-white/20">|</span>
                <span className="flex items-center gap-1 font-semibold text-gold-300">🪜 Fire Escape Stairs</span>
              </div>

              {/* Apartment Room Cards Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {apartments.map((apt) => {
                  const isSelected = selectedUnit?.id === apt.id
                  const statusBg =
                    apt.status === 'AVAILABLE' ? 'border-emerald-500/50 bg-emerald-950/30 text-emerald-200' :
                    apt.status === 'RESERVED' ? 'border-amber-500/50 bg-amber-950/30 text-amber-200' :
                    'border-rose-500/50 bg-rose-950/30 text-rose-200 shadow-none'

                  const badgeClass =
                    apt.status === 'AVAILABLE' ? 'bg-emerald-500 text-white' :
                    apt.status === 'RESERVED' ? 'bg-amber-500 text-white' :
                    'bg-rose-500 text-white'

                  return (
                    <button
                      type="button"
                      key={apt.id}
                      onClick={() => setSelectedUnitId(apt.id)}
                      className={`p-3.5 rounded-xl border text-left transition-all relative group cursor-pointer
                        ${statusBg} ${isSelected ? 'ring-2 ring-gold-400 scale-[1.02] shadow-md' : 'hover:scale-[1.01]'}`}
                    >
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="font-bold text-white text-sm">Unit {apt.unitNumber}</span>
                        <span className={`text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${badgeClass}`}>
                          {apt.status}
                        </span>
                      </div>
                      
                      <p className="text-xs text-white/70 font-medium">
                        {apt.bedrooms} Bed · {apt.bathrooms} Bath · {apt.areaSqft ? `${apt.areaSqft} sqft` : 'Standard'}
                      </p>

                      <div className="mt-2 pt-2 border-t border-white/10 flex items-center justify-between text-xs">
                        <span className="font-bold text-gold-400">
                          {apt.price ? `LKR ${Number(apt.price).toLocaleString()}` : 'Price on request'}
                        </span>
                        <span className="text-[10px] text-white/50 group-hover:text-white transition-colors">Inspect ›</span>
                      </div>
                    </button>
                  )
                })}
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="border border-dashed border-gray-200 rounded-xl p-8 text-center bg-gray-50">
          <Building2 className="w-8 h-8 text-gray-400 mx-auto mb-2" />
          <h4 className="text-sm font-bold text-navy-900">No Apartments Added to Floor {floor.floorNumber} Yet</h4>
          <p className="text-xs text-gray-500 max-w-xs mx-auto mt-1">
            Add apartment units below to Floor {floor.floorNumber} to automatically generate the Master Floor Plan layout.
          </p>
        </div>
      )}
    </div>
  )
}
