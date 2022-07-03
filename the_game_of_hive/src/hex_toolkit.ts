import * as THREE from "three"

export type vec2 = {x: number, y:number}

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
    this.mesh = new THREE.Mesh(new THREE.CylinderGeometry(radius, radius, height, 6), new THREE.MeshStandardMaterial({color: 0xeeeeee}))
    this.radius = radius;
    this.height = height;
    //Hex.objects.push(this)
    this.pos = {
      x: 0,
      y: 0
    }
  }
  getMat = (): THREE.MeshStandardMaterial => {
    if(Array.isArray(this.mesh.material)) {
      return this.mesh.material[0] as THREE.MeshStandardMaterial
    }
    return this.mesh.material as THREE.MeshStandardMaterial
  }
  placeOnGrid = (x: number, y: number, gridOffset: number) => {
    this.pos = {
      x: x,
      y: y
    }
    this.mesh.position.set(
      (gridOffset + this.radius) * (Math.sqrt(3) *  x + Math.sqrt(3)/2 * y), 0, (gridOffset+this.radius) * 3./2 * y
    )
  }
}
export const select_hexes_diagonally = (t: vec2): Hex[] => {
  return Hex.objects.filter((t2) => t2.pos.x == t.x || t2.pos.y == t.y || -t2.pos.x-t2.pos.y == -t.x - t.y)
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
export const getMouseoverFn = (renderer: THREE.WebGLRenderer, cam: THREE.Camera) => {

  let pointer: vec2;
  renderer.domElement.addEventListener("mouseover", (e) => {
    pointer = {
          x: (e.clientX / renderer.domElement.clientWidth) * 2 - 1,
          y: -(e.clientY / renderer.domElement.clientHeight) * 2 + 1,
      } 
    }, false)
  
  const select_hex_with_mouse_over = () => {
    console.log("jd")
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