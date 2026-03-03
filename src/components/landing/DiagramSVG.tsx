import type { DiagramType } from './MorphingDiagram'

export function DiagramSVG({ type }: { type: DiagramType }) {
  switch (type) {
    case 'BPMN':         return <BpmnSVG />
    case 'UML Sequence': return <SequenceSVG />
    case 'Flowchart':    return <FlowchartSVG />
    case 'C4':           return <C4SVG />
    case 'API Lens':     return <ApiLensSVG />
    default:             return <BpmnSVG />
  }
}

function BpmnSVG() {
  // Pool: x=20,y=30,w=660,h=240. Label bar x=20..50 (30px). Divider at x=50. Content from x=80+.
  // Lane 1 Customer:        y=30..110  center=70
  // Lane 2 Payment Service: y=110..190 center=150
  // Lane 3 Bank:            y=190..270 center=230
  return (
    <svg width="100%" height="100%" viewBox="0 0 700 290" preserveAspectRatio="xMidYMid meet"
      style={{ fontFamily: 'Inter,sans-serif', overflow: 'visible' }}>
      <defs>
        <marker id="arrow-b" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto">
          <path d="M0,0 L0,6 L6,3 z" fill="rgba(99,102,241,0.7)"/>
        </marker>
      </defs>

      {/* Pool outline */}
      <rect x="20" y="30" width="660" height="240" rx="6" fill="rgba(99,102,241,0.04)" stroke="rgba(99,102,241,0.25)" strokeWidth="1.5"/>
      {/* Pool label bar */}
      <rect x="20" y="30" width="30" height="240" rx="6" fill="rgba(99,102,241,0.12)" stroke="rgba(99,102,241,0.25)" strokeWidth="1.5"/>
      <text x="35" y="155" fill="#818CF8" fontSize="10" fontWeight="600" textAnchor="middle" transform="rotate(-90,35,155)">Payment Process</text>

      {/* Lane 1 — Customer */}
      <rect x="50" y="30" width="630" height="80" fill="transparent" stroke="rgba(99,102,241,0.15)" strokeWidth="1"/>
      {/* Lane label rotated, centered in lane */}
      <text x="35" y="75" fill="#6366F1" fontSize="9" textAnchor="middle" transform="rotate(-90,35,75)">Customer</text>

      {/* Lane 2 — Payment Service */}
      <rect x="50" y="110" width="630" height="80" fill="rgba(99,102,241,0.02)" stroke="rgba(99,102,241,0.15)" strokeWidth="1"/>
      <text x="35" y="155" fill="#6366F1" fontSize="9" textAnchor="middle" transform="rotate(-90,35,155)">Payment Svc</text>

      {/* Lane 3 — Bank */}
      <rect x="50" y="190" width="630" height="80" fill="transparent" stroke="rgba(99,102,241,0.15)" strokeWidth="1"/>
      <text x="35" y="235" fill="#6366F1" fontSize="9" textAnchor="middle" transform="rotate(-90,35,235)">Bank</text>

      {/* Vertical divider — label column / content */}
      <line x1="50" y1="30" x2="50" y2="270" stroke="rgba(99,102,241,0.2)" strokeWidth="1"/>

      {/* Start event — Customer lane, cx=90 clear of label column */}
      <circle cx="90" cy="70" r="14" fill="rgba(34,197,94,0.12)" stroke="#22C55E" strokeWidth="2"/>

      {/* Submit Order — Customer lane */}
      <rect x="140" y="45" width="110" height="50" rx="6" fill="rgba(99,102,241,0.12)" stroke="rgba(99,102,241,0.4)" strokeWidth="1.5"/>
      <text x="195" y="75" fill="#C4B5FD" fontSize="10" fontWeight="500" textAnchor="middle">Submit Order</text>

      {/* Validate Payment gateway — Payment lane */}
      <polygon points="300,130 328,150 300,170 272,150" fill="rgba(234,179,8,0.12)" stroke="#EAB308" strokeWidth="1.5"/>
      <text x="300" y="154" fill="#FCD34D" fontSize="9" textAnchor="middle">?</text>

      {/* Process Payment — Payment lane */}
      <rect x="360" y="125" width="120" height="50" rx="6" fill="rgba(99,102,241,0.12)" stroke="rgba(99,102,241,0.4)" strokeWidth="1.5"/>
      <text x="420" y="155" fill="#C4B5FD" fontSize="10" fontWeight="500" textAnchor="middle">Process Payment</text>

      {/* Confirm Order — Customer lane */}
      <rect x="520" y="45" width="120" height="50" rx="6" fill="rgba(99,102,241,0.12)" stroke="rgba(99,102,241,0.4)" strokeWidth="1.5"/>
      <text x="580" y="75" fill="#C4B5FD" fontSize="10" fontWeight="500" textAnchor="middle">Confirm Order</text>

      {/* End event — Customer lane */}
      <circle cx="660" cy="70" r="14" fill="rgba(239,68,68,0.12)" stroke="#EF4444" strokeWidth="2.5"/>
      <circle cx="660" cy="70" r="10" fill="rgba(239,68,68,0.3)"/>

      {/* Sequence flows */}
      {/* Start → Submit Order */}
      <line x1="104" y1="70" x2="140" y2="70" stroke="rgba(99,102,241,0.5)" strokeWidth="1.5" markerEnd="url(#arrow-b)"/>
      {/* Submit Order → Gateway */}
      <line x1="250" y1="70" x2="272" y2="150" stroke="rgba(99,102,241,0.5)" strokeWidth="1.5" markerEnd="url(#arrow-b)"/>
      {/* Gateway → Process Payment */}
      <line x1="328" y1="150" x2="360" y2="150" stroke="rgba(99,102,241,0.5)" strokeWidth="1.5" markerEnd="url(#arrow-b)"/>
      {/* Process Payment → Confirm Order */}
      <line x1="480" y1="150" x2="520" y2="70" stroke="rgba(99,102,241,0.5)" strokeWidth="1.5" markerEnd="url(#arrow-b)"/>
      {/* Confirm Order → End */}
      <line x1="640" y1="70" x2="646" y2="70" stroke="rgba(99,102,241,0.5)" strokeWidth="1.5" markerEnd="url(#arrow-b)"/>
    </svg>
  )
}

