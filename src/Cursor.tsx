import * as THREE from "three";
import { MeshBasicMaterial } from "three";
import { updateVector } from "./Actions";
import State from "./State";

export class Cursor extends THREE.Line {
  state: State;
  nextMarker: THREE.Mesh;
  curMarker: THREE.Mesh;
  mouse: THREE.Mesh;

  constructor(state: State) {
    const material = new THREE.LineBasicMaterial({
      color: 0x00ff00,
      linewidth: 2,
    });
    const points = [];
    points.push(new THREE.Vector3(0, 0, 0));
    points.push(new THREE.Vector3(60, 0, 0));
    const geometry = new THREE.BufferGeometry().setFromPoints(points);
    super(geometry, material);
    this.state = state;
    this.visible = true;

    {
      const geometry = new THREE.CircleGeometry();
      const material = new THREE.MeshBasicMaterial({ color: 0xffff00 });
      this.mouse = new THREE.Mesh(geometry, material);
      this.mouse.scale.x = 0.4;
      this.mouse.scale.y = 0.4;
      state.scene.add(this.mouse);
    }

    {
      const geometry = new THREE.PlaneGeometry();
      const material = new THREE.MeshBasicMaterial({ color: 0xff00ff });
      this.nextMarker = new THREE.Mesh(geometry, material);
      this.nextMarker.scale.x = 0.25;
      this.nextMarker.scale.y = 0.5;
      state.scene.add(this.nextMarker);
    }

    {
      const geometry = new THREE.CircleGeometry();
      const material = new THREE.MeshBasicMaterial({ color: 0x00ff00 });
      this.curMarker = new THREE.Mesh(geometry, material);
      this.curMarker.scale.x = 0.08;
      this.curMarker.scale.y = 0.08;
      state.scene.add(this.curMarker);
    }
  }

  setStart(x: number, y: number) {
    const positions = this.state.cursor.geometry.attributes.position.array;
    // @ts-ignore
    positions[0] = x;
    // @ts-ignore
    positions[1] = y;
    this.state.cursor.geometry.attributes.position.needsUpdate = true;

    this.curMarker.position.x = x;
    this.curMarker.position.y = y;

    this.updateMarker();
  }

  updateMarker() {
    const start = this.state.text.linePositions[this.state.text.activeLine];
    const rad = Math.atan2(this.state.vector.y, this.state.vector.x);
    const position = this.state.text.getPositionFromAngle(
      [
        this.state.lastPosition[0] + start[0],
        this.state.lastPosition[1] + start[1],
      ],
      rad
    );
    this.nextMarker.position.set(position[0], position[1], 0);
    this.nextMarker.rotation.z = rad;

    const positions = this.state.cursor.geometry.attributes.position.array;
    // @ts-ignore
    positions[0] = this.nextMarker.position.x;
    // @ts-ignore
    positions[1] = this.nextMarker.position.y;
    this.state.cursor.geometry.attributes.position.needsUpdate = true;

    const linePosition =
      this.state.text.linePositions[this.state.text.activeLine];
    this.curMarker.position.set(linePosition[0], linePosition[1], 0);

    const mouseMaterial = this.mouse.material as MeshBasicMaterial;
    if (this.state.mode === "choosePosition") {
      this.nextMarker.visible = false;
      this.visible = false;
      mouseMaterial.color.setHex(0x00ff00);
      this.mouse.scale.x = 0.4;
      this.mouse.scale.y = 0.4;
      this.curMarker.visible = false;
    } else if (this.state.mode === "navigation") {
      mouseMaterial.color.setHex(0x00ffff);
      this.visible = false;
      this.nextMarker.visible = false;
      this.curMarker.visible = false;
    } else {
      this.nextMarker.visible = true;
      this.visible = true;
      mouseMaterial.color.setHex(0xffff00);
      this.mouse.scale.x = 0.4;
      this.mouse.scale.y = 0.4;
      this.curMarker.visible = true;
    }
  }

  updateEndAndCursor() {
    updateVector(this.state);
    const start = this.state.text.linePositions[this.state.text.activeLine];
    this.state.cursor.setEnd(
      this.state.lastPosition[0] + this.state.vector.x + start[0],
      this.state.lastPosition[1] + this.state.vector.y + start[1]
    );
  }

  setEnd(x: number, y: number) {
    const positions = this.state.cursor.geometry.attributes.position.array;
    // @ts-ignore
    positions[3] = x;
    // @ts-ignore
    positions[4] = y;
    this.state.cursor.geometry.attributes.position.needsUpdate = true;
    this.updateMarker();

    this.mouse.position.set(x, y, 0);
  }
}
