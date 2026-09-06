/**
 * THE LATENT ENGINE - Main Application Controller
 * Orchestrates the neural engine, visualizer, benchmark tasks, guide, and charts.
 */

import { BDHEngine } from './engine.js';
import { Visualizer } from './visualizer.js';
import { ChartRenderer } from './charts.js';
import { GuideController } from './guide.js';
import { BDHModule } from './bdh-module.js';
import { BENCHMARK_TASKS, ARC_COLORS } from './tasks.js';

export class App {
  constructor() {
    // Core state
    this.activeTab = 'guide'; // 'guide' | 'sandbox' | 'architecture'
    this.currentTaskIndex = 0;
    this.currentTask = { ...BENCHMARK_TASKS[0] };
    this.stepsK = 8;
    this.sparsityRatio = 0.05;
    this.noiseSigma = 0.0;
    this.reasoningMode = 'latent'; // 'latent' | 'cot'
    this.isCustomMode = false;

    // Grid working state
    this.workingInputGrid = [...this.currentTask.inputGrid];
    this.workingGroundTruth = [...this.currentTask.groundTruth];

    // Modules
    this.engine = new BDHEngine(64, 10);
    this.visualizer = new Visualizer();
    this.chart = new ChartRenderer('paretoChartSvg');
    this.guide = new GuideController(this);
    this.bdhModule = new BDHModule('bdhModuleContainer');

    // Debounce timer for smooth 60fps slider updates
    this.updateDebounceTimer = null;
  }

  init() {
    this.bdhModule.render();
    this.bindDOMEvents();
    this.renderTaskSelector();
    this.renderColorPalettePicker();
    this.guide.renderStep();

    // Visualizer interactive click callback for custom painting
    this.visualizer.onCellClickCallback = (index, colorVal) => {
      this.handleCellPaint(index, colorVal);
    };

    // Run initial live computation immediately
    this.runSimulation();

    // Window resize handler for canvas and SVG responsiveness
    window.addEventListener('resize', () => {
      if (this.lastResult) {
        this.visualizer.renderLatentHeatmap(this.lastResult.stateHistory, this.lastResult.activeSparsityHistory);
        this.chart.renderParetoFrontier(this.stepsK, this.lastResult.metrics.accuracy, 16);
      }
    });
  }

  /**
   * Executes the real computational forward pass and updates all visual components
   */
  runSimulation() {
    const params = {
      width: this.currentTask.width,
      height: this.currentTask.height,
      stepsK: this.stepsK,
      sparsityRatio: this.sparsityRatio,
      noiseSigma: this.noiseSigma,
      ruleType: this.currentTask.ruleType
    };

    // Real mathematical forward pass
    const result = this.engine.forward(
      this.workingInputGrid,
      this.workingGroundTruth,
      params
    );

    this.lastResult = result;

    // Render 4-Panel Truth Beside Estimate
    this.visualizer.renderTruthBesideEstimate(
      this.workingInputGrid,
      result.predictedGrid,
      this.workingGroundTruth,
      result.confidenceGrid,
      this.currentTask.width,
      this.currentTask.height,
      this.isCustomMode
    );

    // Render Latent State Vector Heatmap (Top-K ~5% sparse activations)
    this.visualizer.renderLatentHeatmap(
      result.stateHistory,
      result.activeSparsityHistory
    );

    // Update Live Metrics HUD
    this.visualizer.updateMetricsHUD(
      result.metrics,
      result.cotMetrics,
      this.stepsK,
      this.sparsityRatio
    );

    // Render Dynamic Pareto Frontier Chart
    this.chart.renderParetoFrontier(
      this.stepsK,
      result.metrics.accuracy,
      16
    );
  }

  /**
   * Schedule update with debouncing for ultra-fluid 60fps interaction
   */
  scheduleUpdate() {
    if (this.updateDebounceTimer) {
      cancelAnimationFrame(this.updateDebounceTimer);
    }
    this.updateDebounceTimer = requestAnimationFrame(() => {
      this.runSimulation();
    });
  }

