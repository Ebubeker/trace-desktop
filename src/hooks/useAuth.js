import { useState, useEffect, createContext, useContext } from 'react'
import { supabase } from '../lib/supabase'

const AuthContext = createContext({})

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [userProfile, setUserProfile] = useState(null)
  const [session, setSession] = useState(null)
  const [loading, setLoading] = useState(true)

  const fetchUserProfile = async (userId) => {
    try {
      console.log('Fetching user profile for userId:', userId)
      
      // Add timeout to prevent hanging
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Profile fetch timeout')), 5000)
      )
      
      const fetchPromise = supabase
        .from('user_profiles')
        .select('*')
        .eq('id', userId)
        .single()

      const { data, error } = await Promise.race([fetchPromise, timeoutPromise])

      if (error) {
        console.error('Error fetching user profile:', error)
        // If user profile doesn't exist, create a default one
        if (error.code === 'PGRST116') {
          console.log('User profile not found, creating default profile')
          return {
            id: userId,
            name: 'User',
            role: 'user',
            org_id: null,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }
        }
        return null
      }

      console.log('User profile fetched successfully:', data)
      return data
    } catch (error) {
      console.error('Error fetching user profile:', error)
      if (error.message === 'Profile fetch timeout') {
        console.log('Profile fetch timed out, using default profile')
        return {
          id: userId,
          name: 'User',
          role: 'user',
          org_id: null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
      }
      return null
    }
  }

  useEffect(() => {
    let isMounted = true
    
    // Get initial session with timeout
    const initializeAuth = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession()
        
        if (!isMounted) return
        
        if (error) {
          console.error('Error getting session:', error)
          setLoading(false)
          return
        }
        
        setSession(session)
        setUser(session?.user ?? null)
        
        if (session?.user?.id) {
          try {
            const profile = await fetchUserProfile(session.user.id)
            if (isMounted) {
              setUserProfile(profile)
            }
          } catch (error) {
            console.error('Error in profile fetch during initialization:', error)
            if (isMounted) {
              // Set a default profile if fetch fails
              setUserProfile({
                id: session.user.id,
                name: session.user.email?.split('@')[0] || 'User',
                role: 'user',
                org_id: null,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
              })
            }
          }
        }
        
        if (isMounted) {
          setLoading(false)
        }
      } catch (error) {
        console.error('Error initializing auth:', error)
        if (isMounted) {
          setLoading(false)
        }
      }
    }

    initializeAuth()

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!isMounted) return
      
      console.log('Auth state changed:', event)
      setSession(session)
      setUser(session?.user ?? null)
      
      // Only fetch profile if signing in or user token refreshed
      // Skip profile fetch on sign out to prevent hanging
      if (session?.user?.id && event !== 'SIGNED_OUT') {
        try {
          const profile = await fetchUserProfile(session.user.id)
          if (isMounted) {
            setUserProfile(profile)
          }
        } catch (error) {
          console.error('Error fetching profile on auth change:', error)
          if (isMounted) {
            // Set a default profile if fetch fails
            setUserProfile({
              id: session.user.id,
              name: session.user.email?.split('@')[0] || 'User',
              role: 'user',
              org_id: null,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            })
          }
        }
      } else {
        setUserProfile(null)
      }
      
      if (isMounted) {
        setLoading(false)
      }
    })

    return () => {
      isMounted = false
      subscription.unsubscribe()
    }
  }, [])

  const signUp = async (email, password) => {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
      })
      if (error) throw error
      return { data, error: null }
    } catch (error) {
      return { data: null, error: error.message }
    }
  }

  const signIn = async (email, password) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })
      if (error) throw error
      return { data, error: null }
    } catch (error) {
      return { data: null, error: error.message }
    }
  }

  const signOut = async () => {
    try {
      // Add timeout to prevent hanging
      const signOutPromise = supabase.auth.signOut()
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Sign out timeout')), 5000)
      )
      
      const { error } = await Promise.race([signOutPromise, timeoutPromise])
        .catch((err) => {
          console.warn('Sign out timeout or error, forcing local sign out:', err)
          // Force local sign out even if server request fails
          return { error: null }
        })
      
      if (error) {
        console.error('Sign out error:', error)
      }
      
      // Always clear local state regardless of server response
      setUser(null)
      setUserProfile(null)
      setSession(null)
      setLoading(false)
      
      return { error: error ? error.message : null }
    } catch (error) {
      console.error('Sign out error:', error)
      // Force local sign out on any error
      setUser(null)
      setUserProfile(null)
      setSession(null)
      setLoading(false)
      return { error: error.message }
    }
  }

  const value = {
    user,
    userProfile,
    session,
    loading,
    signUp,
    signIn,
    signOut,
    fetchUserProfile, // Expose this function if you need to refresh profile data
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}