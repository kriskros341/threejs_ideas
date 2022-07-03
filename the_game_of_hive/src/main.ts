import './style.css'
import * as THREE from "three"
import { AmbientLight, CylinderGeometry, Mesh, MOUSE, Scene, SpotLight, Vector3 } from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls'; // ADDING CONTROLS LITERALLY REPAIRS RAYCASTING!!!~?!!1

let started = false
let around = [
  [1, 0],
  [-1, 0],
  [0, 1],
  [0, -1],
  [-1, 1],
  [1, -1]
]

type vec2 = {x: number, y:number}

function select_hexes_around(coords: vec2): LivingHex[] {
  let neighbours: vec2[] = around.map(v => ({x: v[0], y: v[1]}))
  let tiles = LivingHex.livingObjects.filter(t => {
    for(let n of neighbours) {
      if (t.pos.x == coords.x + n.x && t.pos.y == coords.y + n.y) {
        return true;
      }
    }
  })
  return tiles
}
class Hex extends Mesh {
  //static objects: Hex[] = []
  radius: number;
  height: number
  pos: {
    x: number,
    y: number
  }
  constructor(radius: number, height: number) {
    const geo = new CylinderGeometry(radius, radius, height, 6)
    const mat = new THREE.MeshStandardMaterial({color: 0xeeeeee})
    super(geo, mat)
    this.radius = radius;
    this.height = height;
    //Hex.objects.push(this)
    this.pos = {
      x: 0,
      y: 0
    }
  }
  placeOnGrid = (x: number, y: number, gridOffset: number) => {
    this.pos = {
      x: x,
      y: y
    }
    this.position.set(
      (gridOffset + this.radius) * (Math.sqrt(3) *  x + Math.sqrt(3)/2 * y), 0, (gridOffset+this.radius) * 3./2 * y
    )
  }
}

class LivingHex extends Hex {
  static livingObjects: LivingHex[] = [];
  isAlive = false
  hasBeenAliveFor = 0
  selected = false;
  constructor(radius: number, height: number, isAlive: boolean, selected?: boolean) {
    super(radius, height)
    this.isAlive = isAlive
    if(isAlive) {
      this.material.color.set(0x00ffff)
    }
    LivingHex.livingObjects.push(this)
    if(selected) {
      this.selected = true;
      this.scale.set(1.1, 1.1, 1.1)
    }
  }
  deselect = () => {
    this.selected = false;
    this.scale.set(1, 1, 1)
  }
  select = () => {
    this.selected = true;
    this.scale.set(1.1, 1.1, 1.1)
  }
  predictFutureTile = () => {
    let n = select_hexes_around(this.pos)
    let alive = n.filter(h => h.isAlive)
    const choose = () => {
      if (alive.length == 2) {
        return true
      }
      if(this.isAlive && (alive.length == 3 || alive.length == 4)) {
        return true
      }
      return false
    }
    let l = new LivingHex(this.radius, this.height, choose(), this.selected)
    l.placeOnGrid(this.pos.x, this.pos.y, 0.2)
    return l
  }
}

const updateHover = (hex: LivingHex) => {
  if(started) {
    LivingHex.livingObjects.forEach(h => h.deselect())
    hex.select();
    let l = select_hexes_around(hex.pos)
    l.forEach(t => t.isAlive = true)
  } else {
    LivingHex.livingObjects.forEach(h => h.scale.set(1, 1, 1))
    hex.scale.set(1.1, 1.1, 1.1)

  }
}


const updateClick = (hex: LivingHex) => {
  hex.isAlive = true;
  hex.material.color!.set(0x00ffff)
  started = true
  updateHover(hex)
}

const createRenderer = () => {
  const renderer = new THREE.WebGLRenderer()
  renderer.setPixelRatio(devicePixelRatio);
  renderer.setSize(innerWidth, innerHeight);
  renderer.setClearColor(new THREE.Color(0, 0, 0));
  document.querySelector("#app")!.appendChild(renderer.domElement);
  renderer.domElement.onmousemove = () => {
    let o = select_hex_with_mouse_over()
    o && updateHover(o)
  }
  renderer.domElement.onclick = () => {
    let o = select_Living_hex_with_mouse_over()
    o && updateClick(o)
  }
  return renderer;
}

const createScene = () => {
  const scene = new THREE.Scene()
  return scene
}

