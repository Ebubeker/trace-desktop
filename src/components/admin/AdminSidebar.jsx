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
    <Card className="h-full">
      <CardContent className="p-4">
        <div className="space-y-2">
          <h3 className="text-lg font-semibold mb-4">Admin Panel</h3>
          {menuItems.map((item) => {
            const Icon = item.icon
            return (
              <Button
                key={item.id}
                variant={activeTab === item.id ? "default" : "ghost"}
                className="w-full justify-start"
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