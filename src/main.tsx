import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import './index.css'
import FilterPage, { regionsAction, regionsLoader } from './FilterPage'

const router = createBrowserRouter([
  {
    path: '/',
    loader: regionsLoader,
    action: regionsAction,
    element: <FilterPage />,
  },
])

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <RouterProvider router={router} />
  </StrictMode>,
)
