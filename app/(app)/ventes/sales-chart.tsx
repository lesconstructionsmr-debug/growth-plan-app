'use client'

import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts'

export interface ChartRow {
  year: string
  'Soumissions envoyées': number
  Ventes: number
}

interface SalesChartProps {
  data: ChartRow[]
}

export default function SalesChart({ data }: SalesChartProps) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--line)" vertical={false} />
        <XAxis dataKey="year" stroke="var(--txt-3)" fontSize={10} tickLine={false} />
        <YAxis stroke="var(--txt-3)" fontSize={10} tickLine={false} axisLine={false} />
        <Tooltip contentStyle={{ background: '#1A1C23', borderColor: 'var(--line)', borderRadius: '8px', fontSize: '11px', color: '#fff' }} />
        <Legend wrapperStyle={{ fontSize: '10px', paddingTop: '10px' }} />
        <Bar dataKey="Soumissions envoyées" fill="#D4AF37" radius={[4, 4, 0, 0]} />
        <Bar dataKey="Ventes" fill="#6366F1" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  )
}
