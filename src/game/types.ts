/**
 * Game data types and structures for Doodle Basketball 5v5
 */

export type Position = 'PG' | 'SG' | 'SF' | 'PF' | 'C';

export interface PlayerStats {
  speed: number;    // 1 - 5 pips
  shot: number;     // 1 - 5 pips
  strength: number; // 1 - 5 pips
}

export type DunkType =
  | 'tomahawk'      // Lebronyan signature
  | 'chef_360'      // Steph Chef 360
  | 'rim_breaker'   // Shaq monster two-handed slam
  | 'glide_mamba'   // Kobe reverse double clutch
  | 'sombor_hook'   // Joker skyhook slam
  | 'euro_thunder'  // Giannis eurostep hammer
  | 'space_glide'   // Air Jordan free-throw line glide
  | 'step_slam'     // Luka magic step & self-alley
  | 'alien_stretch' // Wemby ultra-long noodle arm
  | 'punch_dunk'    // Jimmy Buckets comic punch dunk
  | 'windmill'      // Standard athletic windmill
  | 'two_hand_slam'; // Solid power dunk

export interface PlayerDef {
  id: string;
  name: string;
  number: number;
  position: Position;
  stats: PlayerStats;
  dunkType: DunkType;
  dunkName: string;
  dunkDescription: string;
  // Appearance customization
  skinTone: string;     // Hex color
  hairColor: string;    // Hex color
  hairStyle: 'afro' | 'bald' | 'fade' | 'dreads' | 'curls' | 'spiky';
  hasHeadband: boolean;
  headbandColor?: string;
  hasBeard: boolean;
  beardColor?: string;
  heightScale: number;  // 0.88 to 1.15
  quote: string;
}

export interface TeamDef {
  id: string;
  name: string;
  city: string;
  shortName: string;
  primaryColor: string;
  secondaryColor: string;
  jerseyColor: string;
  textColor: string;
  players: PlayerDef[];
}

export interface Vector2D {
  x: number;
  y: number;
}

export interface PlayerState {
  def: PlayerDef;
  teamId: string;
  isHome: boolean;
  x: number;
  y: number;
  vx: number;
  vy: number;
  facing: 1 | -1; // 1 = right, -1 = left
  hasBall: boolean;
  stamina: number; // 0 - 100
  heat: number;    // 0 - 100 ("On Fire" at 100)
  
  // Action states
  state: 'idle' | 'running' | 'shooting' | 'dunking' | 'passing' | 'crossover' | 'shoving' | 'knocked_down' | 'defending';
  stateTimer: number;
  animFrame: number;
  
  // Crossover / Dodge
  crossoverTimer: number;
  
  // Fight / Knockdown
  knockedTimer: number;
  knockedVx: number;
  knockedVy: number;
  
  // Dunking animation specific
  dunkProgress: number; // 0 to 1
  dunkStartX: number;
  dunkStartY: number;
  dunkTargetX: number;
  dunkTargetY: number;

  // Match stats
  points: number;
  dunks: number;
  steals: number;
  knockouts: number;
  crossovers: number;
}

export interface BallState {
  x: number;
  y: number;
  z: number;      // height above floor
  vx: number;
  vy: number;
  vz: number;     // vertical velocity
  carrierId: string | null;
  targetPlayerId: string | null; // for passes
  isShot: boolean;
  isPass: boolean;
  shotTargetRim: 1 | -1; // 1 = right rim, -1 = left rim
  shotDistance: number;
  shotQuality: number; // 0 - 1 (1 = green perfect)
  isDunk: boolean;
  rimBounceCount: number;
}

export interface ParticleEffect {
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
  size: number;
  alpha: number;
  life: number;
  maxLife: number;
  text?: string;
  scale?: number;
  type?: 'spark' | 'smoke' | 'comic_text' | 'sweat' | 'fire' | 'star';
}

export type GamePeriod = 1 | 2 | 3 | 4;

export interface GameScore {
  home: number;
  away: number;
}

export interface GameSettings {
  quarterLengthSeconds: number; // e.g. 90, 120, 180
  difficulty: 'rookie' | 'all_star' | 'hall_of_brawl';
}
