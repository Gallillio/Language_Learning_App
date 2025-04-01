"use client"

import Link from "next/link"
import { useAuth } from "@/contexts/auth-context"
import { useWordBank } from "@/contexts/word-bank-context"
import { Button } from "@/components/ui/button"
import { LogOut, LogIn, User, BookOpen } from "lucide-react"

export default function Navbar() {
  const { user, isAuthenticated, logout } = useAuth()
  const { learningWords, learnedWords } = useWordBank()
  
  const totalWords = learningWords.length + learnedWords.length
  
  return (
    <nav className="border-b bg-background">
      <div className="container flex items-center justify-between h-16 px-4 mx-auto">
        <div className="flex items-center">
          <Link href="/" className="text-xl font-bold text-primary">
            Language Learning App
          </Link>
        </div>
        
        <div className="flex items-center gap-4">
          {isAuthenticated ? (
            <>
              <div className="flex items-center mr-2">
                <User className="w-4 h-4 mr-1" />
                <span>{user?.username}</span>
              </div>
              <div className="flex items-center mr-2 text-sm text-muted-foreground">
                <BookOpen className="w-4 h-4 mr-1" />
                <span>{totalWords} words</span>
              </div>
              <Button variant="outline" size="sm" onClick={logout} className="flex items-center gap-1">
                <LogOut className="w-4 h-4" />
                <span>Logout</span>
              </Button>
            </>
          ) : (
            <Link href="/login">
              <Button variant="outline" size="sm" className="flex items-center gap-1">
                <LogIn className="w-4 h-4" />
                <span>Login</span>
              </Button>
            </Link>
          )}
        </div>
      </div>
    </nav>
  )
} 