function SequenceSVG() {
  const participants = [
    { label: 'User',     x: 100, color: '#6366F1' },
    { label: 'Frontend', x: 260, color: '#22C55E' },
    { label: 'API',      x: 420, color: '#3B82F6' },
    { label: 'Database', x: 580, color: '#A78BFA' },
  ]
  const msgs = [
    { y: 80,  x1: 100, x2: 260, label: 'login()',    dashed: false },
    { y: 115, x1: 260, x2: 420, label: 'POST /auth', dashed: false },
    { y: 150, x1: 420, x2: 580, label: 'query user', dashed: false },
    { y: 185, x1: 580, x2: 420, label: 'user data',  dashed: true  },
    { y: 220, x1: 420, x2: 260, label: 'token',      dashed: true  },
    { y: 255, x1: 260, x2: 100, label: 'session',    dashed: true  },
  ]
  return (
    <svg width="100%" height="100%" viewBox="0 0 700 290" preserveAspectRatio="xMidYMid meet"
      style={{ fontFamily: 'Inter,sans-serif' }}>
      <defs>
        <marker id="arr-fwd" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto">
          <path d="M0,0 L0,6 L6,3 z" fill="rgba(99,102,241,0.8)"/>
        </marker>
        <marker id="arr-bwd" markerWidth="6" markerHeight="6" refX="1" refY="3" orient="auto">
          <path d="M6,0 L6,6 L0,3 z" fill="rgba(167,139,250,0.8)"/>
        </marker>
      </defs>
      {participants.map((p, i) => (
        <g key={i}>
          <rect x={p.x-45} y="20" width="90" height="32" rx="6" fill={`${p.color}18`} stroke={`${p.color}50`} strokeWidth="1.5"/>
          <text x={p.x} y="40" fill={p.color} fontSize="11" fontWeight="600" textAnchor="middle">{p.label}</text>
          <line x1={p.x} y1="52" x2={p.x} y2="275" stroke={`${p.color}25`} strokeWidth="1" strokeDasharray="4 3"/>
        </g>
      ))}
      {msgs.map((msg, i) => (
        <g key={i}>
          <line x1={msg.x1} y1={msg.y} x2={msg.x2} y2={msg.y}
            stroke={msg.dashed ? 'rgba(167,139,250,0.5)' : 'rgba(99,102,241,0.6)'}
            strokeWidth="1.5" strokeDasharray={msg.dashed ? '5 3' : 'none'}
            markerEnd={msg.x2 > msg.x1 ? 'url(#arr-fwd)' : 'url(#arr-bwd)'}/>
          <text x={(msg.x1+msg.x2)/2} y={msg.y-6} fill="#94A3B8" fontSize="9" textAnchor="middle">{msg.label}</text>
        </g>
      ))}
    </svg>
  )
}

