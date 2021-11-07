// import { useEffect } from "react";
// import State from "./State";
// import * as THREE from "three";

// export class SubPointer {
//   state: State;
//   id: number;
//   current: THREE.Vector2;

//   constructor(state: State, e: PointerEvent) {
//     this.state = state;
//     this.id = e.pointerId;
//     this.current = new THREE.Vector2(e.clientX, e.clientY);

//     // left button
//     this.state.pointers.push(this);
//     switch (this.state.pointers.length) {
//       case 1:
//         // start 1
//         this.state.PointerOne.start(this.state.pointers.slice(0, 1));
//         break;
//       case 2:
//         // start 2
//         if (Date.now() - state.PointerOne.startTime) {
//           // revert selection
//           // state.selectedGrid = state.gridCache;
//           // renderSelected(state);
//         }
//         this.state.PointerOne.cancel();
//         this.state.PointerTwo.start(this.state.pointers.slice(0, 2));
//         break;
//       default:
//         // three or greater start three
//         this.state.PointerTwo.end();
//         this.state.PointerThree.start(this.state.pointers.slice(0, 3));
//     }
//   }

//   move(e: PointerEvent) {
//     this.current.set(e.clientX, e.clientY);
//     switch (this.state.pointers.length) {
//       case 1:
//         this.state.PointerOne.move();
//         break;
//       case 2:
//         this.state.PointerTwo.move();
//         break;
//       default:
//         this.state.PointerThree.move();
//         break;
//     }
//   }

//   remove() {
//     const index = getPointerIndexById(this.state, this.id);
//     if (index !== -1) {
//       this.state.pointers.splice(index, 1);
//     }
//     switch (this.state.pointers.length) {
//       case 0:
//         this.state.PointerOne.end();
//         break;
//       case 1:
//         // down to 1
//         this.state.PointerTwo.end();
//         // do not step down to 1
//         // this.state.PointerOne.start(this.state.pointers.slice(0, 1));
//         break;
//       case 2:
//         // down to 2
//         this.state.PointerThree.end();
//         this.state.PointerTwo.start(this.state.pointers.slice(0, 2));
//         break;
//       default:
//     }
//   }
// }

// type PointerProps = {
//   state: State;
// };

// const PointerComponent = ({ state }: PointerProps) => {
//   useEffect(() => {
//     const { canvas } = state;

//     const handlePointerMove = (e: PointerEvent) => {
//       if (state.lastPointerButtonPressed === 0) {
//         if (state.pointers.length > 0) {
//           let pointer;
//           if (state.pressed.includes(" ")) {
//             pointer = getPointerById(state, 999);
//           } else {
//             pointer = getPointerById(state, e.pointerId);
//           }
//           if (pointer) {
//             pointer.move(e);
//           }
//         } else {
//           if (state.PointerHover.active) {
//             state.PointerHover.move(e.clientX, e.clientY);
//           } else {
//             state.PointerHover.start(e.clientX, e.clientY);
//           }
//         }
//       } else if (state.lastPointerButtonPressed === 1) {
//         if (state.PointerMiddle.active) {
//           state.PointerMiddle.move(e);
//         }
//       } else if (state.lastPointerButtonPressed === 2) {
//         // right
//       }
//     };

//     const handlePointerDown = (e: PointerEvent) => {
//       state.PointerHover.end();
//       state.lastPointerButtonPressed = e.button;
//       if (state.lastPointerButtonPressed === 0) {
//         new SubPointer(state, e);
//         canvas.setPointerCapture(e.pointerId);
//       } else if (state.lastPointerButtonPressed === 1) {
//         state.PointerMiddle.start(e);
//       } else if (state.lastPointerButtonPressed === 2) {
//         // right
//       }
//       canvas.setPointerCapture(e.pointerId);
//     };

//     const handlePointerUp = (e: PointerEvent) => {
//       if (state.lastPointerButtonPressed === 0) {
//         if (state.pointers.length > 0) {
//           const pointer = getPointerById(state, e.pointerId);
//           if (pointer) pointer.remove();
//         } else {
//           state.PointerHover.end();
//         }
//         canvas.releasePointerCapture(e.pointerId);
//       } else if (state.lastPointerButtonPressed === 1) {
//         state.PointerMiddle.end();
//         state.lastPointerButtonPressed = 0;
//       } else if (state.lastPointerButtonPressed === 2) {
//         // right
//       }
//     };

//     const handleMousewheel = (e: WheelEvent) => {
//       e.preventDefault();
//       // discreteZoom(state, e.deltaY);
//     };

//     if (canvas) {
//       canvas.addEventListener("pointerdown", handlePointerDown);
//       canvas.addEventListener("pointermove", handlePointerMove);
//       canvas.addEventListener("pointerup", handlePointerUp);
//       canvas.addEventListener("pointercancel", handlePointerUp);
//       canvas.addEventListener("wheel", handleMousewheel, {
//         passive: false,
//       });
//       return () => {
//         canvas.removeEventListener("pointerdown", handlePointerDown);
//         canvas.removeEventListener("pointermove", handlePointerMove);
//         canvas.removeEventListener("pointerup", handlePointerUp);
//         canvas.removeEventListener("pointercancel", handlePointerUp);
//         canvas.removeEventListener("wheel", handleMousewheel);
//       };
//     }
//   }, [state]);

//   return null;
// };

// export default PointerComponent;

// const getPointerIndexById = (state: State, pointerId: number) => {
//   const ids = state.pointers.map((pointer) => pointer.id);
//   return ids.indexOf(pointerId);
// };

// const getPointerById = (state: State, pointerId: number) => {
//   const index = getPointerIndexById(state, pointerId);
//   if (index > -1) {
//     return state.pointers[index];
//   } else {
//     return null;
//   }
// };

export default {};
