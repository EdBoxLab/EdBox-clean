// ============================================
// Performance Monitor Service
// Monitors system performance and provides optimization insights
// ============================================

import { skillProgressionCache } from './cache-service';

/**
 * Performance metrics for different operations
 */
interface PerformanceMetrics {
  operation: string;
  averageTime: number;
  minTime: number;
  maxTime: number;
  totalCalls: number;
  errorRate: number;
  lastUpdated: Date;
}

/**
 * System performance statistics
 */
interface SystemPerformance {
  cacheStats: any;
  backgroundGenerationStats: any;
  operationMetrics: PerformanceMetrics[];
  memoryUsage: {
    used: number;
    total: number;
    percentage: number;
  };
  recommendations: string[];
}

/**
 * Performance monitoring and optimization service
 */
export class PerformanceMonitor {
  private metrics = new Map<string, PerformanceMetrics>();
  private operationTimes = new Map<string, number[]>();
  private errorCounts = new Map<string, number>();

  /**
   * Start timing an operation
   */
  startTiming(operationId: string): string {
    const timingId = `${operationId}_${Date.now()}_${Math.random()}`;
    
    // Check if performance API is available (browser environment)
    if (typeof performance !== 'undefined' && performance.mark) {
      performance.mark(`start_${timingId}`);
    }
    
    return timingId;
  }

  /**
   * End timing an operation and record metrics
   */
  endTiming(timingId: string, success: boolean = true): number {
    try {
      let duration = 0;
      
      // Check if performance API is available (browser environment)
      if (typeof performance !== 'undefined' && performance.mark) {
        performance.mark(`end_${timingId}`);
        performance.measure(`duration_${timingId}`, `start_${timingId}`, `end_${timingId}`);
        
        const measure = performance.getEntriesByName(`duration_${timingId}`)[0];
        duration = measure.duration;
        
        // Cleanup performance entries
        performance.clearMarks(`start_${timingId}`);
        performance.clearMarks(`end_${timingId}`);
        performance.clearMeasures(`duration_${timingId}`);
      } else {
        // Fallback for Node.js environment - use simple timestamp difference
        const parts = timingId.split('_');
        if (parts.length >= 2) {
          const startTime = parseInt(parts[1]);
          if (!isNaN(startTime)) {
            duration = Date.now() - startTime;
          }
        }
      }
      
      // Extract operation name from timing ID
      const operationName = timingId.split('_')[0];
      
      // Record the timing
      this.recordOperationTime(operationName, duration, success);
      
      return duration;
    } catch (error) {
      console.warn('Failed to measure performance:', error);
      return 0;
    }
  }

  /**
   * Record operation time and update metrics
   */
  private recordOperationTime(operation: string, time: number, success: boolean): void {
    // Record timing
    if (!this.operationTimes.has(operation)) {
      this.operationTimes.set(operation, []);
    }
    
    const times = this.operationTimes.get(operation)!;
    times.push(time);
    
    // Keep only last 100 measurements for memory efficiency
    if (times.length > 100) {
      times.shift();
    }
    
    // Record errors
    if (!success) {
      const errorCount = this.errorCounts.get(operation) || 0;
      this.errorCounts.set(operation, errorCount + 1);
    }
    
    // Update metrics
    this.updateMetrics(operation);
  }

  /**
   * Update performance metrics for an operation
   */
  private updateMetrics(operation: string): void {
    const times = this.operationTimes.get(operation) || [];
    const errorCount = this.errorCounts.get(operation) || 0;
    
    if (times.length === 0) return;
    
    const averageTime = times.reduce((sum, time) => sum + time, 0) / times.length;
    const minTime = Math.min(...times);
    const maxTime = Math.max(...times);
    const totalCalls = times.length;
    const errorRate = errorCount / totalCalls;
    
    this.metrics.set(operation, {
      operation,
      averageTime,
      minTime,
      maxTime,
      totalCalls,
      errorRate,
      lastUpdated: new Date()
    });
  }

  /**
   * Get performance metrics for a specific operation
   */
  getOperationMetrics(operation: string): PerformanceMetrics | null {
    return this.metrics.get(operation) || null;
  }

  /**
   * Get all performance metrics
   */
  getAllMetrics(): PerformanceMetrics[] {
    return Array.from(this.metrics.values());
  }

  /**
   * Get comprehensive system performance statistics
   */
  getSystemPerformance(): SystemPerformance {
    const cacheStats = skillProgressionCache.getStats();
    const backgroundStats = {}; // Removed dependency to avoid Groq import issues in tests
    const operationMetrics = this.getAllMetrics();
    
    // Calculate memory usage (approximate)
    const memoryUsage = this.calculateMemoryUsage();
    
    // Generate performance recommendations
    const recommendations = this.generateRecommendations(operationMetrics, cacheStats);
    
    return {
      cacheStats,
      backgroundGenerationStats: backgroundStats,
      operationMetrics,
      memoryUsage,
      recommendations
    };
  }

