/**
 * THE LATENT ENGINE - Guided Tutorial & Narrative Controller
 * Implements the "Guide, then Sandbox" 5-Milestone Walkthrough.
 */

export class GuideController {
  constructor(app) {
    this.app = app;
    this.currentStep = 1;
    this.totalSteps = 5;

    this.stepData = [
      {
        step: 1,
        title: 'The KV-Cache Wall & The CoT Tax',
        badge: 'Milestone 1 · The Frontier Bottleneck',
        body: `
          Traditional frontier LLMs (like OpenAI o1/o3 or DeepSeek R1) scale inference compute by emitting 
          <strong>hundreds of intermediate Chain-of-Thought (CoT) natural language tokens</strong>.
          <br><br>
          While powerful, this forces high-dimensional spatial and mathematical intuitions through a 
          <strong>1D discrete text serialization bottleneck</strong>. Worse, every generated token expands the 
          <strong>Key-Value (KV) Cache</strong> linearly ($O(N)$ memory), inflating latency to several seconds and 
          driving task costs up to <strong>$0.02 - $0.06 per task</strong>.
        `,
        formula: 'KV_Memory = 2 \\times L_{layers} \\times d_{model} \\times T_{tokens} \\times \\text{sizeof}(FP16) \\propto O(N)',
        actionPrompt: 'Look at the Live Resource HUD: notice how the CoT counterfactual uses megabytes of memory and high latency.',
        onEnter: () => {
          this.app.setReasoningMode('cot');
          this.app.setRecurrentSteps(4);
        }
      },
      {
        step: 2,
        title: 'Thinking in Continuous Latents (BDH-CQ)',
        badge: 'Milestone 2 · Recurrent Latent Reasoning',
        body: `
          Pathway's <strong>BDH-CQ (Baby Dragon Hatchling - Continuous Queries)</strong> shifts the reasoning paradigm:
          instead of verbalizing tokens, the network <strong>"thinks" internally by iteratively updating a fixed-size continuous latent vector</strong> $z^{(k)} \\in \\mathbb{R}^D$.
          <br><br>
          Because no intermediate text tokens are generated, the sequence length never increases! 
          The memory footprint is strictly <strong>$O(1)$ constant</strong> (a mere 256 bytes for $D=64$), allowing the model 
          to execute multiple internal "deliberation" loops in parallel GPU memory.
        `,
        formula: 'z^{(k+1)} = \\text{LayerNorm}\\Big(z^{(k)} + f_\\theta\\big(z^{(k)}, x\\big)\\Big) \\quad \\text{with } \\text{Memory} = O(1)',
        actionPrompt: 'We switched to BDH-CQ Latent Reasoning at K=2. Notice how prediction is still coarse with several red mismatch cells.',
        onEnter: () => {
          this.app.setReasoningMode('latent');
          this.app.setRecurrentSteps(2);
        }
      },
      {
        step: 3,
        title: 'Biological Sparsity: The 5% Firing Rule',
        badge: 'Milestone 3 · BDH Architecture Prior',
        body: `
          In Pathway's foundational <strong>Dragon Hatchling architecture (arXiv:2509.26507)</strong>, the network is biologically 
          grounded: neurons employ <strong>sparse, non-negative activations</strong> where only <strong>~5% of units fire simultaneously</strong>, 
          governed by lateral inhibition.
          <br><br>
          Unlike dense Transformer vectors where all weights activate, BDH's 5% sparsity promotes 
          <strong>monosemanticity</strong> (each neuron binds to a distinct spatial or semantic concept) and prevents 
          catastrophic crosstalk between internal reasoning loops.
        `,
        formula: 'a_{\\text{sparse}} = \\text{TopK}_{5\\%}\\Big(\\text{ReLU}\\big(W_{rec} z^{(k)} + W_{in} x + b\\big)\\Big)',
        actionPrompt: 'Inspect the Latent State Vector Heatmap below: observe how only a few select cyan neurons fire at each step.',
        onEnter: () => {
          this.app.setReasoningMode('latent');
          this.app.setSparsityRatio(0.05);
          this.app.setRecurrentSteps(4);
        }
      },
      {
        step: 4,
        title: 'Observing Convergence in Real Time',
        badge: 'Milestone 4 · Truth Beside Estimate',
        body: `
          Here lies the core learning moment: <strong>Truth Beside Estimate</strong>.
          On your screen, the <em>Live Model Estimate</em> is shown directly next to the <em>Ground Truth Target</em>, 
          alongside an illuminated <em>Discrepancy / Error Heatmap</em>.
          <br><br>
          At step $K=1$, the model has high entropy and makes geometric errors. But as we allocate more recurrent inference steps, 
          the continuous latent state relaxes into the correct attractor basin, resolving spatial symmetry, colors, and constraints!
        `,
        formula: '\\Delta_i = \\mathbb{I}\\big(\\hat{y}_i^{(K)} \\neq y^*_i\\big) \\longrightarrow 0 \\quad \\text{as } K \\to K^*',
        actionPrompt: 'Try dragging the "Recurrent Steps (K)" slider up to K=8. Watch the red discrepancy cells turn into green zero-loss matches!',
        onEnter: () => {
          this.app.setReasoningMode('latent');
          this.app.setRecurrentSteps(8);
        }
      },
      {
        step: 5,
        title: 'The Empirical Pareto Frontier & Diminishing Returns',
        badge: 'Milestone 5 · Proving the Claim',
        body: `
          You have now empirically demonstrated our falsifiable claim:
          <br><br>
          1. <strong>Systematic Accuracy Gains:</strong> Accuracy climbs rapidly from ~40% at $K=1$ to <strong>100% at $K=8$</strong> without emitting a single token or expanding memory.
          <br>
          2. <strong>Steep Diminishing Returns:</strong> For $K > 10$, additional compute yields near-zero accuracy gain while linearly increasing latency.
          <br>
          3. <strong>100x Cost Advantage:</strong> BDH-CQ solves the task in <strong>6.5 ms at $0.0007 per task</strong>, compared to $0.02+ for token-based CoT!
        `,
        formula: '\\text{Cost: } \\$0.0007 \\text{ (BDH-CQ)} \\quad \\text{vs} \\quad \\$0.02 - \\$0.06 \\text{ (Token CoT)}',
        actionPrompt: 'Guided walkthrough complete! Click "Unlock Full Sandbox" to paint custom grids, test Sudoku, and inject noise.',
        onEnter: () => {
          this.app.setRecurrentSteps(8);
        }
      }
    ];
  }

