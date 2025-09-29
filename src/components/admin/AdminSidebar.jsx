import React from 'react'
import { Card, CardContent } from '../ui/card'
import { Button } from '../ui/button'
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
    <Card className="h-full border border-gray-200/30">
      <CardContent className="p-4">
        <div className="space-y-2">
          <h3 className="text-lg font-semibold mb-4 text-[#111d29]">Admin Panel</h3>
          {menuItems.map((item) => {
            const Icon = item.icon
            return (
              <Button
                key={item.id}
                variant="ghost"
                className={`w-full justify-start ${
                  activeTab === item.id
                    ? 'bg-[#111d29] text-white hover:bg-[#1a2936] hover:text-white'
                    : 'hover:bg-gray-100 text-gray-700'
                }`}
                onClick={() => onTabChange(item.id)}
              >
                <Icon className="mr-2 h-4 w-4" />
                {item.label}
              </Button>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
} 