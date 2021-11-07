import { useEffect, useRef } from "react";
import { updateVector } from "./Actions";
import State from "./State";

function Keyboard({ state }: { state: State }) {
  const keylist = useRef<any>({});

  useEffect(() => {
    const downHandler = (e: KeyboardEvent) => {
      const kl = keylist.current;
      let press = e.key.toLowerCase();
      kl[press] = true;
      if (state.mode === "normal" || state.mode === "choosePosition") {
        if (kl.arrowdown) {
          state.mouse.y += 16;
          state.cursor.updateEndAndCursor();
          state.movedCheck = true;
        }
        if (kl.arrowup) {
          state.mouse.y -= 16;
          state.cursor.updateEndAndCursor();
          state.movedCheck = true;
        }
        if (kl.arrowleft) {
          state.mouse.x -= 16;
          state.cursor.updateEndAndCursor();
          state.movedCheck = true;
        }
        if (kl.arrowright) {
          state.mouse.x += 16;
          state.cursor.updateEndAndCursor();
          state.movedCheck = true;
        }
      }
      if (state.mode === "choosePosition") {
        if (press === "enter") {
          const start = state.text.linePositions[state.text.activeLine];
          const newStart = [
            state.lastPosition[0] + state.vector.x + start[0] - 0.01,
            state.lastPosition[1] + state.vector.y + start[1],
          ] as [number, number];
          state.text.activeLine++;
          state.text.lines.push("");
          state.text.linePositions.push(newStart);
          state.text.relPositions.push([]);

          state.lastPosition = [0, 0];
          state.text.updatePositions();

          state.setMode("normal");

          updateVector(state);
          state.cursor.setEnd(
            state.lastPosition[0] + state.vector.x + newStart[0],
            state.lastPosition[1] + state.vector.y + newStart[1]
          );
        } else if (press === "escape") {
          state.setMode("navigation");
          state.text.selectedLines = [];
          state.text.renderLinesSelected();
        }
      } else if (state.mode === "navigation") {
        if (press === "backspace") {
          const sorted = state.text.selectedLines.slice().sort(function (a, b) {
            return a - b;
          });
          let adjuster = 0;
          for (const index of sorted) {
            state.text.lines.splice(index - adjuster, 1);
            state.text.relPositions.splice(index - adjuster, 1);
            state.text.linePositions.splice(index - adjuster, 1);
            state.text.setChars();
            state.text.updatePositions();

            const selectedBuffer =
              state.text.geometry.attributes.selected.array;
            // @ts-ignore
            selectedBuffer.fill(0);
            state.text.geometry.attributes.selected.needsUpdate = true;

            state.text.activeLine = Math.max(0, state.text.activeLine - 1);
            const start = state.text.linePositions[state.text.activeLine] || [
              0, 0,
            ];
            updateVector(state);
            state.cursor.setEnd(
              state.lastPosition[0] + state.vector.x + start[0],
              state.lastPosition[1] + state.vector.y + start[1]
            );

            adjuster++;
          }
        } else if (press === "escape") {
          state.text.selectedLines = [];
          state.text.renderLinesSelected();
          state.setMode("normal");
        }
      } else if (state.mode === "normal") {
        if (press.length === 1) {
          state.text.addText(e.key);
        } else {
          if (press === "backspace") {
            state.text.backspace();
          } else if (press === "enter") {
            state.text.enter();
          } else if (press === "escape") {
            state.setMode("navigation");
          }
        }
      }
    };

    const upHandler = (e: KeyboardEvent) => {
      const kl = keylist.current;
      let press = e.key.toLowerCase();
      kl[press] = false;
    };

    window.addEventListener("keydown", downHandler);
    window.addEventListener("keyup", upHandler);
    return () => {
      window.removeEventListener("keydown", downHandler);
      window.removeEventListener("keyup", upHandler);
    };
  }, [state]);

  return null;
}

export default Keyboard;
