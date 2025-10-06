// import { useState, useEffect, useRef, createContext, useContext } from 'react'
// import { supabase } from '../lib/supabase'

// const AuthContext = createContext({})

// export const useAuth = () => {
//   const context = useContext(AuthContext)
//   if (context === undefined) {
//     throw new Error('useAuth must be used within an AuthProvider')
//   }
//   return context
// }

// export const AuthProvider = ({ children }) => {
//   const [user, setUser] = useState(null)
//   const [userProfile, setUserProfile] = useState(null)
//   const [session, setSession] = useState(null)
//   const [loading, setLoading] = useState(true)
//   const userProfileRef = useRef(null)

//   // Keep ref in sync with state
//   useEffect(() => {
//     userProfileRef.current = userProfile
//   }, [userProfile])

//   const fetchUserProfile = async (userId, retryCount = 0) => {
//     try {
//       const timeoutPromise = new Promise((_, reject) => 
//         setTimeout(() => reject(new Error('Profile fetch timeout')), 8000)
//       )
      
//       const fetchPromise = supabase
//         .from('user_profiles')
//         .select('*')
//         .eq('id', userId)
//         .single()

//       const { data, error } = await Promise.race([fetchPromise, timeoutPromise])

//       if (error) {
//         console.error('Error fetching user profile:', error)
//         // If user profile doesn't exist, don't create a default one
//         // Let the app handle the missing profile gracefully
//         if (error.code === 'PGRST116') {
//           console.log('User profile not found in database')
//           return null
//         }
        
//         // If it's a network error and we haven't retried too many times, retry
//         if (retryCount < 2 && (error.message.includes('fetch') || error.message.includes('network'))) {
//           console.log(`Retrying profile fetch (attempt ${retryCount + 2})`)
//           await new Promise(resolve => setTimeout(resolve, 1000 * (retryCount + 1)))
//           return fetchUserProfile(userId, retryCount + 1)
//         }
        
//         return null
//       }

//       console.log('User profile fetched successfully:', data)
//       return data
//     } catch (error) {
//       console.error('Error fetching user profile:', error)
//       if (error.message === 'Profile fetch timeout') {
//         console.log('Profile fetch timed out')
//         // Retry once more on timeout
//         if (retryCount < 1) {
//           console.log('Retrying profile fetch after timeout')
//           await new Promise(resolve => setTimeout(resolve, 2000))
//           return fetchUserProfile(userId, retryCount + 1)
//         }
//       }
//       return null
//     }
//   }

//   useEffect(() => {
//     let isMounted = true
    
//     // Get initial session with timeout
//     const initializeAuth = async () => {
//       try {
//         const { data: { session }, error } = await supabase.auth.getSession()
        
//         if (!isMounted) return
        
//         if (error) {
//           console.error('Error getting session:', error)
//           setLoading(false)
//           return
//         }
        
//         setSession(session)
//         setUser(session?.user ?? null)
        
//         if (session?.user?.id) {
//           try {
//             const profile = await fetchUserProfile(session.user.id)
//             if (isMounted) {
//               console.log('Setting user profile during initialization:', profile)
//               setUserProfile(profile)
//             }
//           } catch (error) {
//             console.error('Error in profile fetch during initialization:', error)
//             if (isMounted) {
//               // Only set default profile if we're sure the user should be a regular user
//               // Don't assume role - let the database determine it
//               console.log('Profile fetch failed, will retry...')
//               // Don't set a default profile here - let it retry
//             }
//           }
//         }
        
//         if (isMounted) {
//           setLoading(false)
//         }
//       } catch (error) {
//         console.error('Error initializing auth:', error)
//         if (isMounted) {
//           setLoading(false)
//         }
//       }
//     }

//     initializeAuth()

//     // Listen for auth changes
//     const {
//       data: { subscription },
//     } = supabase.auth.onAuthStateChange(async (event, session) => {
//       if (!isMounted) return
      
//       console.log('Auth state changed:', event, 'Session user ID:', session?.user?.id)
//       setSession(session)
//       setUser(session?.user ?? null)
      
