import React from 'react'
import { 
  ClipboardList, 
  Users, 
  Activity,
  UserCircle,
  Clock
} from 'lucide-react'

export function AdminSidebar({ activeTab, onTabChange }) {
  const menuItems = [
    {
      id: 'activity',
      label: 'Activity Logs',
      icon: Activity
    },
    {
      id: 'tasks',
      label: 'Task Management', 
      icon: ClipboardList
    },
    {
      id: 'time-tracking',
      label: 'Time Tracking',
      icon: Clock
    },
    {
      id: 'users',
      label: 'User Management',
      icon: Users
    },
    {
      id: 'profile',
      label: 'Profile',
      icon: UserCircle
    }
  ]

  return (
    <div className="fixed left-0 top-0 h-screen w-16 bg-[#111d29] flex flex-col items-center z-50">
      <nav className="space-y-4 flex-1 pt-[1.125rem]">
        {menuItems.map((item) => {
          const Icon = item.icon
          return (
            <button
              key={item.id}
              onClick={() => onTabChange(item.id)}
              title={item.label}
              className={`w-12 h-12 flex items-center justify-center rounded-lg transition-all ${
                activeTab === item.id
                  ? 'bg-white text-[#111d29]'
                  : 'text-gray-300 hover:bg-[#1a2936] hover:text-white'
              }`}
            >
              <Icon className="h-5 w-5" />
            </button>
          )
        })}
      </nav>
    </div>
  )
} 