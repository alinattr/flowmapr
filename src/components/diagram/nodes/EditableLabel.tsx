'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { useReactFlow } from '@xyflow/react'

export type TextAlign = 'left' | 'center' | 'right'

export interface EditableLabelProps {
  nodeId: string
  label: string
  textAlign?: TextAlign
  className?: string
  style?: React.CSSProperties
}

export function EditableLabel({
  nodeId,
  label,
  textAlign = 'center',
  className = '',
  style,
}: EditableLabelProps) {
  const [editing, setEditing] = useState(false)
  const [value, setValue] = useState(label)
  const inputRef = useRef<HTMLInputElement>(null)
  const { setNodes } = useReactFlow()

  useEffect(() => {
    if (editing && inputRef.current) {
      inputRef.current.focus()
      inputRef.current.select()
    }
  }, [editing])

  const commit = useCallback(() => {
    setEditing(false)
    const trimmed = value.trim() || label
    setValue(trimmed)
    setNodes((nds) =>
      nds.map((n) =>
        n.id === nodeId ? { ...n, data: { ...n.data, label: trimmed } } : n
      )
    )
  }, [value, label, nodeId, setNodes])

  const alignStyle = { textAlign } as const

  if (editing) {
    return (
      <input
        ref={inputRef}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => {
          if (e.key === 'Enter') commit()
          if (e.key === 'Escape') {
            setValue(label)
            setEditing(false)
          }
        }}
        className={`w-full bg-transparent outline-none ${className}`}
        style={{ minWidth: 40, ...alignStyle, ...style }}
      />
    )
  }

  return (
    <span
      onDoubleClick={() => {
        setValue(label)
        setEditing(true)
      }}
      className={`block w-full cursor-text select-none ${className}`}
      style={{ ...alignStyle, ...style }}
    >
      {label}
    </span>
  )
}
