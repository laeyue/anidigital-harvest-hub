import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://suoqctrweiqqkiqzfxha.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN1b3FjdHJ3ZWlxcWtpcXpmeGhhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU3MjQ2OTksImV4cCI6MjA4MTMwMDY5OX0.Axo0W-nnrOE-mNewIFC1HYDGfpAzl02SqTHJRvxIfvo';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

