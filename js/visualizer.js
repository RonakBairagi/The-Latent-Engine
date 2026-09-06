/**
 * THE LATENT ENGINE - Visualizer & Truth Beside Estimate UI Renderer
 * Renders the 4-panel comparison, discrepancy heatmap, interactive grid cells,
 * and the HTML5 canvas latent state vector activation heatmap.
 */

import { ARC_COLORS } from './tasks.js';

export class Visualizer {
  constructor() {
    // DOM Container references
    this.containerInput = document.getElementById('gridInput');
    this.containerEstimate = document.getElementById('gridEstimate');
    this.containerTruth = document.getElementById('gridTruth');
    this.containerDelta = document.getElementById('gridDelta');
    this.canvasLatent = document.getElementById('latentCanvas');
    this.canvasCtx = this.canvasLatent ? this.canvasLatent.getContext('2d') : null;

    // Hover tooltip
    this.tooltip = this.createTooltip();

    // Active brush color for interactive editing
    this.activeBrushColor = 1;
    this.onCellClickCallback = null;
  }

  createTooltip() {
    let tip = document.getElementById('cellTooltip');
    if (!tip) {
      tip = document.createElement('div');
      tip.id = 'cellTooltip';
      tip.className = 'cell-tooltip';
      tip.style.display = 'none';
      document.body.appendChild(tip);
    }
    return tip;
  }

  /**
   * Renders the complete 4-Panel "Truth Beside Estimate" suite
   */
  renderTruthBesideEstimate(inputGrid, predictedGrid, groundTruth, confidences, width, height, isInteractive = false) {
    this.renderGrid(this.containerInput, inputGrid, width, height, 'input', isInteractive);
    this.renderEstimateGrid(this.containerEstimate, predictedGrid, groundTruth, confidences, width, height);
    this.renderGrid(this.containerTruth, groundTruth, width, height, 'truth', false);
    this.renderDeltaGrid(this.containerDelta, predictedGrid, groundTruth, width, height);
  }

  /**
   * Renders a standard static or editable grid
   */
  renderGrid(container, data, width, height, type, isInteractive) {
    if (!container) return;
    container.innerHTML = '';
    
    const gridEl = document.createElement('div');
    gridEl.className = `arc-grid ${isInteractive ? 'interactive' : ''}`;
    gridEl.style.gridTemplateColumns = `repeat(${width}, 32px)`;

    for (let i = 0; i < width * height; i++) {
      const cell = document.createElement('div');
      const val = data[i];
      cell.className = `arc-cell arc-color-${val}`;
      cell.dataset.index = i;
      cell.dataset.row = Math.floor(i / width);
      cell.dataset.col = i % width;
      cell.dataset.val = val;

      if (isInteractive) {
        cell.addEventListener('click', () => {
          if (this.onCellClickCallback) {
            this.onCellClickCallback(i, this.activeBrushColor);
          }
        });
      }

      this.attachTooltipEvents(cell, `(${cell.dataset.row}, ${cell.dataset.col}) | Value: ${val} (${ARC_COLORS[val]?.name || 'Color'})`);
      gridEl.appendChild(cell);
    }

    container.appendChild(gridEl);
  }

  /**
   * Renders the Live Model Estimate grid with match/mismatch indicators and confidence
   */
  renderEstimateGrid(container, predicted, groundTruth, confidences, width, height) {
    if (!container) return;
    container.innerHTML = '';

    const gridEl = document.createElement('div');
    gridEl.className = 'arc-grid';
    gridEl.style.gridTemplateColumns = `repeat(${width}, 32px)`;

    for (let i = 0; i < width * height; i++) {
      const cell = document.createElement('div');
      const predVal = predicted[i];
      const targetVal = groundTruth[i];
      const isMatch = predVal === targetVal;
      const conf = confidences ? Math.round(confidences[i] * 100) : 100;

      cell.className = `arc-cell arc-color-${predVal} ${isMatch ? 'cell-match' : 'cell-mismatch'}`;
      cell.dataset.index = i;
      cell.dataset.row = Math.floor(i / width);
      cell.dataset.col = i % width;

      // Subtle confidence opacity
      cell.style.opacity = Math.max(0.45, conf / 100);

      const statusText = isMatch ? '✓ Correct' : `✗ Error (Expected ${targetVal})`;
      this.attachTooltipEvents(cell, `Cell (${cell.dataset.row}, ${cell.dataset.col}) | Est: ${predVal} | ${statusText} | Conf: ${conf}%`);

      gridEl.appendChild(cell);
    }

    container.appendChild(gridEl);
  }

  /**
   * Renders the Discrepancy / Error Heatmap
   */
  renderDeltaGrid(container, predicted, groundTruth, width, height) {
    if (!container) return;
    container.innerHTML = '';

    const gridEl = document.createElement('div');
    gridEl.className = 'arc-grid';
    gridEl.style.gridTemplateColumns = `repeat(${width}, 32px)`;

    for (let i = 0; i < width * height; i++) {
      const cell = document.createElement('div');
      const predVal = predicted[i];
      const targetVal = groundTruth[i];
      const isMatch = predVal === targetVal;

      if (isMatch) {
        cell.className = 'arc-cell delta-cell-match';
        cell.textContent = '0';
      } else {
        cell.className = 'arc-cell delta-cell-error';
        cell.textContent = `Δ`;
      }

      const diffText = isMatch ? 'Match (Zero Loss)' : `Discrepancy: Pred ${predVal} vs Truth ${targetVal}`;
      this.attachTooltipEvents(cell, `(${Math.floor(i / width)}, ${i % width}) | ${diffText}`);
      gridEl.appendChild(cell);
    }

    container.appendChild(gridEl);
  }

