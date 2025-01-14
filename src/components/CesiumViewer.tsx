import { useState, useEffect, useRef } from "react";
import * as Cesium from "cesium";
import { MarkerType } from "../types/MarkerType";

if (typeof window !== "undefined") {
  window.CESIUM_BASE_URL = "/static/";
}

declare global {
  interface Window {
    CESIUM_BASE_URL: string;
  }
}
const getMarkerImage = (type: MarkerType): string => {
  switch (type) {
    case MarkerType.BUILDING:
      return "/building-marker.svg";
    case MarkerType.ROAD:
      return "/road-marker.svg";
    case MarkerType.UTILITY:
      return "/utility-marker.svg";
    case MarkerType.MEASUREMENT:
      return "/marker.svg";
    default:
      return "/building-marker.svg"; // Fallback
  }
};

export default function CesiumViewer() {
  const viewerContainer = useRef<HTMLDivElement>(null);
  const viewerRef = useRef<Cesium.Viewer | null>(null);
  const markersRef = useRef<Cesium.Entity[]>([]);
  const [isViewerReady, setIsViewerReady] = useState(false);
  const [isPlacingMarker, setIsPlacingMarker] = useState(false);
  const [selectedMarkerType, setSelectedMarkerType] = useState<MarkerType>(
    MarkerType.BUILDING,
  );
  const [customLabel, setCustomLabel] = useState<string>("");

  useEffect(() => {
    const initViewer = async () => {
      if (!viewerContainer.current) return;

      Cesium.Ion.defaultAccessToken =
        process.env.NEXT_PUBLIC_CESIUM_ION_ACCESS_TOKEN || "";

      console.log("Initializing viewer...");
      // Create viewer with minimal settings
      const viewer = new Cesium.Viewer(viewerContainer.current, {
        terrainProvider: await Cesium.createWorldTerrainAsync(),
        baseLayerPicker: false,
        timeline: false,
        animation: false,
        navigationHelpButton: false,
        homeButton: false,
        infoBox: false,
        sceneMode: Cesium.SceneMode.SCENE3D,
        scene3DOnly: true,
        contextOptions: {
          webgl: {
            alpha: true,
            preserveDrawingBuffer: true,
          },
        },
      });

      let terrainLoaded = false;
      viewer.scene.globe.tileLoadProgressEvent.addEventListener(
        (queueLength) => {
          console.log(`Terrain loading... (${queueLength} tiles remaining)`);
          if (queueLength === 0 && !terrainLoaded) {
            terrainLoaded = true;
            console.log("Terrain loaded");

            viewer.scene.camera.setView({
              destination: Cesium.Cartesian3.fromDegrees(
                -118.2437,
                34.0522,
                2000,
              ),
              orientation: {
                heading: 0.0,
                pitch: -Cesium.Math.PI_OVER_FOUR,
                roll: 0.0,
              },
            });

            viewer.scene.requestRender();
            setIsViewerReady(true);
          }
        },
      );

      viewerRef.current = viewer;

      return () => {
        viewer.destroy();
      };
    };

    initViewer();
  }, []);

  const addMarker = () => {
    if (!viewerRef.current) {
      console.error("Viewer not initialized");
      return;
    }

    console.log("Starting marker placement...");
    setIsPlacingMarker(true);

    const handler = new Cesium.ScreenSpaceEventHandler(
      viewerRef.current.scene.canvas,
    );

    handler.setInputAction(
      (click: Cesium.ScreenSpaceEventHandler.PositionedEvent) => {
        if (!viewerRef.current) return;
        console.log("Click detected:", click.position);

        // Get position from click
        const cartesian = viewerRef.current.scene.pickPosition(click.position);
        if (!cartesian) {
          console.error("Could not get position from click");
          return;
        }
        console.log("Position:", cartesian);

        // Create marker
        const marker = viewerRef.current.entities.add({
          position: cartesian,
          billboard: {
            image: getMarkerImage(selectedMarkerType),
            verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
            scale: 0.5,
            heightReference: Cesium.HeightReference.RELATIVE_TO_GROUND,
            show: true,
          },
          label: {
            text:
              customLabel ||
              `${selectedMarkerType} ${markersRef.current.length + 1}`,
            font: "14pt sans-serif",
            style: Cesium.LabelStyle.FILL_AND_OUTLINE,
            outlineWidth: 2,
            verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
            pixelOffset: new Cesium.Cartesian2(0, -30),
            heightReference: Cesium.HeightReference.RELATIVE_TO_GROUND,
            show: true,
          },
        });

        console.log("Marker created:", marker);
        markersRef.current.push(marker);

        // Force scene update
        viewerRef.current.scene.requestRender();
        handler.destroy();
        setIsPlacingMarker(false);
      },
      Cesium.ScreenSpaceEventType.LEFT_CLICK,
    );
  };

  const clearMarkers = () => {
    if (!viewerRef.current) return;
    markersRef.current.forEach((marker) => {
      viewerRef.current?.entities.remove(marker);
    });
    markersRef.current = [];
    viewerRef.current.scene.requestRender();
  };

  return (
    <div className="relative w-full h-full">
      <div className="absolute top-4 left-4 z-10 space-y-2">
        <div className="space-x-2 bg-white p-2 rounded">
          <select
            value={selectedMarkerType}
            onChange={(e) =>
              setSelectedMarkerType(e.target.value as MarkerType)
            }
            disabled={isPlacingMarker}
            className="px-2 py-1 rounded"
          >
            {Object.values(MarkerType).map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </select>
          <input
            type="text"
            value={customLabel}
            onChange={(e) => setCustomLabel(e.target.value)}
            placeholder="Label"
            className="px-2 py-1 rounded"
            disabled={isPlacingMarker}
          />
          <button
            onClick={addMarker}
            disabled={isPlacingMarker}
            className="px-4 py-1 bg-blue-500 text-white rounded"
          >
            {isPlacingMarker ? "Click Map" : "Add Marker"}
          </button>
          <button
            onClick={clearMarkers}
            className="px-4 py-1 bg-red-500 text-white rounded"
          >
            Clear All
          </button>
        </div>
      </div>
      <div ref={viewerContainer} className="w-full h-full" />
    </div>
  );
}
