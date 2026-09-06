/**
 * THE LATENT ENGINE - Dynamic SVG Pareto Frontier & Cost-Compute Charts
 * Renders the empirical trade-off: Recurrent Steps K vs Accuracy vs Latency vs Token CoT
 */

export class ChartRenderer {
  constructor(containerId = 'paretoChartSvg') {
    this.container = document.getElementById(containerId);
  }

  /**
   * Renders the dynamic Pareto Frontier curve based on current task difficulty and K
   */
  renderParetoFrontier(currentK, currentAccuracy, maxSteps = 16) {
    if (!this.container) return;

    // Chart dimensions
    const width = this.container.clientWidth || 540;
    const height = 240;
    const padding = { top: 25, right: 35, bottom: 40, left: 55 };
    const chartW = width - padding.left - padding.right;
    const chartH = height - padding.top - padding.bottom;

    // Generate theoretical Pareto curve points for K = 1..maxSteps
    // Demonstrating logarithmic/sigmoidal accuracy growth with diminishing returns
    const bdhPoints = [];
    const cotPoints = [];

    for (let k = 1; k <= maxSteps; k++) {
      // BDH Latent Recurrence: fast saturation towards 100%
      const acc = Math.min(100, Math.round(100 * (1 - Math.exp(-0.42 * k)) * (1 - 0.05 * Math.sin(k * 0.5))));
      const latency = Math.round(0.75 * k + 0.5); // Sub-linear fast compute
      bdhPoints.push({ k, acc, latency });

      // CoT Autoregressive: slow verbal tokens, high latency
      const cotTokens = Math.round(150 + k * 45);
      const cotLatency = Math.round(cotTokens * 14.5);
      cotPoints.push({ k, acc, latency: cotLatency, tokens: cotTokens });
    }

    // Coordinate mapping helpers
    const scaleX = (k) => padding.left + ((k - 1) / (maxSteps - 1)) * chartW;
    const scaleY = (acc) => padding.top + chartH - (acc / 100) * chartH;

    // Build SVG Path for BDH Latent Recurrence
    let pathD = `M ${scaleX(bdhPoints[0].k)} ${scaleY(bdhPoints[0].acc)}`;
    for (let i = 1; i < bdhPoints.length; i++) {
      pathD += ` L ${scaleX(bdhPoints[i].k)} ${scaleY(bdhPoints[i].acc)}`;
    }

    // Current operating point
    const currX = scaleX(currentK);
    const currY = scaleY(currentAccuracy);

    // Render Clean High-End SVG
    this.container.innerHTML = `
      <svg width="100%" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg" style="overflow: visible;">
        <defs>
          <!-- Neon Glow Filters -->
          <filter id="glow-cyan" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
          <filter id="glow-primary" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="4" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
          <linearGradient id="areaGradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stop-color="#06b6d4" stop-opacity="0.3" />
            <stop offset="100%" stop-color="#06b6d4" stop-opacity="0.0" />
          </linearGradient>
        </defs>

        <!-- Background grid lines -->
        ${[0, 25, 50, 75, 100].map(val => `
          <line x1="${padding.left}" y1="${scaleY(val)}" x2="${width - padding.right}" y2="${scaleY(val)}" stroke="rgba(255, 255, 255, 0.06)" stroke-dasharray="3,3" />
          <text x="${padding.left - 10}" y="${scaleY(val) + 4}" fill="#64748b" font-size="10" font-family="'JetBrains Mono', monospace" text-anchor="end">${val}%</text>
        `).join('')}

        <!-- X Axis Ticks (Recurrent Steps K) -->
        ${[1, 4, 8, 12, 16].map(k => `
          <line x1="${scaleX(k)}" y1="${height - padding.bottom}" x2="${scaleX(k)}" y2="${height - padding.bottom + 5}" stroke="#475569" />
          <text x="${scaleX(k)}" y="${height - padding.bottom + 18}" fill="#94a3b8" font-size="10" font-family="'JetBrains Mono', monospace" text-anchor="middle">K=${k}</text>
        `).join('')}

        <!-- Axis Labels -->
        <text x="${width / 2}" y="${height - 5}" fill="#94a3b8" font-size="11" font-family="'Inter', sans-serif" font-weight="600" text-anchor="middle">Recurrent Inference Steps (Compute Allocation K)</text>
        <text transform="rotate(-90)" x="${-(height / 2)}" y="18" fill="#94a3b8" font-size="11" font-family="'Inter', sans-serif" font-weight="600" text-anchor="middle">Spatial Accuracy (%)</text>

        <!-- Pareto Diminishing Returns Critical Threshold Area (K >= 8) -->
        <rect x="${scaleX(8)}" y="${padding.top}" width="${scaleX(maxSteps) - scaleX(8)}" height="${chartH}" fill="rgba(245, 158, 11, 0.04)" />
        <text x="${(scaleX(8) + scaleX(maxSteps)) / 2}" y="${padding.top + 16}" fill="#f59e0b" font-size="9" font-family="'JetBrains Mono', monospace" text-anchor="middle" letter-spacing="0.05em">DIMINISHING RETURNS ZONE</text>

        <!-- Filled Gradient Area -->
        <path d="${pathD} L ${scaleX(maxSteps)} ${scaleY(0)} L ${scaleX(1)} ${scaleY(0)} Z" fill="url(#areaGradient)" />

        <!-- BDH-CQ Pareto Line -->
        <path d="${pathD}" fill="none" stroke="#06b6d4" stroke-width="3" filter="url(#glow-cyan)" />

        <!-- Active Operating Point Marker -->
        <circle cx="${currX}" cy="${currY}" r="7" fill="#6366f1" stroke="#ffffff" stroke-width="2.5" filter="url(#glow-primary)" />
        <circle cx="${currX}" cy="${currY}" r="12" fill="none" stroke="#6366f1" stroke-width="1" opacity="0.6">
          <animate attributeName="r" values="7;16;7" dur="2s" repeatCount="indefinite" />
          <animate attributeName="opacity" values="0.8;0;0.8" dur="2s" repeatCount="indefinite" />
        </circle>

        <!-- Current Value Callout Badge -->
        <g transform="translate(${Math.min(width - 120, Math.max(padding.left + 60, currX))}, ${Math.max(padding.top + 20, currY - 25)})">
          <rect x="-48" y="-14" width="96" height="24" rx="4" fill="#0d1424" stroke="#6366f1" stroke-width="1.5" />
          <text x="0" y="2" fill="#ffffff" font-size="10" font-family="'JetBrains Mono', monospace" font-weight="700" text-anchor="middle">K=${currentK} | ${currentAccuracy}%</text>
        </g>
      </svg>
    `;
  }
}