//       // Only fetch profile on specific events, not on every token refresh
//       if (session?.user?.id && (event === 'SIGNED_IN' || event === 'SIGNED_UP')) {
//         // Only fetch if we don't already have a profile for this user
//         if (!userProfileRef.current || userProfileRef.current.id !== session.user.id) {
//           try {
//             console.log('Fetching profile for event:', event)
//             const profile = await fetchUserProfile(session.user.id)
//             if (isMounted) {
//               console.log('Setting user profile on auth change:', profile)
//               setUserProfile(profile)
//             }
//           } catch (error) {
//             console.error('Error fetching profile on auth change:', error)
//             if (isMounted) {
//               console.log('Profile fetch failed on auth change, keeping current state')
//             }
//           }
//         } else {
//           console.log('Profile already exists for user, skipping refetch. Current profile:', userProfileRef.current)
//         }
//       } else if (event === 'SIGNED_OUT') {
//         console.log('User signed out, clearing profile')
//         setUserProfile(null)
//       } else if (event === 'TOKEN_REFRESHED' && session?.user?.id && !userProfileRef.current) {
//         // If token refreshed and we don't have a profile, try to fetch it
//         console.log('Token refreshed but no profile found, attempting to fetch profile')
//         try {
//           const profile = await fetchUserProfile(session.user.id)
//           if (isMounted) {
//             console.log('Setting user profile after token refresh:', profile)
//             setUserProfile(profile)
//           }
//         } catch (error) {
//           console.error('Error fetching profile after token refresh:', error)
//         }
//       } else {
//         console.log('Auth event not triggering profile fetch:', event)
//       }
//       // For TOKEN_REFRESHED events, don't refetch profile to prevent dashboard switching
      
//       if (isMounted) {
//         setLoading(false)
//       }
//     })

//     return () => {
//       isMounted = false
//       subscription.unsubscribe()
//     }
//   }, [])

//   const signUp = async (email, password) => {
//     try {
//       const { data, error } = await supabase.auth.signUp({
//         email,
//         password,
//       })
//       if (error) throw error
//       return { data, error: null }
//     } catch (error) {
//       return { data: null, error: error.message }
//     }
//   }

//   const signIn = async (email, password) => {
//     try {
//       const { data, error } = await supabase.auth.signInWithPassword({
//         email,
//         password,
//       })
//       if (error) throw error
//       return { data, error: null }
//     } catch (error) {
//       return { data: null, error: error.message }
//     }
//   }

//   const signOut = async () => {
//     try {
//       // Add timeout to prevent hanging
//       const signOutPromise = supabase.auth.signOut()
//       const timeoutPromise = new Promise((_, reject) => 
//         setTimeout(() => reject(new Error('Sign out timeout')), 5000)
//       )
      
//       const { error } = await Promise.race([signOutPromise, timeoutPromise])
//         .catch((err) => {
//           console.warn('Sign out timeout or error, forcing local sign out:', err)
//           // Force local sign out even if server request fails
//           return { error: null }
//         })
      
//       if (error) {
//         console.error('Sign out error:', error)
//       }
      
//       // Always clear local state regardless of server response
//       setUser(null)
//       setUserProfile(null)
//       setSession(null)
//       setLoading(false)
      
//       return { error: error ? error.message : null }
//     } catch (error) {
//       console.error('Sign out error:', error)
//       // Force local sign out on any error
//       setUser(null)
//       setUserProfile(null)
//       setSession(null)
//       setLoading(false)
//       return { error: error.message }
//     }
//   }

//   const value = {
//     user,
//     userProfile,
//     session,
//     loading,
//     signUp,
//     signIn,
//     signOut,
//     fetchUserProfile, // Expose this function if you need to refresh profile data
//   }

//   return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
// }

