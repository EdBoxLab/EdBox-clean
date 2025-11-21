import { Language, SceneDefinition, VisualizationMode } from './types';

export const SCENES: SceneDefinition[] = [
  {
    id: 'bubble-sort',
    name: 'Sorting Visualizer',
    description: 'Interactive Bubble Sort visualization using the Chart renderer.',
    language: Language.JavaScript,
    defaultViz: VisualizationMode.Chart,
    code: `// Bubble Sort Visualization
// Global 'visualize(type, data)' and 'sleep(ms)' are available.

async function runSort() {
  log("Initializing random array...");
  
  // Generate random data
  let arr = Array.from({length: 15}, (_, i) => ({
    name: i, 
    value: Math.floor(Math.random() * 100)
  }));
  
  visualize('chart', arr);
  await sleep(500);

  let n = arr.length;
  for (let i = 0; i < n - 1; i++) {
    for (let j = 0; j < n - i - 1; j++) {
      
      // Highlight comparison (optional logic could go here)
      
      if (arr[j].value > arr[j + 1].value) {
        // Swap
        let temp = arr[j].value;
        arr[j].value = arr[j + 1].value;
        arr[j + 1].value = temp;
        
        // Update visualization
        visualize('chart', [...arr]);
        log(\`Swapped index \${j} and \${j+1}\`);
        await sleep(100); 
      }
    }
  }
  log("Sorting complete!");
}

runSort();`
  },
  {
    id: 'data-science',
    name: 'Data Analysis (Python)',
    description: 'Simulated Python data science workflow using Gemini for execution.',
    language: Language.Python,
    defaultViz: VisualizationMode.None,
    code: `# Python Data Analysis Simulation
# This code is executed by the AI Runtime.

import numpy as np

def analyze_growth():
    years = [2020, 2021, 2022, 2023, 2024]
    values = [100, 120, 150, 210, 300]
    
    growth_rate = (values[-1] - values[0]) / values[0] * 100
    
    print(f"Data Points: {list(zip(years, values))}")
    print(f"Total Growth over 5 years: {growth_rate}%")
    
    # AI will detect this print and explain the trend
    return "Analysis Complete"

analyze_growth()`
  },
  {
    id: 'web-dom',
    name: 'Interactive DOM',
    description: 'Direct DOM manipulation sandbox.',
    language: Language.HTML,
    defaultViz: VisualizationMode.DOM,
    code: `<style>
  .box {
    width: 100px;
    height: 100px;
    background: linear-gradient(45deg, #ff6b6b, #feca57);
    border-radius: 12px;
    transition: all 0.3s ease;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    color: white;
    font-weight: bold;
  }
  .box:hover {
    transform: scale(1.1) rotate(5deg);
  }
  .container {
    display: flex;
    gap: 20px;
    padding: 40px;
    justify-content: center;
  }
</style>

<div class="container">
  <div class="box" onclick="alert('Clicked Box 1')">Box 1</div>
  <div class="box" onclick="this.style.filter = 'hue-rotate(90deg)'">Box 2</div>
</div>

<div style="text-align:center; color: #aaa; margin-top: 20px;">
  Hover and click the elements!
</div>`
  }
];
