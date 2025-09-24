'use client'

import { useState } from 'react'
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { 
  ChevronLeft, 
  ChevronRight, 
  Briefcase, 
  FileText, 
  Plus,
  Zap
} from "lucide-react"
import Link from 'next/link'
import { usePathname } from 'next/navigation'

interface SidebarProps {
  isCollapsed: boolean;
  onToggle: () => void;
}

export default function Sidebar({ isCollapsed, onToggle }: SidebarProps) {
  const pathname = usePathname()
  
  const navigation = [
    {
      name: 'My Jobs',
      href: '/',
      icon: Briefcase,
      current: pathname === '/',
      count: 12
    },
    {
      name: 'My Resumes',
      href: '/resumes',
      icon: FileText,
      current: pathname === '/resumes',
      count: 5
    }
  ]

  return (
    <div className={`bg-white border-r border-gray-200 transition-all duration-300 ${
      isCollapsed ? 'w-16' : 'w-64'
    } flex flex-col h-screen`}>
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          {!isCollapsed && (
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                <Zap className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-gray-900">ResumeForge</h1>
                <p className="text-xs text-gray-500">AI Resume Builder</p>
              </div>
            </div>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={onToggle}
            className="p-1.5"
          >
            {isCollapsed ? (
              <ChevronRight className="w-4 h-4" />
            ) : (
              <ChevronLeft className="w-4 h-4" />
            )}
          </Button>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-2">
        {navigation.map((item) => {
          const Icon = item.icon
          return (
            <Link key={item.name} href={item.href}>
              <div className={`flex items-center space-x-3 px-3 py-2.5 rounded-lg transition-colors ${
                item.current 
                  ? 'bg-blue-50 text-blue-700 border border-blue-200' 
                  : 'text-gray-700 hover:bg-gray-50'
              }`}>
                <Icon className="w-5 h-5" />
                {!isCollapsed && (
                  <>
                    <span className="font-medium flex-1">{item.name}</span>
                    <Badge variant="secondary" className="text-xs">
                      {item.count}
                    </Badge>
                  </>
                )}
              </div>
            </Link>
          )
        })}
      </nav>

      {/* Create New Resume Button */}
      <div className="p-4 border-t border-gray-200">
        <Link href="/create">
          <Button className={`w-full ${isCollapsed ? 'px-2' : ''}`}>
            <Plus className="w-4 h-4" />
            {!isCollapsed && <span className="ml-2">Create New Resume</span>}
          </Button>
        </Link>
      </div>
    </div>
  )
}
