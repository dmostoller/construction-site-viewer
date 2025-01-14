import fs from "fs-extra";
import path from "path";

const copyAssets = async () => {
  const cesiumPath = "node_modules/cesium/Build/Cesium";
  const publicPath = "public/static";

  const folders = ["Workers", "Assets", "ThirdParty", "Widgets"];

  await fs.ensureDir(publicPath);

  // Copy main folders
  for (const folder of folders) {
    await fs.copy(
      path.join(cesiumPath, folder),
      path.join(publicPath, folder),
      { overwrite: true },
    );
  }

  // Copy InfoBoxDescription.css from correct path
  const infoBoxSource = path.join(
    cesiumPath,
    "Widgets/InfoBox/InfoBoxDescription.css",
  );
  const infoBoxDest = path.join(
    publicPath,
    "Widgets/InfoBox/InfoBoxDescription.css",
  );

  if (await fs.pathExists(infoBoxSource)) {
    await fs.copy(infoBoxSource, infoBoxDest, { overwrite: true });
  }

  console.log("Cesium assets copied successfully");
};

copyAssets().catch(console.error);
