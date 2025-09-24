'use client'

import { useState, useEffect } from 'react'
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { userStorage, userService, User as UserType } from '@/services/userService'
import { 
  Bell,
  Search,
  Settings,
  User,
  LogOut
} from "lucide-react"

export default function Header() {
  const [currentUser, setCurrentUser] = useState<UserType | null>(null)

  useEffect(() => {
    // Load user data if available
    const userData = userStorage.getUserData()
    if (userData) {
      setCurrentUser(userData)
    }
  }, [])

  const handleLogout = () => {
    userStorage.clearCurrentUser()
    setCurrentUser(null)
    window.location.reload()
  }
  return (
    <header className="bg-white border-b border-gray-200 px-6 py-4">
      <div className="flex items-center justify-between">
        {/* Search */}
        <div className="flex-1 max-w-lg">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search jobs, companies, or resumes..."
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* Right side */}
        <div className="flex items-center space-x-4">
          {/* Stats */}
          <div className="hidden md:flex items-center space-x-4 text-sm">
            <div className="flex items-center space-x-1">
              <span className="text-gray-500">Applications:</span>
              <Badge variant="outline">12</Badge>
            </div>
            <div className="flex items-center space-x-1">
              <span className="text-gray-500">Interviews:</span>
              <Badge variant="default">3</Badge>
            </div>
            <div className="flex items-center space-x-1">
              <span className="text-gray-500">Match Rate:</span>
              <Badge variant="secondary">78%</Badge>
            </div>
          </div>

          {/* Notifications */}
          <Button variant="ghost" size="sm" className="relative">
            <Bell className="w-4 h-4" />
            <Badge className="absolute -top-1 -right-1 w-2 h-2 p-0 bg-red-500">
              <span className="sr-only">New notifications</span>
            </Badge>
          </Button>

          {/* Settings */}
          <Button variant="ghost" size="sm">
            <Settings className="w-4 h-4" />
          </Button>

          {/* User Profile */}
          {currentUser ? (
            <div className="flex items-center space-x-2">
              <div className="text-right text-sm">
                <div className="font-medium text-gray-900">
                  {currentUser.first_name && currentUser.last_name 
                    ? `${currentUser.first_name} ${currentUser.last_name}`
                    : currentUser.email
                  }
                </div>
                <div className="text-gray-500 capitalize">
                  {currentUser.subscription_tier} Plan
                </div>
              </div>
              <Button variant="ghost" size="sm">
                <User className="w-4 h-4" />
              </Button>
              <Button variant="ghost" size="sm" onClick={handleLogout}>
                <LogOut className="w-4 h-4" />
              </Button>
            </div>
          ) : (
            <Button variant="ghost" size="sm">
              <User className="w-4 h-4" />
            </Button>
          )}
        </div>
      </div>
    </header>
  )
}
