require('dotenv').config({ path: '.env.local' });
const { Client } = require('pg');

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  console.error('ERROR: Missing DATABASE_URL in .env.local');
  process.exit(1);
}

async function testConnection() {
  const client = new Client({
    connectionString: connectionString,
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();
    console.log('CONNECTED_SUCCESSFULLY');
    
    const res = await client.query("SELECT table_name FROM information_schema.tables WHERE table_name = 'genie_node_embeddings'");
    console.log('TABLE_EXISTS:', res.rows.length > 0);
    
    const extensions = await client.query("SELECT extname FROM pg_extension WHERE extname = 'vector'");
    console.log('VECTOR_EXTENSION_EXISTS:', extensions.rows.length > 0);
    
    const rpcs = await client.query("SELECT routine_name FROM information_schema.routines WHERE routine_name = 'match_node_embeddings'");
    console.log('RPC_EXISTS:', rpcs.rows.length > 0);

    await client.end();
  } catch (err) {
    console.error('CONNECTION_ERROR:', err.message);
    process.exit(1);
  }
}

testConnection();
