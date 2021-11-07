import State from "./State";
import * as THREE from "three";

export const setRay = (
  state: State,
  targetVector: THREE.Vector3,
  mouse: THREE.Vector2,
  newZ: number
) => {
  const rayVec = state.tempVec.set(
    (mouse.x / window.innerWidth) * 2 - 1,
    -(mouse.y / window.innerHeight) * 2 + 1,
    0.5
  );
  const camera = state.camera;
  rayVec.unproject(camera);
  rayVec.sub(camera.position).normalize();
  const distance = (newZ - camera.position.z) / rayVec.z;
  targetVector.copy(camera.position).add(rayVec.multiplyScalar(distance));
};

export const updateVector = (state: State): void => {
  const visibleHeight =
    2 * Math.tan((state.camera.fov * Math.PI) / 360) * state.camera.position.z;
  const zoomPixel = visibleHeight / window.innerHeight;

  const worldMouse = [0, 0];
  worldMouse[0] =
    (state.camera.position.x / zoomPixel +
      (state.mouse.x - window.innerWidth / 2)) *
    zoomPixel;
  worldMouse[1] =
    (state.camera.position.y / zoomPixel -
      (state.mouse.y - window.innerHeight / 2)) *
    zoomPixel;

  const start = state.text.linePositions[state.text.activeLine] || [0, 0];
  state.vector.set(
    worldMouse[0] - start[0] - state.lastPosition[0],
    worldMouse[1] - start[1] - state.lastPosition[1]
  );
};
