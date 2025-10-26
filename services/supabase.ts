import { createClient } from '@supabase/supabase-js';

// Provided by user
const supabaseUrl = 'https://jzoiwioofsdksnziztrt.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp6b2l3aW9vZnNka3Nueml6dHJ0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjExODQzMjEsImV4cCI6MjA3Njc2MDMyMX0.fkDviYSnqQYWClp_zfyBOo4UIu1OuD1U5F-EKeGQxo0';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
