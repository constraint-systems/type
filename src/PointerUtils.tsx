import { updateVector } from "./Actions";
import State from "./State";
import * as THREE from "three";

export const updateTarget = (state: State, e: PointerEvent) => {
  state.mouse.set(e.clientX, e.clientY);
  updateVector(state);
  const start = state.text.linePositions[state.text.activeLine];
  state.cursor.setEnd(
    state.lastPosition[0] + state.vector.x + start[0],
    state.lastPosition[1] + state.vector.y + start[1]
  );
};

export const moveCamera = (state: State, active: any, cameraDown: any) => {
  const visibleHeight =
    2 * Math.tan((state.camera.fov * Math.PI) / 360) * cameraDown.current.z;
  const zoomPixel = visibleHeight / window.innerHeight;
  const dragged = [
    active.current[0] - active.down[0],
    active.current[1] - active.down[1],
  ];
  state.camera.position.x = cameraDown.current.x - dragged[0] * zoomPixel;
  state.camera.position.y = cameraDown.current.y + dragged[1] * zoomPixel;
  return [-dragged[0] * zoomPixel, dragged[1] * zoomPixel];
};

export const choosePosition = (state: State, e: PointerEvent) => {
  updateTarget(state, e);
  const start = state.text.linePositions[state.text.activeLine];
  const newStart = [
    state.lastPosition[0] + state.vector.x + start[0] - 0.01,
    state.lastPosition[1] + state.vector.y + start[1],
  ] as [number, number];
  state.text.activeLine = state.text.lines.length;
  state.text.lines.push("");
  state.text.linePositions.push(newStart);
  state.text.relPositions.push([]);
  state.lastPosition = [0, 0];
  state.text.updatePositions();
  state.setMode("normal");
  updateTarget(state, e);
};

export const navigationClick = (
  state: State,
  e: PointerEvent,
  doubleClick: boolean,
  mouse2: THREE.Vector2,
  raycaster: THREE.Raycaster,
  positionCache: any,
  cameraDown: any
) => {
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
      return;
    }
  } else {
    state.draggingLine = false;
    if (!e.shiftKey) state.text.selectedLines = [];
    state.text.renderLinesSelected();

    mouse2.x = (e.clientX / window.innerWidth) * 2 - 1;
    mouse2.y = -(e.clientY / window.innerHeight) * 2 + 1;
    updateTarget(state, e);

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
    }

    state.draggingCamera = true;
    cameraDown.current.copy(state.camera.position);
  }
};

export const moveLines = (
  state: State,
  e: PointerEvent,
  active: any,
  positionCache: any
) => {
  const visibleHeight =
    2 * Math.tan((state.camera.fov * Math.PI) / 360) * state.camera.position.z;
  const zoomPixel = visibleHeight / window.innerHeight;

  const dragged = [
    active.current[0] - active.down[0],
    active.current[1] - active.down[1],
  ];
  for (let i = 0; i < positionCache.current.length; i++) {
    const index = state.text.selectedLines[i];
    state.text.linePositions[index] = [
      positionCache.current[i][0] + dragged[0] * zoomPixel,
      positionCache.current[i][1] - dragged[1] * zoomPixel,
    ];
  }
  state.text.updatePositions();

  updateTarget(state, e);
};

export const targetZoom = (
  state: State,
  target: [number, number],
  cameraDown: THREE.Vector3,
  percent: number
) => {
  const visibleHeight =
    2 * Math.tan((state.camera.fov * Math.PI) / 360) * cameraDown.z;
  const zoomPixel = visibleHeight / window.innerHeight;

  const relx = target[0] - window.innerWidth / 2;
  const rely = -(target[1] - window.innerHeight / 2);
  const worldRelX = relx * zoomPixel;
  const worldRelY = rely * zoomPixel;

  const boundZoom = (state: State, val: number) => {
    const min = 3;
    const max = 18;
    return Math.min(max, Math.max(min, val));
  };

  const nextZoom = boundZoom(state, cameraDown.z / percent);

  const newVisibleHeight =
    2 * Math.tan((state.camera.fov * Math.PI) / 360) * nextZoom;
  const newZoomPixel = newVisibleHeight / window.innerHeight;

  const newWorldX = relx * newZoomPixel;
  const newWorldY = rely * newZoomPixel;

  const diffX = newWorldX - worldRelX;
  const diffY = newWorldY - worldRelY;

  state.camera.position.x = cameraDown.x - diffX;
  state.camera.position.y = cameraDown.y - diffY;
  state.camera.position.z = nextZoom;
};