function ErdSVG() {
  const entities = [
    { x: 55,  y: 50, name: 'User',    color: '#6366F1', fields: ['🔑 id: uuid', 'email: string', 'name: string'] },
    { x: 275, y: 35, name: 'Order',   color: '#22C55E', fields: ['🔑 id: uuid', '🔗 user_id', 'total: decimal', 'status: enum'] },
    { x: 495, y: 50, name: 'Product', color: '#3B82F6', fields: ['🔑 id: uuid', 'name: string', 'price: decimal'] },
  ]
  return (
    <svg width="100%" height="100%" viewBox="0 0 700 290" preserveAspectRatio="xMidYMid meet"
      style={{ fontFamily: 'Inter,sans-serif' }}>
      <line x1="215" y1="115" x2="275" y2="115" stroke="rgba(99,102,241,0.4)" strokeWidth="1.5"/>
      <text x="245" y="108" fill="#52525B" fontSize="9" textAnchor="middle">1:N</text>
      <line x1="455" y1="115" x2="495" y2="115" stroke="rgba(99,102,241,0.4)" strokeWidth="1.5"/>
      <text x="475" y="108" fill="#52525B" fontSize="9" textAnchor="middle">N:M</text>
      {entities.map((e, i) => (
        <g key={i}>
          <rect x={e.x} y={e.y} width="160" height={40+e.fields.length*24} rx="8" fill="rgba(255,255,255,0.02)" stroke={`${e.color}40`} strokeWidth="1.5"/>
          <rect x={e.x} y={e.y} width="160" height="32" rx="8" fill={`${e.color}20`}/>
          <text x={e.x+80} y={e.y+21} fill={e.color} fontSize="11" fontWeight="700" textAnchor="middle">{e.name}</text>
          {e.fields.map((f, j) => (
            <text key={j} x={e.x+12} y={e.y+48+j*24} fill="#94A3B8" fontSize="10" fontFamily="JetBrains Mono,monospace">{f}</text>
          ))}
        </g>
      ))}
    </svg>
  )
}

