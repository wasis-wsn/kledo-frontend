import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import './index.css'
import { regionsLoader } from './routes/region-data'
import FilterPage from './FilterPage'

const router = createBrowserRouter([
  {
    path: '/',
    loader: regionsLoader,
    element: <FilterPage />,
  },
])

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <RouterProvider router={router} />
  </StrictMode>,
)
