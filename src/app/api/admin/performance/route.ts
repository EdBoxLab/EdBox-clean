// ============================================
// Performance Monitoring API
// Provides performance metrics and optimization insights
// ============================================

import { NextRequest, NextResponse } from 'next/server';
import { performanceMonitor } from '@/lib/services/performance-monitor';
import { skillProgressionCache } from '@/lib/services/cache-service';
import { backgroundChallengeGenerator } from '@/lib/services/background-challenge-generator';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const format = searchParams.get('format') || 'json';
    const operation = searchParams.get('operation');

    // Get specific operation metrics if requested
    if (operation) {
      const metrics = performanceMonitor.getOperationMetrics(operation);
      if (!metrics) {
        return NextResponse.json(
          { error: `No metrics found for operation: ${operation}` },
          { status: 404 }
        );
      }
      return NextResponse.json(metrics);
    }

    // Get comprehensive system performance
    const systemPerformance = performanceMonitor.getSystemPerformance();

    // Return formatted report if requested
    if (format === 'report') {
      const report = performanceMonitor.getPerformanceReport();
      return new NextResponse(report, {
        headers: {
          'Content-Type': 'text/plain',
          'Content-Disposition': 'attachment; filename="performance-report.txt"'
        }
      });
    }

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      performance: systemPerformance
    });

  } catch (error) {
    console.error('Performance monitoring error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to get performance metrics',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, ...params } = body;

    switch (action) {
      case 'clear_cache':
        skillProgressionCache.clearAll();
        return NextResponse.json({
          success: true,
          message: 'All caches cleared successfully'
        });

      case 'clear_metrics':
        performanceMonitor.clearMetrics();
        return NextResponse.json({
          success: true,
          message: 'Performance metrics cleared successfully'
        });

      case 'pregenerate_challenges':
        await backgroundChallengeGenerator.preGeneratePopularSkills();
        return NextResponse.json({
          success: true,
          message: 'Background challenge generation initiated'
        });

      case 'export_metrics':
        const exportData = performanceMonitor.exportMetrics();
        return NextResponse.json({
          success: true,
          data: exportData
        });

      default:
        return NextResponse.json(
          { error: `Unknown action: ${action}` },
          { status: 400 }
        );
    }

  } catch (error) {
    console.error('Performance action error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to execute performance action',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const target = searchParams.get('target');

    switch (target) {
      case 'cache':
        skillProgressionCache.clearAll();
        return NextResponse.json({
          success: true,
          message: 'Cache cleared successfully'
        });

      case 'metrics':
        performanceMonitor.clearMetrics();
        return NextResponse.json({
          success: true,
          message: 'Metrics cleared successfully'
        });

      case 'all':
        skillProgressionCache.clearAll();
        performanceMonitor.clearMetrics();
        return NextResponse.json({
          success: true,
          message: 'All performance data cleared successfully'
        });

      default:
        return NextResponse.json(
          { error: 'Invalid target. Use: cache, metrics, or all' },
          { status: 400 }
        );
    }

  } catch (error) {
    console.error('Performance cleanup error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to clear performance data',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}