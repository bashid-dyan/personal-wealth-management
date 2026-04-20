'use client'

import dynamic from 'next/dynamic'

// SSR-safe wrapper: Leaflet touches `window` on import, so we only load it
// on the client.
const LeafletMap = dynamic(() => import('./leaflet-map'), {
  ssr: false,
  loading: () => (
    <div
      className="w-full rounded-lg border flex items-center justify-center text-xs"
      style={{
        height: 240,
        background: 'var(--surface-2)',
        borderColor: 'var(--border-soft)',
        color: 'var(--ink-soft)',
      }}
    >
      Memuat peta…
    </div>
  ),
})

export { LeafletMap }
