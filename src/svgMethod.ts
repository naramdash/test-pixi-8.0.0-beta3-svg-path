import { Application, Graphics } from "pixi.js";

export function svgAtPixi8(app: Application) {
  app.stage.removeChildren();

  const g = new Graphics();
  g.svg(
    `<svg height='500' viewBox="0 0 1000 1000"><path stroke='black' stroke-width="2" d=" M 100 100 L 200 100 H 300 V 200 C 400 200, 400 300, 500 300 S 600 400, 700 400 Q 750 450, 800 500 T 900 600 A 50 50, 0, 1, 1, 950,650 Z m 50 50 l 50 50 h 50 v 50 c 50 50, 50 100, 100 100 s 100 50, 150 50 q 25 25, 50 50 t 75 75 a 25 25,0,1,1,25,25 z m 150 350 l 50 50 h 50 v 50 c 50 50, 50 100, 100 100 s 100 50, 150 50 q 25 25, 50 50 t 75 75 a 25 25,0,1,1,25,25 z " /></svg>`
  );
  app.stage.addChild(g);
}
