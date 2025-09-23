// FIX: Removed a circular self-import that was causing type declaration conflicts.
export interface Point {
  x: number;
  y: number;
}

export type JointName =
  | 'head'
  | 'neck'
  | 'waist'
  | 'pelvis'
  | 'leftShoulder'
  | 'rightShoulder'
  | 'leftElbow'
  | 'rightElbow'
  | 'leftHand'
  | 'rightHand'
  | 'leftHip'
  | 'rightHip'
  | 'leftKnee'
  | 'rightKnee'
  | 'leftAnkle'
  | 'rightAnkle';

export type StickFigurePose = Record<JointName, Point>;

export type Limb = [JointName, JointName];

export interface StickFigureData {
  id: string;
  pose: StickFigurePose;
  color: string;
}

export interface SavedPose {
  id: string;
  pose: StickFigurePose;
  isDefault?: boolean;
}