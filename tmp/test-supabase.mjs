
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

async function testSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  console.log(`Testing Supabase at ${url}...`);
  const supabase = createClient(url, key);

  try {
    // Try to get user (will probably return error since no session, but should connect)
    const { data, error } = await supabase.auth.getUser();
    console.log('Result:', { data, error });
  } catch (error) {
    console.error('Thrown error:');
    console.error(error);
  }
}

testSupabase();
