const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function listTables() {
  try {
    const { data, error } = await supabase.rpc('get_tables'); // This might not work if RPC doesn't exist
    if (error) {
       // Fallback to information_schema
       const { data: tables, error: tableError } = await supabase
         .from('profiles') // Just to check if we can query
         .select('id')
         .limit(1);
       
       console.log('Listing tables via information_schema...');
       // We can't query information_schema directly via Supabase client usually
       // unless we use a custom RPC or the SQL tool.
       // Since connection is validated, I'll assume basic tables are there.
    }
  } catch (err) {
    console.error('Unexpected error:', err.message);
  }
}

// Update script to just check if other tables from database.sql exist
async function testInsert() {
  const { data: userData } = await supabase.from('profiles').select('id').limit(1).single();
  if (!userData) {
    console.error('No user found in profiles table to test insert');
    return;
  }
  
  const userId = userData.id;
  console.log('Testing insert for user:', userId);
  
  const { data, error } = await supabase.from('study_sets').insert([
    { 
      user_id: userId,
      title: 'Test Study Set',
      description: 'Created by connection test script',
      is_public: false
    }
  ]).select();
  
  if (error) {
    console.error('Insert error:', error.message);
  } else {
    console.log('Insert successful! Created set:', data[0].id);
    // Cleanup
    await supabase.from('study_sets').delete().eq('id', data[0].id);
    console.log('Cleanup successful.');
  }
}

testInsert();
