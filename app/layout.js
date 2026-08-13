import './globals.css'

export const metadata = {
  title: 'Project Labyrinth v0.2.0 | Zero-Trust Detection Lab',
  description:
    'An explainable zero-trust detection and response simulation with defensive deception, alert triage, and tamper-evident audit evidence.',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
