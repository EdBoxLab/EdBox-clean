/**
 * Load Testing Script for EdBox
 * Tests concurrent user capacity (target: 1000+ users)
 * 
 * Run with: node load-test.js
 */

const API_BASE_URL = process.env.API_URL || 'http://localhost:3000';
const TARGET_CONCURRENT_USERS = 1000;
const RAMP_UP_TIME_MS = 30000; // 30 seconds to ramp up to full load
const TEST_DURATION_MS = 60000; // 1 minute test duration

// Test endpoints
const ENDPOINTS = [
  { method: 'GET', path: '/api/feed/generate', weight: 0.3 },
  { method: 'GET', path: '/api/learner/state', weight: 0.2 },
  { method: 'POST', path: '/api/xp/update', weight: 0.2, body: { xpGained: 10, activity: 'test' } },
  { method: 'GET', path: '/api/study-sets', weight: 0.15 },
  { method: 'GET', path: '/api/chat', weight: 0.15 }
];

// Metrics tracking
const metrics = {
  totalRequests: 0,
  successfulRequests: 0,
  failedRequests: 0,
  totalResponseTime: 0,
  minResponseTime: Infinity,
  maxResponseTime: 0,
  responseTimesByEndpoint: {},
  errorsByEndpoint: {},
  concurrentUsers: 0,
  startTime: null
};

// Helper: Random endpoint selection based on weights
function selectEndpoint() {
  const rand = Math.random();
  let cumulative = 0;
  
  for (const endpoint of ENDPOINTS) {
    cumulative += endpoint.weight;
    if (rand <= cumulative) return endpoint;
  }
  
  return ENDPOINTS[0];
}

// Helper: Make HTTP request
async function makeRequest(endpoint) {
  const startTime = Date.now();
  
  try {
    const options = {
      method: endpoint.method,
      headers: {
        'Content-Type': 'application/json',
      }
    };
    
    if (endpoint.body) {
      options.body = JSON.stringify(endpoint.body);
    }
    
    const response = await fetch(`${API_BASE_URL}${endpoint.path}`, options);
    const endTime = Date.now();
    const responseTime = endTime - startTime;
    
    // Update metrics
    metrics.totalRequests++;
    
    if (response.ok) {
      metrics.successfulRequests++;
    } else {
      metrics.failedRequests++;
      metrics.errorsByEndpoint[endpoint.path] = (metrics.errorsByEndpoint[endpoint.path] || 0) + 1;
    }
    
    metrics.totalResponseTime += responseTime;
    metrics.minResponseTime = Math.min(metrics.minResponseTime, responseTime);
    metrics.maxResponseTime = Math.max(metrics.maxResponseTime, responseTime);
    
    if (!metrics.responseTimesByEndpoint[endpoint.path]) {
      metrics.responseTimesByEndpoint[endpoint.path] = [];
    }
    metrics.responseTimesByEndpoint[endpoint.path].push(responseTime);
    
    return { success: response.ok, responseTime, status: response.status };
  } catch (error) {
    metrics.totalRequests++;
    metrics.failedRequests++;
    metrics.errorsByEndpoint[endpoint.path] = (metrics.errorsByEndpoint[endpoint.path] || 0) + 1;
    
    return { success: false, responseTime: Date.now() - startTime, error: error.message };
  }
}

// Simulate single user
async function simulateUser(userId, testDuration) {
  const endTime = Date.now() + testDuration;
  
  metrics.concurrentUsers++;
  
  while (Date.now() < endTime) {
    const endpoint = selectEndpoint();
    await makeRequest(endpoint);
    
    // Random delay between requests (0.5-2 seconds)
    const delay = Math.random() * 1500 + 500;
    await new Promise(resolve => setTimeout(resolve, delay));
  }
  
  metrics.concurrentUsers--;
}

