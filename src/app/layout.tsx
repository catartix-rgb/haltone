import type { Metadata, Viewport } from 'next'
import '@/styles/globals.css'

export const metadata: Metadata = {
  title: 'Halftone Studio — Generative print tools for designers',
  description:
    'Turn any image into editable halftone, ASCII or dither artwork. Export crisp SVG for Illustrator and Photoshop, or PNG up to 8K.',
  openGraph: {
    title: 'Halftone Studio',
    description: 'Generative print tools for designers',
  },
  icons: {
    icon: '/favicon.svg',
  },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  themeColor: '#dff5f4',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <head>
        {/* Type — Instrument Serif (display), Geist (sans), JetBrains Mono */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=Geist:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;500;600&display=swap"
          rel="stylesheet"
        />
        <style>{`
          :root {
            --font-display: 'Instrument Serif', serif;
            --font-sans: 'Geist', system-ui, sans-serif;
            --font-mono: 'JetBrains Mono', ui-monospace, monospace;
          }
        `}</style>
      </head>
      <body>{children}</body>
    </html>
  )
}