  // =========================================================================
  // DOM EVENT BINDINGS & CONTROLS
  // =========================================================================
  bindDOMEvents() {
    // Mode switcher tabs
    document.querySelectorAll('.tab-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const tab = e.currentTarget.dataset.tab;
        this.switchMainTab(tab);
      });
    });

    // Recurrent Steps Slider K
    const sliderK = document.getElementById('sliderStepsK');
    const valK = document.getElementById('valSliderK');
    if (sliderK) {
      sliderK.addEventListener('input', (e) => {
        this.stepsK = parseInt(e.target.value, 10);
        if (valK) valK.textContent = this.stepsK;
        this.scheduleUpdate();
      });
    }

    // BDH Biological Sparsity Slider
    const sliderSparsity = document.getElementById('sliderSparsity');
    const valSparsity = document.getElementById('valSliderSparsity');
    if (sliderSparsity) {
      sliderSparsity.addEventListener('input', (e) => {
        this.sparsityRatio = parseFloat(e.target.value);
        if (valSparsity) valSparsity.textContent = `${Math.round(this.sparsityRatio * 100)}%`;
        this.scheduleUpdate();
      });
    }

    // Noise Perturbation Slider
    const sliderNoise = document.getElementById('sliderNoise');
    const valNoise = document.getElementById('valSliderNoise');
    if (sliderNoise) {
      sliderNoise.addEventListener('input', (e) => {
        this.noiseSigma = parseFloat(e.target.value);
        if (valNoise) valNoise.textContent = this.noiseSigma.toFixed(2);
        this.scheduleUpdate();
      });
    }

    // Reasoning Mode Toggles
    const btnModeLatent = document.getElementById('btnModeLatent');
    const btnModeCot = document.getElementById('btnModeCot');
    if (btnModeLatent) {
      btnModeLatent.addEventListener('click', () => this.setReasoningMode('latent'));
    }
    if (btnModeCot) {
      btnModeCot.addEventListener('click', () => this.setReasoningMode('cot'));
    }

    // Quick jump button from header
    const btnHeaderSandbox = document.getElementById('btnHeaderSandbox');
    if (btnHeaderSandbox) {
      btnHeaderSandbox.addEventListener('click', () => this.switchMainTab('sandbox'));
    }

    // Custom Grid Painter Action Buttons
    const btnClearGrid = document.getElementById('btnClearGrid');
    const btnRandomizeGrid = document.getElementById('btnRandomizeGrid');
    const btnInvertGrid = document.getElementById('btnInvertGrid');

    if (btnClearGrid) {
      btnClearGrid.addEventListener('click', () => {
        this.workingInputGrid.fill(0);
        this.scheduleUpdate();
      });
    }

    if (btnRandomizeGrid) {
      btnRandomizeGrid.addEventListener('click', () => {
        for (let i = 0; i < this.workingInputGrid.length; i++) {
          this.workingInputGrid[i] = Math.floor(Math.random() * 6);
        }
        this.scheduleUpdate();
      });
    }

    if (btnInvertGrid) {
      btnInvertGrid.addEventListener('click', () => {
        for (let i = 0; i < this.workingInputGrid.length; i++) {
          if (this.workingInputGrid[i] !== 0) {
            this.workingInputGrid[i] = (this.workingInputGrid[i] % 9) + 1;
          }
        }
        this.scheduleUpdate();
      });
    }
  }

  switchMainTab(tab) {
    this.activeTab = tab;
    document.querySelectorAll('.tab-btn').forEach(b => {
      b.classList.toggle('active', b.dataset.tab === tab);
    });

    const guideSec = document.getElementById('sectionGuide');
    const sandboxSec = document.getElementById('sectionSandbox');
    const archSec = document.getElementById('sectionArchitecture');

    if (guideSec) guideSec.style.display = tab === 'guide' ? 'block' : 'none';
    if (sandboxSec) sandboxSec.style.display = tab === 'sandbox' ? 'block' : 'none';
    if (archSec) archSec.style.display = tab === 'architecture' ? 'block' : 'none';

    // Highlight interactive grid editor when sandbox is active
    this.isCustomMode = (tab === 'sandbox');
    const customTools = document.getElementById('customEditorTools');
    if (customTools) {
      customTools.style.display = tab === 'sandbox' ? 'flex' : 'none';
    }

    this.runSimulation();
  }

  setReasoningMode(mode) {
    this.reasoningMode = mode;
    const btnLatent = document.getElementById('btnModeLatent');
    const btnCot = document.getElementById('btnModeCot');

    if (btnLatent) btnLatent.classList.toggle('active', mode === 'latent');
    if (btnCot) btnCot.classList.toggle('active', mode === 'cot');

    const cotHud = document.getElementById('cotComparisonCard');
    if (cotHud) {
      cotHud.style.display = mode === 'cot' ? 'block' : 'none';
    }

    this.scheduleUpdate();
  }

  setRecurrentSteps(k) {
    this.stepsK = k;
    const slider = document.getElementById('sliderStepsK');
    const label = document.getElementById('valSliderK');
    if (slider) slider.value = k;
    if (label) label.textContent = k;
    this.scheduleUpdate();
  }

  setSparsityRatio(ratio) {
    this.sparsityRatio = ratio;
    const slider = document.getElementById('sliderSparsity');
    const label = document.getElementById('valSliderSparsity');
    if (slider) slider.value = ratio;
    if (label) label.textContent = `${Math.round(ratio * 100)}%`;
    this.scheduleUpdate();
  }

  /**
   * Renders the benchmark task selection pills
   */
  renderTaskSelector() {
    const container = document.getElementById('taskPillList');
    if (!container) return;
    container.innerHTML = '';

    BENCHMARK_TASKS.forEach((task, idx) => {
      const pill = document.createElement('div');
      pill.className = `task-pill ${idx === this.currentTaskIndex ? 'active' : ''}`;
      pill.innerHTML = `
        <div class="task-pill-info">
          <div class="task-pill-name">${task.name}</div>
          <div class="task-pill-rule">${task.category} · ${task.width}x${task.height}</div>
        </div>
        <div class="task-pill-tag">${task.difficulty}</div>
      `;

      pill.addEventListener('click', () => {
        this.selectTask(idx);
      });

      container.appendChild(pill);
    });
  }

  selectTask(index) {
    this.currentTaskIndex = index;
    this.currentTask = { ...BENCHMARK_TASKS[index] };
    this.workingInputGrid = [...this.currentTask.inputGrid];
    this.workingGroundTruth = [...this.currentTask.groundTruth];
    this.stepsK = this.currentTask.defaultSteps || 8;

    const slider = document.getElementById('sliderStepsK');
    const label = document.getElementById('valSliderK');
    if (slider) slider.value = this.stepsK;
    if (label) label.textContent = this.stepsK;

    const taskTitle = document.getElementById('activeTaskTitle');
    const taskDesc = document.getElementById('activeTaskDescription');
    if (taskTitle) taskTitle.textContent = this.currentTask.name;
    if (taskDesc) taskDesc.textContent = this.currentTask.description;

    this.renderTaskSelector();
    this.runSimulation();
  }

  /**
   * Renders the ARC 10-Color Palette Swatches for interactive grid painting
   */
  renderColorPalettePicker() {
    const container = document.getElementById('colorSwatchPicker');
    if (!container) return;
    container.innerHTML = '';

    ARC_COLORS.forEach(color => {
      const btn = document.createElement('div');
      btn.className = `color-swatch-btn ${color.id === this.visualizer.activeBrushColor ? 'active' : ''}`;
      btn.style.backgroundColor = color.hex;
      btn.title = `Color ${color.id}: ${color.name}`;

      btn.addEventListener('click', () => {
        this.visualizer.activeBrushColor = color.id;
        document.querySelectorAll('.color-swatch-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
      });

      container.appendChild(btn);
    });
  }

  handleCellPaint(cellIndex, colorVal) {
    if (cellIndex >= 0 && cellIndex < this.workingInputGrid.length) {
      this.workingInputGrid[cellIndex] = colorVal;
      // Auto-adapt ground truth for spatial symmetry task reflection
      if (this.currentTask.ruleType === 'symmetry') {
        const w = this.currentTask.width;
        const r = Math.floor(cellIndex / w);
        const c = cellIndex % w;
        const reflectedCol = (w - 1) - c;
        const targetIndex = r * w + reflectedCol;
        // Invert polarity: 1->2, 3->4, etc.
        const targetColor = colorVal === 0 ? 0 : (colorVal % 2 === 1 ? colorVal + 1 : colorVal - 1);
        this.workingGroundTruth[targetIndex] = targetColor;
      }
      this.scheduleUpdate();
    }
  }
}

// Global bootstrap on DOM ready
document.addEventListener('DOMContentLoaded', () => {
  window.latentEngineApp = new App();
  window.latentEngineApp.init();
});
