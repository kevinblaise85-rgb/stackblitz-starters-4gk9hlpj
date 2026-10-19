import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://kidtwjlpodttcrnbdlyc.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtpZHR3amxwb2R0dGNybmJkbHljIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDAwMDAwMDAsImV4cCI6MjA1NTU1NTU1MH0.ExempleDeCle';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);