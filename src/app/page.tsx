"use client";
import dynamic from "next/dynamic";

// We need to dynamically import the Cesium component to avoid SSR issues
const CesiumViewer = dynamic(() => import("@/components/CesiumViewer"), {
  ssr: false,
});

export default function Home() {
  return (
    <main className="w-full h-screen relative">
      <CesiumViewer />
      <div className="absolute top-0 left-4 bg-background/90 p-4 rounded-lg shadow-lg text-center">
        <h1 className="text-xl font-bold mb-4 text-foreground">
          Construction Site Viewer
        </h1>
      </div>
    </main>
  );
}
