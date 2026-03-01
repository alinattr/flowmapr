'use client'

import { useState, useCallback } from 'react'
import { useReactFlow, type Node } from '@xyflow/react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { X, Plus } from 'lucide-react'

interface UmlAttribute {
  visibility: '+' | '-' | '#'
  name: string
  type: string
}

interface UmlMethod {
  visibility: '+' | '-' | '#'
  name: string
  params: string
  returnType: string
}

interface UmlClassData {
  name: string
  stereotype?: string | null
  attributes?: UmlAttribute[]
  methods?: UmlMethod[]
}

const STEREOTYPE_OPTIONS = [
  { value: '', label: 'None' },
  { value: '<<interface>>', label: '<<interface>>' },
  { value: '<<abstract>>', label: '<<abstract>>' },
  { value: '<<enum>>', label: '<<enum>>' },
]

const VIS_OPTIONS: Array<'+' | '-' | '#'> = ['+', '-', '#']

interface UmlClassPanelProps {
  selectedNode: Node
  onDeleteNode: (nodeId: string) => void
}

export function UmlClassPanel({ selectedNode, onDeleteNode }: UmlClassPanelProps) {
  const { setNodes } = useReactFlow()
  const classData = selectedNode.data as unknown as UmlClassData

  const [addingAttr, setAddingAttr] = useState(false)
  const [attrVis, setAttrVis] = useState<'+' | '-' | '#'>('+')
  const [attrName, setAttrName] = useState('')
  const [attrType, setAttrType] = useState('')

  const [addingMethod, setAddingMethod] = useState(false)
  const [methVis, setMethVis] = useState<'+' | '-' | '#'>('+')
  const [methName, setMethName] = useState('')
  const [methParams, setMethParams] = useState('')
  const [methReturn, setMethReturn] = useState('')

  const updateData = useCallback(
    (patch: Partial<UmlClassData>) => {
      setNodes((nds) =>
        nds.map((n) =>
          n.id === selectedNode.id
            ? { ...n, data: { ...n.data, ...patch } }
            : n
        )
      )
    },
    [selectedNode.id, setNodes]
  )

  function handleAddAttr() {
    if (!attrName.trim()) return
    const newAttr: UmlAttribute = {
      visibility: attrVis,
      name: attrName.trim(),
      type: attrType.trim() || 'String',
    }
    updateData({ attributes: [...(classData.attributes ?? []), newAttr] })
    setAttrName('')
    setAttrType('')
    setAddingAttr(false)
  }

  function handleRemoveAttr(idx: number) {
    const attrs = [...(classData.attributes ?? [])]
    attrs.splice(idx, 1)
    updateData({ attributes: attrs })
  }

  function handleAddMethod() {
    if (!methName.trim()) return
    const newMethod: UmlMethod = {
      visibility: methVis,
      name: methName.trim(),
      params: methParams.trim(),
      returnType: methReturn.trim() || 'void',
    }
    updateData({ methods: [...(classData.methods ?? []), newMethod] })
    setMethName('')
    setMethParams('')
    setMethReturn('')
    setAddingMethod(false)
  }

  function handleRemoveMethod(idx: number) {
    const meths = [...(classData.methods ?? [])]
    meths.splice(idx, 1)
    updateData({ methods: meths })
  }

  return (
    <div className="absolute right-4 top-16 z-10 w-72 overflow-hidden rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] shadow-lg">
      <div className="border-b border-[var(--color-border)] bg-[var(--color-accent-subtle)] px-4 py-3">
        <div className="text-[10px] font-medium uppercase tracking-wider text-[var(--color-text-secondary)]">
          Selected: Class
        </div>
      </div>

      <div className="max-h-[60vh] space-y-4 overflow-y-auto p-4">
        {/* Class name */}
        <div className="space-y-1.5">
          <Label className="text-xs">Class name</Label>
          <Input
            value={classData.name}
            onChange={(e) => updateData({ name: e.target.value })}
            className="h-8 text-sm"
          />
        </div>

        {/* Stereotype */}
        <div className="space-y-1.5">
          <Label className="text-xs">Stereotype</Label>
          <select
            value={classData.stereotype ?? ''}
            onChange={(e) =>
              updateData({ stereotype: e.target.value || null })
            }
            className="h-8 w-full rounded-md border border-[var(--color-border)] bg-[var(--color-surface)] px-2 text-sm outline-none focus:border-[var(--color-accent-brand)]"
          >
            {STEREOTYPE_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        {/* Attributes */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label className="text-xs">Attributes</Label>
            <button
              onClick={() => setAddingAttr(true)}
              className="flex items-center gap-1 text-xs text-[var(--color-accent-brand)] hover:underline"
            >
              <Plus className="h-3 w-3" strokeWidth={2} />
              Add
            </button>
          </div>
          {(classData.attributes ?? []).map((attr, i) => (
            <div
              key={i}
              className="flex items-center justify-between rounded-md bg-[var(--color-surface-raised)] px-2 py-1.5"
            >
              <span className="font-mono text-xs text-[var(--color-text-primary)]">
                <span
                  style={{
                    color:
                      attr.visibility === '+'
                        ? '#16A34A'
                        : attr.visibility === '-'
                          ? '#DC2626'
                          : '#D97706',
                    fontWeight: 600,
                  }}
                >
                  {attr.visibility}
                </span>{' '}
                {attr.name}: {attr.type}
              </span>
              <button
                onClick={() => handleRemoveAttr(i)}
                className="text-[var(--color-text-disabled)] hover:text-[var(--color-danger)]"
              >
                <X className="h-3 w-3" strokeWidth={2} />
              </button>
            </div>
          ))}
          {addingAttr && (
            <div className="space-y-1.5 rounded-md border border-[var(--color-border)] p-2">
              <div className="flex gap-1.5">
                <select
                  value={attrVis}
                  onChange={(e) =>
                    setAttrVis(e.target.value as '+' | '-' | '#')
                  }
                  className="h-7 w-12 rounded border border-[var(--color-border)] text-center text-xs"
                >
                  {VIS_OPTIONS.map((v) => (
                    <option key={v} value={v}>
                      {v}
                    </option>
                  ))}
                </select>
                <Input
                  value={attrName}
                  onChange={(e) => setAttrName(e.target.value)}
                  placeholder="name"
                  className="h-7 text-xs"
                />
                <Input
                  value={attrType}
                  onChange={(e) => setAttrType(e.target.value)}
                  placeholder="type"
                  className="h-7 w-20 text-xs"
                />
              </div>
              <div className="flex gap-1.5">
                <Button size="sm" className="h-6 text-xs" onClick={handleAddAttr}>
                  Add
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-6 text-xs"
                  onClick={() => setAddingAttr(false)}
                >
                  Cancel
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Methods */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label className="text-xs">Methods</Label>
            <button
              onClick={() => setAddingMethod(true)}
              className="flex items-center gap-1 text-xs text-[var(--color-accent-brand)] hover:underline"
            >
              <Plus className="h-3 w-3" strokeWidth={2} />
              Add
            </button>
          </div>
          {(classData.methods ?? []).map((method, i) => (
            <div
              key={i}
              className="flex items-center justify-between rounded-md bg-[var(--color-surface-raised)] px-2 py-1.5"
            >
              <span className="font-mono text-xs text-[var(--color-text-secondary)]">
                <span
                  style={{
                    color:
                      method.visibility === '+'
                        ? '#16A34A'
                        : method.visibility === '-'
                          ? '#DC2626'
                          : '#D97706',
                    fontWeight: 600,
                  }}
                >
                  {method.visibility}
                </span>{' '}
                {method.name}({method.params}): {method.returnType}
              </span>
              <button
                onClick={() => handleRemoveMethod(i)}
                className="text-[var(--color-text-disabled)] hover:text-[var(--color-danger)]"
              >
                <X className="h-3 w-3" strokeWidth={2} />
              </button>
            </div>
          ))}
          {addingMethod && (
            <div className="space-y-1.5 rounded-md border border-[var(--color-border)] p-2">
              <div className="flex gap-1.5">
                <select
                  value={methVis}
                  onChange={(e) =>
                    setMethVis(e.target.value as '+' | '-' | '#')
                  }
                  className="h-7 w-12 rounded border border-[var(--color-border)] text-center text-xs"
                >
                  {VIS_OPTIONS.map((v) => (
                    <option key={v} value={v}>
                      {v}
                    </option>
                  ))}
                </select>
                <Input
                  value={methName}
                  onChange={(e) => setMethName(e.target.value)}
                  placeholder="name"
                  className="h-7 text-xs"
                />
              </div>
              <div className="flex gap-1.5">
                <Input
                  value={methParams}
                  onChange={(e) => setMethParams(e.target.value)}
                  placeholder="params"
                  className="h-7 text-xs"
                />
                <Input
                  value={methReturn}
                  onChange={(e) => setMethReturn(e.target.value)}
                  placeholder="return"
                  className="h-7 w-20 text-xs"
                />
              </div>
              <div className="flex gap-1.5">
                <Button size="sm" className="h-6 text-xs" onClick={handleAddMethod}>
                  Add
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-6 text-xs"
                  onClick={() => setAddingMethod(false)}
                >
                  Cancel
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Delete */}
        <Button
          variant="outline"
          size="sm"
          className="w-full text-[var(--color-danger)] hover:bg-red-50"
          onClick={() => onDeleteNode(selectedNode.id)}
        >
          Delete class
        </Button>
      </div>
    </div>
  )
}
