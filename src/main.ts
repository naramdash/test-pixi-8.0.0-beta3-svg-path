import { Application } from "pixi.js";
import { svgAtPixi8 } from "./svgMethod";
import { customParse } from "./customParse";

const app_ver8_svg = new Application();
await app_ver8_svg.init({
  preference: "webgl",
  backgroundColor: "white",
  backgroundAlpha: 0,
  width: 1000,
  height: 1000,
});
svgAtPixi8(app_ver8_svg);

const h1_svg = document.createElement("h1");
h1_svg.textContent = "Pixi 8 svg method";
document.querySelector<HTMLDivElement>("#app")!.append(h1_svg);
document
  .querySelector<HTMLDivElement>("#app")!
  .append(app_ver8_svg.canvas as HTMLCanvasElement);

const app_my_custom_code = new Application();
await app_my_custom_code.init({
  preference: "webgl",
  backgroundColor: "white",
  backgroundAlpha: 0,
  width: 1000,
  height: 1000,
});
customParse(app_my_custom_code);

const h1_custom = document.createElement("h1");
h1_custom.textContent = "custom parsing d";
document.querySelector<HTMLDivElement>("#app")!.append(h1_custom);
document
  .querySelector<HTMLDivElement>("#app")!
  .append(app_my_custom_code.canvas as HTMLCanvasElement);