  /**
   * Calculate approximate memory usage
   */
  private calculateMemoryUsage(): { used: number; total: number; percentage: number } {
    // This is a simplified calculation
    // In a real application, you might use process.memoryUsage() in Node.js
    const cacheMemory = Object.values(skillProgressionCache.getStats())
      .reduce((total, stat) => total + (stat.memoryUsage || 0), 0);
    
    const metricsMemory = this.metrics.size * 1024; // Rough estimate
    
    const used = cacheMemory + metricsMemory;
    const total = 100 * 1024 * 1024; // Assume 100MB total available
    const percentage = (used / total) * 100;
    
    return { used, total, percentage };
  }

  /**
   * Generate performance optimization recommendations
   */
  private generateRecommendations(
    metrics: PerformanceMetrics[], 
    cacheStats: any
  ): string[] {
    const recommendations: string[] = [];
    
    // Check for slow operations
    const slowOperations = metrics.filter(m => m.averageTime > 1000); // > 1 second
    if (slowOperations.length > 0) {
      recommendations.push(
        `Slow operations detected: ${slowOperations.map(op => op.operation).join(', ')}. Consider optimization.`
      );
    }
    
    // Check for high error rates
    const errorProneOperations = metrics.filter(m => m.errorRate > 0.1); // > 10% error rate
    if (errorProneOperations.length > 0) {
      recommendations.push(
        `High error rates in: ${errorProneOperations.map(op => op.operation).join(', ')}. Review error handling.`
      );
    }
    
    // Check cache efficiency
    const totalCacheSize = Object.values(cacheStats).reduce((total: number, stat: any) => total + stat.size, 0);
    const totalMaxSize = Object.values(cacheStats).reduce((total: number, stat: any) => total + stat.maxSize, 0);
    
    if (totalCacheSize / totalMaxSize > 0.8) {
      recommendations.push('Cache utilization is high (>80%). Consider increasing cache sizes.');
    }
    
    const avgHitRate = Object.values(cacheStats).reduce((total: number, stat: any) => total + stat.hitRate, 0) / Object.keys(cacheStats).length;
    if (avgHitRate < 0.5) {
      recommendations.push('Cache hit rate is low (<50%). Review caching strategy and TTL settings.');
    }
    
    // Check background generation queue
    // This would require access to background generator stats
    
    if (recommendations.length === 0) {
      recommendations.push('System performance is optimal.');
    }
    
    return recommendations;
  }

  /**
   * Get performance report as formatted string
   */
  getPerformanceReport(): string {
    const performance = this.getSystemPerformance();
    
    let report = '=== SKILL PROGRESSION SYSTEM PERFORMANCE REPORT ===\n\n';
    
    // Cache Statistics
    report += 'CACHE STATISTICS:\n';
    Object.entries(performance.cacheStats).forEach(([cache, stats]: [string, any]) => {
      report += `  ${cache}: ${stats.size}/${stats.maxSize} entries, ${(stats.hitRate * 100).toFixed(1)}% hit rate\n`;
    });
    
    // Operation Metrics
    report += '\nOPERATION METRICS:\n';
    performance.operationMetrics.forEach(metric => {
      report += `  ${metric.operation}: avg ${metric.averageTime.toFixed(1)}ms, ${metric.totalCalls} calls, ${(metric.errorRate * 100).toFixed(1)}% errors\n`;
    });
    
    // Memory Usage
    report += `\nMEMORY USAGE: ${(performance.memoryUsage.used / 1024 / 1024).toFixed(1)}MB / ${(performance.memoryUsage.total / 1024 / 1024).toFixed(1)}MB (${performance.memoryUsage.percentage.toFixed(1)}%)\n`;
    
    // Recommendations
    report += '\nRECOMMENDATIONS:\n';
    performance.recommendations.forEach(rec => {
      report += `  - ${rec}\n`;
    });
    
    return report;
  }

  /**
   * Clear all performance data
   */
  clearMetrics(): void {
    this.metrics.clear();
    this.operationTimes.clear();
    this.errorCounts.clear();
  }

  /**
   * Export performance data for analysis
   */
  exportMetrics(): {
    timestamp: Date;
    metrics: PerformanceMetrics[];
    systemPerformance: SystemPerformance;
  } {
    return {
      timestamp: new Date(),
      metrics: this.getAllMetrics(),
      systemPerformance: this.getSystemPerformance()
    };
  }
}

// Export singleton instance
export const performanceMonitor = new PerformanceMonitor();