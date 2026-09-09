import { NavLink } from 'react-router-dom'
import { Video } from 'lucide-react'

export default function HeaderCreateVideo({ activeTab }) {
  return (
    <header className="flex h-14 w-full shrink-0 items-center justify-between border-b border-gray-200 bg-white px-6 font-medium">
      <div className="flex items-center gap-8">
        <div className="flex items-center gap-2">
          <Video className="h-5 w-5 text-blue-600" />
          <span className="text-base font-black tracking-wide text-gray-900">
            VIDEO GENERATION
          </span>
        </div>

        <nav className="hidden items-center gap-6 md:flex">
          <NavLink
            to="/create-video-ai"
            className={({ isActive }) =>
              isActive || activeTab === 'video'
                ? 'text-sm font-bold text-blue-600 transition-all hover:text-blue-700'
                : 'text-sm text-gray-500 transition-all hover:text-blue-600'
            }
          >
            Video
          </NavLink>

          <NavLink
            to="/create-video-motion-control"
            className={({ isActive }) =>
              isActive || activeTab === 'motion-control'
                ? 'text-sm font-bold text-blue-600 transition-all hover:text-blue-700'
                : 'text-sm text-gray-500 transition-all hover:text-blue-600'
            }
          >
            Motion Control
          </NavLink>
        </nav>
      </div>
    </header>
  )
}