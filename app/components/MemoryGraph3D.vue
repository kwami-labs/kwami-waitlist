<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch } from 'vue'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'

type MemoryNode = {
  id: string
  label: string
  type: string
}

type MemoryEdge = {
  source: string
  target: string
  relation: string
}

type MemoryGraph = {
  nodes: MemoryNode[]
  edges: MemoryEdge[]
}

const props = defineProps<{
  graph: MemoryGraph
}>()

const containerRef = ref<HTMLDivElement | null>(null)

let scene: THREE.Scene
let camera: THREE.PerspectiveCamera
let renderer: THREE.WebGLRenderer
let controls: OrbitControls
let animationId = 0
let nodeObjects: THREE.Object3D[] = []
let edgeObjects: THREE.Object3D[] = []
let labelSprites: THREE.Sprite[] = []
let positions3D = new Map<string, THREE.Vector3>()

const typeColors: Record<string, number> = {
  user: 0x00d9a6,
  assistant: 0x7c4dff,
  person: 0xff6b9d,
  location: 0x26c6da,
  preference: 0xffb74d,
  topic: 0x7e57c2,
  project: 0xffca28,
  product: 0x4fc3f7,
  event: 0x5c6bc0,
  activity: 0xec407a,
  goal: 0xef5350,
  fact: 0x90a4ae,
}

function getNodeColor(type: string): number {
  return typeColors[type.toLowerCase()] ?? 0xb0bec5
}

function calculateDegrees(nodes: MemoryNode[], edges: MemoryEdge[]): Map<string, number> {
  const degrees = new Map<string, number>()
  nodes.forEach((node) => degrees.set(node.id, 0))
  edges.forEach((edge) => {
    degrees.set(edge.source, (degrees.get(edge.source) || 0) + 1)
    degrees.set(edge.target, (degrees.get(edge.target) || 0) + 1)
  })
  return degrees
}

function findCentralNode(degrees: Map<string, number>): string {
  let centralNodeId = 'kwami'
  let maxDegree = 0
  degrees.forEach((degree, id) => {
    if (degree > maxDegree) {
      maxDegree = degree
      centralNodeId = id
    }
  })
  return centralNodeId
}

function calculateNodeRadius(degree: number, maxDegree: number, isUser: boolean): number {
  const degreeScale = Math.min(degree / Math.max(maxDegree, 1), 1)
  let radius = 6 + (16 - 6) * Math.sqrt(degreeScale)
  if (isUser) radius = Math.max(radius, 14)
  return radius
}

function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text
  return `${text.slice(0, maxLength - 2)}..`
}

function graphScale(): number {
  const n = props.graph.nodes.length
  if (n <= 20) return 1
  return 1 + Math.log10(n / 15) * 0.65
}

function createTextSprite(text: string, color: number): THREE.Sprite {
  const canvas = document.createElement('canvas')
  const context = canvas.getContext('2d')!
  canvas.width = 1024
  canvas.height = 160

  context.clearRect(0, 0, canvas.width, canvas.height)
  context.font = 'bold 72px Inter, system-ui, sans-serif'
  context.textAlign = 'center'
  context.textBaseline = 'middle'
  context.shadowColor = 'rgba(0,0,0,0.9)'
  context.shadowBlur = 14
  context.fillStyle = `#${color.toString(16).padStart(6, '0')}`
  context.fillText(text, canvas.width / 2, canvas.height / 2)

  const texture = new THREE.CanvasTexture(canvas)
  texture.minFilter = THREE.LinearFilter
  texture.magFilter = THREE.LinearFilter
  const material = new THREE.SpriteMaterial({
    map: texture,
    transparent: true,
    depthTest: false,
    opacity: 1,
  })
  const sprite = new THREE.Sprite(material)
  sprite.scale.set(68, 10.6, 1)
  return sprite
}

function clearSceneObjects() {
  nodeObjects.forEach((obj) => scene.remove(obj))
  edgeObjects.forEach((obj) => scene.remove(obj))
  labelSprites.forEach((obj) => scene.remove(obj))
  nodeObjects = []
  edgeObjects = []
  labelSprites = []
  positions3D.clear()
}

