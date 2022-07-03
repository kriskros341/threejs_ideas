import './style.css'
import * as THREE from "three"
import { AmbientLight, Camera, CylinderGeometry, Mesh, MeshBasicMaterial, MOUSE, OrthographicCamera, Scene, SpotLight, Vector3 } from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls'; // ADDING CONTROLS LITERALLY REPAIRS RAYCASTING!!!~?!!1
import { Hex, vec2, getMouseoverFn, around, Grid, Hexagon, select_hexes_around, select_hexes_diagonally } from "./hex_toolkit"

let started = false



const createRenderer = () => {
  const renderer = new THREE.WebGLRenderer()
  renderer.setPixelRatio(devicePixelRatio);
  renderer.setSize(innerWidth, innerHeight);
  renderer.setClearColor(new THREE.Color(0, 0, 0));
  document.querySelector("#app")!.appendChild(renderer.domElement);
  renderer.domElement.onmousemove = () => {
  }
  renderer.domElement.onclick = () => {
  }
  return renderer;
}

const createScene = () => {
  const scene = new THREE.Scene()
  return scene
}

let aspectRatio = innerWidth / innerHeight
class MyCamera extends OrthographicCamera {
  viewSize: number
  distance = 25
  constructor(viewSize: number) {
    super(
      -aspectRatio * viewSize / 2, aspectRatio * viewSize / 2, 
      viewSize / 2, -viewSize / 2,
      0, 1000
    ) // if near < 0 bad things fucking happen
    this.viewSize = viewSize
    this.rotation.set(-Math.PI/2, 0, 0)
    this.position.set(0, this.distance, this.distance)
    window.addEventListener('resize', this.onWindowResize);
  }
  onWindowResize() {
    aspectRatio = window.innerWidth / window.innerHeight;
    this.left = -aspectRatio * this.viewSize / 2
    this.right =  aspectRatio * this.viewSize / 2
    this.updateProjectionMatrix();
    renderer.setSize( window.innerWidth, window.innerHeight );
  }
  setRotation = (v: number) => {
    cam.rotation.set(cam.rotation.x, cam.rotation.y, v/400)
    cam.position.set(cam.distance * Math.sin(v/400), cam.position.y, cam.distance * (Math.cos(v/400)))
  }
}
const cam = new MyCamera(40)


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


const createHex = () => {
  let hex = new Hex(1, 0.1)
  scene && scene.add(hex.mesh)
  return hex
}
const scene = createScene()

const ambient = new AmbientLight(0xffffff, 0.7)
scene.add(ambient)
const point = new SpotLight(0xffffff, 0.5)
point.position.set(0, 0, 1)
scene.add(point)

/*
const placeOnBoard = () => {
  const width = 16;
  const height = 10;
  const offset_width = -width / 2 + 2.8; //not sure why this constant is necessary... OOOH the offset
  const offset_height = -height / 2;
  for(let i = 0; i <= height; i++) {
    for(let j = 0; j <= width; j++) {
      let c = createHex()
      c.placeOnGrid(Math.floor(-i/2) + j + offset_width, i + offset_height, 0.2)
    }
  }
}
*/


//createHexBoard()
//placeOnBoard()


const renderer = createRenderer()



const rerender = () => {
  requestAnimationFrame(rerender)
  renderer.render(scene, cam);
}



class superHex extends Hex {
  static superHexes: superHex[] = []
  isActive: boolean = false
  segment: number | undefined
  constructor() {
    super(2.5, 0.1)
    superHex.superHexes.push(this)
  }
  select() {
    superHex.superHexes.forEach(h => h.deselect())
    const neighbours = select_hexes_around(this.pos)
    this.mesh.scale.set(1.1, 1.1, 1.1)
    neighbours.forEach(n => n.mesh.scale.set(1.1, 1.1, 1.1))
  }
  activate(seg?: number) {
    this.isActive = true
    this.segment = seg ? seg : segment;
    this.getMat().color.set(colors[this.segment])
  }
  propagate(fn: (h: superHex) => void, timeout = 0, getter: (coords: vec2) => Hex[] = select_hexes_around) {
    setTimeout(() => {
      const targets = getter(this.pos) as superHex[]
      targets.forEach(t => fn(t))
    }, timeout)
  }
  click(seg: number) {
    this.activate(seg)
    this.propagate(
      (t) => {
        t.segment != this.segment && t.click(seg)
      }, 100)

  }
  deselect() {
    this.mesh.scale.set(1, 1, 1)
  }
}

class SuperGrid extends Hexagon<superHex> {
  constructor(size: number) {
    super(size, superHex)
  }
}

var startCoords = {x: 0, y: 0};
var last = {x: 0, y: 0};
var isDown = false;

const mod = (n1: number, n2: number) => {
  let m = n1 > 0 ? n1 : -n1;
  n2 = Math.abs(n2)

  while(m >= n2) {
    m -= n2
  }
  return n1 < 0 ? m : -m

}

let segment = 0
let colors = [
  0xffffff,
  0x00ffff,
  0x0000ff,
  0xff0000,
  0xffff00,
  0x00ff00,
]

addEventListener("mousemove", (e) => {
  isDown && cam.setRotation(-e.offsetX + startCoords.x)
  const current2 = mod(cam.rotation.z / 2, Math.PI) // 2 PI in full circle but multiplying PI breaks it (?!?!)
  let seg = Math.floor(current2 * 6 / Math.PI + 0.5) // round 
  seg = seg >= 0 ? seg == 6 ? 0 : seg : 6 + seg; 
  segment = seg
})
addEventListener("mousemove", () => {
  const l = select_hex_with_mouse_over() as superHex;
  l && l.select();
})
addEventListener("click", () => {
  const l = select_hex_with_mouse_over() as superHex;
  if(l) {
    l.getMat().vertexColors
  }
  //if(l) {
  //  const g = select_hexes_around(l.pos) as superHex[]
  //  g.forEach(h => h.click(segment))
  //  l.click(segment);
  //}
})

addEventListener("mousedown", (e) => {
  const l = select_hex_with_mouse_over()
  if(!l) {
    isDown = true;
    startCoords = {x: e.pageX - renderer.domElement.offsetLeft - last.x,
                    y: e.pageY - renderer.domElement.offsetTop - last.y};
  }
})

addEventListener("mouseup", function (e) {
  const l = select_hex_with_mouse_over()
  if(!l || isDown) {
    isDown = false;
    last = {x: e.pageX - renderer.domElement.offsetLeft - startCoords.x,
            y: e.pageY - renderer.domElement.offsetTop - startCoords.y};
    }
})

const g = new SuperGrid(10)
g.build(1, 0.1)
g.draw(scene)

renderer.domElement.addEventListener("mousemove", (e) => {
  pointer = {
        x: (e.clientX / renderer.domElement.clientWidth) * 2 - 1,
        y: -(e.clientY / renderer.domElement.clientHeight) * 2 + 1,
    } 
  }
)
let raycaster = new THREE.Raycaster();
let intersects: THREE.Intersection[] = [];
const select_hex_with_mouse_over = getMouseoverFn(renderer, cam)
rerender()