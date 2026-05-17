import React from 'react'
import ReactDOM from 'react-dom/client'
import { createClient } from '@supabase/supabase-js'
import App from './App.jsx'

// Supabase client
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseKey = import.meta.env.VITE_SUPABASE_KEY
const supabase = (supabaseUrl && supabaseKey) ? createClient(supabaseUrl, supabaseKey) : null
window.supabase = supabase

// Local storage layer (cache + fallback)
window.storage = {
  get: async (key) => {
    try { const val = localStorage.getItem(key); return val !== null ? { key, value: val } : null; } catch { return null; }
  },
  set: async (key, value) => {
    try { localStorage.setItem(key, value); return { key, value }; } catch { return null; }
  },
  delete: async (key) => {
    try { localStorage.removeItem(key); return { key, deleted: true }; } catch { return null; }
  },
  list: async (prefix) => {
    try { return { keys: Object.keys(localStorage).filter(k => !prefix || k.startsWith(prefix)) }; } catch { return { keys: [] }; }
  }
};

ReactDOM.createRoot(document.getElementById('root')).render(<App />)
