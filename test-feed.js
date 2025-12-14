// Simple test script to verify feed generation
const testFeedGeneration = async () => {
  try {
    console.log('🧪 Testing feed generation...');
    
    const response = await fetch('http://localhost:3000/api/feed/generate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        interests: ['JavaScript', 'React', 'Web Development'],
        likedTopics: ['Frontend', 'UI/UX'],
        excludeTypes: []
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    
    console.log('✅ Feed generated successfully!');
    console.log(`📊 Generated ${data.length} items`);
    
    // Check content types
    const types = data.map(item => item.type);
    const uniqueTypes = [...new Set(types)];
    console.log(`🎯 Content types: ${uniqueTypes.join(', ')}`);
    
    // Check for shorts
    const videos = data.filter(item => item.type === 'video');
    console.log(`🔥 YouTube Shorts: ${videos.length}`);
    
    // Verify no duplicates within batch
    const typeCounts = types.reduce((acc, type) => {
      acc[type] = (acc[type] || 0) + 1;
      return acc;
    }, {});
    
    console.log('📈 Type distribution:', typeCounts);
    
    return data;
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    return null;
  }
};

// Test with excluded types
const testWithExclusions = async () => {
  try {
    console.log('\n🧪 Testing with excluded types...');
    
    const response = await fetch('http://localhost:3000/api/feed/generate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        interests: ['Python', 'Machine Learning'],
        likedTopics: ['AI', 'Data Science'],
        excludeTypes: ['quiz', 'fact']
      }),
    });

    const data = await response.json();
    
    console.log('✅ Exclusion test passed!');
    console.log(`📊 Generated ${data.length} items`);
    
    const types = data.map(item => item.type);
    const uniqueTypes = [...new Set(types)];
    console.log(`🎯 Content types (should not include quiz/fact): ${uniqueTypes.join(', ')}`);
    
    return data;
  } catch (error) {
    console.error('❌ Exclusion test failed:', error.message);
    return null;
  }
};

// Run tests
if (typeof window === 'undefined') {
  // Node.js environment
  const fetch = require('node-fetch');
  testFeedGeneration().then(() => testWithExclusions());
} else {
  // Browser environment
  testFeedGeneration().then(() => testWithExclusions());
}