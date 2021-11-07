import * as THREE from "three";
import { useEffect, useState, useRef } from "react";
import { updateVector, setRay } from "./Actions";
import State from "./State";

function Pointer({ state }: { state: State }) {
  const down = useRef<[number, number]>([0, 0]);
  const clickTime = useRef(Date.now());
  const cameraDown = useRef<THREE.Vector3>(new THREE.Vector3());
  const raycaster = new THREE.Raycaster();
  const mouse2 = new THREE.Vector2();
  const dragCache = new THREE.Vector2();
  const positionCache = useRef<[number, number][]>([]);

  useEffect(() => {
    const { canvas } = state;

    function pointerUp(e: PointerEvent) {
      state.draggingLine = false;
      state.draggingCamera = false;
    }

    function pointerDown(e: PointerEvent) {
      let doubleClick = false;
      if (Date.now() - clickTime.current < 500) {
        doubleClick = true;
      } else {
        clickTime.current = Date.now();
      }

      if (state.mode === "choosePosition" && e.button === 0) {
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

        state.draggingCamera = true;

        down.current = [e.clientX, e.clientY];
        cameraDown.current.copy(state.camera.position);
      } else if (state.mode === "navigation" && e.button === 0) {
        mouse2.x = (e.clientX / window.innerWidth) * 2 - 1;
        mouse2.y = -(e.clientY / window.innerHeight) * 2 + 1;
        raycaster.setFromCamera(mouse2, state.camera);
        const intersects = raycaster.intersectObject(state.text);
        if (intersects.length > 0) {
          const instanceId = intersects[0].instanceId;
          if (instanceId !== null && instanceId !== undefined) {
            const lineIndex = state.text.getInstanceLineIndex(instanceId);
            if (lineIndex !== undefined) {
              if (e.shiftKey) {
                state.text.selectedLines.push(lineIndex);
              } else {
                if (state.text.selectedLines.includes(lineIndex)) {
                  if (doubleClick) {
                    state.text.selectedLines = [];
                    state.text.activeLine = lineIndex;
                    const relPositions = state.text.relPositions[lineIndex];
                    state.lastPosition = relPositions[
                      relPositions.length - 1
                    ].slice() as [number, number];
                    state.text.selectedLines = [];
                    state.setMode("normal");
                  }
                } else {
                  state.text.selectedLines = [];
                  state.text.selectedLines.push(lineIndex);
                }
              }
            }
            state.text.renderLinesSelected();
            state.draggingLine = true;
            positionCache.current = [];
            for (const line of state.text.selectedLines) {
              // positionCache.push()
              positionCache.current.push(
                state.text.linePositions[line].slice() as [number, number]
              );
            }
            down.current = [e.clientX, e.clientY];
            return;
          }
        } else {
          state.draggingCamera = true;
          if (!e.shiftKey) state.text.selectedLines = [];
          state.text.renderLinesSelected();

          if (doubleClick) {
            state.setMode("normal");

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

            state.draggingCamera = true;

            down.current = [e.clientX, e.clientY];
            cameraDown.current.copy(state.camera.position);
          }
        }

        mouse2.x = (e.clientX / window.innerWidth) * 2 - 1;
        mouse2.y = -(e.clientY / window.innerHeight) * 2 + 1;
        state.draggingCamera = true;

        down.current = [e.clientX, e.clientY];
        cameraDown.current.copy(state.camera.position);
      } else {
        mouse2.x = (e.clientX / window.innerWidth) * 2 - 1;
        mouse2.y = -(e.clientY / window.innerHeight) * 2 + 1;
        state.draggingCamera = true;

        state.mouse.set(e.clientX, e.clientY);

        updateVector(state);

        const start = state.text.linePositions[state.text.activeLine];
        state.cursor.setEnd(
          state.lastPosition[0] + state.vector.x + start[0],
          state.lastPosition[1] + state.vector.y + start[1]
        );

        down.current = [e.clientX, e.clientY];
        cameraDown.current.copy(state.camera.position);
      }
    }

    function pointerMove(e: PointerEvent) {
      state.mouse.set(e.clientX, e.clientY);
      state.movedCheck = true;
      if (state.draggingLine || state.draggingCamera) {
        const visibleHeight =
          2 *
          Math.tan((state.camera.fov * Math.PI) / 360) *
          state.camera.position.z;
        const zoomPixel = visibleHeight / window.innerHeight;

        const dragged = [
          state.mouse.x - down.current[0],
          state.mouse.y - down.current[1],
        ];
        if (state.draggingLine) {
          for (let i = 0; i < positionCache.current.length; i++) {
            const index = state.text.selectedLines[i];
            state.text.linePositions[index] = [
              positionCache.current[i][0] + dragged[0] * zoomPixel,
              positionCache.current[i][1] - dragged[1] * zoomPixel,
            ];
          }
          state.text.updatePositions();

          updateVector(state);
          const start = state.text.linePositions[state.text.activeLine];
          state.cursor.setEnd(
            state.lastPosition[0] + state.vector.x + start[0],
            state.lastPosition[1] + state.vector.y + start[1]
          );
        } else if (state.draggingCamera) {
          state.camera.position.x =
            cameraDown.current.x - dragged[0] * zoomPixel;
          state.camera.position.y =
            cameraDown.current.y + dragged[1] * zoomPixel;
        }
      } else {
        updateVector(state);

        const start = state.text.linePositions[state.text.activeLine];
        state.cursor.setEnd(
          state.lastPosition[0] + state.vector.x + start[0],
          state.lastPosition[1] + state.vector.y + start[1]
        );
      }
    }

    const mouseWheel = (e: Event) => {
      const deltaY = (e as WheelEvent).deltaY;
      const percent = (window.innerHeight + deltaY * 2) / window.innerHeight;
      const newZ = Math.min(18, Math.max(3, state.camera.position.z * percent));
      setRay(state, state.ray, state.mouse, newZ);
      state.camera.position.copy(state.ray);
    };

    window.document.addEventListener("pointerdown", pointerDown);
    window.document.addEventListener("pointermove", pointerMove);
    window.document.addEventListener("pointerup", pointerUp);
    window.document.addEventListener("mousewheel", mouseWheel, {
      passive: false,
    });
    return () => {
      window.document.removeEventListener("mousewheel", mouseWheel);
      window.document.removeEventListener("pointerdown", pointerDown);
      window.document.removeEventListener("pointermove", pointerMove);
      window.document.removeEventListener("pointerup", pointerUp);
    };
  }, [state]);

  return null;
}

export default Pointer;
