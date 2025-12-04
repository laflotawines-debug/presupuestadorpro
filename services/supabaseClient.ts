import { createClient } from '@supabase/supabase-js';

// ⚠️ REEMPLAZA ESTOS VALORES CON LOS DE TU PROYECTO SUPABASE ⚠️
const SUPABASE_URL = 'https://jwaqbiefywzxcwvligca.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp3YXFiaWVmeXd6eGN3dmxpZ2NhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ4NTY0MTQsImV4cCI6MjA4MDQzMjQxNH0.KqdCDt5VHT6RO7Nb7cuNeeAhYuA-z1l0-hDLz2FFJUw';

// Helper to check if credentials are valid or placeholders
export const isSupabaseConfigured = () => {
  return !SUPABASE_URL.includes('tu-proyecto') && 
         !SUPABASE_ANON_KEY.includes('tu-anon-key');
};

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);