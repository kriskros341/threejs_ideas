import * as THREE from "three"
import { MaxEquation } from "three";
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls'; // ADDING CONTROLS LITERALLY REPAIRS RAYCASTING!!!~?!!1

export type vec2 = {x: number, y:number}

abstract class Board<H extends Hex> {
  abstract hexes: H[];
  constructor() {

  }
  abstract build(...args: any[]): void
  moveBy(v: THREE.Vector3) {
    for(let hex of this.hexes) {
      hex.mesh.translateX(v.x)
      hex.mesh.translateY(v.y)
      hex.mesh.translateZ(v.z)
    }
  }
}

interface Class<T> {
  new(...args: any[]): T
}

export class Grid<H extends Hex> extends Board<H> {
  hexes: H[] = [];
  width: number;
  height: number
  type: any
  constructor(width: number, height: number, type: typeof Hex = Hex) {
    super()
    this.type = type
    this.width = width
    this.height = height
  }
  build(...args: any[]) {
    for(let i = 0; i < this.height; i++) {
      for(let j = 0; j < this.width; j++) {
        let hex = new this.type(...args)
        hex.placeOnGrid(Math.floor(-i/2) + j, i, 0.2)
        this.hexes.push(hex);
      }
    }
  } 
  draw = (scene: THREE.Scene) => {
    for(let hex of this.hexes) {
      scene.add(hex.mesh);
    }
  } 
}

const defaultMaterial = new THREE.MeshBasicMaterial({color: 0xffffff})

export class Hexagon<H extends Hex> extends Board<H> {
  hexes: H[] = [];
  type: any
  radius: number
  constructor(radius: number, type: typeof Hex = Hex) {
    super()
    this.type = type
    this.radius = radius
  }
  build(...args: any[]) {
    const skip = 3
    //  7
    for(let i = -this.radius; i <= this.radius; i++) {
      let r1 = Math.max(-this.radius, -i - this.radius)
      let r2 = Math.min(this.radius, -i + this.radius)
      for (let j = r1; j <= r2; j++) {
        let hex = new this.type(...args)
        hex.placeOnGrid(i, j, 0.2)
        this.hexes.push(hex);
      }
    }
  } 
  draw = (scene: THREE.Scene) => {
    for(let hex of this.hexes) {
      scene.add(hex.mesh);
    }
  } 
}

export class Hex {
  static objects: Hex[] = []
  radius: number;
  height: number
  pos: {
    x: number,
    y: number
  }
  mesh: THREE.Mesh;
  constructor(radius: number, height: number) {
    this.mesh = new THREE.Mesh(new THREE.CylinderGeometry(radius, radius, height, 6, 1, false), new THREE.MeshStandardMaterial({color: 0xeeeeee}))
    this.radius = radius;
    this.height = height;
    this.pos = {
      x: 0,
      y: 0
    }
    Hex.objects.push(this)
  }
  getMat = (): THREE.MeshStandardMaterial => {
    if(Array.isArray(this.mesh.material)) {
      return this.mesh.material[0] as THREE.MeshStandardMaterial
    }
    return this.mesh.material as THREE.MeshStandardMaterial
  }
  placeOnGrid = (x: number, y: number, gridOffset: number = 0) => {
    this.pos = {
      x: x,
      y: y
    }
    this.mesh.position.set(
      (gridOffset + this.radius) * (Math.sqrt(3) *  x + Math.sqrt(3)/2 * y), 0, (gridOffset+this.radius) * 3./2 * y
    )
  }
}
export const select_hexes_diagonally = (t: vec2, options: {r:boolean, q:boolean, s:boolean} = {r: true, q: true, s: true}): Hex[] => {
  return Hex.objects.filter((t2) => (options.r && t2.pos.x == t.x) || (options.q && t2.pos.y == t.y) || (options.s && -t2.pos.x-t2.pos.y == -t.x - t.y))
}

export const around = [
  [1, 0],
  [-1, 0],
  [0, 1],
  [0, -1],
  [-1, 1],
  [1, -1]
]

export function select_hexes_around(coords: vec2): Hex[] {
  let neighbours: vec2[] = around.map(v => ({x: v[0], y: v[1]}))
  let tiles = Hex.objects.filter(t => {
    for(let n of neighbours) {
      if (t.pos.x == coords.x + n.x && t.pos.y == coords.y + n.y) {
        return true;
      }
    }
  })
  return tiles
}


let raycaster = new THREE.Raycaster();
let intersects: THREE.Intersection[] = [];
let pointer: vec2;
export const getMouseoverFn = (renderer: THREE.WebGLRenderer, cam: THREE.Camera) => {
  renderer.domElement.addEventListener("mousemove", (e) => {
    pointer = {
          x: (e.clientX / renderer.domElement.clientWidth) * 2 - 1,
          y: -(e.clientY / renderer.domElement.clientHeight) * 2 + 1,
      } 
    }, )
  const select_hex_with_mouse_over = () => {
    for(let o of Hex.objects) {
      raycaster.setFromCamera(pointer, cam);
      intersects = raycaster.intersectObject(o.mesh);
      if(intersects[0]) {
        return o;
      }
    }
    return null;
  }

  return select_hex_with_mouse_over
}