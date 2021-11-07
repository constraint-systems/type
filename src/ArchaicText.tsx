// import * as THREE from "three";
// import { Euler } from "three";
// import State from "./State";

// const LIMIT = 1000;
// class ArchaicText extends THREE.InstancedMesh {
//   chars: Array<string>;
//   state: State;
//   aspect: number;
//   lineStarts: Array<[number, number]>;
//   lines: Array<string>;
//   positions: Array<[number, number]>;
//   activeLine: number;

//   constructor(state: State) {
//     const geometry = new THREE.PlaneBufferGeometry();
//     var uv = geometry.getAttribute("uv");
//     let texture;
//     let texScale = [1, 1];
//     let aspect;
//     const chars = " abcdefghijklmnopqrstuvwxyz?,.!1234567890".split("");
//     {
//       const c = document.createElement("canvas");
//       const cx = c.getContext("2d")!;
//       cx.clearRect(0, 0, c.width, c.height);
//       const fs = 64;
//       cx.font = fs + "px custom";

//       const ch = Math.round(fs * 1.2);

//       const toMeasure = cx.measureText("n");
//       const cw = toMeasure.width;

//       c.width = cw * chars.length;
//       c.height = ch;
//       // have to set font again after resize
//       cx.font = fs + "px custom";

//       cx.fillStyle = "black";
//       cx.textBaseline = "middle";
//       for (let i = 0; i < chars.length; i++) {
//         const char = chars[i];
//         cx.fillText(char, i * cw, ch / 2);
//       }
//       // document.body.appendChild(c);
//       texture = new THREE.CanvasTexture(c);
//       // texture.magFilter = THREE.NearestFilter;

//       uv.setXY(0, 0, 1);
//       uv.setXY(1, 1, 1);
//       uv.setXY(2, 0, 0);
//       uv.setXY(3, 1, 0);
//       texScale[0] = cw / c.width;
//       texScale[1] = ch / c.height;

//       aspect = [cw / ch, 1, 1];
//       // aspect = [1, 1, 1];
//     }

//     const visible = Array(LIMIT).fill(1);

//     geometry.setAttribute(
//       "visible",
//       new THREE.InstancedBufferAttribute(new Float32Array(visible), 1, false)
//     );

//     const offsets = [];
//     for (let i = 0; i < LIMIT; i++) {
//       offsets.push(0, 0);
//     }

//     geometry.setAttribute(
//       "offset",
//       new THREE.InstancedBufferAttribute(new Float32Array(offsets), 2, false)
//     );

//     const vertexShader = `
//     varying vec2 vUv;
//     attribute vec2 offset;
//     varying vec2 vOffset;
//     uniform vec2 texScale;
//     varying vec2 vTexScale;
//     uniform vec3 aspect;
//     uniform float scale;
//     attribute float visible;

//     void main() {
//       vUv = uv * texScale;
//       vOffset = offset * texScale;
//       vTexScale = texScale;

//       gl_Position = projectionMatrix * viewMatrix * modelMatrix * instanceMatrix * vec4(position * aspect * scale, 1.0) * visible;
//     }
//     `;

//     const fragmentShader = `
//     uniform sampler2D texture1;
//     varying vec2 vUv;
//     varying vec2 vOffset;
//     varying vec2 vTexScale;

//     void main() {
//       vec4 color = texture2D(texture1, vec2(vUv.x + vOffset.x, vUv.y + vOffset.y));
//       gl_FragColor = color;
//     }
//     `;

//     var uniforms = {
//       texture1: { type: "t", value: texture },
//       texScale: { value: texScale },
//       aspect: { value: aspect },
//       scale: { value: 0.5 },
//     };

//     const material = new THREE.ShaderMaterial({
//       uniforms: uniforms,
//       vertexShader: vertexShader,
//       fragmentShader: fragmentShader,
//     });
//     material.transparent = true;

//     super(geometry, material, LIMIT);
//     this.positions = [];
//     this.lines = [""];
//     this.activeLine = 0;
//     this.chars = chars;
//     this.state = state;
//     this.aspect = aspect[0];
//     this.lineStarts = [[0, 0]];

//     state.scene.add(this);

//     this.setChars();

//     // setInterval(() => {
//     //   this.addText(chars[Math.floor(Math.random() * chars.length)]);
//     // }, 20);
//   }

//   getPositionFromAngle(
//     prev: [number, number],
//     angle: number
//   ): [number, number] {
//     const rx = 0.6 * this.aspect;
//     const x = prev[0] + Math.cos(angle) * rx;
//     const y = prev[1] + Math.sin(angle) * rx;
//     return [x, y];
//   }

