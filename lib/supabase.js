import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://kidtwjlpodttcrnbdlyc.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtpZHR3amxwb2R0dGNybmJkbHljIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTI0MzU2NjYsImV4cCI6MjEwODAxMTY2Nn0.2-Xm_FFPshCsiL76NermWKPR_MXkMwzma7CPSoNXn6Q';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);