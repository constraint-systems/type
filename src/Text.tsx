import * as THREE from "three";
import { Euler, ShaderMaterial } from "three";
import { updateVector } from "./Actions";
import { TEXT_COLOR } from "./Constants";
import LineHandles from "./LineHandles";
import State from "./State";

const makeCanvas = (c: HTMLCanvasElement, chars: string[], color: string) => {
  const cx = c.getContext("2d")!;
  cx.clearRect(0, 0, c.width, c.height);
  const fs = 64;
  cx.font = fs + "px custom";

  const ch = Math.round(fs * 1.2);

  const toMeasure = cx.measureText("n");
  const cw = toMeasure.width;
  c.width = 2048;
  const rows = Math.ceil((chars.length * cw) / c.width);
  c.height = rows * ch;
  const perRow = Math.floor(c.width / cw);

  cx.fillStyle = "white";
  cx.fillRect(0, 0, c.width, c.height);
  cx.clearRect(0, 0, c.width, c.height);

  // have to set font again after resize
  cx.font = fs + "px custom";
  cx.fillStyle = color;
  cx.textBaseline = "middle";
  for (let i = 0; i < chars.length; i++) {
    const char = chars[i];
    const col = i % perRow;
    const row = Math.floor(i / perRow);
    // console.log(col * cw, row * ch + ch / 2);
    cx.fillText(char, col * cw, row * ch + ch / 2);
  }
  return { c, cw, ch, rows, perRow };
};

const LIMIT = 2000;
class Text extends THREE.InstancedMesh {
  chars: Array<string>;
  state: State;
  aspect: number;
  lines: Array<string>;
  linePositions: Array<[number, number]>;
  relPositions: Array<Array<[number, number]>>;
  activeLine: number;
  lineHandles: LineHandles;
  dragLineIndex: null | number;
  selectedLines: Array<number>;
  perRow: number;
  rows: number;
  canvas: HTMLCanvasElement;
  ch: number;
  charCounter: number;

  constructor(state: State, lineStart: [number, number]) {
    const geometry = new THREE.PlaneBufferGeometry();
    var uv = geometry.getAttribute("uv");
    let texture;
    let texScale = [1, 1];
    let aspect;
    let rows;
    let perRow;
    const chars =
      " abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ012346789%$€¥£¢&*@#|áâàäåãæçéêèëíîìï:;-–—•,.…'\"`„‹›«»/\\?!¿¡()[]{}©®§+×=_°~^<>".split(
        ""
      );
    const canvas = document.createElement("canvas");
    let ch;
    {
      const madeCanvas = makeCanvas(canvas, chars, TEXT_COLOR);
      const c = madeCanvas.c;
      const cw = madeCanvas.cw;
      ch = madeCanvas.ch;
      rows = madeCanvas.rows;
      perRow = madeCanvas.perRow;
      texture = new THREE.CanvasTexture(c);

      uv.setXY(0, 0, 1);
      uv.setXY(1, 1, 1);
      uv.setXY(2, 0, 0);
      uv.setXY(3, 1, 0);
      texScale[0] = cw / c.width;
      texScale[1] = ch / c.height;

      aspect = [cw / ch, 1, 1];
    }

    const offsets = [];
    for (let i = 0; i < LIMIT; i++) {
      offsets.push(0, 0);
    }

    const selected = [];
    for (let i = 0; i < LIMIT; i++) {
      selected.push(0);
    }

    geometry.setAttribute(
      "offset",
      new THREE.InstancedBufferAttribute(new Float32Array(offsets), 2, false)
    );

    geometry.setAttribute(
      "selected",
      new THREE.InstancedBufferAttribute(new Float32Array(selected), 1, false)
    );

    const vertexShader = `
      varying vec2 vUv;
      attribute vec2 offset;
      varying vec2 vOffset;
      uniform vec2 texScale;
      varying vec2 vTexScale;
      uniform vec3 aspect;
      uniform float scale;
      attribute float selected;
      varying float vSelected;

      void main() {
        vUv = uv * texScale;
        vOffset = offset * texScale;
        vTexScale = texScale;
        vSelected = selected;

        gl_Position = projectionMatrix * viewMatrix * modelMatrix * instanceMatrix * vec4(position * aspect * scale, 1.0);
      }
    `;

    const fragmentShader = `
      uniform sampler2D texture1;
      varying vec2 vUv;
      varying vec2 vOffset;
      varying float vSelected;
      uniform vec3 color;

      void main() {
         vec4 tex = texture2D(texture1, vec2(vUv.x + vOffset.x, vUv.y + vOffset.y ));
         vec4 colored = vec4(color, tex.a);
         if (vSelected == 1.0 && colored.a < 0.2) {
           colored.r = 0.5;
           colored.g = 1.0;
           colored.b = 0.5;
           colored.a = 1.0;
         }
        gl_FragColor = colored;
      }
    `;

    var uniforms = {
      texture1: { type: "t", value: texture },
      texScale: { value: texScale },
      aspect: { value: aspect },
      selected: { value: selected },
      scale: { value: 0.5 },
      color: { value: [1.0, 0.0, 0.0] },
    };

    const material = new THREE.ShaderMaterial({
      uniforms: uniforms,
      vertexShader: vertexShader,
      fragmentShader: fragmentShader,
    });
    material.transparent = true;

    super(geometry, material, LIMIT);
    this.chars = chars;
    this.state = state;
    this.aspect = aspect[0];
    this.perRow = perRow;
    this.rows = rows;
    this.lines = [""];
    this.linePositions = [lineStart.slice() as [number, number]];
    this.relPositions = [[]];
    this.activeLine = 0;
    this.dragLineIndex = null;
    this.selectedLines = [];
    this.canvas = canvas;
    this.ch = ch;
    this.charCounter = 0;

    state.scene.add(this);

    this.lineHandles = new LineHandles(state);

    // this.setChars();

    // const startText = "start typing";
    // let counter = 0;
    // let interval = setInterval(() => {
    //   if (counter === startText.length - 1) clearInterval(interval);
    //   this.addText(startText[counter]);
    //   counter++;
    // }, 30);

    // setInterval(() => {
    //   this.addText(chars[Math.floor(Math.random() * chars.length)]);
    // }, 20);
  }

