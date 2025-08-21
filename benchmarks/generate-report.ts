#!/usr/bin/env bun
/**
 * Script to generate comprehensive HTML reports from benchmark results
 * 
 * This script takes evaluation and comparison results and generates
 * visual HTML reports with charts and analysis.
 */
import { existsSync } from 'node:fs';
import { readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

const BENCHMARKS_DIR = join(process.cwd(), 'benchmarks');

// Types for report data
interface StrategyMetrics {
  strategy_name: string;
  total_cases: number;
  successful_predictions: number;
  failed_predictions: number;
  accuracy: number;
  top_3_accuracy: number;
  top_5_accuracy: number;
  mrr: number;
  avg_execution_time_ms: number;
  by_category: Record<string, { total: number; correct: number; accuracy: number }>;
  by_difficulty: Record<string, { total: number; correct: number; accuracy: number }>;
}

interface ComparisonReport {
  comparison_info: {
    dataset_version: string;
    evaluated_at: string;
    split_used: string;
    total_test_cases: number;
    strategies_compared: string[];
  };
  strategy_metrics: StrategyMetrics[];
  winner_analysis: {
    overall_winner: string;
    category_winners: Record<string, string>;
    difficulty_winners: Record<string, string>;
    speed_winner: string;
  };
}

/**
 * Generate HTML chart for accuracy comparison
 */
const generateAccuracyChart = (metrics: StrategyMetrics[]): string => {
  const data = metrics.map(m => ({
    strategy: m.strategy_name,
    accuracy: m.accuracy * 100,
    top3: m.top_3_accuracy * 100,
    top5: m.top_5_accuracy * 100,
  }));
  
  return `
    <div class="chart-container">
      <h3>Accuracy Comparison</h3>
      <canvas id="accuracyChart" width="400" height="200"></canvas>
      <script>
        const accuracyCtx = document.getElementById('accuracyChart').getContext('2d');
        new Chart(accuracyCtx, {
          type: 'bar',
          data: {
            labels: ${JSON.stringify(data.map(d => d.strategy))},
            datasets: [
              {
                label: 'Accuracy',
                data: ${JSON.stringify(data.map(d => d.accuracy))},
                backgroundColor: 'rgba(54, 162, 235, 0.8)',
                borderColor: 'rgba(54, 162, 235, 1)',
                borderWidth: 1
              },
              {
                label: 'Top-3 Accuracy',
                data: ${JSON.stringify(data.map(d => d.top3))},
                backgroundColor: 'rgba(255, 206, 86, 0.8)',
                borderColor: 'rgba(255, 206, 86, 1)',
                borderWidth: 1
              },
              {
                label: 'Top-5 Accuracy',
                data: ${JSON.stringify(data.map(d => d.top5))},
                backgroundColor: 'rgba(75, 192, 192, 0.8)',
                borderColor: 'rgba(75, 192, 192, 1)',
                borderWidth: 1
              }
            ]
          },
          options: {
            responsive: true,
            scales: {
              y: {
                beginAtZero: true,
                max: 100,
                ticks: {
                  callback: function(value) {
                    return value + '%';
                  }
                }
              }
            },
            plugins: {
              title: {
                display: true,
                text: 'Strategy Accuracy Comparison'
              }
            }
          }
        });
      </script>
    </div>
  `;
};

/**
 * Generate HTML chart for performance metrics
 */
const generatePerformanceChart = (metrics: StrategyMetrics[]): string => {
  const data = metrics.map(m => ({
    strategy: m.strategy_name,
    mrr: m.mrr,
    speed: m.avg_execution_time_ms,
  }));
  
  return `
    <div class="chart-container">
      <h3>Performance Metrics</h3>
      <div class="chart-row">
        <div class="chart-col">
          <canvas id="mrrChart" width="300" height="150"></canvas>
        </div>
        <div class="chart-col">
          <canvas id="speedChart" width="300" height="150"></canvas>
        </div>
      </div>
      <script>
        // MRR Chart
        const mrrCtx = document.getElementById('mrrChart').getContext('2d');
        new Chart(mrrCtx, {
          type: 'bar',
          data: {
            labels: ${JSON.stringify(data.map(d => d.strategy))},
            datasets: [{
              label: 'Mean Reciprocal Rank',
              data: ${JSON.stringify(data.map(d => d.mrr))},
              backgroundColor: 'rgba(153, 102, 255, 0.8)',
              borderColor: 'rgba(153, 102, 255, 1)',
              borderWidth: 1
            }]
          },
          options: {
            responsive: true,
            scales: {
              y: { beginAtZero: true, max: 1 }
            },
            plugins: {
              title: { display: true, text: 'Mean Reciprocal Rank' }
            }
          }
        });
        
        // Speed Chart
        const speedCtx = document.getElementById('speedChart').getContext('2d');
        new Chart(speedCtx, {
          type: 'bar',
          data: {
            labels: ${JSON.stringify(data.map(d => d.strategy))},
            datasets: [{
              label: 'Avg Execution Time (ms)',
              data: ${JSON.stringify(data.map(d => d.speed))},
              backgroundColor: 'rgba(255, 99, 132, 0.8)',
              borderColor: 'rgba(255, 99, 132, 1)',
              borderWidth: 1
            }]
          },
          options: {
            responsive: true,
            scales: {
              y: { beginAtZero: true }
            },
            plugins: {
              title: { display: true, text: 'Average Execution Time' }
            }
          }
        });
      </script>
    </div>
  `;
};

/**
 * Generate category breakdown chart
 */
const generateCategoryChart = (metrics: StrategyMetrics[]): string => {
  const categories = new Set<string>();
  metrics.forEach(m => Object.keys(m.by_category).forEach(cat => categories.add(cat)));
  
  const datasets = metrics.map((m, index) => {
    const colors = [
      'rgba(54, 162, 235, 0.8)',
      'rgba(255, 206, 86, 0.8)',
      'rgba(75, 192, 192, 0.8)',
      'rgba(153, 102, 255, 0.8)',
      'rgba(255, 99, 132, 0.8)'
    ];
    
    return {
      label: m.strategy_name,
      data: Array.from(categories).map(cat => 
        m.by_category[cat] ? m.by_category[cat].accuracy * 100 : 0
      ),
      backgroundColor: colors[index % colors.length],
      borderColor: colors[index % colors.length].replace('0.8', '1'),
      borderWidth: 1
    };
  });
  
  return `
    <div class="chart-container">
      <h3>Accuracy by Category</h3>
      <canvas id="categoryChart" width="400" height="200"></canvas>
      <script>
        const categoryCtx = document.getElementById('categoryChart').getContext('2d');
        new Chart(categoryCtx, {
          type: 'bar',
          data: {
            labels: ${JSON.stringify(Array.from(categories))},
            datasets: ${JSON.stringify(datasets)}
          },
          options: {
            responsive: true,
            scales: {
              y: {
                beginAtZero: true,
                max: 100,
                ticks: {
                  callback: function(value) {
                    return value + '%';
                  }
                }
              }
            },
            plugins: {
              title: {
                display: true,
                text: 'Accuracy by Function Category'
              }
            }
          }
        });
      </script>
    </div>
  `;
};

/**
 * Generate difficulty breakdown chart
 */
const generateDifficultyChart = (metrics: StrategyMetrics[]): string => {
  const difficulties = ['easy', 'medium', 'hard'];
  
  const datasets = metrics.map((m, index) => {
    const colors = [
      'rgba(54, 162, 235, 0.8)',
      'rgba(255, 206, 86, 0.8)',
      'rgba(75, 192, 192, 0.8)',
      'rgba(153, 102, 255, 0.8)',
      'rgba(255, 99, 132, 0.8)'
    ];
    
    return {
      label: m.strategy_name,
      data: difficulties.map(diff => 
        m.by_difficulty[diff] ? m.by_difficulty[diff].accuracy * 100 : 0
      ),
      backgroundColor: colors[index % colors.length],
      borderColor: colors[index % colors.length].replace('0.8', '1'),
      borderWidth: 1
    };
  });
  
  return `
    <div class="chart-container">
      <h3>Accuracy by Difficulty</h3>
      <canvas id="difficultyChart" width="400" height="200"></canvas>
      <script>
        const difficultyCtx = document.getElementById('difficultyChart').getContext('2d');
        new Chart(difficultyCtx, {
          type: 'bar',
          data: {
            labels: ${JSON.stringify(difficulties)},
            datasets: ${JSON.stringify(datasets)}
          },
          options: {
            responsive: true,
            scales: {
              y: {
                beginAtZero: true,
                max: 100,
                ticks: {
                  callback: function(value) {
                    return value + '%';
                  }
                }
              }
            },
            plugins: {
              title: {
                display: true,
                text: 'Accuracy by Query Difficulty'
              }
            }
          }
        });
      </script>
    </div>
  `;
};

/**
 * Generate summary table
 */
const generateSummaryTable = (report: ComparisonReport): string => {
  const rows = report.strategy_metrics.map(m => `
    <tr>
      <td>${m.strategy_name}</td>
      <td>${(m.accuracy * 100).toFixed(1)}%</td>
      <td>${(m.top_3_accuracy * 100).toFixed(1)}%</td>
      <td>${(m.top_5_accuracy * 100).toFixed(1)}%</td>
      <td>${m.mrr.toFixed(3)}</td>
      <td>${m.avg_execution_time_ms.toFixed(1)}ms</td>
      <td>${m.successful_predictions}/${m.total_cases}</td>
    </tr>
  `).join('');
  
  return `
    <div class="summary-section">
      <h3>Performance Summary</h3>
      <table class="summary-table">
        <thead>
          <tr>
            <th>Strategy</th>
            <th>Accuracy</th>
            <th>Top-3</th>
            <th>Top-5</th>
            <th>MRR</th>
            <th>Avg Time</th>
            <th>Success Rate</th>
          </tr>
        </thead>
        <tbody>
          ${rows}
        </tbody>
      </table>
    </div>
  `;
};

/**
 * Generate winner analysis
 */
const generateWinnerAnalysis = (report: ComparisonReport): string => {
  return `
    <div class="winners-section">
      <h3>Winner Analysis</h3>
      <div class="winner-grid">
        <div class="winner-card">
          <h4>🏆 Overall Winner</h4>
          <p class="winner-name">${report.winner_analysis.overall_winner}</p>
        </div>
        <div class="winner-card">
          <h4>⚡ Speed Winner</h4>
          <p class="winner-name">${report.winner_analysis.speed_winner}</p>
        </div>
      </div>
      
      <div class="breakdown-section">
        <div class="breakdown-col">
          <h4>Category Winners</h4>
          <ul>
            ${Object.entries(report.winner_analysis.category_winners)
              .map(([cat, winner]) => `<li><strong>${cat}:</strong> ${winner}</li>`)
              .join('')}
          </ul>
        </div>
        <div class="breakdown-col">
          <h4>Difficulty Winners</h4>
          <ul>
            ${Object.entries(report.winner_analysis.difficulty_winners)
              .map(([diff, winner]) => `<li><strong>${diff}:</strong> ${winner}</li>`)
              .join('')}
          </ul>
        </div>
      </div>
    </div>
  `;
};

/**
 * Generate complete HTML report
 */
const generateHTMLReport = (report: ComparisonReport): string => {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Tool Selection Benchmark Report</title>
    <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            line-height: 1.6;
            margin: 0;
            padding: 20px;
            background-color: #f5f5f5;
        }
        .container {
            max-width: 1200px;
            margin: 0 auto;
            background: white;
            padding: 30px;
            border-radius: 10px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }
        h1 {
            color: #333;
            text-align: center;
            margin-bottom: 30px;
        }
        h2 {
            color: #444;
            border-bottom: 2px solid #eee;
            padding-bottom: 10px;
        }
        h3 {
            color: #555;
            margin-top: 30px;
        }
        .meta-info {
            background: #f8f9fa;
            padding: 15px;
            border-radius: 5px;
            margin-bottom: 30px;
        }
        .chart-container {
            margin: 30px 0;
            background: white;
            padding: 20px;
            border-radius: 5px;
            border: 1px solid #eee;
        }
        .chart-row {
            display: flex;
            gap: 20px;
        }
        .chart-col {
            flex: 1;
        }
        .summary-table {
            width: 100%;
            border-collapse: collapse;
            margin: 20px 0;
        }
        .summary-table th,
        .summary-table td {
            padding: 12px;
            text-align: left;
            border-bottom: 1px solid #ddd;
        }
        .summary-table th {
            background-color: #f2f2f2;
            font-weight: 600;
        }
        .summary-table tr:hover {
            background-color: #f5f5f5;
        }
        .winner-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
            gap: 20px;
            margin: 20px 0;
        }
        .winner-card {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 20px;
            border-radius: 10px;
            text-align: center;
        }
        .winner-card h4 {
            margin: 0 0 10px 0;
            color: white;
        }
        .winner-name {
            font-size: 1.5em;
            font-weight: bold;
            margin: 0;
        }
        .breakdown-section {
            display: flex;
            gap: 40px;
            margin-top: 20px;
        }
        .breakdown-col {
            flex: 1;
        }
        .breakdown-col ul {
            list-style: none;
            padding: 0;
        }
        .breakdown-col li {
            padding: 5px 0;
            border-bottom: 1px solid #eee;
        }
        .breakdown-col li:last-child {
            border-bottom: none;
        }
        @media (max-width: 768px) {
            .chart-row,
            .breakdown-section {
                flex-direction: column;
            }
            .winner-grid {
                grid-template-columns: 1fr;
            }
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>🏆 Tool Selection Benchmark Report</h1>
        
        <div class="meta-info">
            <h3>📊 Report Information</h3>
            <p><strong>Dataset Version:</strong> ${report.comparison_info.dataset_version}</p>
            <p><strong>Evaluation Date:</strong> ${new Date(report.comparison_info.evaluated_at).toLocaleString()}</p>
            <p><strong>Split Used:</strong> ${report.comparison_info.split_used}</p>
            <p><strong>Test Cases:</strong> ${report.comparison_info.total_test_cases}</p>
            <p><strong>Strategies Compared:</strong> ${report.comparison_info.strategies_compared.join(', ')}</p>
        </div>

        ${generateSummaryTable(report)}
        
        ${generateWinnerAnalysis(report)}
        
        <h2>📈 Performance Charts</h2>
        
        ${generateAccuracyChart(report.strategy_metrics)}
        
        ${generatePerformanceChart(report.strategy_metrics)}
        
        ${generateCategoryChart(report.strategy_metrics)}
        
        ${generateDifficultyChart(report.strategy_metrics)}
        
        <div class="meta-info" style="margin-top: 40px;">
            <h3>📝 Notes</h3>
            <ul>
                <li><strong>Accuracy:</strong> Percentage of queries where the top result was correct</li>
                <li><strong>Top-K Accuracy:</strong> Percentage of queries where the correct result was in top K</li>
                <li><strong>MRR:</strong> Mean Reciprocal Rank - average of 1/rank of first correct result</li>
                <li><strong>Execution Time:</strong> Average time to generate results per query</li>
            </ul>
        </div>
    </div>
</body>
</html>
  `;
};

/**
 * Main function
 */
const main = async (): Promise<void> => {
  const args = process.argv.slice(2);
  const reportFile = args.find(arg => arg.startsWith('--input='))?.split('=')[1] || 'comparison-test-comparison.json';
  const outputName = args.find(arg => arg.startsWith('--output='))?.split('=')[1] || 'benchmark-report.html';
  
  console.log('📊 Generating HTML benchmark report...');
  console.log(`Input: ${reportFile}`);
  
  // Load comparison report
  const reportPath = join(BENCHMARKS_DIR, reportFile);
  if (!existsSync(reportPath)) {
    throw new Error(`Report file not found: ${reportPath}`);
  }
  
  const content = await readFile(reportPath, 'utf-8');
  const report = JSON.parse(content) as ComparisonReport;
  
  console.log(`Loaded report with ${report.strategy_metrics.length} strategies`);
  
  // Generate HTML report
  const htmlContent = generateHTMLReport(report);
  
  // Save HTML report
  const outputPath = join(BENCHMARKS_DIR, outputName);
  await writeFile(outputPath, htmlContent);
  
  console.log(`\\n✅ HTML report generated: ${outputPath}`);
  console.log('\\n📊 Report includes:');
  console.log('  - Performance summary table');
  console.log('  - Winner analysis');
  console.log('  - Interactive charts (accuracy, performance, breakdowns)');
  console.log('  - Responsive design for mobile/desktop');
  
  console.log(`\\n🌐 Open in browser: file://${outputPath}`);
};

// Run the main function
if (import.meta.main) {
  main().catch((error) => {
    console.error('Error:', error);
    process.exit(1);
  });
}