  renderStep() {
    const data = this.stepData[this.currentStep - 1];
    if (!data) return;

    // Update stepper dots
    const dotsContainer = document.getElementById('stepperDots');
    if (dotsContainer) {
      dotsContainer.innerHTML = '';
      for (let i = 1; i <= this.totalSteps; i++) {
        const dot = document.createElement('div');
        dot.className = `stepper-dot ${i === this.currentStep ? 'active' : i < this.currentStep ? 'completed' : ''}`;
        dot.textContent = i;
        dot.title = `Step ${i}`;
        dot.addEventListener('click', () => this.goToStep(i));
        dotsContainer.appendChild(dot);
      }
    }

    // Update Card Contents
    const cardEl = document.getElementById('guideStepCard');
    if (cardEl) {
      cardEl.innerHTML = `
        <div class="guide-step-badge">
          <span>⚡</span> ${data.badge}
        </div>
        <h3>${data.title}</h3>
        <div class="guide-step-body">
          ${data.body}
          <div class="formula-box">${data.formula}</div>
        </div>
        <div class="guide-action-prompt">
          <span class="guide-action-icon">🎯</span>
          <span class="guide-action-text">${data.actionPrompt}</span>
        </div>
        <div class="guide-footer-nav">
          <button class="btn btn-secondary" id="btnGuidePrev" ${this.currentStep === 1 ? 'disabled style="opacity: 0.4; cursor: not-allowed;"' : ''}>
            ← Previous
          </button>
          <span style="font-size: 0.8rem; font-family: var(--font-mono); color: var(--text-muted);">
            Step ${this.currentStep} of ${this.totalSteps}
          </span>
          ${this.currentStep < this.totalSteps ? `
            <button class="btn btn-primary" id="btnGuideNext">
              Next Step →
            </button>
          ` : `
            <button class="btn btn-primary" id="btnUnlockSandbox">
              🚀 Unlock Full Sandbox
            </button>
          `}
        </div>
      `;

      // Re-bind buttons
      const btnPrev = document.getElementById('btnGuidePrev');
      if (btnPrev && this.currentStep > 1) {
        btnPrev.addEventListener('click', () => this.prevStep());
      }
      const btnNext = document.getElementById('btnGuideNext');
      if (btnNext) {
        btnNext.addEventListener('click', () => this.nextStep());
      }
      const btnUnlock = document.getElementById('btnUnlockSandbox');
      if (btnUnlock) {
        btnUnlock.addEventListener('click', () => {
          this.app.switchMainTab('sandbox');
        });
      }
    }

    // Trigger step callback
    if (data.onEnter) {
      data.onEnter();
    }
  }

  nextStep() {
    if (this.currentStep < this.totalSteps) {
      this.currentStep++;
      this.renderStep();
    }
  }

  prevStep() {
    if (this.currentStep > 1) {
      this.currentStep--;
      this.renderStep();
    }
  }

  goToStep(stepNum) {
    if (stepNum >= 1 && stepNum <= this.totalSteps) {
      this.currentStep = stepNum;
      this.renderStep();
    }
  }
}
