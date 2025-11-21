
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://fiviygonxineoynebhxy.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'sb_publishable_1Z7DbQYCkRfJdfscK67Q1Q_NjIC2sd-';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
