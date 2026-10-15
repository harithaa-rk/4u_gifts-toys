import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import gsap from 'gsap';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

/**
 * Cinematic 3D Magical Toy Vending Machine Scene
 * Built with Three.js & GSAP for 4U Toys & Gifts
 * Features:
 * - Rich boutique palette: Hot pink (#FF3F9D), bubblegum (#FF63B7), lavender (#A78BFA),
 *   electric purple (#8057E8), aqua (#67DFF5), butter yellow (#FFD86F), rose gold (#E8A598)
 * - Real product catalogue integration: loads real 3D models (GLTF) and real product image textures
 * - Dual-tier rotating carousels with individual product bays
 * - Overhead motorized gantry crane with telescoping piston & 3-finger articulated claw
 * - Internal spiral drop chute & hinged collection hatch with dynamic illumination
 * - Studio lighting rig (key, lavender fill, pink rim, warm chamber spotlights)
 * - Satin floor with soft contact shadow, drifting star particles & floating bubbles
 * - Interactive raycast hover & selection
 * - Multi-stage animated dispensing sequence
 */
const VendingMachineScene = ({
  products = [],
  selectedIndex = 0,
  onSelectProduct,
  isDispensing = false,
  onDispenseStep,
  onDispenseComplete,
  cameraMode = 'hero',
  scrollProgress = 0,
}) => {
  const mountRef = useRef(null);
  const sceneRef = useRef(null);
  const rendererRef = useRef(null);
  const cameraRef = useRef(null);
  const animFrameRef = useRef(null);

  // Animated 3D element references
  const carouselUpperRef = useRef(null);
  const carouselLowerRef = useRef(null);
  const clawGroupRef = useRef(null);
  const clawPistonRef = useRef(null);
  const clawFingersRef = useRef([]);
  const hatchDoorRef = useRef(null);
  const trayLightRef = useRef(null);
  const heroRevealGroupRef = useRef(null);
  const particlesRef = useRef(null);
  const bubblesRef = useRef(null);
  const toyBaysRef = useRef([]);
  const marqueeGlowRef = useRef(null);
  const ledStripsRef = useRef([]);

  // Mouse & interaction state
  const mouseRef = useRef({ x: 0, y: 0, targetX: 0, targetY: 0 });
  const hoveredBayIndexRef = useRef(-1);
  const isDispensingRef = useRef(isDispensing);
  const clockRef = useRef(new THREE.Clock());

  useEffect(() => {
    isDispensingRef.current = isDispensing;
  }, [isDispensing]);

  // Dispensing Animation Sequence
  useEffect(() => {
    if (!isDispensing) return;

    const timeline = gsap.timeline({
      onComplete: () => {
        if (onDispenseComplete) {
          const selectedProd = products[selectedIndex] || null;
          onDispenseComplete(selectedProd);
        }
      },
    });

    onDispenseStep?.('aligning');

    // 1. Rotate carousel so the selected product faces front
    const tier = selectedIndex < 3 ? 'upper' : 'lower';
    const tierIndex = selectedIndex % 3;
    const targetAngle = -(tierIndex * (Math.PI * 2 / 3));

    const activeCarousel = tier === 'upper' ? carouselUpperRef.current : carouselLowerRef.current;
    if (activeCarousel) {
      timeline.to(activeCarousel.rotation, {
        y: targetAngle,
        duration: 1.1,
        ease: 'power2.inOut',
      });
    }

    // 2. Gantry moves over the product & lowers claw
    timeline.add(() => onDispenseStep?.('grabbing'));
    if (clawGroupRef.current && clawPistonRef.current) {
      const gantryX = tierIndex === 0 ? 0 : tierIndex === 1 ? 0.45 : -0.45;
      const pistonDrop = tier === 'upper' ? -0.45 : -0.85;

      timeline.to(clawGroupRef.current.position, {
        x: gantryX,
        duration: 0.65,
        ease: 'power1.out',
      });
      timeline.to(clawPistonRef.current.position, {
        y: pistonDrop,
        duration: 0.75,
        ease: 'power2.in',
      });

      // Close claw fingers around item
      clawFingersRef.current.forEach((finger) => {
        timeline.to(finger.rotation, { z: finger.userData.closedAngle, duration: 0.3 }, '<0.4');
      });

      // Lift claw with product
      timeline.to(clawPistonRef.current.position, {
        y: 0,
        duration: 0.75,
        ease: 'power2.out',
      });
    }

    // 3. Move claw to drop chute (center) & release
    timeline.add(() => onDispenseStep?.('dropping'));
    if (clawGroupRef.current) {
      timeline.to(clawGroupRef.current.position, {
        x: 0,
        duration: 0.55,
        ease: 'power1.inOut',
      });

      // Open claw fingers
      clawFingersRef.current.forEach((finger) => {
        timeline.to(finger.rotation, { z: finger.userData.openAngle, duration: 0.25 });
      });
    }

    // 4. Open collection hatch with warm golden burst
    timeline.add(() => onDispenseStep?.('opening_hatch'));
    if (hatchDoorRef.current && trayLightRef.current) {
      timeline.to(hatchDoorRef.current.rotation, {
        x: Math.PI * 0.44,
        duration: 0.5,
        ease: 'back.out(2)',
      });
      timeline.to(trayLightRef.current, {
        intensity: 8.5,
        duration: 0.4,
      }, '<');
    }

    // 5. Elevate Hero Reveal Pod up to camera view
    timeline.add(() => onDispenseStep?.('revealing'));
    if (heroRevealGroupRef.current) {
      heroRevealGroupRef.current.visible = true;
      heroRevealGroupRef.current.position.set(0, -1.2, 0.5);
      heroRevealGroupRef.current.scale.set(0.01, 0.01, 0.01);
      heroRevealGroupRef.current.rotation.set(0, 0, 0);

      timeline.to(heroRevealGroupRef.current.position, {
        y: 0.25,
        z: 2.5,
        duration: 1.2,
        ease: 'power3.out',
      });
      timeline.to(heroRevealGroupRef.current.scale, {
        x: 1,
        y: 1,
        z: 1,
        duration: 1.2,
        ease: 'elastic.out(1, 0.75)',
      }, '<');
      timeline.to(heroRevealGroupRef.current.rotation, {
        y: Math.PI * 2,
        duration: 1.3,
        ease: 'power1.inOut',
      }, '<');
    }

  }, [isDispensing, selectedIndex, products, onDispenseStep, onDispenseComplete]);

  // Adjust camera position based on cameraMode
  useEffect(() => {
    if (!cameraRef.current) return;
    const cam = cameraRef.current;

    if (cameraMode === 'interior') {
      gsap.to(cam.position, { x: 0, y: 0.6, z: 3.2, duration: 1.2, ease: 'power2.out' });
    } else if (cameraMode === 'categories') {
      gsap.to(cam.position, { x: 0, y: 1.6, z: 5.0, duration: 1.2, ease: 'power2.out' });
    } else {
      // Default 'hero' view
      gsap.to(cam.position, { x: 0, y: 0.5, z: 5.6, duration: 1.2, ease: 'power2.out' });
    }
  }, [cameraMode]);

  // Scroll effect on camera
  useEffect(() => {
    if (!cameraRef.current || isDispensingRef.current) return;
    const cam = cameraRef.current;
    if (scrollProgress > 0 && scrollProgress < 0.35) {
      const targetZ = 5.6 - (scrollProgress / 0.35) * 1.8;
      const targetY = 0.5 + (scrollProgress / 0.35) * 0.3;
      cam.position.z = THREE.MathUtils.lerp(cam.position.z, targetZ, 0.1);
      cam.position.y = THREE.MathUtils.lerp(cam.position.y, targetY, 0.1);
    }
  }, [scrollProgress]);

  // Main Three.js Scene Setup
  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const width = container.clientWidth;
    const height = container.clientHeight;

    // 1. SCENE WITH RICH GRADIENT FOG
    const scene = new THREE.Scene();
    scene.background = new THREE.Color('#FFF0F7');
    scene.fog = new THREE.FogExp2('#FFF0F7', 0.045);
    sceneRef.current = scene;

    // 2. CAMERA
    const camera = new THREE.PerspectiveCamera(38, width / height, 0.1, 100);
    camera.position.set(0, 0.5, 5.6);
    cameraRef.current = camera;

    // 3. RENDERER
    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      powerPreference: 'high-performance',
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.15;
    container.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // 4. CINEMATIC STUDIO LIGHTING RIG
    // Ambient fill with soft lavender warmth
    const ambientLight = new THREE.AmbientLight('#F3E8FF', 1.5);
    scene.add(ambientLight);

    // Key light (soft sun angle from upper left)
    const keyLight = new THREE.DirectionalLight('#FFFFFF', 2.9);
    keyLight.position.set(4, 7, 5);
    keyLight.castShadow = true;
    keyLight.shadow.mapSize.width = 1024;
    keyLight.shadow.mapSize.height = 1024;
    keyLight.shadow.camera.near = 0.5;
    keyLight.shadow.camera.far = 15;
    keyLight.shadow.camera.left = -3;
    keyLight.shadow.camera.right = 3;
    keyLight.shadow.camera.top = 4;
    keyLight.shadow.camera.bottom = -3;
    keyLight.shadow.bias = -0.0005;
    scene.add(keyLight);

    // Lavender fill light from opposite angle
    const fillLight = new THREE.DirectionalLight('#A78BFA', 1.6);
    fillLight.position.set(-4, 3, 3);
    scene.add(fillLight);

    // Hot pink rim light from behind
    const rimLight = new THREE.DirectionalLight('#FF63B7', 2.4);
    rimLight.position.set(-2, 4, -4);
    scene.add(rimLight);

    // Warm floor bounce light
    const bounceLight = new THREE.DirectionalLight('#FFD86F', 0.9);
    bounceLight.position.set(0, -3, 2);
    scene.add(bounceLight);

    // 5. SATIN SHOWROOM FLOOR & CONTACT SHADOW
    const floorGeo = new THREE.PlaneGeometry(32, 32);
    const floorMat = new THREE.MeshStandardMaterial({
      color: '#FFF0F7',
      roughness: 0.3,
      metalness: 0.08,
    });
    const floorMesh = new THREE.Mesh(floorGeo, floorMat);
    floorMesh.rotation.x = -Math.PI / 2;
    floorMesh.position.y = -2.1;
    floorMesh.receiveShadow = true;
    scene.add(floorMesh);

    // Realistic contact shadow blob
    const shadowCanvas = document.createElement('canvas');
    shadowCanvas.width = 256;
    shadowCanvas.height = 256;
    const sCtx = shadowCanvas.getContext('2d');
    const sGrad = sCtx.createRadialGradient(128, 128, 10, 128, 128, 122);
    sGrad.addColorStop(0, 'rgba(64, 32, 68, 0.55)');
    sGrad.addColorStop(0.5, 'rgba(64, 32, 68, 0.22)');
    sGrad.addColorStop(1, 'rgba(64, 32, 68, 0)');
    sCtx.fillStyle = sGrad;
    sCtx.fillRect(0, 0, 256, 256);
    const shadowTex = new THREE.CanvasTexture(shadowCanvas);
    const shadowMat = new THREE.MeshBasicMaterial({
      map: shadowTex,
      transparent: true,
      opacity: 0.88,
      depthWrite: false,
    });
    const contactShadow = new THREE.Mesh(new THREE.PlaneGeometry(3.8, 2.8), shadowMat);
    contactShadow.rotation.x = -Math.PI / 2;
    contactShadow.position.set(0, -2.09, 0.1);
    scene.add(contactShadow);

    // 6. ATMOSPHERIC PARTICLES & FLOATING BUBBLES
    // Twinkling golden stars
    const particleCount = 100;
    const particleGeo = new THREE.BufferGeometry();
    const particlePos = new Float32Array(particleCount * 3);
    for (let i = 0; i < particleCount; i++) {
      particlePos[i * 3 + 0] = (Math.random() - 0.5) * 9;
      particlePos[i * 3 + 1] = (Math.random() - 0.5) * 6 + 0.6;
      particlePos[i * 3 + 2] = (Math.random() - 0.5) * 6 + 1.6;
    }
    particleGeo.setAttribute('position', new THREE.BufferAttribute(particlePos, 3));
    const particles = new THREE.Points(
      particleGeo,
      new THREE.PointsMaterial({
        color: '#FFD86F',
        size: 0.075,
        transparent: true,
        opacity: 0.8,
        blending: THREE.AdditiveBlending,
      })
    );
    scene.add(particles);
    particlesRef.current = particles;

    // Floating translucent dream bubbles
    const bubblesGroup = new THREE.Group();
    const bubbleMat = new THREE.MeshPhysicalMaterial({
      color: '#A78BFA',
      transmission: 0.85,
      opacity: 0.45,
      transparent: true,
      roughness: 0.05,
      ior: 1.33,
    });
    for (let b = 0; b < 12; b++) {
      const r = Math.random() * 0.08 + 0.04;
      const bubble = new THREE.Mesh(new THREE.SphereGeometry(r, 16, 16), bubbleMat);
      bubble.position.set(
        (Math.random() - 0.5) * 6,
        Math.random() * 4 - 1.5,
        (Math.random() - 0.5) * 4 + 1
      );
      bubble.userData = { speed: Math.random() * 0.005 + 0.003, offset: Math.random() * Math.PI };
      bubblesGroup.add(bubble);
    }
    scene.add(bubblesGroup);
    bubblesRef.current = bubblesGroup;

    // 7. 3D VENDING MACHINE SHOWPIECE
    const machineGroup = new THREE.Group();
    machineGroup.position.set(0, -0.4, 0);
    scene.add(machineGroup);

    // Premium Material System
    const hotPinkMat = new THREE.MeshStandardMaterial({
      color: '#FF3F9D',
      roughness: 0.2,
      metalness: 0.15,
    });
    const bubblegumMat = new THREE.MeshStandardMaterial({
      color: '#FF63B7',
      roughness: 0.24,
      metalness: 0.1,
    });
    const roseGoldMat = new THREE.MeshStandardMaterial({
      color: '#E8A598',
      roughness: 0.22,
      metalness: 0.9,
    });
    const pearlWhiteMat = new THREE.MeshStandardMaterial({
      color: '#FFF9FC',
      roughness: 0.18,
      metalness: 0.04,
    });
    const electricPurpleMat = new THREE.MeshStandardMaterial({
      color: '#8057E8',
      emissive: '#8057E8',
      emissiveIntensity: 1.4,
      roughness: 0.1,
    });
    const aquaMat = new THREE.MeshStandardMaterial({
      color: '#67DFF5',
      emissive: '#67DFF5',
      emissiveIntensity: 1.6,
      roughness: 0.1,
    });
    const glassMat = new THREE.MeshPhysicalMaterial({
      color: '#FFFFFF',
      transmission: 0.94,
      opacity: 0.32,
      transparent: true,
      roughness: 0.05,
      ior: 1.5,
      thickness: 0.22,
      specularIntensity: 1.0,
      specularColor: new THREE.Color('#FFF5FA'),
    });
    const neonSignMat = new THREE.MeshStandardMaterial({
      color: '#FF3F9D',
      emissive: '#FF3F9D',
      emissiveIntensity: 2.2,
      roughness: 0.1,
    });

    // ── Cabinet Base & Pedestal ──
    const baseMesh = new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.4, 1.8), roseGoldMat);
    baseMesh.position.y = -1.5;
    baseMesh.castShadow = true;
    baseMesh.receiveShadow = true;
    machineGroup.add(baseMesh);

    const baseTrim = new THREE.Mesh(new THREE.BoxGeometry(2.46, 0.06, 1.86), hotPinkMat);
    baseTrim.position.y = -1.3;
    machineGroup.add(baseTrim);

    // ── Outer Body Housing ──
    // Back wall
    const backWall = new THREE.Mesh(new THREE.BoxGeometry(2.36, 2.7, 0.2), pearlWhiteMat);
    backWall.position.set(0, 0.05, -0.8);
    backWall.receiveShadow = true;
    machineGroup.add(backWall);

    // Left wall
    const leftWall = new THREE.Mesh(new THREE.BoxGeometry(0.2, 2.7, 1.6), bubblegumMat);
    leftWall.position.set(-1.08, 0.05, 0);
    leftWall.castShadow = true;
    leftWall.receiveShadow = true;
    machineGroup.add(leftWall);

    // Right wall (controller side)
    const rightWall = new THREE.Mesh(new THREE.BoxGeometry(0.35, 2.7, 1.6), hotPinkMat);
    rightWall.position.set(1.02, 0.05, 0);
    rightWall.castShadow = true;
    rightWall.receiveShadow = true;
    machineGroup.add(rightWall);

    // Roof & Marquee Crown
    const roof = new THREE.Mesh(new THREE.BoxGeometry(2.44, 0.35, 1.82), bubblegumMat);
    roof.position.set(0, 1.5, 0);
    roof.castShadow = true;
    machineGroup.add(roof);

    const roofRim = new THREE.Mesh(new THREE.BoxGeometry(2.5, 0.08, 1.88), roseGoldMat);
    roofRim.position.set(0, 1.7, 0);
    machineGroup.add(roofRim);

    // Backlit Glowing Marquee Sign "4U TOYS & GIFTS"
    const marqueeBack = new THREE.Mesh(new THREE.BoxGeometry(1.65, 0.4, 0.08), pearlWhiteMat);
    marqueeBack.position.set(0, 1.5, 0.92);
    machineGroup.add(marqueeBack);

    const marqueeNeon = new THREE.Mesh(new THREE.BoxGeometry(1.52, 0.28, 0.04), neonSignMat);
    marqueeNeon.position.set(0, 1.5, 0.96);
    machineGroup.add(marqueeNeon);
    marqueeGlowRef.current = marqueeNeon;

    // Glowing LED Edge Strips
    const led1 = new THREE.Mesh(new THREE.BoxGeometry(0.04, 2.6, 0.04), aquaMat);
    led1.position.set(-0.96, 0.05, 0.82);
    machineGroup.add(led1);

    const led2 = new THREE.Mesh(new THREE.BoxGeometry(0.04, 2.6, 0.04), electricPurpleMat);
    led2.position.set(0.72, 0.05, 0.82);
    machineGroup.add(led2);
    ledStripsRef.current = [led1, led2];

    // ── Internal Showroom Lighting ──
    const intLightTop = new THREE.PointLight('#FFF0F7', 2.4, 3.5);
    intLightTop.position.set(0, 1.2, 0.3);
    machineGroup.add(intLightTop);

    const intLightWarm = new THREE.PointLight('#FFD86F', 1.8, 3.0);
    intLightWarm.position.set(0, -0.2, 0.5);
    machineGroup.add(intLightWarm);

    // ── Transparent Glass Enclosure ──
    const frontGlass = new THREE.Mesh(new THREE.BoxGeometry(1.7, 1.9, 0.06), glassMat);
    frontGlass.position.set(-0.12, 0.35, 0.82);
    machineGroup.add(frontGlass);

    // Rose gold glass framing
    const frameTop = new THREE.Mesh(new THREE.BoxGeometry(1.78, 0.08, 0.1), roseGoldMat);
    frameTop.position.set(-0.12, 1.3, 0.82);
    machineGroup.add(frameTop);

    const frameBot = new THREE.Mesh(new THREE.BoxGeometry(1.78, 0.08, 0.1), roseGoldMat);
    frameBot.position.set(-0.12, -0.6, 0.82);
    machineGroup.add(frameBot);

    // ── Dual Rotating Carousels ──
    const carouselUpper = new THREE.Group();
    carouselUpper.position.set(-0.12, 0.65, 0);
    machineGroup.add(carouselUpper);
    carouselUpperRef.current = carouselUpper;

    const carouselLower = new THREE.Group();
    carouselLower.position.set(-0.12, -0.05, 0);
    machineGroup.add(carouselLower);
    carouselLowerRef.current = carouselLower;

    // Carousel Discs with Rose Gold Rims
    const discGeo = new THREE.CylinderGeometry(0.68, 0.68, 0.04, 32);
    const discRimGeo = new THREE.TorusGeometry(0.68, 0.02, 16, 32);

    const discU = new THREE.Mesh(discGeo, pearlWhiteMat);
    discU.receiveShadow = true;
    carouselUpper.add(discU);
    const rimU = new THREE.Mesh(discRimGeo, roseGoldMat);
    rimU.rotation.x = Math.PI / 2;
    carouselUpper.add(rimU);

    const discL = new THREE.Mesh(discGeo, pearlWhiteMat);
    discL.receiveShadow = true;
    carouselLower.add(discL);
    const rimL = new THREE.Mesh(discRimGeo, roseGoldMat);
    rimL.rotation.x = Math.PI / 2;
    carouselLower.add(rimL);

    // Center Spindle Shaft
    const spindle = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 1.5, 16), roseGoldMat);
    spindle.position.set(-0.12, 0.3, 0);
    machineGroup.add(spindle);

    // ── 6 REAL PRODUCT BAYS (Mapped to Authoritative Database Records) ──
    const toyBays = [];
    const gltfLoader = new GLTFLoader();
    const textureLoader = new THREE.TextureLoader();

    // Helper: Build a product bay display pod
    const createProductBay = (product, globalIndex, tier) => {
      const bayGroup = new THREE.Group();

      // Glowing Pedestal with Rose Gold Rim
      const pedestal = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.2, 0.04, 24), roseGoldMat);
      pedestal.position.y = 0.02;
      bayGroup.add(pedestal);

      const neonRing = new THREE.Mesh(new THREE.TorusGeometry(0.2, 0.015, 8, 24), aquaMat);
      neonRing.rotation.x = Math.PI / 2;
      neonRing.position.y = 0.03;
      bayGroup.add(neonRing);

      // Check if product has an authoritative 3D model (e.g. Flower1 with astronaut.glb)
      if (product?.model3d) {
        gltfLoader.load(
          product.model3d,
          (gltf) => {
            const model = gltf.scene;
            // Center & scale model to fit chamber pedestal
            const box = new THREE.Box3().setFromObject(model);
            const size = new THREE.Vector3();
            box.getSize(size);
            const maxAxis = Math.max(size.x, size.y, size.z) || 1;
            const targetScale = 0.32 / maxAxis;
            model.scale.set(targetScale, targetScale, targetScale);
            model.position.set(0, 0.18, 0);
            bayGroup.add(model);
          },
          undefined,
          (err) => console.warn('Could not load product 3D model:', err)
        );
      } else if (product?.images?.[0]) {
        // Honest Visual Presentation: Load actual product photo on an acrylic display plaque
        textureLoader.load(
          product.images[0],
          (texture) => {
            texture.colorSpace = THREE.SRGBColorSpace;
            const cardMat = new THREE.MeshStandardMaterial({
              map: texture,
              roughness: 0.2,
              metalness: 0.05,
              side: THREE.DoubleSide,
            });
            const plaque = new THREE.Mesh(new THREE.PlaneGeometry(0.26, 0.26), cardMat);
            plaque.position.set(0, 0.18, 0);
            bayGroup.add(plaque);

            // Rose gold frame around product image
            const frameGeo = new THREE.BoxGeometry(0.28, 0.28, 0.01);
            const framePlaque = new THREE.Mesh(frameGeo, roseGoldMat);
            framePlaque.position.set(0, 0.18, -0.008);
            bayGroup.add(framePlaque);
          },
          undefined,
          () => {}
        );
      } else {
        // Category companion emblem when image is not yet available
        const emblem = new THREE.Mesh(new THREE.DodecahedronGeometry(0.12), bubblegumMat);
        emblem.position.y = 0.18;
        bayGroup.add(emblem);
      }

      bayGroup.userData = {
        index: globalIndex,
        tier,
        product,
        basePos: new THREE.Vector3(),
      };

      return bayGroup;
    };

    // Populate Upper Tier (First 3 real products)
    for (let i = 0; i < 3; i++) {
      const prod = products[i] || null;
      const bay = createProductBay(prod, i, 'upper');
      const angle = (i * Math.PI * 2) / 3;
      bay.position.set(Math.cos(angle) * 0.46, 0.03, Math.sin(angle) * 0.46);
      bay.userData.basePos.copy(bay.position);
      carouselUpper.add(bay);
      toyBays.push(bay);
    }

    // Populate Lower Tier (Next 3 real products)
    for (let i = 0; i < 3; i++) {
      const prod = products[i + 3] || null;
      const bay = createProductBay(prod, i + 3, 'lower');
      const angle = (i * Math.PI * 2) / 3 + 0.5;
      bay.position.set(Math.cos(angle) * 0.46, 0.03, Math.sin(angle) * 0.46);
      bay.userData.basePos.copy(bay.position);
      carouselLower.add(bay);
      toyBays.push(bay);
    }

    toyBaysRef.current = toyBays;

    // ── Overhead Gantry Crane & Robotic Claw ──
    const clawGroup = new THREE.Group();
    clawGroup.position.set(0, 1.15, 0.1);
    machineGroup.add(clawGroup);
    clawGroupRef.current = clawGroup;

    // Rose gold gantry rails
    const rail = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 1.6, 12), roseGoldMat);
    rail.rotation.z = Math.PI / 2;
    rail.position.y = 0.08;
    clawGroup.add(rail);

    // Motor Carriage Box
    const motorBox = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.12, 0.16), hotPinkMat);
    clawGroup.add(motorBox);

    // Piston Arm (telescopes down during dispense)
    const pistonGroup = new THREE.Group();
    clawGroup.add(pistonGroup);
    clawPistonRef.current = pistonGroup;

    const pistonRod = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.018, 0.5, 12), roseGoldMat);
    pistonRod.position.y = -0.25;
    pistonGroup.add(pistonRod);

    // Claw Hub & 3 Articulated Fingers
    const clawHub = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.05, 0.04, 16), electricPurpleMat);
    clawHub.position.y = -0.5;
    pistonGroup.add(clawHub);

    const fingers = [];
    for (let f = 0; f < 3; f++) {
      const fPivot = new THREE.Group();
      fPivot.position.set(0, -0.52, 0);
      fPivot.rotation.y = (f * Math.PI * 2) / 3;

      const fMesh = new THREE.Mesh(new THREE.BoxGeometry(0.015, 0.12, 0.03), roseGoldMat);
      fMesh.position.set(0.05, -0.05, 0);
      fMesh.rotation.z = -0.4;
      fPivot.add(fMesh);

      fPivot.userData = { openAngle: 0, closedAngle: 0.45 };
      pistonGroup.add(fPivot);
      fingers.push(fPivot);
    }
    clawFingersRef.current = fingers;

    // ── Spiral Drop Chute ──
    const chute = new THREE.Mesh(
      new THREE.CylinderGeometry(0.22, 0.16, 0.4, 20, 1, true),
      new THREE.MeshStandardMaterial({ color: '#FFD86F', roughness: 0.28, side: THREE.DoubleSide })
    );
    chute.position.set(-0.12, -0.4, 0.5);
    chute.rotation.x = 0.3;
    machineGroup.add(chute);

    // ── Collection Hatch & Pickup Tray (Bottom) ──
    const trayInterior = new THREE.Mesh(new THREE.BoxGeometry(0.85, 0.42, 0.45), pearlWhiteMat);
    trayInterior.position.set(-0.12, -1.0, 0.65);
    machineGroup.add(trayInterior);

    // Warm Interior Spotlight in Tray
    const trayLight = new THREE.PointLight('#FFD86F', 2.2, 1.8);
    trayLight.position.set(-0.12, -0.9, 0.7);
    machineGroup.add(trayLight);
    trayLightRef.current = trayLight;

    // Hinged Flap Hatch Door
    const hatchPivot = new THREE.Group();
    hatchPivot.position.set(-0.12, -0.78, 0.88);
    machineGroup.add(hatchPivot);
    hatchDoorRef.current = hatchPivot;

    const hatchDoor = new THREE.Mesh(
      new THREE.BoxGeometry(0.84, 0.4, 0.03),
      new THREE.MeshPhysicalMaterial({ color: '#FF63B7', transmission: 0.55, roughness: 0.2, transparent: true, opacity: 0.8 })
    );
    hatchDoor.position.set(0, -0.2, 0);
    hatchPivot.add(hatchDoor);

    const handle = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.015, 0.35, 12), roseGoldMat);
    handle.rotation.z = Math.PI / 2;
    handle.position.set(0, -0.32, 0.03);
    hatchPivot.add(handle);

    // ── Control Panel (Right Side) ──
    const screenMesh = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.26, 0.46), new THREE.MeshStandardMaterial({ color: '#402044', roughness: 0.1 }));
    screenMesh.position.set(1.2, 0.65, 0.2);
    machineGroup.add(screenMesh);

    const slotPlate = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.18, 0.12), roseGoldMat);
    slotPlate.position.set(1.2, 0.35, 0.2);
    machineGroup.add(slotPlate);

    const slotHole = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.08, 0.015), new THREE.MeshBasicMaterial({ color: '#111111' }));
    slotHole.position.set(1.205, 0.35, 0.2);
    machineGroup.add(slotHole);

    // Keypad Buttons
    for (let r = 0; r < 3; r++) {
      for (let c = 0; c < 2; c++) {
        const btn = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.05, 0.05), roseGoldMat);
        btn.position.set(1.2, 0.15 - r * 0.08, 0.15 + c * 0.09);
        machineGroup.add(btn);
      }
    }

    // Big Heart Dispense Button
    const bigBtn = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.07, 0.05, 24), hotPinkMat);
    bigBtn.rotation.z = Math.PI / 2;
    bigBtn.position.set(1.2, -0.22, 0.2);
    machineGroup.add(bigBtn);

    // ── Hero Reveal Group (Ascends out of tray during dispense) ──
    const heroRevealGroup = new THREE.Group();
    heroRevealGroup.visible = false;
    scene.add(heroRevealGroup);
    heroRevealGroupRef.current = heroRevealGroup;

    const heroPed = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.4, 0.08, 32), roseGoldMat);
    heroRevealGroup.add(heroPed);

    const heroSphere = new THREE.Mesh(
      new THREE.SphereGeometry(0.42, 32, 32),
      new THREE.MeshPhysicalMaterial({ color: '#FF3F9D', transmission: 0.72, roughness: 0.1, transparent: true, opacity: 0.85 })
    );
    heroSphere.position.y = 0.45;
    heroRevealGroup.add(heroSphere);

    const heroStar = new THREE.Mesh(new THREE.OctahedronGeometry(0.2, 0), new THREE.MeshStandardMaterial({ color: '#FFD86F', metalness: 0.8, roughness: 0.2 }));
    heroStar.position.y = 0.45;
    heroRevealGroup.add(heroStar);

    // 8. RAYCASTER & INTERACTION
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();

    const handlePointerMove = (e) => {
      const rect = container.getBoundingClientRect();
      mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

      mouseRef.current.targetX = mouse.x * 0.42;
      mouseRef.current.targetY = mouse.y * 0.22;

      raycaster.setFromCamera(mouse, camera);
      const intersects = raycaster.intersectObjects(toyBays, true);

      if (intersects.length > 0) {
        let hitBay = intersects[0].object;
        while (hitBay && !hitBay.userData?.tier && hitBay.parent) {
          hitBay = hitBay.parent;
        }

        if (hitBay && typeof hitBay.userData?.index === 'number') {
          container.style.cursor = 'pointer';
          hoveredBayIndexRef.current = hitBay.userData.index;
          return;
        }
      }

      container.style.cursor = 'default';
      hoveredBayIndexRef.current = -1;
    };

    const handleClick = (e) => {
      if (isDispensingRef.current) return;
      const rect = container.getBoundingClientRect();
      mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

      raycaster.setFromCamera(mouse, camera);
      const intersects = raycaster.intersectObjects(toyBays, true);

      if (intersects.length > 0) {
        let hitBay = intersects[0].object;
        while (hitBay && !hitBay.userData?.tier && hitBay.parent) {
          hitBay = hitBay.parent;
        }

        if (hitBay && typeof hitBay.userData?.index === 'number') {
          onSelectProduct?.(hitBay.userData.index);
        }
      }
    };

    container.addEventListener('pointermove', handlePointerMove);
    container.addEventListener('click', handleClick);

    // 9. ANIMATION LOOP
    const animate = () => {
      animFrameRef.current = requestAnimationFrame(animate);
      const elapsedTime = clockRef.current.getElapsedTime();

      // Continuous Idle carousel spinning
      if (!isDispensingRef.current) {
        if (carouselUpperRef.current) carouselUpperRef.current.rotation.y += 0.003;
        if (carouselLowerRef.current) carouselLowerRef.current.rotation.y -= 0.0025;
      }

      // Subtle bay bobbing & hover highlight
      toyBays.forEach((bay, idx) => {
        const floatOffset = Math.sin(elapsedTime * 2.2 + idx * 1.1) * 0.025;
        if (bay.userData.basePos) {
          bay.position.y = bay.userData.basePos.y + floatOffset;
        }

        const isHovered = hoveredBayIndexRef.current === bay.userData.index;
        const isSelected = selectedIndex === bay.userData.index;
        const targetScale = isHovered ? 1.18 : isSelected ? 1.08 : 1.0;
        bay.scale.lerp(new THREE.Vector3(targetScale, targetScale, targetScale), 0.12);
      });

      // Drifting stars
      if (particlesRef.current) {
        const positions = particlesRef.current.geometry.attributes.position.array;
        for (let i = 1; i < positions.length; i += 3) {
          positions[i] += 0.003;
          if (positions[i] > 3.5) positions[i] = -2.0;
        }
        particlesRef.current.geometry.attributes.position.needsUpdate = true;
      }

      // Floating dream bubbles
      if (bubblesRef.current) {
        bubblesRef.current.children.forEach((bubble) => {
          bubble.position.y += bubble.userData.speed;
          bubble.position.x += Math.sin(elapsedTime + bubble.userData.offset) * 0.002;
          if (bubble.position.y > 3.2) bubble.position.y = -2.0;
        });
      }

      // Pulsing marquee glow
      if (marqueeGlowRef.current) {
        const pulse = 1.8 + Math.sin(elapsedTime * 3.2) * 0.4;
        marqueeGlowRef.current.material.emissiveIntensity = pulse;
      }

      // Smooth mouse parallax lerp
      mouseRef.current.x = THREE.MathUtils.lerp(mouseRef.current.x, mouseRef.current.targetX, 0.05);
      mouseRef.current.y = THREE.MathUtils.lerp(mouseRef.current.y, mouseRef.current.targetY, 0.05);

      if (!isDispensingRef.current && cameraRef.current) {
        cameraRef.current.position.x = mouseRef.current.x;
        cameraRef.current.position.y = 0.5 + mouseRef.current.y;
        cameraRef.current.lookAt(0, 0.2, 0);
      }

      renderer.render(scene, camera);
    };

    animate();

    // 10. RESIZE
    const handleResize = () => {
      if (!container || !renderer || !camera) return;
      const w = container.clientWidth;
      const h = container.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };

    window.addEventListener('resize', handleResize);

    // 11. CLEANUP
    return () => {
      cancelAnimationFrame(animFrameRef.current);
      window.removeEventListener('resize', handleResize);
      container.removeEventListener('pointermove', handlePointerMove);
      container.removeEventListener('click', handleClick);

      if (renderer.domElement && container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
      renderer.dispose();
    };
  }, [products]); // Re-initialize bays when authoritative products load

  return (
    <div
      ref={mountRef}
      style={{
        width: '100%',
        height: '100%',
        position: 'relative',
        outline: 'none',
        overflow: 'hidden',
        userSelect: 'none',
      }}
    />
  );
};

export default VendingMachineScene;
