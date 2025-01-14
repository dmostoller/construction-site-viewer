import { Cartesian3 } from "@cesium/engine";

export enum MarkerType {
  BUILDING = "building",
  ROAD = "road",
  UTILITY = "utility",
  MEASUREMENT = "measurement",
}

export interface MarkerData {
  id: string;
  type: MarkerType;
  position: Cartesian3;
  label?: string;
}
