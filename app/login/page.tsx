"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/contexts/auth-context"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import Link from "next/link"
import { useToast } from "@/components/ui/use-toast"

export default function LoginPage() {
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const { login } = useAuth()
  const { toast } = useToast()
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!username || !password) {
      toast({
        title: "Error",
        description: "Please enter both username and password",
        variant: "destructive"
      })
      return
    }
    
    setIsLoading(true)
    
    try {
      const result = await login(username, password)
      
      if (result.success) {
        toast({
          title: "Success",
          description: "You have been logged in successfully",
        })
      } else {
        toast({
          title: "Login failed",
          description: result.message || "Invalid username or password",
          variant: "destructive"
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "An error occurred during login",
        variant: "destructive"
      })
    } finally {
      setIsLoading(false)
    }
  }
  
  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-b from-blue-50 to-purple-50 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-center">Login</CardTitle>
          <CardDescription className="text-center">
            Enter your credentials to access your account
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="username">Username or Email</Label>
              <Input 
                id="username" 
                placeholder="Enter your username or email" 
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                disabled={isLoading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input 
                id="password" 
                type="password" 
                placeholder="Enter your password" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={isLoading}
              />
            </div>
            <div className="text-sm text-muted-foreground">
              <p>Test Accounts:</p>
              <ul className="list-disc pl-5 mt-1">
                <li>Username: testuser, Password: password123</li>
                <li>Username: student, Password: letmein</li>
              </ul>
            </div>
          </CardContent>
          <CardFooter className="flex flex-col space-y-2">
            <Button 
              type="submit" 
              className="w-full" 
              disabled={isLoading}
            >
              {isLoading ? "Logging in..." : "Login"}
            </Button>
            <div className="text-center text-sm">
              Don't have an account?{" "}
              <Link href="/register" className="text-primary hover:underline">
                Register
              </Link>
            </div>
          </CardFooter>
        </form>
      </Card>
    </div>
  )
} 