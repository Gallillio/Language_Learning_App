"use client"

import Link from "next/link"
import { useState, useEffect, useRef } from "react"
import { useAuth } from "@/contexts/auth-context"
import { useWordBank } from "@/contexts/word-bank-context"
import { useStreak } from "@/hooks/useStreak"
import { Button } from "@/components/ui/button"
import { LogOut, LogIn, User, BookOpen, Flame, Menu, X, ChevronDown } from "lucide-react"
import { useOutsideClick } from "@/hooks/useOutsideClick"

export interface NavbarProps {
  isMobile: boolean;
  isMobileMenuOpen: boolean;
  setIsMobileMenuOpen: (isOpen: boolean) => void;
  activeTab: string;
  onTabChange: (tab: string) => void;
}

export default function Navbar({ 
  isMobile, 
  isMobileMenuOpen, 
  setIsMobileMenuOpen, 
  activeTab, 
  onTabChange 
}: NavbarProps) {
  const { user, isAuthenticated, logout } = useAuth()
  const { streakCount } = useStreak()
  const { learningWords, learnedWords } = useWordBank()
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false)
  
  const userMenuRef = useRef<HTMLDivElement>(null)
  
  // Calculate total words
  const totalWords = learningWords.length + learnedWords.length
  
  // Handle outside click for user menu
  useOutsideClick(userMenuRef, () => {
    if (isUserMenuOpen) setIsUserMenuOpen(false)
  })
  
  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen)
  }
  
  const toggleUserMenu = () => {
    setIsUserMenuOpen(!isUserMenuOpen)
  }
  
  return (
    <nav className="bg-white shadow-md py-4">
      <div className="container mx-auto px-4 flex justify-between items-center">
        <div className="flex items-center">
          <Link href="/" className="text-3xl font-bold text-primary">
            Language Buddy
          </Link>
        </div>
        
        <div className="flex items-center gap-4">
          {!isMobile && isAuthenticated && (
            <>
              <div className="flex items-center gap-1 bg-amber-50 text-amber-600 px-3 py-1 rounded-full">
                <Flame className="h-5 w-5 text-amber-500 fill-amber-500" />
                <span className="font-bold">{streakCount}</span>
                <span className="text-xs hidden sm:inline">
                  {streakCount === 1 ? 'day' : 'days'}
                </span>
              </div>
              <div 
                className="flex items-center mr-2 text-sm text-muted-foreground hover:text-primary cursor-pointer" 
                onClick={() => onTabChange("wordbank")}
              >
                <BookOpen className="w-4 h-4 mr-1" />
                <span>{totalWords} words</span>
              </div>
              <div className="relative" ref={userMenuRef}>
                <div 
                  className="flex items-center cursor-pointer hover:text-primary py-1 px-2 rounded-md hover:bg-gray-100"
                  onClick={toggleUserMenu}
                >
                  <User className="w-4 h-4 mr-1" />
                  <span>{user?.username}</span>
                  <ChevronDown className="w-4 h-4 ml-1" />
                </div>
                
                {isUserMenuOpen && (
                  <div className="absolute right-0 mt-1 w-48 bg-white rounded-md shadow-lg z-50 py-1 border">
                    <div className="px-4 py-2 border-b">
                      <p className="text-sm font-medium">{user?.username}</p>
                    </div>
                    <button 
                      onClick={logout}
                      className="flex w-full items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                      <LogOut className="w-4 h-4 mr-2" />
                      Logout
                    </button>
                  </div>
                )}
              </div>
            </>
          )}
          
          {!isMobile && !isAuthenticated && (
            <Link href="/login">
              <Button variant="outline" size="sm" className="flex items-center gap-1">
                <LogIn className="w-4 h-4" />
                <span>Login</span>
              </Button>
            </Link>
          )}
          
          {/* Mobile streak counter + menu button */}
          {isMobile && (
            <div className="flex items-center gap-3">
              {isAuthenticated && (
                <>
                  <div className="flex items-center gap-1 bg-amber-50 text-amber-600 px-3 py-1 rounded-full">
                    <Flame className="h-5 w-5 text-amber-500 fill-amber-500" />
                    <span className="font-bold">{streakCount}</span>
                    <span className="text-xs hidden sm:inline">
                      {streakCount === 1 ? 'day' : 'days'}
                    </span>
                  </div>
                  <div 
                    className="flex items-center gap-1 text-sm text-muted-foreground hover:text-primary cursor-pointer" 
                    onClick={() => onTabChange("wordbank")}
                  >
                    <BookOpen className="w-4 h-4" />
                    <span>{totalWords}</span>
                  </div>
                </>
              )}
              <Button
                variant="ghost"
                size="icon"
                onClick={toggleMobileMenu}
                aria-label="Toggle menu"
              >
                {isMobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
              </Button>
            </div>
          )}
        </div>
      </div>
      
      {/* Mobile Navigation */}
      {isMobile && isMobileMenuOpen && (
        <div className="fixed inset-0 bg-white z-50 pt-20">
          <div className="container mx-auto px-4 flex flex-col gap-4">
            {/* User info section */}
            {isAuthenticated && (
              <div className="flex flex-col items-start gap-3 pb-4 mb-4 border-b">
                <div className="flex items-center gap-2">
                  <User className="w-5 h-5" />
                  <span className="text-lg font-medium">{user?.username}</span>
                </div>
                <Button variant="outline" size="sm" onClick={logout} className="flex items-center gap-1 mt-2">
                  <LogOut className="w-4 h-4" />
                  <span>Logout</span>
                </Button>
              </div>
            )}
            
            {!isAuthenticated && (
              <div className="pb-4 mb-4 border-b">
                <Link href="/login">
                  <Button variant="outline" className="flex items-center gap-1 w-full justify-center">
                    <LogIn className="w-4 h-4" />
                    <span>Login</span>
                  </Button>
                </Link>
              </div>
            )}
            
            {/* Navigation section */}
            <Button
              variant={activeTab === "game" ? "default" : "ghost"}
              onClick={() => onTabChange("game")}
              className="w-full justify-start text-lg py-4"
            >
              Game Mode
            </Button>
            <Button
              variant={activeTab === "reading" ? "default" : "ghost"}
              onClick={() => onTabChange("reading")}
              className="w-full justify-start text-lg py-4"
            >
              Reading Mode
            </Button>
            <Button
              variant={activeTab === "flashcards" ? "default" : "ghost"}
              onClick={() => onTabChange("flashcards")}
              className="w-full justify-start text-lg py-4"
            >
              Flash Cards
            </Button>
            <Button
              variant={activeTab === "wordbank" ? "default" : "ghost"}
              onClick={() => onTabChange("wordbank")}
              className="w-full justify-start text-lg py-4"
            >
              Word Bank
            </Button>
            <Button
              variant={activeTab === "addwords" ? "default" : "ghost"}
              onClick={() => onTabChange("addwords")}
              className="w-full justify-start text-lg py-4"
            >
              Add New Words
            </Button>
          </div>
        </div>
      )}
    </nav>
  )
} 