import { useState, useEffect, useRef, createContext, useContext } from 'react'
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

  // Use refs to track current values and prevent race conditions
  const userProfileRef = useRef(null)
  const currentUserIdRef = useRef(null)
  const isMountedRef = useRef(true)
  const isInitializedRef = useRef(false)
  const profileFetchInProgressRef = useRef(false)

  // Keep refs in sync with state
  useEffect(() => {
    userProfileRef.current = userProfile
  }, [userProfile])

  useEffect(() => {
    currentUserIdRef.current = user?.id || null
  }, [user])

  const fetchUserProfile = async (userId, retryCount = 0) => {
    // Prevent concurrent fetches for the same user
    if (profileFetchInProgressRef.current && currentUserIdRef.current === userId) {
      console.log('Profile fetch already in progress, skipping')
      return userProfileRef.current
    }

    profileFetchInProgressRef.current = true

    try {
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Profile fetch timeout')), 8000)
      )
      
      const fetchPromise = supabase
        .from('user_profiles')
        .select('*')
        .eq('id', userId)
        .single()

      const { data, error } = await Promise.race([fetchPromise, timeoutPromise])

      if (error) {
        console.error('Error fetching user profile:', error)
        
        if (error.code === 'PGRST116') {
          console.log('User profile not found in database')
          return null
        }
        
        if (retryCount < 2 && (error.message.includes('fetch') || error.message.includes('network'))) {
          console.log(`Retrying profile fetch (attempt ${retryCount + 2})`)
          await new Promise(resolve => setTimeout(resolve, 1000 * (retryCount + 1)))
          return fetchUserProfile(userId, retryCount + 1)
        }
        
        return null
      }

      console.log('User profile fetched successfully:', data)
      return data
    } catch (error) {
      console.error('Error fetching user profile:', error)
      if (error.message === 'Profile fetch timeout' && retryCount < 1) {
        console.log('Retrying profile fetch after timeout')
        await new Promise(resolve => setTimeout(resolve, 2000))
        return fetchUserProfile(userId, retryCount + 1)
      }
      return null
    } finally {
      profileFetchInProgressRef.current = false
    }
  }

  const safeSetState = (setter, value, stateName) => {
    if (isMountedRef.current) {
      console.log(`Setting ${stateName}:`, value)
      setter(value)
    }
  }

  useEffect(() => {
    isMountedRef.current = true
    
    const initializeAuth = async () => {
      try {
        console.log('Initializing auth...')
        const { data: { session }, error } = await supabase.auth.getSession()
        
        if (!isMountedRef.current) return
        
        if (error) {
          console.error('Error getting session:', error)
          safeSetState(setLoading, false, 'loading')
          return
        }
        
        console.log('Initial session:', session?.user?.id || 'no session')
        
        // Set session and user together
        safeSetState(setSession, session, 'session')
        safeSetState(setUser, session?.user ?? null, 'user')
      
      if (session?.user?.id) {
          try {
        const profile = await fetchUserProfile(session.user.id)
            if (isMountedRef.current) {
              safeSetState(setUserProfile, profile, 'userProfile')
            }
          } catch (error) {
            console.error('Error in profile fetch during initialization:', error)
          }
        } else {
          // No session, ensure profile is null
          safeSetState(setUserProfile, null, 'userProfile')
        }
        
        isInitializedRef.current = true
        safeSetState(setLoading, false, 'loading')
      } catch (error) {
        console.error('Error initializing auth:', error)
        if (isMountedRef.current) {
          safeSetState(setLoading, false, 'loading')
        }
      }
    }

    initializeAuth()

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, newSession) => {
      if (!isMountedRef.current) return
      
      console.log('Auth state changed:', event, 'User ID:', newSession?.user?.id || 'no user')
      
      // CRITICAL: Always update session and user together atomically
      const newUser = newSession?.user ?? null
      const prevUserId = currentUserIdRef.current
      const newUserId = newUser?.id || null
      
      safeSetState(setSession, newSession, 'session')
      safeSetState(setUser, newUser, 'user')
      
      // Handle different auth events
      if (event === 'SIGNED_OUT') {
        console.log('User signed out, clearing profile')
        safeSetState(setUserProfile, null, 'userProfile')
      } 
      else if (event === 'SIGNED_IN' || event === 'SIGNED_UP') {
        console.log('User signed in/up, fetching profile')
        if (newUserId) {
          try {
            const profile = await fetchUserProfile(newUserId)
            if (isMountedRef.current) {
              safeSetState(setUserProfile, profile, 'userProfile')
            }
          } catch (error) {
            console.error('Error fetching profile on auth change:', error)
          }
        }
      }
      else if (event === 'TOKEN_REFRESHED') {
        console.log('Token refreshed')
        // Only refetch profile if user ID changed (shouldn't happen, but be safe)
        // or if we don't have a profile but should
        if (newUserId && (!userProfileRef.current || prevUserId !== newUserId)) {
          console.log('Fetching profile after token refresh due to missing/changed profile')
          try {
            const profile = await fetchUserProfile(newUserId)
            if (isMountedRef.current) {
              safeSetState(setUserProfile, profile, 'userProfile')
            }
          } catch (error) {
            console.error('Error fetching profile on token refresh:', error)
          }
        }
      }
      else if (event === 'USER_UPDATED') {
        console.log('User updated, refetching profile')
        if (newUserId) {
          try {
            const profile = await fetchUserProfile(newUserId)
            if (isMountedRef.current) {
              safeSetState(setUserProfile, profile, 'userProfile')
            }
          } catch (error) {
            console.error('Error fetching profile on user update:', error)
          }
        }
      }
      
      // Ensure loading is false after initialization
      if (isInitializedRef.current) {
        safeSetState(setLoading, false, 'loading')
      }
    })

    return () => {
      console.log('AuthProvider unmounting')
      isMountedRef.current = false
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
      const signOutPromise = supabase.auth.signOut()
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Sign out timeout')), 5000)
      )
      
      const { error } = await Promise.race([signOutPromise, timeoutPromise])
        .catch((err) => {
          console.warn('Sign out timeout or error, forcing local sign out:', err)
          return { error: null }
        })
      
      if (error) {
        console.error('Sign out error:', error)
      }
      
      // Always clear local state
      safeSetState(setUser, null, 'user')
      safeSetState(setUserProfile, null, 'userProfile')
      safeSetState(setSession, null, 'session')
      safeSetState(setLoading, false, 'loading')
      
      return { error: error ? error.message : null }
    } catch (error) {
      console.error('Sign out error:', error)
      // Force local sign out on any error
      safeSetState(setUser, null, 'user')
      safeSetState(setUserProfile, null, 'userProfile')
      safeSetState(setSession, null, 'session')
      safeSetState(setLoading, false, 'loading')
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
    fetchUserProfile,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}