  /**
   * Renders the Latent State Vector Heatmap (Visualizing all 64 neurons over K steps)
   * Highlighting Pathway BDH's signature ~5% Top-K sparse non-negative firing!
   */
  renderLatentHeatmap(stateHistory, activeSparsityHistory) {
    if (!this.canvasLatent || !stateHistory || stateHistory.length === 0) return;
    const ctx = this.canvasCtx;
    const numSteps = stateHistory.length; // K+1 (from 0 to K)
    const latentDim = stateHistory[0].length; // 64

    // Ensure internal resolution matches client display
    const dpr = window.devicePixelRatio || 1;
    const displayWidth = this.canvasLatent.parentElement.clientWidth - 24;
    const displayHeight = 130;

    this.canvasLatent.width = displayWidth * dpr;
    this.canvasLatent.height = displayHeight * dpr;
    this.canvasLatent.style.width = `${displayWidth}px`;
    this.canvasLatent.style.height = `${displayHeight}px`;
    ctx.scale(dpr, dpr);

    ctx.fillStyle = '#03060c';
    ctx.fillRect(0, 0, displayWidth, displayHeight);

    const stepWidth = displayWidth / numSteps;
    const neuronHeight = displayHeight / latentDim;

    for (let s = 0; s < numSteps; s++) {
      const vec = stateHistory[s];
      for (let i = 0; i < latentDim; i++) {
        const val = vec[i]; // Normalized / activated value
        
        let color = '#090d16'; // Inhibited baseline
        if (val > 0.01) {
          if (val > 1.8) {
            // Top active peak (BDH 5% sparse neuron)
            color = '#38bdf8'; // Bright cyan
          } else if (val > 1.2) {
            color = '#06b6d4'; // Cyan
          } else if (val > 0.6) {
            color = '#6366f1'; // Indigo
          } else {
            color = '#312e81'; // Deep violet
          }
        }

        ctx.fillStyle = color;
        ctx.fillRect(s * stepWidth, i * neuronHeight, stepWidth - 0.5, neuronHeight);
      }
    }

    // Draw vertical step divider lines
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
    ctx.lineWidth = 1;
    for (let s = 0; s <= numSteps; s++) {
      ctx.beginPath();
      ctx.moveTo(s * stepWidth, 0);
      ctx.lineTo(s * stepWidth, displayHeight);
      ctx.stroke();
    }
  }

  /**
   * Updates top bar and HUD metrics
   */
  updateMetricsHUD(metrics, cotMetrics, stepsK, sparsityRatio) {
    // Latent Engine Metrics
    this.setElementText('valAccuracy', `${metrics.accuracy}%`);
    this.setElementText('valLoss', metrics.loss.toFixed(3));
    this.setElementText('valMismatches', `${metrics.mismatchIndices.length} / ${metrics.totalCells}`);
    this.setElementText('valLatency', `${metrics.latencyMs} ms`);
    this.setElementText('valMemory', `${metrics.memoryBytes} B`);
    this.setElementText('valCost', `$${metrics.costUsd.toFixed(4)}`);
    this.setElementText('valActiveSparsity', `${Math.round(sparsityRatio * 100)}% (~${Math.round(64 * sparsityRatio)} units)`);

    // Color accuracy badge dynamically
    const accBadge = document.getElementById('badgeAccuracy');
    if (accBadge) {
      accBadge.className = `metric-pill ${metrics.accuracy === 100 ? 'success' : metrics.accuracy >= 70 ? 'warning' : 'danger'}`;
    }

    // CoT Counterfactual Metrics
    if (cotMetrics) {
      this.setElementText('cotTokens', `${cotMetrics.tokensGenerated} tokens`);
      this.setElementText('cotKvCache', `${cotMetrics.kvCacheMB} MB`);
      this.setElementText('cotLatency', `${cotMetrics.latencyMs} ms`);
      this.setElementText('cotCost', `$${cotMetrics.costUsd.toFixed(4)}`);
    }
  }

  setElementText(id, text) {
    const el = document.getElementById(id);
    if (el) el.textContent = text;
  }

  attachTooltipEvents(element, text) {
    element.addEventListener('mouseenter', (e) => {
      this.tooltip.textContent = text;
      this.tooltip.style.display = 'block';
      this.positionTooltip(e);
    });
    element.addEventListener('mousemove', (e) => {
      this.positionTooltip(e);
    });
    element.addEventListener('mouseleave', () => {
      this.tooltip.style.display = 'none';
    });
  }

  positionTooltip(e) {
    const x = e.clientX + 12;
    const y = e.clientY + 12;
    this.tooltip.style.left = `${x}px`;
    this.tooltip.style.top = `${y}px`;
  }
}
