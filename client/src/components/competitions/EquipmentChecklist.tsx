import { useState } from 'react'
import { Plus, Trash2, Check } from 'lucide-react'
import { competitionsApi, type EquipmentItem } from '@/api/competitions.api'

interface Props {
  competitionId: number
  items: EquipmentItem[]
  onUpdate: () => void
}

export default function EquipmentChecklist({ competitionId, items, onUpdate }: Props) {
  const [newItem, setNewItem] = useState('')
  const [category, setCategory] = useState('')

  const handleAdd = async () => {
    if (!newItem.trim()) return
    await competitionsApi.addEquipment(competitionId, {
      name: newItem.trim(),
      category: category || undefined,
    })
    setNewItem('')
    setCategory('')
    onUpdate()
  }

  const handleToggle = async (item: EquipmentItem) => {
    await competitionsApi.updateEquipment(competitionId, item.id, { checked: !item.checked })
    onUpdate()
  }

  const handleDelete = async (itemId: number) => {
    await competitionsApi.removeEquipment(competitionId, itemId)
    onUpdate()
  }

  const categories = ['swim', 'bike', 'run', 'nutrition', 'other']
  const grouped = categories.reduce((acc, cat) => {
    const catItems = items.filter(i => (i.category || 'other') === cat)
    if (catItems.length > 0) acc[cat] = catItems
    return acc
  }, {} as Record<string, EquipmentItem[]>)

  const ungrouped = items.filter(i => !i.category)
  const checkedCount = items.filter(i => i.checked).length

  const categoryLabels: Record<string, string> = {
    swim: 'Natation',
    bike: 'Vélo',
    run: 'Course',
    nutrition: 'Nutrition',
    other: 'Autre',
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-gray-900">Checklist matériel</h3>
        <span className="text-sm text-gray-500">{checkedCount}/{items.length}</span>
      </div>

      {/* Progress bar */}
      {items.length > 0 && (
        <div className="w-full bg-gray-200 rounded-full h-2 mb-4">
          <div
            className="bg-green-500 h-2 rounded-full transition-all"
            style={{ width: `${(checkedCount / items.length) * 100}%` }}
          />
        </div>
      )}

      {/* Items by category */}
      {Object.entries(grouped).map(([cat, catItems]) => (
        <div key={cat} className="mb-3">
          <p className="text-xs font-medium text-gray-400 uppercase mb-1">{categoryLabels[cat] || cat}</p>
          {catItems.map(item => (
            <div key={item.id} className="flex items-center gap-2 py-1.5 group">
              <button
                onClick={() => handleToggle(item)}
                className={`h-5 w-5 rounded border flex items-center justify-center transition-colors ${
                  item.checked
                    ? 'bg-green-500 border-green-500 text-white'
                    : 'border-gray-300 hover:border-blue-400'
                }`}
              >
                {item.checked && <Check className="h-3 w-3" />}
              </button>
              <span className={`flex-1 text-sm ${item.checked ? 'text-gray-400 line-through' : 'text-gray-700'}`}>
                {item.name}
              </span>
              <button
                onClick={() => handleDelete(item.id)}
                className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-500 transition-opacity"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      ))}

      {/* Add form */}
      <div className="flex gap-2 mt-4">
        <input
          value={newItem}
          onChange={e => setNewItem(e.target.value)}
          placeholder="Ajouter un élément..."
          className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
          onKeyDown={e => e.key === 'Enter' && handleAdd()}
        />
        <select
          value={category}
          onChange={e => setCategory(e.target.value)}
          className="px-2 py-2 text-sm border border-gray-300 rounded-lg"
        >
          <option value="">Catégorie</option>
          {categories.map(c => (
            <option key={c} value={c}>{categoryLabels[c]}</option>
          ))}
        </select>
        <button
          onClick={handleAdd}
          disabled={!newItem.trim()}
          className="p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
        >
          <Plus className="h-4 w-4" />
        </button>
      </div>
    </div>
  )
}
