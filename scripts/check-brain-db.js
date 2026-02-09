require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('ERROR: Missing Supabase credentials. Please set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function check() {
  console.log('Checking genie_node_embeddings table...');
  const { data, error } = await supabase
    .from('genie_node_embeddings')
    .select('*')
    .limit(1);

  if (error) {
    console.log('TABLE_ERROR:', error.message);
  } else {
    console.log('TABLE_SUCCESS: Table exists');
  }

  console.log('Checking match_node_embeddings RPC...');
  // We can't easily check for RPC existence via JS client without calling it,
  // but we can try to call it with dummy data.
  const { error: rpcError } = await supabase.rpc('match_node_embeddings', {
    query_embedding: Array(1536).fill(0),
    match_threshold: 0.5,
    match_count: 1
  });

  if (rpcError) {
    console.log('RPC_ERROR:', rpcError.message);
  } else {
    console.log('RPC_SUCCESS: RPC exists');
  }
}

check();