function FlowchartSVG() {
  // All nodes centered at x=350. Fits within y=20..282 (height=290).
  // Start:          x=275, y=20,  w=150, h=34 → bottom=54
  // Enter Email:    x=275, y=74,  w=150, h=40 → bottom=114
  // Valid? diamond: cx=350, cy=155 → top=135, bottom=175
  // Show Error:     x=510, y=135, w=110, h=40 → center y=155
  // Send Reset:     x=275, y=195, w=150, h=40 → bottom=235
  // End:            x=275, y=248, w=150, h=34
  return (
    <svg width="100%" height="100%" viewBox="0 0 700 290" preserveAspectRatio="xMidYMid meet"
      style={{ fontFamily: 'Inter,sans-serif' }}>
      <defs>
        <marker id="arr-fc" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto">
          <path d="M0,0 L0,6 L6,3 z" fill="rgba(99,102,241,0.7)"/>
        </marker>
        <marker id="arr-red" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto">
          <path d="M0,0 L0,6 L6,3 z" fill="rgba(239,68,68,0.7)"/>
        </marker>
      </defs>

      {/* Start */}
      <rect x="275" y="20" width="150" height="34" rx="17" fill="rgba(34,197,94,0.15)" stroke="#22C55E" strokeWidth="1.5"/>
      <text x="350" y="42" fill="#86EFAC" fontSize="11" fontWeight="600" textAnchor="middle">Start</text>

      {/* Enter Email */}
      <rect x="275" y="74" width="150" height="40" rx="6" fill="rgba(99,102,241,0.12)" stroke="rgba(99,102,241,0.4)" strokeWidth="1.5"/>
      <text x="350" y="99" fill="#C4B5FD" fontSize="10" fontWeight="500" textAnchor="middle">Enter Email</text>

      {/* Valid? diamond */}
      <polygon points="350,135 400,155 350,175 300,155" fill="rgba(59,130,246,0.12)" stroke="rgba(59,130,246,0.5)" strokeWidth="1.5"/>
      <text x="350" y="159" fill="#93C5FD" fontSize="9" textAnchor="middle">Valid?</text>

      {/* Show Error (No branch) */}
      <rect x="510" y="135" width="110" height="40" rx="6" fill="rgba(239,68,68,0.1)" stroke="rgba(239,68,68,0.4)" strokeWidth="1.5"/>
      <text x="565" y="160" fill="#FCA5A5" fontSize="10" textAnchor="middle">Show Error</text>

      {/* Send Reset Link */}
      <rect x="275" y="195" width="150" height="40" rx="6" fill="rgba(99,102,241,0.12)" stroke="rgba(99,102,241,0.4)" strokeWidth="1.5"/>
      <text x="350" y="220" fill="#C4B5FD" fontSize="10" fontWeight="500" textAnchor="middle">Send Reset Link</text>

      {/* End */}
      <rect x="275" y="248" width="150" height="34" rx="17" fill="rgba(239,68,68,0.12)" stroke="#EF4444" strokeWidth="1.5"/>
      <text x="350" y="270" fill="#FCA5A5" fontSize="11" fontWeight="600" textAnchor="middle">End</text>

      {/* Arrows — main flow */}
      <line x1="350" y1="54"  x2="350" y2="74"  stroke="rgba(99,102,241,0.5)" strokeWidth="1.5" markerEnd="url(#arr-fc)"/>
      <line x1="350" y1="114" x2="350" y2="135" stroke="rgba(99,102,241,0.5)" strokeWidth="1.5" markerEnd="url(#arr-fc)"/>
      <line x1="350" y1="175" x2="350" y2="195" stroke="rgba(99,102,241,0.5)" strokeWidth="1.5" markerEnd="url(#arr-fc)"/>
      <line x1="350" y1="235" x2="350" y2="248" stroke="rgba(99,102,241,0.5)" strokeWidth="1.5" markerEnd="url(#arr-fc)"/>

      {/* No branch → Show Error */}
      <line x1="400" y1="155" x2="510" y2="155" stroke="rgba(239,68,68,0.5)" strokeWidth="1.5" markerEnd="url(#arr-red)"/>
      <text x="452" y="148" fill="#71717A" fontSize="9" textAnchor="middle">No</text>

      {/* Yes label */}
      <text x="362" y="192" fill="#71717A" fontSize="9">Yes</text>

      {/* Show Error → back up to Enter Email via left loop */}
      <path d="M 510 155 L 475 155 L 475 94 L 425 94"
        fill="none" stroke="rgba(239,68,68,0.4)" strokeWidth="1.5" strokeDasharray="3 2" markerEnd="url(#arr-red)"/>
    </svg>
  )
}

