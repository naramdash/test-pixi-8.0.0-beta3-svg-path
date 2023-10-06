import { Graphics } from "pixi.js";
import arcToBezier from "svg-arc-to-cubic-bezier";

const commandSizeMap = {
  a: 7,
  c: 6,
  h: 1,
  l: 2,
  m: 2,
  q: 4,
  s: 4,
  t: 2,
  v: 1,
  z: 0,
} as const;

export function SVGToGraphicsPath(
  svgPathD: string,
  graphics: Graphics
): Graphics {
  const commands = svgPathD.match(/[a-df-z][^a-df-z]*/gi)!;

  const data = svgPathD
    .match(/[+-]?\d*\.?\d+(?:[eE][+-]?\d+)?/g)!
    .map(parseFloat);

  const betterCommands: string[] = [];

  commands.forEach((command) => {
    const data = command
      .match(/[+-]?\d*\.?\d+(?:[eE][+-]?\d+)?/g)
      ?.map(parseFloat);

    const type = command[0];

    let totalInstructions = 1;

    if (data) {
      totalInstructions =
        data.length /
        commandSizeMap[type.toLowerCase() as keyof typeof commandSizeMap];
    }

    for (let i = 0; i < totalInstructions; i++) {
      betterCommands.push(type);
    }
  });

  let dataIndex = 0;

  let lastX = 0;
  let lastY = 0;
  let pathStart: { x: number; y: number } | null = null;
  let lastCommand = {
    type: "M" as "M" | "L" | "C" | "Q" | "A" | "Z",
    data: [] as number[],
  };

  // graphics.stroke({ color: "blue", width: 2 });
  graphics.moveTo(0, 0);

  for (let i = 0; i < betterCommands.length; i++) {
    const type = betterCommands[i];

    if (
      pathStart == null &&
      ["L", "C", "Q", "A"].some((t) => t === type.toUpperCase())
    ) {
      pathStart = { x: lastX, y: lastY };
    }

    switch (type) {
      //#region MOVE commands
      case "M":
        lastX = data[dataIndex++];
        lastY = data[dataIndex++];

        graphics.moveTo(lastX, lastY);
        lastCommand = { type: "M", data: [lastX, lastY] };

        // beginHole();
        break;
      case "m":
        lastX += data[dataIndex++];
        lastY += data[dataIndex++];

        graphics.moveTo(lastX, lastY);
        lastCommand = { type: "M", data: [lastX, lastY] };
        break;
      //#endregion

      //#region LINE commands
      case "H":
        lastX = data[dataIndex++];

        graphics.lineTo(lastX, lastY);
        lastCommand = { type: "L", data: [lastX, lastY] };
        break;
      case "h":
        lastX += data[dataIndex++];

        graphics.lineTo(lastX, lastY);
        lastCommand = { type: "L", data: [lastX, lastY] };
        break;
      case "V":
        lastY = data[dataIndex++];

        graphics.lineTo(lastX, lastY);
        lastCommand = { type: "L", data: [lastX, lastY] };
        break;
      case "v":
        lastY += data[dataIndex++];

        graphics.lineTo(lastX, lastY);
        lastCommand = { type: "L", data: [lastX, lastY] };
        break;
      case "L":
        lastX = data[dataIndex++];
        lastY = data[dataIndex++];

        graphics.lineTo(lastX, lastY);
        lastCommand = { type: "L", data: [lastX, lastY] };
        break;
      case "l":
        lastX += data[dataIndex++];
        lastY += data[dataIndex++];

        graphics.lineTo(lastX, lastY);
        lastCommand = { type: "L", data: [lastX, lastY] };
        break;
      //#endregion

      //#region BEZIER commands
      case "C":
        lastX = data[dataIndex + 4];
        lastY = data[dataIndex + 5];

        graphics.bezierCurveTo(
          data[dataIndex],
          data[dataIndex + 1],
          data[dataIndex + 2],
          data[dataIndex + 3],
          lastX,
          lastY
        );

        lastCommand = {
          type: "C",
          data: [
            data[dataIndex],
            data[dataIndex + 1],
            data[dataIndex + 2],
            data[dataIndex + 3],
            lastX,
            lastY,
          ],
        };
        dataIndex += 6;
        break;

      case "c":
        graphics.bezierCurveTo(
          lastX + data[dataIndex],
          lastY + data[dataIndex + 1],
          lastX + data[dataIndex + 2],
          lastY + data[dataIndex + 3],
          lastX + data[dataIndex + 4],
          lastY + data[dataIndex + 5]
        );

        lastCommand = {
          type: "C",
          data: [
            lastX + data[dataIndex],
            lastY + data[dataIndex + 1],
            lastX + data[dataIndex + 2],
            lastY + data[dataIndex + 3],
            lastX + data[dataIndex + 4],
            lastY + data[dataIndex + 5],
          ],
        };

        lastX += data[dataIndex + 4];
        lastY += data[dataIndex + 5];

        dataIndex += 6;
        break;

      case "S":
        {
          const x = lastX;
          const y = lastY;

          lastX = data[dataIndex + 2];
          lastY = data[dataIndex + 3];

          const args = smoothCubicToCubicArgs(
            lastCommand,
            { x, y },
            data[dataIndex],
            data[dataIndex + 1],
            lastX,
            lastY
          );
          graphics.bezierCurveTo(...args);
          lastCommand = { type: "C", data: [...args] };

          dataIndex += 4;
        }
        break;
      case "s":
        {
          const args = smoothCubicToCubicArgs(
            lastCommand,
            { x: lastX, y: lastY },
            lastX + data[dataIndex],
            lastY + data[dataIndex + 1],
            lastX + data[dataIndex + 2],
            lastY + data[dataIndex + 3]
          );

          graphics.bezierCurveTo(...args);
          lastCommand = { type: "C", data: [...args] };

          lastX += data[dataIndex + 2];
          lastY += data[dataIndex + 3];

          dataIndex += 4;
        }

        break;
      case "Q":
        lastX = data[dataIndex + 2];
        lastY = data[dataIndex + 3];

        graphics.quadraticCurveTo(
          data[dataIndex],
          data[dataIndex + 1],
          lastX,
          lastY
        );
        lastCommand = {
          type: "Q",
          data: [data[dataIndex], data[dataIndex + 1], lastX, lastY],
        };

        dataIndex += 4;
        break;
      case "q":
        graphics.quadraticCurveTo(
          lastX + data[dataIndex],
          lastY + data[dataIndex + 1],
          lastX + data[dataIndex + 2],
          lastY + data[dataIndex + 3]
        );
        lastCommand = {
          type: "Q",
          data: [
            lastX + data[dataIndex],
            lastY + data[dataIndex + 1],
            lastX + data[dataIndex + 2],
            lastY + data[dataIndex + 3],
          ],
        };

        lastX += data[dataIndex + 2];
        lastY += data[dataIndex + 3];

        dataIndex += 4;
        break;

      case "T":
        {
          const x = lastX;
          const y = lastY;

          lastX = data[dataIndex++];
          lastY = data[dataIndex++];

          const args = smoothQuadraticToQuadraticArgs(
            lastCommand,
            { x, y },
            lastX,
            lastY
          );
          graphics.quadraticCurveTo(...args);
          lastCommand = { type: "Q", data: [...args] };
        }
        break;

      case "t":
        {
          const x = lastX;
          const y = lastY;

          lastX += data[dataIndex++];
          lastY += data[dataIndex++];

          const args = smoothQuadraticToQuadraticArgs(
            lastCommand,
            { x, y },
            lastX,
            lastY
          );
          graphics.quadraticCurveTo(...args);
          lastCommand = { type: "Q", data: [...args] };
        }

        break;
      //#endregion

      //#region ELLIPTICAL commands
      case "A":
        {
          const px = lastX;
          const py = lastY;
          lastX = data[dataIndex + 5];
          lastY = data[dataIndex + 6];

          arcToBezier({
            px,
            py,
            cx: lastX,
            cy: lastY,
            rx: data[dataIndex],
            ry: data[dataIndex + 1],
            xAxisRotation: data[dataIndex + 2],
            largeArcFlag: data[dataIndex + 3] as 0 | 1,
            sweepFlag: data[dataIndex + 4] as 0 | 1,
          }).forEach(({ x1, y1, x2, y2, x, y }: any) => {
            graphics.bezierCurveTo(x1, y1, x2, y2, x, y);
          });

          lastCommand = {
            type: "A",
            data: [
              px,
              py,
              lastX,
              lastY,
              data[dataIndex],
              data[dataIndex + 1],
              data[dataIndex + 2],
              data[dataIndex + 3],
              data[dataIndex + 4],
            ],
          };

          // path.arcToSvg(
          //   data[dataIndex], // rx
          //   data[dataIndex + 1], // ry
          //   data[dataIndex + 2], // angle
          //   data[dataIndex + 3], // large-arc-flag
          //   data[dataIndex + 4], // sweep-flag
          //   lastX, // x
          //   lastY // y
          // );

          dataIndex += 7;
        }

        break;
      case "a":
        {
          const px = lastX;
          const py = lastY;
          lastX += data[dataIndex + 5];
          lastY += data[dataIndex + 6];

          arcToBezier({
            px,
            py,
            cx: lastX,
            cy: lastY,
            rx: data[dataIndex],
            ry: data[dataIndex + 1],
            xAxisRotation: data[dataIndex + 2],
            largeArcFlag: data[dataIndex + 3] as 0 | 1,
            sweepFlag: data[dataIndex + 4] as 0 | 1,
          }).forEach(({ x1, y1, x2, y2, x, y }) => {
            graphics.bezierCurveTo(x1, y1, x2, y2, x, y);
          });

          lastCommand = {
            type: "A",
            data: [
              px,
              py,
              lastX,
              lastY,
              data[dataIndex],
              data[dataIndex + 1],
              data[dataIndex + 2],
              data[dataIndex + 3],
              data[dataIndex + 4],
            ],
          };

          // path.arcToSvg(
          //   data[dataIndex], // rx
          //   data[dataIndex + 1], // ry
          //   data[dataIndex + 2], // angle
          //   data[dataIndex + 3], // large-arc-flag
          //   data[dataIndex + 4], // sweep-flag
          //   lastX, // x
          //   lastY // y
          // );

          dataIndex += 7;
        }

        break;
      //#endregion

      //#region CLOSE commands
      case "Z":
      case "z":
        graphics.closePath();

        lastCommand = {
          type: "Z",
          data: [],
        };

        if (pathStart) {
          lastX = pathStart.x;
          lastY = pathStart.y;
        }
        pathStart = null;

        break;
      //#endregion

      default:
    }
  }

  return graphics;
}

