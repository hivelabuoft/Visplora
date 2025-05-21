export interface Position {
  x: number;
  y: number;
}

export interface Size {
  width: number;
  height: number;
}

export interface Visualization {
  id: string;
  title: string;
  spec: any; // Vega-Lite specification
  position: Position;
  size: Size;
  createdAt: Date;
  updatedAt: Date;
}

export interface ChartTemplate {
  id: string;
  name: string;
  category: string;
  thumbnailUrl: string;
  spec: any; // Vega-Lite specification template
}