function C4SVG() {
  return (
    <svg width="100%" height="100%" viewBox="0 0 700 290" preserveAspectRatio="xMidYMid meet"
      style={{ fontFamily: 'Inter,sans-serif' }}>
      <defs>
        <marker id="c4arr" markerWidth="5" markerHeight="5" refX="3" refY="2.5" orient="auto">
          <path d="M0,0 L0,5 L5,2.5 z" fill="rgba(99,102,241,0.5)"/>
        </marker>
      </defs>

      {/* User — stick figure */}
      <circle cx="80" cy="50" r="18" fill="rgba(99,102,241,0.15)" stroke="rgba(99,102,241,0.5)" strokeWidth="1.5"/>
      <line x1="80"  y1="68"  x2="80"  y2="110" stroke="rgba(99,102,241,0.5)" strokeWidth="1.5"/>
      <line x1="50"  y1="85"  x2="110" y2="85"  stroke="rgba(99,102,241,0.5)" strokeWidth="1.5"/>
      <line x1="80"  y1="110" x2="55"  y2="140" stroke="rgba(99,102,241,0.5)" strokeWidth="1.5"/>
      <line x1="80"  y1="110" x2="105" y2="140" stroke="rgba(99,102,241,0.5)" strokeWidth="1.5"/>
      <text x="80" y="160" fill="#818CF8" fontSize="10" fontWeight="600" textAnchor="middle">User</text>

      {/* System boundary (dashed) */}
      <rect x="160" y="20" width="320" height="250" rx="6"
        fill="rgba(255,255,255,0.01)" stroke="rgba(255,255,255,0.10)"
        strokeWidth="1" strokeDasharray="6 3"/>
      <text x="170" y="38" fill="#3F3F46" fontSize="10">Food Delivery System</text>

      {/* Internal containers */}
      {/* Mobile App */}
      <rect x="180" y="50" width="130" height="55" rx="8" fill="rgba(99,102,241,0.18)" stroke="rgba(99,102,241,0.5)" strokeWidth="1.5"/>
      <text x="245" y="74"  fill="#A5B4FC" fontSize="10" fontWeight="600" textAnchor="middle">Mobile App</text>
      <text x="245" y="90"  fill="#52525B" fontSize="9"  textAnchor="middle" fontStyle="italic">[React Native]</text>

      {/* Node.js API */}
      <rect x="230" y="130" width="130" height="55" rx="8" fill="rgba(99,102,241,0.18)" stroke="rgba(99,102,241,0.5)" strokeWidth="1.5"/>
      <text x="295" y="154" fill="#A5B4FC" fontSize="10" fontWeight="600" textAnchor="middle">Node.js API</text>
      <text x="295" y="170" fill="#52525B" fontSize="9"  textAnchor="middle" fontStyle="italic">[Node.js]</text>

      {/* PostgreSQL */}
      <rect x="180" y="210" width="130" height="55" rx="8" fill="rgba(59,130,246,0.18)" stroke="rgba(59,130,246,0.5)" strokeWidth="1.5"/>
      <text x="245" y="234" fill="#93C5FD" fontSize="10" fontWeight="600" textAnchor="middle">PostgreSQL</text>
      <text x="245" y="250" fill="#52525B" fontSize="9"  textAnchor="middle" fontStyle="italic">[Database]</text>

      {/* External systems */}
      {/* Stripe */}
      <rect x="540" y="70" width="120" height="50" rx="8" fill="rgba(100,116,139,0.12)" stroke="rgba(100,116,139,0.35)" strokeWidth="1"/>
      <text x="600" y="92"  fill="#94A3B8" fontSize="10" fontWeight="600" textAnchor="middle">Stripe</text>
      <text x="600" y="107" fill="#52525B" fontSize="9"  textAnchor="middle" fontStyle="italic">[Payment]</text>

      {/* SMS Service */}
      <rect x="540" y="170" width="120" height="50" rx="8" fill="rgba(100,116,139,0.12)" stroke="rgba(100,116,139,0.35)" strokeWidth="1"/>
      <text x="600" y="192" fill="#94A3B8" fontSize="10" fontWeight="600" textAnchor="middle">SMS Service</text>
      <text x="600" y="207" fill="#52525B" fontSize="9"  textAnchor="middle" fontStyle="italic">[Twilio]</text>

      {/* Connection lines */}
      <line x1="105" y1="90"  x2="180" y2="77"  stroke="rgba(99,102,241,0.3)" strokeWidth="1" strokeDasharray="4 3" markerEnd="url(#c4arr)"/>
      <line x1="245" y1="105" x2="265" y2="130" stroke="rgba(99,102,241,0.3)" strokeWidth="1" strokeDasharray="4 3" markerEnd="url(#c4arr)"/>
      <line x1="265" y1="185" x2="245" y2="210" stroke="rgba(99,102,241,0.3)" strokeWidth="1" strokeDasharray="4 3" markerEnd="url(#c4arr)"/>
      <line x1="360" y1="157" x2="540" y2="95"  stroke="rgba(99,102,241,0.3)" strokeWidth="1" strokeDasharray="4 3" markerEnd="url(#c4arr)"/>
      <line x1="360" y1="165" x2="540" y2="195" stroke="rgba(99,102,241,0.3)" strokeWidth="1" strokeDasharray="4 3" markerEnd="url(#c4arr)"/>
    </svg>
  )
}

