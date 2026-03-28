
async function testFetch() {
  const url = 'https://fiviygonxineoynebhxy.supabase.co/auth/v1/user';
  console.log(`Testing fetch to ${url}...`);
  try {
    const response = await fetch(url, {
      headers: {
        'apikey': 'dummy',
        'Authorization': 'Bearer dummy'
      }
    });
    console.log(`Response status: ${response.status}`);
  } catch (error) {
    console.error('Fetch failed:');
    console.error(error);
    if (error.cause) {
      console.error('Cause:');
      console.error(error.cause);
    }
  }
}

testFetch();
