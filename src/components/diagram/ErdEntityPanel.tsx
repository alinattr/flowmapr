'use client'

import { useState, useCallback } from 'react'
import { useReactFlow, type Node } from '@xyflow/react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { X, Plus } from 'lucide-react'

interface ErdField {
  name: string
  type: string
  isPk?: boolean
  isFk?: boolean
  isNullable?: boolean
}

const TYPE_OPTIONS = ['uuid', 'varchar', 'text', 'integer', 'bigint', 'decimal', 'boolean', 'timestamp', 'date', 'json', 'enum']
const ENTITY_COLORS = ['#6366F1', '#22C55E', '#3B82F6', '#F59E0B', '#A78BFA', '#EC4899', '#14B8A6']

interface ErdEntityPanelProps {
  selectedNode: Node
  onClose: () => void
}

export function ErdEntityPanel({ selectedNode, onClose }: ErdEntityPanelProps) {
  const { updateNodeData } = useReactFlow()
  const nodeData = selectedNode.data as { label?: string; fields?: ErdField[]; color?: string }
  const [name, setName] = useState(String(nodeData.label ?? 'Entity'))
  const [fields, setFields] = useState<ErdField[]>(Array.isArray(nodeData.fields) ? nodeData.fields : [])
  const [color, setColor] = useState(String(nodeData.color ?? '#6366F1'))

  const save = useCallback(() => {
    updateNodeData(selectedNode.id, { label: name, fields, color })
  }, [selectedNode.id, name, fields, color, updateNodeData])

  const addField = () => {
    const f: ErdField = { name: 'field', type: 'varchar', isPk: false, isFk: false, isNullable: false }
    setFields(prev => [...prev, f])
  }

  const removeField = (i: number) => setFields(prev => prev.filter((_, j) => j !== i))

  const updateField = (i: number, key: keyof ErdField, value: unknown) => {
    setFields(prev => prev.map((f, j) => j === i ? { ...f, [key]: value } : f))
  }

  return (
    <div style={{
      width: 280, height: '100%', overflow: 'auto',
      background: 'var(--color-bg-secondary)',
      borderLeft: '1px solid var(--color-border)',
      padding: 16, display: 'flex', flexDirection: 'column', gap: 16,
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-text-primary)', fontFamily: 'Inter, sans-serif' }}>
          Entity
        </span>
        <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-secondary)' }}>
          <X size={14} />
        </button>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        <Label style={{ fontSize: 11, color: 'var(--color-text-secondary)' }}>Name</Label>
        <Input
          value={name}
          onChange={e => setName(e.target.value)}
          onBlur={save}
          style={{ fontSize: 12, height: 32 }}
        />
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        <Label style={{ fontSize: 11, color: 'var(--color-text-secondary)' }}>Color</Label>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {ENTITY_COLORS.map(c => (
            <button
              key={c}
              onClick={() => { setColor(c); updateNodeData(selectedNode.id, { color: c }) }}
              style={{
                width: 20, height: 20, borderRadius: '50%', background: c,
                border: `2px solid ${color === c ? '#fff' : 'transparent'}`, cursor: 'pointer',
              }}
            />
          ))}
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Label style={{ fontSize: 11, color: 'var(--color-text-secondary)' }}>Fields</Label>
          <Button size="sm" variant="ghost" onClick={addField} style={{ padding: '2px 8px', height: 24, fontSize: 11 }}>
            <Plus size={12} /> Add
          </Button>
        </div>

        {fields.map((f, i) => (
          <div key={i} style={{ display: 'flex', flexDirection: 'column', gap: 4, padding: 8, background: 'rgba(255,255,255,0.02)', borderRadius: 6, border: '1px solid rgba(255,255,255,0.06)' }}>
            <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
              <Input value={f.name} onChange={e => updateField(i, 'name', e.target.value)} onBlur={save} placeholder="field_name" style={{ flex: 1, fontSize: 11, height: 26 }} />
              <select
                value={f.type}
                onChange={e => { updateField(i, 'type', e.target.value); save() }}
                style={{ fontSize: 10, background: 'var(--color-bg-primary)', border: '1px solid var(--color-border)', borderRadius: 4, color: 'var(--color-text-secondary)', padding: '2px 4px', height: 26 }}
              >
                {TYPE_OPTIONS.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
              <button onClick={() => { removeField(i); save() }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#71717A', padding: 2 }}>
                <X size={12} />
              </button>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              {(['isPk', 'isFk', 'isNullable'] as const).map(flag => (
                <label key={flag} style={{ display: 'flex', alignItems: 'center', gap: 3, fontSize: 10, color: 'var(--color-text-secondary)', cursor: 'pointer' }}>
                  <input type="checkbox" checked={Boolean(f[flag])} onChange={e => { updateField(i, flag, e.target.checked); save() }} style={{ width: 10, height: 10 }} />
                  {flag === 'isPk' ? 'PK' : flag === 'isFk' ? 'FK' : 'Null'}
                </label>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