const viewSize = 20;
const aspectRatio = innerWidth / innerHeight
const createCamera = () => {
  const cam = new THREE.OrthographicCamera(
    //50/-2, 50/2, 50/2, 50/-2, -1000, 100
    
    -aspectRatio * viewSize / 2, aspectRatio * viewSize / 2, 
    viewSize / 2, -viewSize / 2,
    -1000, 1000
    )
  return cam
}

const createSphere = () => {
  const geo = new THREE.SphereGeometry(0.5)
  const mat = new THREE.MeshStandardMaterial({color: 0xeeeeee})
  const mesh = new THREE.Mesh(geo, mat)
  scene && scene.add(mesh)
  return mesh
}

let pointer = {
  x: 0,
  y: 0,
}

onmousemove = (e) => {
   pointer = {
        x: (e.clientX / renderer.domElement.clientWidth) * 2 - 1,
        y: -(e.clientY / renderer.domElement.clientHeight) * 2 + 1,
    } 
}

let raycaster = new THREE.Raycaster();
let intersects: THREE.Intersection[] = [];
const select_hex_with_mouse_over = () => {
  for(let o of LivingHex.livingObjects) {
    raycaster.setFromCamera(pointer, cam);
    intersects = raycaster.intersectObject(o);
    if(intersects[0]) {
      return o;
    }
  }
  return null;
}
const select_Living_hex_with_mouse_over = () => {
  for(let o of LivingHex.livingObjects) {
    raycaster.setFromCamera(pointer, cam);
    intersects = raycaster.intersectObject(o);
    if(intersects[0]) {
      return o;
    }
  }
  return null;
}

const createHex = () => {
  let mesh = new Hex(1, 0.1)
  scene && scene.add(mesh)
  return mesh
}
const createLivingHex = () => {
  let mesh = new LivingHex(1, 0.1, false)
  scene && scene.add(mesh)
  return mesh
}
const scene = createScene()

const ambient = new AmbientLight(0xffffff, 0.4)
scene.add(ambient)
const point = new SpotLight(0xffffff, 0.5)
point.position.set(0, 0, 1)
scene.add(point)


const placeOnBoard = () => {
  const width = 16;
  const height = 10;
  const offset_width = -width / 2 + 2.8; //not sure why this constant is necessary... OOOH the offset
  const offset_height = -height / 2;

  for(let i = 0; i <= height; i++) {
    for(let j = 0; j <= width; j++) {
      let c = createLivingHex()
      c.placeOnGrid(Math.floor(-i/2) + j + offset_width, i + offset_height, 0.2)
    }
  }
}


const select_hexes_diagonally = (t: vec2): Hex[] => {
  return Hex.objects.filter((t2) => t2.pos.x == t.x || t2.pos.y == t.y || -t2.pos.x-t2.pos.y == -t.x - t.y)
}



const createHexBoard = () => {
  const size = 16
  let offset = -size / 2
  let skip = 2
  for(let i = 0; i <= size+1; i++) {
    for(let j = 0; j <= size+1; j++) {
      if(i + offset > -7) {
        let c = createHex()
        c.placeOnGrid(i + offset, j + offset, 0.2)
      }
    }

  }
}

//createHexBoard()
placeOnBoard()


const renderer = createRenderer()

const cam = createCamera()
cam.rotation.set(Math.PI/2, 0, 0)
cam.position.set(0, 5, 0)

const controls = new OrbitControls(cam, renderer.domElement);
controls.addEventListener("change", () => {
  console.log("c")
})
controls.enabled = false

let t = 0
let j = 0
setInterval(() => {
  if(started) {
    console.log("GENERATION", j)
    let new_arr = LivingHex.livingObjects.map(o => o.predictFutureTile())
    LivingHex.livingObjects.forEach((o: Mesh) => {
      scene.remove(o)
      o.material.dispose()
      o.geometry.dispose()
    })
    new_arr.forEach(o => scene.add(o))
    console.log(new_arr)
    LivingHex.livingObjects = new_arr
    j++;
  }
}, 500)

const rerender = () => {
  requestAnimationFrame(rerender)
  //controls.update()
  renderer.render(scene, cam);
}
rerender()


/*
ideas for improvements:
  I want it to thrive off of singular click, without moving the mouse
  I want it to not replace all the objects and mutete them instead
*/