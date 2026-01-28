import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import * as Sentry from '@sentry/react'
import { BrowserTracing } from '@sentry/tracing'

Sentry.init({
  dsn: "https://5bfe894c010d3ebb856cd227f44d4a4b@o4510786071101440.ingest.us.sentry.io/4510786089779200", // Your actual DSN
  integrations: [new BrowserTracing()],
  tracesSampleRate: 1.0, // Capture 100% of transactions for performance monitoring
  environment: import.meta.env.MODE, // 'development' or 'production'
  release: `reef-tank-designer@${import.meta.env.PACKAGE_VERSION || 'unknown'}`, // Set your release version
})

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Sentry.withErrorBoundary fallback={<p>An error has occurred</p>}>
      <App />
    </Sentry.withErrorBoundary>
  </StrictMode>,
)
