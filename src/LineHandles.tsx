import * as THREE from "three";
import State from "./State";

const LIMIT = 1000;
class LineHandles extends THREE.InstancedMesh {
  state: State;
  visibles: Array<number>;
  positions: Array<[number, number]>;

  constructor(state: State) {
    const geometry = new THREE.CircleGeometry();
    const material = new THREE.MeshBasicMaterial({ color: 0x00ff00 });

    super(geometry, material, LIMIT);
    state.scene.add(this);

    this.state = state;

    this.visibles = new Array(LIMIT).fill(0);
    this.positions = new Array(LIMIT).fill([0, 0]);

    this.updatePositions();
  }

  setPosition(index: number, position: [number, number]) {
    this.positions[index] = position;
    this.updatePositions();
  }

  updateSelections() {
    this.visibles.fill(0);
    if (this.state.text) {
      if (this.state.text.selectedLines.length > 0) {
        for (const index of this.state.text.selectedLines) {
          this.visibles[index] = 1;
        }
      }
      if (this.state.text.activeLine !== null) {
        this.visibles[this.state.text.activeLine] = 1;
      }
    }
    const matrix = new THREE.Matrix4();
    for (let i = 0; i < LIMIT; i++) {
      if (this.visibles[i] === 1) {
        const position = this.positions[i];
        matrix.makeScale(0.0, 0.0, 1);
        matrix.setPosition(position[0], position[1], 0);
        this.setMatrixAt(i, matrix);
      } else {
        matrix.makeScale(0.0, 0.0, 1);
        this.setMatrixAt(i, matrix);
      }
    }
    this.instanceMatrix.needsUpdate = true;
  }

  updatePositions() {
    const matrix = new THREE.Matrix4();
    for (let i = 0; i < LIMIT; i++) {
      const position = this.positions[i];
      matrix.makeScale(0.08, 0.08, 1);
      matrix.setPosition(position[0], position[1], 0);
      this.setMatrixAt(i, matrix);
    }
    this.updateSelections();
    this.instanceMatrix.needsUpdate = true;
  }
}

export default LineHandles;