function smoothCubicToCubicArgs(
  last: { type: "M" | "L" | "C" | "Q" | "A" | "Z"; data: number[] } | undefined,
  lastPoint: { x: number; y: number },
  cp2x: number,
  cp2y: number,
  x: number,
  y: number
) {
  // const last = this.instructions[this.instructions.length - 1];
  // const lastPoint = this._getLastPoint(Point.shared);

  let cp1x = 0;
  let cp1y = 0;

  if (!last || last.type !== "C") {
    cp1x = lastPoint.x;
    cp1y = lastPoint.y;
  } else {
    cp1x = last.data[2];
    cp1y = last.data[3];

    const currentX = lastPoint.x;
    const currentY = lastPoint.y;

    cp1x = currentX + (currentX - cp1x);
    cp1y = currentY + (currentY - cp1y);
  }

  return [cp1x, cp1y, cp2x, cp2y, x, y] as const;
}

function smoothQuadraticToQuadraticArgs(
  last: { type: string; data: number[] } | undefined,
  lastPoint: { x: number; y: number },
  x: number,
  y: number
) {
  // check if we have a previous quadraticCurveTo
  // const last = this.instructions[this.instructions.length - 1];
  // const lastPoint = this._getLastPoint(Point.shared);

  let cpx1 = 0;
  let cpy1 = 0;

  if (!last || last.type !== "Q") {
    cpx1 = lastPoint.x;
    cpy1 = lastPoint.y;
  } else {
    cpx1 = last.data[0];
    cpy1 = last.data[1];

    const currentX = lastPoint.x;
    const currentY = lastPoint.y;

    cpx1 = currentX + (currentX - cpx1);
    cpy1 = currentY + (currentY - cpy1);
  }

  return [cpx1, cpy1, x, y] as const;
}
