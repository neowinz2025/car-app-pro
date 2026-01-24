export interface PlateRecord {
  id: string;
  plate: string;
  timestamp: Date;
  loja: boolean;
  lavaJato: boolean;
}

export type ActiveStep = 'loja' | 'lavaJato' | null;

export interface AppState {
  plates: PlateRecord[];
  activeStep: ActiveStep;
  isScanning: boolean;
  flashlightOn: boolean;
}
