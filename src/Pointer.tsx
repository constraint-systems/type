import { useEffect, useRef } from "react";
import State from "./State";
import * as THREE from "three";
import {
  choosePosition,
  moveCamera,
  navigationClick,
  updateTarget,
  moveLines,
  targetZoom,
} from "./PointerUtils";

const PointerComponent = ({
  state,
  keyboardRef,
}: {
  state: State;
  keyboardRef: any;
}) => {
  const pointersRef = useRef<any[]>([]);
  const cameraDown = useRef<THREE.Vector3>(new THREE.Vector3());
  const mouse2 = new THREE.Vector2();
  const positionCache = useRef<[number, number][]>([]);
  const raycaster = new THREE.Raycaster();
  const clickTime = useRef<{ id: number | null; time: number }>({
    id: null,
    time: Date.now(),
  });

  useEffect(() => {
    const { canvas } = state;
    const activePointers = pointersRef.current;

    const handlePointerMove = (e: PointerEvent) => {
      if (activePointers.length === 0) {
        hoverMove(e);
      } else {
        const activeIds = activePointers.map((p) => p.id);
        const index = activeIds.indexOf(e.pointerId);
        if (index > -1) {
          const active = activePointers[index];
          active.current = [e.clientX, e.clientY];
          if (activePointers.length === 1) {
            oneDrag(e);
          } else if (activePointers.length === 2) {
            twoDrag(e);
          }
        }
      }
    };

    const handleMouseDown = (e: MouseEvent) => {
      // necessary to preserve focus on mobile evidently
      e.preventDefault();
    };

    const handlePointerDown = (e: PointerEvent) => {
      e.preventDefault();

      if (e.pointerType === "touch") {
        if (state.mode !== "navigation") {
          keyboardRef.current?.focus();
        }
      }

      const prevLength = activePointers.length;
      const activeIds = activePointers.map((p) => p.id);
      if (activeIds.indexOf(e.pointerId) === -1) {
        // limit to 2
        if (activePointers.length < 2) {
          activePointers.push({
            id: e.pointerId,
            down: [e.clientX, e.clientY],
            current: [e.clientX, e.clientY],
          });
        }
      }
      const activeLength = activePointers.length;

      if (prevLength === 0 && activeLength === 1) {
        oneDragStart(e);
      } else if (prevLength === 2 && activeLength === 1) {
        oneDragStart(e);
      } else if (prevLength === 1 && activeLength === 2) {
        twoDragStart(e);
      }

      canvas.setPointerCapture(e.pointerId);
    };

    const handleMousewheel = (e: WheelEvent) => {
      e.preventDefault();
      cameraDown.current.copy(state.camera.position);
      const percent = (window.innerHeight - e.deltaY * 2) / window.innerHeight;
      targetZoom(state, [e.clientX, e.clientY], cameraDown.current, percent);
      cameraDown.current.copy(state.camera.position);
    };

    const handlePointerUp = (e: PointerEvent) => {
      e.preventDefault();

      const prevLength = activePointers.length;
      const activeIds = activePointers.map((p) => p.id);
      if (activeIds.indexOf(e.pointerId) !== -1) {
        const index = activeIds.indexOf(e.pointerId);
        activePointers.splice(index, 1);
      }
      const activeLength = activePointers.length;

      if (prevLength === 1 && activeLength === 0) {
        oneDragEnd(e);
      } else if (prevLength === 2 && activeLength === 1) {
        twoDragEnd(e);
        oneDragStart(e);
      }

      canvas.releasePointerCapture(e.pointerId);
    };

    const handleClick = (e: any) => {
      e.preventDefault();
    };

    const hoverMove = (e: PointerEvent) => {
      updateTarget(state, e);
    };

    const oneDragStart = (e: PointerEvent) => {
      let doubleClick = false;
      if (Date.now() - clickTime.current.time < 500) {
        doubleClick = true;
      } else {
        clickTime.current.id = e.pointerId;
        clickTime.current.time = Date.now();
      }

      // reset down for all active pointers
      for (const active of activePointers) {
        active.down = active.current.slice();
      }

      if (e.pointerType === "touch") {
        if (state.mode === "choosePosition" && e.button === 0) {
          choosePosition(state, e);
        } else if (state.mode === "navigation") {
          updateTarget(state, e);
          navigationClick(
            state,
            e,
            doubleClick,
            mouse2,
            raycaster,
            positionCache,
            cameraDown
          );
          return;
        } else {
          state.draggingCamera = false;
        }
      } else {
        if (state.mode === "choosePosition" && e.button === 0) {
          choosePosition(state, e);
        } else if (state.mode === "navigation") {
          navigationClick(
            state,
            e,
            doubleClick,
            mouse2,
            raycaster,
            positionCache,
            cameraDown
          );
        }
        state.draggingCamera = true;
        cameraDown.current.copy(state.camera.position);
      }
    };
    const oneDrag = (e: PointerEvent) => {
      const active = activePointers[0];

      if (e.pointerType === "touch") {
        if (state.draggingLine) {
          moveLines(state, e, active, positionCache);
        } else if (state.draggingCamera) {
          moveCamera(state, active, cameraDown);
          updateTarget(state, e);
        } else {
          updateTarget(state, e);
        }
      } else {
        if (state.draggingLine) {
          moveLines(state, e, active, positionCache);
        } else if (state.draggingCamera) {
          moveCamera(state, active, cameraDown);
        }
      }
    };
    const oneDragEnd = (e: PointerEvent) => {};

    const twoDragStart = (e: PointerEvent) => {
      // reset down for all active pointers
      for (const active of activePointers) {
        active.down = active.current.slice();
      }
      state.draggingCamera = true;
      cameraDown.current.copy(state.camera.position);
    };
    const twoDrag = (e: PointerEvent) => {
      const a = activePointers[0];
      const b = activePointers[1];
      const minDown = [
        Math.min(a.down[0], b.down[0]),
        Math.min(a.down[1], b.down[1]),
      ];
      const maxDown = [
        Math.max(a.down[0], b.down[0]),
        Math.max(a.down[1], b.down[1]),
      ];
      const min = [
        Math.min(a.current[0], b.current[0]),
        Math.min(a.current[1], b.current[1]),
      ];
      const max = [
        Math.max(a.current[0], b.current[0]),
        Math.max(a.current[1], b.current[1]),
      ];
      const combined = {
        down: [
          minDown[0] + (maxDown[0] - minDown[0]) / 2,
          minDown[1] + (maxDown[1] - minDown[1]) / 2,
        ],
        current: [
          min[0] + (max[0] - min[0]) / 2,
          min[1] + (max[1] - min[1]) / 2,
        ],
      };

      const change = moveCamera(state, combined, cameraDown);
      const adjustedDown = new THREE.Vector3();
      adjustedDown.x = cameraDown.current.x + change[0];
      adjustedDown.y = cameraDown.current.y + change[1];
      adjustedDown.z = cameraDown.current.z;
      const downDiff = Math.sqrt(
        Math.pow(b.down[0] - a.down[0], 2) + Math.pow(b.down[1] - a.down[1], 2)
      );
      const currDiff = Math.sqrt(
        Math.pow(b.current[0] - a.current[0], 2) +
          Math.pow(b.current[1] - a.current[1], 2)
      );
      const percent = (currDiff - downDiff) / downDiff + 1;
      targetZoom(
        state,
        combined.current as [number, number],
        adjustedDown,
        percent
      );
    };
    const twoDragEnd = (e: PointerEvent) => {};

    if (canvas) {
      canvas.addEventListener("pointerdown", handlePointerDown);
      document.addEventListener("pointermove", handlePointerMove);
      canvas.addEventListener("mousedown", handleMouseDown);
      canvas.addEventListener("pointerup", handlePointerUp);
      canvas.addEventListener("pointercancel", handlePointerUp);
      canvas.addEventListener("click", handleClick);
      canvas.addEventListener("wheel", handleMousewheel, {
        passive: false,
      });
      return () => {
        canvas.removeEventListener("pointerdown", handlePointerDown);
        document.removeEventListener("pointermove", handlePointerMove);
        canvas.removeEventListener("pointerup", handlePointerUp);
        canvas.removeEventListener("pointercancel", handlePointerUp);
        canvas.removeEventListener("click", handleClick);
        canvas.removeEventListener("wheel", handleMousewheel);
      };
    }
  }, [state, keyboardRef]);

  return null;
};

export default PointerComponent;
