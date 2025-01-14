import { useEffect, useRef } from "react";
import * as Cesium from "cesium";

if (typeof window !== "undefined") {
  window.CESIUM_BASE_URL = "/static/";
}

declare global {
  interface Window {
    CESIUM_BASE_URL: string;
  }
}

export default function CesiumViewer() {
  const viewerContainer = useRef<HTMLDivElement>(null);
  const viewerRef = useRef<Cesium.Viewer | null>(null);
  const markersRef = useRef<Cesium.Entity[]>([]);

  // Marker functions moved outside useEffect
  const addMarker = () => {
    if (!viewerRef.current) return;

    // Set cursor to indicate placement mode
    if (viewerRef.current.container) {
      (viewerRef.current.container as HTMLElement).style.cursor = "crosshair";
    }

    const handler = new Cesium.ScreenSpaceEventHandler(
      viewerRef.current.scene.canvas,
    );

    handler.setInputAction(
      (click: Cesium.ScreenSpaceEventHandler.PositionedEvent) => {
        if (!viewerRef.current) return;

        const cartesian = viewerRef.current.camera.pickEllipsoid(
          click.position,
          viewerRef.current.scene.globe.ellipsoid,
        );

        if (cartesian) {
          const cartographic = Cesium.Cartographic.fromCartesian(cartesian);
          const longitude = Cesium.Math.toDegrees(cartographic.longitude);
          const latitude = Cesium.Math.toDegrees(cartographic.latitude);

          const marker = viewerRef.current.entities.add({
            position: Cesium.Cartesian3.fromDegrees(longitude, latitude),
            billboard: {
              image: "/marker.svg",
              verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
              scale: 0.5,
            },
            label: {
              text: `Marker ${markersRef.current.length + 1}`,
              font: "14pt sans-serif",
              style: Cesium.LabelStyle.FILL_AND_OUTLINE,
              outlineWidth: 2,
              verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
              pixelOffset: new Cesium.Cartesian2(0, -30),
            },
          });

          markersRef.current.push(marker);
        }

        // Reset cursor after placement
        if (viewerRef.current.container) {
          (viewerRef.current.container as HTMLElement).style.cursor = "default";
        }
        handler.destroy();
      },
      Cesium.ScreenSpaceEventType.LEFT_CLICK,
    );
  };

  const clearMarkers = () => {
    if (!viewerRef.current) return;

    markersRef.current.forEach((marker) => {
      if (viewerRef.current) {
        viewerRef.current.entities.remove(marker);
      }
    });
    markersRef.current = [];
  };

  useEffect(() => {
    const initViewer = async () => {
      if (!viewerContainer.current) return;

      Cesium.Ion.defaultAccessToken =
        process.env.NEXT_PUBLIC_CESIUM_ION_ACCESS_TOKEN || "";

      const viewer = new Cesium.Viewer(viewerContainer.current, {
        terrainProvider: await Cesium.createWorldTerrainAsync(),
        baseLayerPicker: false,
        timeline: false,
        animation: false,
        targetFrameRate: 60,
        contextOptions: {
          webgl: {
            alpha: true,
            preserveDrawingBuffer: true,
          },
        },
      });

      viewer.camera.setView({
        destination: Cesium.Cartesian3.fromDegrees(-118.2437, 34.0522, 500),
        orientation: {
          heading: Cesium.Math.toRadians(0),
          pitch: Cesium.Math.toRadians(-30),
          roll: 0.0,
        },
      });

      viewerRef.current = viewer;

      return () => {
        if (viewerRef.current) {
          viewerRef.current.destroy();
        }
      };
    };

    initViewer();
  }, []);

  return (
    <div className="relative w-full h-full">
      <div className="absolute top-12 left-4 z-10 space-x-2">
        <button
          className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
          onClick={addMarker}
        >
          Add Marker
        </button>
        <button
          className="bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded"
          onClick={clearMarkers}
        >
          Clear Markers
        </button>
      </div>
      <div ref={viewerContainer} className="w-full h-full" />
    </div>
  );
}
