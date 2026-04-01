import './globals.css'

export const metadata = {
  title: 'AI Guardian Assistant: Project Labyrinth',
  description:
    'A zero-trust defensive simulation with dynamic access decisions, a privacy-preserving vault, and The Labyrinth deception layer.',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