function initScene() {
  if (!containerRef.value) return

  const width = containerRef.value.clientWidth
  const height = containerRef.value.clientHeight || 520
  const scale = graphScale()

  scene = new THREE.Scene()
  scene.background = null

  camera = new THREE.PerspectiveCamera(55, width / height, 0.1, 6000)
  camera.position.set(0, 34 * scale, 210 * scale)

  renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true })
  renderer.setSize(width, height)
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
  containerRef.value.innerHTML = ''
  containerRef.value.appendChild(renderer.domElement)

  controls = new OrbitControls(camera, renderer.domElement)
  controls.enableDamping = true
  controls.dampingFactor = 0.05
  controls.autoRotate = true
  controls.autoRotateSpeed = 0.5
  controls.minDistance = 80
  controls.maxDistance = 560

  scene.add(new THREE.AmbientLight(0xffffff, 0.7))
  const pointLight = new THREE.PointLight(0xffffff, 1.2)
  pointLight.position.set(120, 120, 120)
  scene.add(pointLight)
}

function init3DLayout() {
  const nodes = props.graph.nodes
  const edges = props.graph.edges
  const scale = graphScale()
  const nodeDegrees = calculateDegrees(nodes, edges)
  const centralNodeId = findCentralNode(nodeDegrees)

  const connectedToCentral = new Set<string>()
  edges.forEach((edge) => {
    if (edge.source === centralNodeId) connectedToCentral.add(edge.target)
    if (edge.target === centralNodeId) connectedToCentral.add(edge.source)
  })

  const directRadius = 74 * scale
  const indirectRadius = 136 * scale
  let directAngle = 0
  let indirectAngle = 0
  const directAngleStep = (2 * Math.PI) / Math.max(connectedToCentral.size, 1)
  const indirectNodes = nodes.filter((n) => n.id !== centralNodeId && !connectedToCentral.has(n.id))
  const indirectAngleStep = (2 * Math.PI) / Math.max(indirectNodes.length, 1)

  nodes.forEach((node) => {
    if (node.id === centralNodeId) {
      positions3D.set(node.id, new THREE.Vector3(0, 0, 0))
    } else if (connectedToCentral.has(node.id)) {
      const phi = directAngle
      const theta = Math.PI / 2 + (Math.random() - 0.5) * 0.8
      positions3D.set(
        node.id,
        new THREE.Vector3(
          directRadius * Math.sin(theta) * Math.cos(phi),
          directRadius * Math.cos(theta),
          directRadius * Math.sin(theta) * Math.sin(phi),
        ),
      )
      directAngle += directAngleStep
    } else {
      const phi = indirectAngle + Math.PI / 4
      const theta = Math.PI / 2 + (Math.random() - 0.5) * 1.1
      positions3D.set(
        node.id,
        new THREE.Vector3(
          indirectRadius * Math.sin(theta) * Math.cos(phi),
          indirectRadius * Math.cos(theta),
          indirectRadius * Math.sin(theta) * Math.sin(phi),
        ),
      )
      indirectAngle += indirectAngleStep
    }
  })

  const iterations = Math.min(300 + nodes.length * 2, 600)
  const k = 0.15
  const baseRepulsion = 15000 * scale
  const minDistance = 40 + 15 * scale

  for (let i = 0; i < iterations; i++) {
    const cooling = 1 - (i / iterations) * 0.7

    for (let a = 0; a < nodes.length; a++) {
      for (let b = a + 1; b < nodes.length; b++) {
        const nodeA = nodes[a]
        const nodeB = nodes[b]
        if (!nodeA || !nodeB) continue

        const posA = positions3D.get(nodeA.id)!
        const posB = positions3D.get(nodeB.id)!
        const delta = new THREE.Vector3().subVectors(posA, posB)
        const dist = delta.length() || 1
        const degreeA = nodeDegrees.get(nodeA.id) || 1
        const degreeB = nodeDegrees.get(nodeB.id) || 1
        const degreeFactor = Math.sqrt(degreeA * degreeB) / 2 + 1
        let force = (baseRepulsion * degreeFactor / (dist * dist)) * cooling

        if (dist < minDistance) force += (minDistance - dist) * 2 * cooling

        delta.normalize().multiplyScalar(force)
        if (nodeA.id !== centralNodeId) posA.add(delta)
        if (nodeB.id !== centralNodeId) posB.sub(delta)
      }
    }

    props.graph.edges.forEach((edge) => {
      const posA = positions3D.get(edge.source)
      const posB = positions3D.get(edge.target)
      if (!posA || !posB) return

      const delta = new THREE.Vector3().subVectors(posB, posA)
      const dist = delta.length() || 1
      const degreeA = nodeDegrees.get(edge.source) || 1
      const degreeB = nodeDegrees.get(edge.target) || 1
      const targetLength = 44 * scale + Math.max(degreeA, degreeB) * 5
      const force = (dist - targetLength) * k * cooling
      delta.normalize().multiplyScalar(force)
      if (edge.source !== centralNodeId) posA.add(delta)
      if (edge.target !== centralNodeId) posB.sub(delta)
    })
  }

  const maxDegree = Math.max(...Array.from(nodeDegrees.values()), 1)

  props.graph.edges.forEach((edge) => {
    const startPos = positions3D.get(edge.source)
    const endPos = positions3D.get(edge.target)
    if (!startPos || !endPos) return

    const direction = new THREE.Vector3().subVectors(endPos, startPos)
    const midPoint = new THREE.Vector3().addVectors(startPos, endPos).multiplyScalar(0.5)
    const perpendicular = new THREE.Vector3().crossVectors(direction.normalize(), new THREE.Vector3(0, 1, 0))
    if (perpendicular.length() < 0.1) perpendicular.crossVectors(direction, new THREE.Vector3(1, 0, 0))
    perpendicular.normalize()
    midPoint.add(perpendicular.multiplyScalar(10))

    const curve = new THREE.QuadraticBezierCurve3(startPos.clone(), midPoint, endPos.clone())
    const points = curve.getPoints(22)
    const geometry = new THREE.BufferGeometry().setFromPoints(points)
    const material = new THREE.LineBasicMaterial({
      color: 0x3d4a5c,
      opacity: 0.42,
      transparent: true,
    })

    const line = new THREE.Line(geometry, material)
    scene.add(line)
    edgeObjects.push(line)
  })

  props.graph.nodes.forEach((node) => {
    const pos = positions3D.get(node.id)
    if (!pos) return

    const degree = nodeDegrees.get(node.id) || 1
    const radius = calculateNodeRadius(degree, maxDegree, node.type === 'user')
    const color = getNodeColor(node.type)

    const geometry = new THREE.SphereGeometry(radius, 32, 32)
    const material = new THREE.MeshPhongMaterial({
      color,
      emissive: color,
      emissiveIntensity: 0.34,
      shininess: 55,
    })

    const sphere = new THREE.Mesh(geometry, material)
    sphere.position.copy(pos)
    scene.add(sphere)
    nodeObjects.push(sphere)

    const glowGeometry = new THREE.SphereGeometry(radius * 1.4, 16, 16)
    const glowMaterial = new THREE.MeshBasicMaterial({
      color,
      transparent: true,
      opacity: 0.12,
    })
    const glow = new THREE.Mesh(glowGeometry, glowMaterial)
    glow.position.copy(pos)
    scene.add(glow)
    nodeObjects.push(glow)

    const label = truncateText(node.label, degree > 3 ? 20 : 15)
    const labelSprite = createTextSprite(label, 0xe2e8f0)
    labelSprite.position.copy(pos)
    labelSprite.position.y -= radius + 12
    scene.add(labelSprite)
    labelSprites.push(labelSprite)
  })
}

