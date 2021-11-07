import * as THREE from "three";
import { updateVector } from "./Actions";
import { Cursor } from "./Cursor";
import { BACKGROUND_COLOR, SAVE2X, TRANSPARENT } from "./Constants";
import Text from "./Text";

class State {
  canvas: HTMLCanvasElement;
  camera: THREE.PerspectiveCamera;
  printCamera: THREE.PerspectiveCamera;
  renderer: THREE.WebGLRenderer;
  printRenderer: THREE.WebGLRenderer;
  scene: THREE.Scene;
  text: Text;
  data: string;
  worldPixel: number;
  center: THREE.Vector2;
  mouse: THREE.Vector2;
  vector: THREE.Vector2;
  tempVec: THREE.Vector3;
  ray: THREE.Vector3;
  lastPosition: [number, number];
  cursor: Cursor;
  draggingCamera: boolean;
  draggingLine: boolean;
  movedCheck: boolean;
  mode: "normal" | "choosePosition" | "navigation";
  transparentBackground: boolean;
  save2x: boolean;
  touch: boolean;

  constructor(canvas: HTMLCanvasElement, printCanvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.camera = new THREE.PerspectiveCamera(
      75,
      window.innerWidth / window.innerHeight,
      0.1,
      100
    );
    this.printCamera = new THREE.PerspectiveCamera(
      75,
      window.innerWidth / window.innerHeight,
      0.1,
      100
    );
    this.renderer = new THREE.WebGLRenderer({
      canvas,
      alpha: true,
    });
    this.renderer.setPixelRatio(window.devicePixelRatio);
    this.renderer.setSize(window.innerWidth, window.innerHeight);

    this.printRenderer = new THREE.WebGLRenderer({
      canvas: printCanvas,
      alpha: true,
    });
    this.printRenderer.setPixelRatio(window.devicePixelRatio);
    this.printRenderer.setSize(window.innerWidth, window.innerHeight);

    this.scene = new THREE.Scene();
    this.center = new THREE.Vector2(
      window.innerWidth / 2,
      window.innerHeight / 2
    );
    this.vector = new THREE.Vector2();

    this.draggingLine = false;
    this.draggingCamera = false;

    const ZSTART = 10;
    // set world pixel
    {
      const visibleHeight =
        2 * Math.tan((this.camera.fov * Math.PI) / 360) * ZSTART;
      this.worldPixel = visibleHeight / window.innerHeight;
    }

    this.data = "";
    this.ray = new THREE.Vector3();
    this.tempVec = new THREE.Vector3();
    this.cursor = new Cursor(this);
    this.mouse = new THREE.Vector2(window.innerWidth - 48, 72);
    this.movedCheck = false;
    this.setBackgroundColor(BACKGROUND_COLOR);
    this.transparentBackground = TRANSPARENT;
    this.save2x = SAVE2X;

    this.lastPosition = [0, 0];
    this.text = new Text(this, [
      (-window.innerWidth / 2 + 24) * this.worldPixel,
      (window.innerHeight / 2 - 72) * this.worldPixel,
    ]);
    this.mode = "normal";

    this.scene.add(this.cursor);

    this.camera.position.z = ZSTART;

    this.touch = window.matchMedia("(pointer: coarse)").matches;

    updateVector(this);

    const start = this.text.linePositions[this.text.activeLine];
    this.cursor.setEnd(
      this.lastPosition[0] + this.vector.x + start[0],
      this.lastPosition[1] + this.vector.y + start[1]
    );

    this.animate();

    const handleResize = () => {
      this.renderer.setSize(window.innerWidth, window.innerHeight);
      this.camera.aspect = window.innerWidth / window.innerHeight;
      this.camera.updateProjectionMatrix();
    };
    window.addEventListener("resize", handleResize);
  }

  setMode(newMode: "normal" | "choosePosition" | "navigation") {
    this.mode = newMode;
    this.cursor.updateMarker();
  }

  setBackgroundColor(color: string) {
    this.scene.background = new THREE.Color(color);
  }

  animate() {
    // this.renderer.setClearColor(0xff0000, 0);
    this.renderer.clear();
    this.renderer.render(this.scene, this.camera);
    requestAnimationFrame(this.animate.bind(this));
  }

  printImage() {
    if (this.text.charCounter > 0) {
      let multiplier = 1;
      if (this.save2x) multiplier = 2;

      const visibleHeight =
        2 * Math.tan((this.camera.fov * Math.PI) / 360) * 10;
      const zoomPixel = visibleHeight / window.innerHeight;
      let { top, left, bottom, right } = this.text.getPoints();
      const pad = 0.6;
      top += pad;
      bottom -= pad;
      left -= pad;
      right += pad;
      const width = ((right - left) / zoomPixel) * multiplier;
      const height = ((top - bottom) / zoomPixel) * multiplier;
      const center = [left + (right - left) / 2, bottom + (top - bottom) / 2];

      const adjust = height / window.innerHeight / multiplier;

      this.printCamera.position.x = center[0];
      this.printCamera.position.y = center[1];
      this.printCamera.position.z = 10 * adjust;

      this.printCamera.aspect = width / height;
      this.printCamera.updateProjectionMatrix();
      this.printRenderer.setSize(width, height);

      this.cursor.visible = false;
      this.cursor.curMarker.visible = false;
      this.cursor.nextMarker.visible = false;
      this.cursor.mouse.visible = false;

      let cacheBackground = Object.assign({}, this.scene.background);
      if (this.transparentBackground) {
        this.scene.background = null;
      }
      this.printRenderer.setClearColor(0x000000, 0);
      this.printRenderer.clear();
      this.printRenderer.render(this.scene, this.printCamera);

      this.printRenderer.domElement.toBlob((blob) => {
        const link = document.createElement("a");
        link.setAttribute(
          "download",
          "type-" + Math.round(new Date().getTime() / 1000) + ".png"
        );
        link.setAttribute("href", URL.createObjectURL(blob));
        link.dispatchEvent(
          new MouseEvent(`click`, {
            bubbles: true,
            cancelable: true,
            view: window,
          })
        );

        if (this.transparentBackground) {
          this.scene.background = cacheBackground;
        }

        this.cursor.visible = true;
        this.cursor.mouse.visible = true;
        this.cursor.curMarker.visible = true;
        this.cursor.nextMarker.visible = true;
      });
    }
  }
}

export default State;
