import React, { useState } from 'react'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card'
import { useAuth } from '../../hooks/useAuth'

export function AuthForm() {
  const [loading, setLoading] = useState(false)
  const [isSignUp, setIsSignUp] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [message, setMessage] = useState('')
  const { signIn, signUp } = useAuth()

  const handleAuth = async (e) => {
    e.preventDefault()
    setLoading(true)
    setMessage('')

    try {
      const { error } = isSignUp 
        ? await signUp(email, password)
        : await signIn(email, password)

      if (error) {
        setMessage(error)
      } else if (isSignUp) {
        setMessage('Check your email for the confirmation link!')
      }
    } catch (error) {
      setMessage('An unexpected error occurred')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card className="w-full max-w-md border border-gray-200/30">
      <CardHeader className="text-center">
        <CardTitle className="text-2xl font-semibold text-[#111d29] mb-2">
          {isSignUp ? 'Create Account' : 'Welcome Back'}
        </CardTitle>
        <CardDescription className="text-gray-600">
          {isSignUp 
            ? 'Create a new account to get started' 
            : 'Sign in to your account'
          }
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <form onSubmit={handleAuth} className="space-y-4">
          <div className="space-y-4">
            <div>
              <Input
                type="email"
                placeholder="Your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="border-gray-200/50 focus:border-[#111d29] focus:ring-[#111d29]/20"
              />
            </div>
            <div>
              <Input
                type="password"
                placeholder="Your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="border-gray-200/50 focus:border-[#111d29] focus:ring-[#111d29]/20"
              />
            </div>
          </div>
          <Button 
            type="submit" 
            className="w-full bg-[#111d29] hover:bg-[#1a2936] text-white border-none py-2.5"
            disabled={loading}
          >
            {loading ? 'Please wait...' : (isSignUp ? 'Create Account' : 'Sign In')}
          </Button>
          {message && (
            <div className={`text-sm p-3 rounded-lg ${
              message.includes('email') 
                ? 'text-green-700 bg-green-50 border border-green-200/50' 
                : 'text-red-700 bg-red-50 border border-red-200/50'
            }`}>
              {message}
            </div>
          )}
        </form>
        <div className="text-center border-t pt-6">
          <button
            type="button"
            className="text-sm text-[#111d29] hover:underline font-medium"
            onClick={() => setIsSignUp(!isSignUp)}
          >
            {isSignUp ? 'Already have an account? Sign in' : "Don't have an account? Sign up"}
          </button>
        </div>
      </CardContent>
    </Card>
  )
}