  setColor(color: string) {
    (this.material as ShaderMaterial).uniforms.color.value = new THREE.Color(
      color
    ).toArray();
  }

  getInstanceLineIndex(instanceIndex: number) {
    let total = 0;
    for (let i = 0; i < this.lines.length; i++) {
      const line = this.lines[i];
      const lineLength = line.length;
      if (instanceIndex < total + lineLength - 1) return i;
      total += lineLength;
    }
  }

  renderLinesSelected() {
    const selectedBuffer = this.geometry.attributes.selected.array;
    // @ts-ignore
    selectedBuffer.fill(0);
    let charCounter = 0;
    for (let i = 0; i < this.lines.length; i++) {
      const line = this.lines[i];
      if (this.selectedLines.includes(i)) {
        for (let j = 0; j < line.length; j++) {
          // @ts-ignore
          selectedBuffer[charCounter + j] = 1;
        }
      }
      charCounter += line.length;
    }
    this.geometry.attributes.selected.needsUpdate = true;
  }

  getPositionFromAngle(
    prev: [number, number],
    angle: number
  ): [number, number] {
    const rx = 0.6 * this.aspect;
    const x = prev[0] + Math.cos(angle) * rx;
    const y = prev[1] + Math.sin(angle) * rx;
    return [x, y];
  }

  getPoints() {
    const _center = new THREE.Vector3();
    const _matrix = new THREE.Matrix4();
    const _scale = new THREE.Vector3();
    const _quaternion = new THREE.Quaternion();
    let left = Infinity;
    let right = -Infinity;
    let top = -Infinity;
    let bottom = Infinity;

    const activePoints = this.lines.reduce(
      (total, curr) => total + curr.length,
      0
    );

    for (let instanceId = 0; instanceId < activePoints; instanceId++) {
      this.getMatrixAt(instanceId, _matrix);

      _matrix.decompose(_center, _quaternion, _scale);
      // apply parent transforms to instance
      // _center.applyMatrix4(this.matrixWorld);
      left = Math.min(_center.x, left);
      right = Math.max(_center.x, right);
      top = Math.max(_center.y, top);
      bottom = Math.min(_center.y, bottom);
    }
    return { top, left, right, bottom };
  }