//   setChars() {
//     let counter = 0;
//     const offsetBuffer = this.geometry.attributes.offset.array;
//     // @ts-ignore
//     offsetBuffer.fill(0);
//     for (const line of this.lines) {
//       for (const char of line.split("")) {
//         // @ts-ignore
//         offsetBuffer[counter * 2] = this.chars.indexOf(char);
//         counter++;
//       }
//     }
//     this.geometry.attributes.offset.needsUpdate = true;
//   }

//   addText(data: string) {
//     if (!this.state.dragging) {
//       const rad = Math.atan2(this.state.vector.y, this.state.vector.x);
//       this.lines[this.activeLine] += data;
//       const previous = this.state.lastPosition.slice() as [number, number];
//       const position = this.getPositionFromAngle(previous, rad);
//       this.state.lastPosition = position.slice() as [number, number];

//       this.state.cursor.setStart(
//         this.state.lastPosition[0],
//         this.state.lastPosition[1]
//       );
//       const positionDiff = [
//         position[0] - previous[0],
//         position[1] - previous[1],
//       ];
//       this.setPosition(
//         this.activeLine,
//         this.lines[this.activeLine].length - 1,
//         position
//       );
//       this.setChars();
//       this.updatePositions();

//       this.state.camera.position.set(
//         this.state.camera.position.x + positionDiff[0],
//         this.state.camera.position.y + positionDiff[1],
//         this.state.camera.position.z
//       );

//       this.state.cursor.setEnd(
//         this.state.lastPosition[0] + this.state.vector.x,
//         this.state.lastPosition[1] + this.state.vector.y
//       );
//     }
//   }

//   setPosition(
//     lineIndex: number,
//     index: number,
//     position: [number, number]
//   ): void {
//     let point = 0;
//     for (let i = 0; i < lineIndex; i++) {
//       index += this.lines[i].length;
//     }
//     point += index;
//     this.positions[point] = position;
//   }

//   backspace() {
//     if (!this.state.dragging) {
//       const line = this.lines[this.activeLine];
//       if (line.length > 0) {
//         const previous = this.state.lastPosition.slice();
//         const length = line.length;
//         this.lines[this.activeLine] = line.substring(0, length - 1);
//         this.setPosition(this.activeLine, length - 1, [0, 0]);
//         if (length === 1) {
//           this.state.lastPosition = [0, 0];
//         } else {
//           this.state.lastPosition = this.positions[length - 2].slice() as [
//             number,
//             number
//           ];
//         }
//         this.setChars();
//         this.updatePositions();

//         const positionDiff = [
//           this.state.lastPosition[0] - previous[0],
//           this.state.lastPosition[1] - previous[1],
//         ];

//         this.state.camera.position.set(
//           this.state.camera.position.x + positionDiff[0],
//           this.state.camera.position.y + positionDiff[1],
//           this.state.camera.position.z
//         );

//         this.state.cursor.setStart(
//           this.state.lastPosition[0],
//           this.state.lastPosition[1]
//         );
//         this.state.cursor.setEnd(
//           this.state.lastPosition[0] + this.state.vector.x,
//           this.state.lastPosition[1] + this.state.vector.y
//         );
//       }
//     }
//   }

//   enter() {
//     this.lines.splice(this.activeLine + 1, 0, "");
//     this.activeLine += 1;
//     this.lineStarts = [
//       ...this.lineStarts.slice(0, this.activeLine + 1),
//       [0, 1],
//       ...this.lineStarts.slice(this.activeLine + 1),
//     ];

//     this.setPosition(this.activeLine, 0, [0, 0]);
//     console.log(this.lineStarts);
//   }

//   updatePositions() {
//     const matrix = new THREE.Matrix4();
//     const euler = new Euler(0, 0, 0);
//     let prev = [0, 0];
//     let charCounter = 0;
//     for (let j = 0; j < this.lines.length; j++) {
//       const line = this.lines[j];
//       const start = this.lineStarts[j];
//       for (let k = 0; k < line.length; k++) {
//         const position = this.positions[charCounter];
//         const x = position[0];
//         const y = position[1];
//         const rad = Math.atan2(x - prev[0], prev[1] - y);
//         euler.z = rad - Math.PI / 2;
//         matrix.makeRotationFromEuler(euler);
//         matrix.setPosition(x + start[0], y + start[1], 0);
//         this.setMatrixAt(charCounter, matrix);
//         if (k === 0) {
//           prev = [0, 0];
//         } else {
//           prev = [x, y];
//
//         }
//         charCounter++;
//       }
//       console.log(line);
//     }
//     this.instanceMatrix.needsUpdate = true;
//   }
// }

// export default ArchaicText;

export {};