function animate() {
  animationId = requestAnimationFrame(animate)
  controls?.update()
  renderer?.render(scene, camera)
}

function onWindowResize() {
  if (!containerRef.value || !camera || !renderer) return
  const width = containerRef.value.clientWidth
  const height = containerRef.value.clientHeight || 520
  camera.aspect = width / height
  camera.updateProjectionMatrix()
  renderer.setSize(width, height)
}

function rebuild() {
  if (!containerRef.value || !props.graph?.nodes?.length) return
  if (animationId) cancelAnimationFrame(animationId)
  if (renderer) {
    renderer.domElement.removeEventListener('wheel', stopWheelScroll, true)
    renderer.dispose()
  }
  window.removeEventListener('resize', onWindowResize)

  initScene()
  clearSceneObjects()
  init3DLayout()
  animate()

  renderer.domElement.addEventListener('wheel', stopWheelScroll, { passive: false, capture: true })
  window.addEventListener('resize', onWindowResize)
}

function stopWheelScroll(event: WheelEvent) {
  event.stopPropagation()
}

onMounted(rebuild)
watch(() => props.graph, rebuild, { deep: true })

onUnmounted(() => {
  if (animationId) cancelAnimationFrame(animationId)
  if (renderer) {
    renderer.domElement.removeEventListener('wheel', stopWheelScroll, true)
    renderer.dispose()
  }
  window.removeEventListener('resize', onWindowResize)
})
</script>

<template>
  <div ref="containerRef" class="waitlist-memory-graph" />
</template>

<style scoped>
.waitlist-memory-graph {
  width: 100%;
  height: 100dvh;
  min-height: 100dvh;
  border-radius: 0;
  overflow: hidden;
  background: transparent;
  border: none;
  box-shadow: none;
}
</style>