function ApiLensSVG() {
  return (
    <svg width="100%" height="100%" viewBox="0 0 700 290" preserveAspectRatio="xMidYMid meet"
      style={{ fontFamily: 'Inter,sans-serif' }}>
      {/* Left panel — API Documentation */}
      <rect x="20" y="20" width="295" height="255" rx="8" fill="rgba(255,255,255,0.02)" stroke="rgba(255,255,255,0.07)" strokeWidth="1"/>
      <rect x="20" y="20" width="295" height="32" rx="8" fill="rgba(255,255,255,0.05)"/>
      <text x="34" y="40" fill="#71717A" fontSize="10" fontWeight="500">API Documentation</text>

      {[
        { method: 'POST', path: '/auth/login',      mc: '#3B82F6', mb: 'rgba(59,130,246,0.2)',  y: 60  },
        { method: 'GET',  path: '/users/me',         mc: '#22C55E', mb: 'rgba(34,197,94,0.2)',   y: 100 },
        { method: 'POST', path: '/payment/init',     mc: '#3B82F6', mb: 'rgba(59,130,246,0.2)',  y: 140 },
        { method: 'GET',  path: '/wallet/balance',   mc: '#22C55E', mb: 'rgba(34,197,94,0.2)',   y: 180 },
        { method: 'DEL',  path: '/users/{id}',       mc: '#EF4444', mb: 'rgba(239,68,68,0.2)',   y: 220 },
      ].map((ep, i) => (
        <g key={i}>
          {i === 0 && <rect x="20" y={ep.y-2} width="295" height="36" fill="rgba(99,102,241,0.07)" stroke="rgba(99,102,241,0.15)" strokeWidth="1"/>}
          <rect x="32" y={ep.y+8} width="32" height="15" rx="3" fill={ep.mb}/>
          <text x="48" y={ep.y+20} fill={ep.mc} fontSize="8" fontFamily="JetBrains Mono,monospace" fontWeight="700" textAnchor="middle">{ep.method}</text>
          <text x="70" y={ep.y+20} fill="#94A3B8" fontSize="10" fontFamily="JetBrains Mono,monospace">{ep.path}</text>
        </g>
      ))}

      {/* Right panel — Architecture */}
      <rect x="385" y="20" width="295" height="255" rx="8" fill="rgba(255,255,255,0.02)" stroke="rgba(255,255,255,0.07)" strokeWidth="1"/>
      <rect x="385" y="20" width="295" height="32" rx="8" fill="rgba(255,255,255,0.05)"/>
      <text x="399" y="40" fill="#71717A" fontSize="10" fontWeight="500">Architecture</text>

      {[
        { x: 410, y: 60,  label: 'Auth\nService',    color: '#6366F1' },
        { x: 510, y: 148, label: 'Payment\nService', color: '#22C55E' },
        { x: 410, y: 215, label: 'User\nService',    color: '#A78BFA' },
      ].map((svc, i) => (
        <g key={i}>
          <rect x={svc.x} y={svc.y} width="100" height="52" rx="8" fill={`${svc.color}18`} stroke={`${svc.color}50`} strokeWidth="1.5"/>
          {svc.label.split('\n').map((line, li) => (
            <text key={li} x={svc.x+50} y={svc.y+22+li*16} fill={svc.color} fontSize="10" fontWeight="600" textAnchor="middle">{line}</text>
          ))}
        </g>
      ))}

      <line x1="460" y1="112" x2="510" y2="148" stroke="rgba(99,102,241,0.3)" strokeWidth="1" strokeDasharray="4 3"/>
      <line x1="510" y1="200" x2="460" y2="215" stroke="rgba(99,102,241,0.3)" strokeWidth="1" strokeDasharray="4 3"/>
      <line x1="315" y1="80"  x2="410" y2="82"  stroke="#6366F1" strokeWidth="1.5" strokeDasharray="5 3"/>
    </svg>
  )
}
