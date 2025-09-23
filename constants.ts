import type { StickFigurePose, Limb, SavedPose, JointName } from './types';

export const INITIAL_POSE: StickFigurePose = {
  head: { x: 250, y: 80 },
  neck: { x: 250, y: 120 },
  waist: { x: 250, y: 180 },
  pelvis: { x: 250, y: 240 },
  leftShoulder: { x: 210, y: 130 },
  rightShoulder: { x: 290, y: 130 },
  leftElbow: { x: 180, y: 190 },
  rightElbow: { x: 320, y: 190 },
  leftHand: { x: 150, y: 250 },
  rightHand: { x: 350, y: 250 },
  leftHip: { x: 225, y: 240 },
  rightHip: { x: 275, y: 240 },
  leftKnee: { x: 215, y: 320 },
  rightKnee: { x: 285, y: 320 },
  leftAnkle: { x: 205, y: 400 },
  rightAnkle: { x: 295, y: 400 },
};

export const LIMBS: Limb[] = [
  // Torso
  ['neck', 'waist'],
  ['waist', 'pelvis'],
  ['neck', 'leftShoulder'],
  ['neck', 'rightShoulder'],
  ['pelvis', 'leftHip'],
  ['pelvis', 'rightHip'],
  // Left Arm
  ['leftShoulder', 'leftElbow'],
  ['leftElbow', 'leftHand'],
  // Right Arm
  ['rightShoulder', 'rightElbow'],
  ['rightElbow', 'rightHand'],
  // Left Leg
  ['leftHip', 'leftKnee'],
  ['leftKnee', 'leftAnkle'],
  // Right Leg
  ['rightHip', 'rightKnee'],
  ['rightKnee', 'rightAnkle'],
];

export const DEFAULT_POSES: SavedPose[] = [
  {
    id: 'default-standing',
    isDefault: true,
    pose: {
      head: { x: 0, y: -160 },
      neck: { x: 0, y: -120 },
      waist: { x: 0, y: -60 },
      pelvis: { x: 0, y: 0 },
      leftShoulder: { x: -40, y: -110 },
      rightShoulder: { x: 40, y: -110 },
      leftElbow: { x: -70, y: -50 },
      rightElbow: { x: 70, y: -50 },
      leftHand: { x: -100, y: 10 },
      rightHand: { x: 100, y: 10 },
      leftHip: { x: -25, y: 0 },
      rightHip: { x: 25, y: 0 },
      leftKnee: { x: -35, y: 80 },
      rightKnee: { x: 35, y: 80 },
      leftAnkle: { x: -45, y: 160 },
      rightAnkle: { x: 45, y: 160 },
    },
  },
  {
    id: 'default-wave',
    isDefault: true,
    // This pose is normalized relative to the pelvis
    pose: {
      head: { x: 0, y: -160 },
      neck: { x: 0, y: -120 },
      waist: { x: 0, y: -60 },
      pelvis: { x: 0, y: 0 },
      leftShoulder: { x: -40, y: -110 },
      rightShoulder: { x: 40, y: -110 },
      leftElbow: { x: -70, y: -50 },
      rightElbow: { x: 90, y: -90 },
      leftHand: { x: -100, y: 10 },
      rightHand: { x: 120, y: -160 },
      leftHip: { x: -25, y: 0 },
      rightHip: { x: 25, y: 0 },
      leftKnee: { x: -35, y: 80 },
      rightKnee: { x: 35, y: 80 },
      leftAnkle: { x: -45, y: 160 },
      rightAnkle: { x: 45, y: 160 },
    },
  },
];

export const STICK_FIGURE_COLORS = [
  '#0891b2', // cyan-600
  '#be185d', // pink-700
  '#16a34a', // green-600
  '#c026d3', // fuchsia-600
  '#d97706', // amber-600
];