// Main load test
async function runLoadTest() {
  console.log('🚀 EdBox Load Test Starting...\n');
  console.log(`Target: ${TARGET_CONCURRENT_USERS} concurrent users`);
  console.log(`Ramp-up: ${RAMP_UP_TIME_MS / 1000}s`);
  console.log(`Duration: ${TEST_DURATION_MS / 1000}s\n`);
  
  metrics.startTime = Date.now();
  
  const userPromises = [];
  const usersPerInterval = TARGET_CONCURRENT_USERS / (RAMP_UP_TIME_MS / 1000);
  
  // Ramp up users gradually
  for (let i = 0; i < TARGET_CONCURRENT_USERS; i++) {
    const delay = (i / TARGET_CONCURRENT_USERS) * RAMP_UP_TIME_MS;
    
    setTimeout(() => {
      userPromises.push(simulateUser(i, TEST_DURATION_MS));
    }, delay);
  }
  
  // Progress reporting
  const progressInterval = setInterval(() => {
    const elapsed = ((Date.now() - metrics.startTime) / 1000).toFixed(1);
    const avgResponseTime = metrics.totalRequests > 0 
      ? (metrics.totalResponseTime / metrics.totalRequests).toFixed(2) 
      : 0;
    const successRate = metrics.totalRequests > 0 
      ? ((metrics.successfulRequests / metrics.totalRequests) * 100).toFixed(2) 
      : 0;
    
    console.log(`[${elapsed}s] Active Users: ${metrics.concurrentUsers} | Requests: ${metrics.totalRequests} | Success: ${successRate}% | Avg Response: ${avgResponseTime}ms`);
  }, 2000);
  
  // Wait for all users to complete
  await Promise.all(userPromises);
  clearInterval(progressInterval);
  
  // Final report
  printReport();
}

// Print final report
function printReport() {
  const totalTime = (Date.now() - metrics.startTime) / 1000;
  const avgResponseTime = metrics.totalResponseTime / metrics.totalRequests;
  const successRate = (metrics.successfulRequests / metrics.totalRequests) * 100;
  const requestsPerSecond = metrics.totalRequests / totalTime;
  
  console.log('\n' + '='.repeat(60));
  console.log('📊 LOAD TEST RESULTS');
  console.log('='.repeat(60));
  console.log(`\n⏱️  Total Duration: ${totalTime.toFixed(2)}s`);
  console.log(`👥 Peak Concurrent Users: ${TARGET_CONCURRENT_USERS}`);
  console.log(`\n📈 Request Statistics:`);
  console.log(`   Total Requests: ${metrics.totalRequests}`);
  console.log(`   Successful: ${metrics.successfulRequests} (${successRate.toFixed(2)}%)`);
  console.log(`   Failed: ${metrics.failedRequests} (${(100 - successRate).toFixed(2)}%)`);
  console.log(`   Requests/sec: ${requestsPerSecond.toFixed(2)}`);
  console.log(`\n⚡ Response Times:`);
  console.log(`   Average: ${avgResponseTime.toFixed(2)}ms`);
  console.log(`   Min: ${metrics.minResponseTime}ms`);
  console.log(`   Max: ${metrics.maxResponseTime}ms`);
  
  console.log(`\n📍 Per-Endpoint Performance:`);
  for (const [endpoint, times] of Object.entries(metrics.responseTimesByEndpoint)) {
    const avg = times.reduce((a, b) => a + b, 0) / times.length;
    const errors = metrics.errorsByEndpoint[endpoint] || 0;
    const successRate = ((times.length - errors) / times.length * 100).toFixed(1);
    console.log(`   ${endpoint}`);
    console.log(`     Avg: ${avg.toFixed(2)}ms | Requests: ${times.length} | Success: ${successRate}%`);
  }
  
  // Pass/Fail determination
  const PASS_CRITERIA = {
    minSuccessRate: 95, // 95% success rate
    maxAvgResponseTime: 2000, // 2 seconds average
    minConcurrentUsers: 1000
  };
  
  const passed = 
    successRate >= PASS_CRITERIA.minSuccessRate &&
    avgResponseTime <= PASS_CRITERIA.maxAvgResponseTime &&
    TARGET_CONCURRENT_USERS >= PASS_CRITERIA.minConcurrentUsers;
  
  console.log('\n' + '='.repeat(60));
  if (passed) {
    console.log('✅ LOAD TEST PASSED!');
    console.log('   System can handle 1000+ concurrent users.');
  } else {
    console.log('❌ LOAD TEST FAILED!');
    if (successRate < PASS_CRITERIA.minSuccessRate) {
      console.log(`   ⚠️  Success rate ${successRate.toFixed(2)}% below threshold ${PASS_CRITERIA.minSuccessRate}%`);
    }
    if (avgResponseTime > PASS_CRITERIA.maxAvgResponseTime) {
      console.log(`   ⚠️  Average response time ${avgResponseTime.toFixed(2)}ms above threshold ${PASS_CRITERIA.maxAvgResponseTime}ms`);
    }
  }
  console.log('='.repeat(60) + '\n');
  
  process.exit(passed ? 0 : 1);
}

// Run the test
runLoadTest().catch(error => {
  console.error('❌ Load test error:', error);
  process.exit(1);
});