  addText(data: string) {
    if (this.charCounter < LIMIT) {
      const rad = Math.atan2(this.state.vector.y, this.state.vector.x);
      const position = this.getPositionFromAngle(this.state.lastPosition, rad);

      const start = this.state.text.linePositions[this.state.text.activeLine];
      const cursor = [
        this.state.lastPosition[0] + this.state.vector.x,
        this.state.lastPosition[1] + this.state.vector.y,
      ];
      const prevSigns = [
        cursor[0] - this.state.lastPosition[0] < 0 ? -1 : 1,
        cursor[1] - this.state.lastPosition[1] < 0 ? -1 : 1,
      ];
      const nextSigns = [
        cursor[0] - position[0] < 0 ? -1 : 1,
        cursor[1] - position[1] < 0 ? -1 : 1,
      ];
      if (prevSigns[0] !== nextSigns[0] || prevSigns[1] !== nextSigns[1]) {
        return;
      }

      this.lines[this.activeLine] += data;
      this.relPositions[this.activeLine].push(position);
      this.setChars();
      this.updatePositions();

      // const positionDiff = [
      //   position[0] - this.state.lastPosition[0],
      //   position[1] - this.state.lastPosition[1],
      // ];

      const relPositions = this.relPositions[this.activeLine];
      this.state.lastPosition = relPositions[
        relPositions.length - 1
      ].slice() as [number, number];

      updateVector(this.state);

      // this.state.camera.position.set(
      //   this.state.camera.position.x + positionDiff[0],
      //   this.state.camera.position.y + positionDiff[1],
      //   this.state.camera.position.z
      // );

      this.state.cursor.setEnd(
        this.state.lastPosition[0] + this.state.vector.x + start[0],
        this.state.lastPosition[1] + this.state.vector.y + start[1]
      );

      this.state.movedCheck = false;
    } else {
      alert("You have reached the charater limit of " + 2000 + " characters.");
    }
  }

  backspace() {
    const line = this.lines[this.activeLine];
    if (line.length > 0) {
      const start = this.state.text.linePositions[this.state.text.activeLine];
      const thisLine = this.lines[this.activeLine];
      this.lines[this.activeLine] = thisLine.slice(0, thisLine.length - 1);
      const relPositions = this.relPositions[this.activeLine];
      this.relPositions[this.activeLine] = this.relPositions[
        this.activeLine
      ].slice(0, thisLine.length - 1);
      this.setChars();
      this.updatePositions();
      if (thisLine.length === 1) {
        this.state.lastPosition = [0, 0];
      } else {
        this.state.lastPosition = relPositions[
          relPositions.length - 2
        ].slice() as [number, number];
      }

      updateVector(this.state);
      this.state.cursor.setEnd(
        this.state.lastPosition[0] + this.state.vector.x + start[0],
        this.state.lastPosition[1] + this.state.vector.y + start[1]
      );

      this.state.movedCheck = false;
    }
  }

  enter() {
    this.state.setMode("choosePosition");
    return;
  }

  setChars() {
    let counter = 0;
    const offsetBuffer = this.geometry.attributes.offset.array;
    // @ts-ignore
    offsetBuffer.fill(-1);
    for (const line of this.lines) {
      for (const char of line.split("")) {
        const index = this.chars.indexOf(char);
        const col = index % this.perRow;
        const row = Math.floor(index / this.perRow);
        // @ts-ignore
        offsetBuffer[counter * 2] = col;
        // @ts-ignore
        offsetBuffer[counter * 2 + 1] = this.rows - 1 - row;
        counter++;
      }
    }
    this.geometry.attributes.offset.needsUpdate = true;
  }

  updatePositions() {
    const matrix = new THREE.Matrix4();
    const euler = new Euler(0, 0, 0);
    let prev = [0, 0];
    let charCounter = 0;
    // clear empty
    for (let i = this.lines.length - 1; i >= 0; i--) {
      const line = this.lines[i];
      if (this.activeLine !== i && line.length === 0) {
        this.lines.splice(i, 1);
        this.linePositions.splice(i, 1);
        this.relPositions.splice(i, 1);
        this.activeLine--;
      }
    }
    for (let j = 0; j < this.lines.length; j++) {
      const line = this.lines[j];
      const start = this.linePositions[j];
      this.lineHandles.setPosition(j, start);
      for (let k = 0; k < line.length; k++) {
        const position = this.relPositions[j][k];
        const x = position[0];
        const y = position[1];
        if (k === 0) prev = [0, 0];
        const rad = Math.atan2(x - prev[0], prev[1] - y);
        euler.z = rad - Math.PI / 2;
        matrix.makeRotationFromEuler(euler);
        matrix.setPosition(x + start[0], y + start[1], 0);
        this.setMatrixAt(charCounter, matrix);
        if (k === 0) {
          prev = [0, 0];
        } else {
          prev = [x, y];
        }
        charCounter++;
      }
    }
    this.charCounter = charCounter;
    this.instanceMatrix.needsUpdate = true;
  }
}

export default Text;
