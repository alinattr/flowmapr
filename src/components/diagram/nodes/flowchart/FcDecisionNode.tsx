import { Handle, Position, type NodeProps } from '@xyflow/react'
import { EditableLabel } from '../EditableLabel'
import { useTheme } from '@/lib/theme/ThemeProvider'

export function FcDecisionNode({ data, id }: NodeProps) {
  const { theme } = useTheme()
  const isDark = theme === 'dark'

  return (
    <div style={{ position: 'relative', width: 140, height: 70, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <svg width="140" height="70" style={{ position: 'absolute', top: 0, left: 0 }}>
        <polygon
          points="70,4 136,35 70,66 4,35"
          fill={isDark ? 'rgba(59,130,246,0.12)' : '#DBEAFE'}
          stroke={isDark ? 'rgba(59,130,246,0.4)' : '#3B82F6'}
          strokeWidth="1.5"
        />
      </svg>
      <Handle type="target" position={Position.Top} style={{ top: 4, background: '#3B82F6', zIndex: 1 }} />
      <EditableLabel nodeId={id} label={String(data.label ?? 'Decision')} style={{ position: 'relative', zIndex: 1, fontSize: 11, textAlign: 'center', maxWidth: 100 }} />
      <Handle type="source" position={Position.Bottom} id="yes" style={{ bottom: 4, background: '#3B82F6', zIndex: 1 }} />
      <Handle type="source" position={Position.Right} id="no" style={{ right: 4, background: '#EF4444', zIndex: 1 }} />
    </div>
  )
}
