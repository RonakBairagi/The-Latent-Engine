/**
 * Canonical Abstract Reasoning (ARC) and Constraint Satisfaction (Sudoku) Tasks
 * Used to demonstrate Recurrent Latent-Space Convergence and Truth Beside Estimate.
 */

export const BENCHMARK_TASKS = [
  {
    id: 'symmetry',
    name: 'Spatial Reflection & Polarity',
    category: 'ARC-AGI Spatial Geometry',
    width: 5,
    height: 5,
    ruleType: 'symmetry',
    description: 'Reflect spatial geometry across the central vertical axis with chromatic polarity inversion (Blue 1 → Red 2, Green 3 → Yellow 4).',
    // Input grid: 5x5 flattened
    inputGrid: [
      1, 0, 0, 0, 0,
      1, 1, 0, 0, 0,
      0, 3, 0, 0, 0,
      3, 3, 0, 0, 0,
      0, 1, 0, 0, 0
    ],
    // Target Ground Truth
    groundTruth: [
      1, 0, 0, 0, 2,
      1, 1, 0, 2, 2,
      0, 3, 0, 4, 0,
      3, 3, 0, 4, 4,
      0, 1, 0, 2, 0
    ],
    difficulty: 'Medium',
    defaultSteps: 8
  },
  {
    id: 'gravity',
    name: 'Topological Gravity & Barrier',
    category: 'ARC-AGI Physics Prior',
    width: 6,
    height: 6,
    ruleType: 'gravity',
    description: 'Suspended particles (Blue 1 & Orange 7) fall downwards under simulated gravity until resting atop a static barrier (Grey 5).',
    inputGrid: [
      0, 1, 0, 7, 0, 0,
      0, 0, 0, 7, 0, 1,
      0, 0, 0, 0, 0, 0,
      5, 5, 5, 5, 5, 5,
      0, 0, 0, 0, 0, 0,
      0, 0, 0, 0, 0, 0
    ],
    groundTruth: [
      0, 0, 0, 0, 0, 0,
      0, 0, 0, 0, 0, 0,
      0, 1, 0, 7, 0, 1,
      5, 5, 5, 5, 5, 5,
      0, 0, 0, 7, 0, 0,
      0, 0, 0, 0, 0, 0
    ],
    difficulty: 'Hard',
    defaultSteps: 10
  },
  {
    id: 'pattern',
    name: 'Periodic Motif Extrapolation',
    category: 'ARC-AGI Pattern Synthesis',
    width: 6,
    height: 6,
    ruleType: 'pattern',
    description: 'Extrapolate the 2D periodic tessellation motif observed in the top-left sub-region across the full grid.',
    inputGrid: [
      2, 8, 2, 0, 0, 0,
      8, 2, 8, 0, 0, 0,
      2, 8, 2, 0, 0, 0,
      0, 0, 0, 0, 0, 0,
      0, 0, 0, 0, 0, 0,
      0, 0, 0, 0, 0, 0
    ],
    groundTruth: [
      2, 8, 2, 2, 8, 2,
      8, 2, 8, 8, 2, 8,
      2, 8, 2, 2, 8, 2,
      2, 8, 2, 2, 8, 2,
      8, 2, 8, 8, 2, 8,
      2, 8, 2, 2, 8, 2
    ],
    difficulty: 'Medium',
    defaultSteps: 7
  },
  {
    id: 'sudoku',
    name: 'Sudoku Extreme Mini (4x4)',
    category: 'BDH-CQ Constraint Satisfaction',
    width: 4,
    height: 4,
    ruleType: 'sudoku',
    description: 'Pathway BDH-CQ flagship benchmark: Solve Latin-square uniqueness across rows, columns, and 2x2 boxes via recurrent attractor relaxation.',
    inputGrid: [
      1, 0, 0, 4,
      0, 0, 2, 0,
      0, 1, 0, 0,
      3, 0, 0, 2
    ],
    groundTruth: [
      1, 2, 3, 4,
      4, 3, 2, 1,
      2, 1, 4, 3,
      3, 4, 1, 2
    ],
    difficulty: 'Expert',
    defaultSteps: 12
  }
];

export const ARC_COLORS = [
  { id: 0, hex: '#000000', name: 'Background (Black)' },
  { id: 1, hex: '#0074D9', name: 'Blue' },
  { id: 2, hex: '#FF4136', name: 'Red' },
  { id: 3, hex: '#2ECC40', name: 'Green' },
  { id: 4, hex: '#FFDC00', name: 'Yellow' },
  { id: 5, hex: '#AAAAAA', name: 'Grey' },
  { id: 6, hex: '#F012BE', name: 'Magenta' },
  { id: 7, hex: '#FF851B', name: 'Orange' },
  { id: 8, hex: '#7FDBFF', name: 'Teal' },
  { id: 9, hex: '#870C25', name: 'Maroon' }
];
