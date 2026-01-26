const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://fiviygonxineoynebhxy.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR3d3lzdXVxZm1va2dvbW5rZWZvIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2OTI2NzkwNSwiZXhwIjoyMDg0ODQzOTA1fQ.YURLTqqB--e9TikiaIWyToptDZXw2-FwgKyk6gIGo3o';
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
