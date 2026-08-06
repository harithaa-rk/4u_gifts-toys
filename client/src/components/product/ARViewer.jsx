import "@google/model-viewer";
import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Camera, QrCode, X, Sparkles, VideoOff, Download, RotateCcw, Maximize2, Layers } from "lucide-react";

// ─── Device Detection ────────────────────────────────────────────────────────
function isIOS() {
  return /iPhone|iPad|iPod/i.test(navigator.userAgent) ||
    (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
}
function isAndroid() {
  return /Android/i.test(navigator.userAgent);
}

// ─────────────────────────────────────────────────────────────────────────────
// Multi-Face Box glTF 2.0 Generator
//
// Creates a proper cuboid with ONE texture per face (up to 6 textures).
// Face order: Front(+Z), Back(-Z), Left(-X), Right(+X), Top(+Y), Bottom(-Y)
//
// imageUrls: array of 1-6 product image URLs.
//   [0] → Front   [1] → Back   [2] → Left
//   [3] → Right   [4] → Top    [5] → Bottom
// Missing faces fall back to imageUrls[0].
// ─────────────────────────────────────────────────────────────────────────────
function generateMultiFaceBoxGltf(imageUrls, w = 0.25, h = 0.25, d = 0.08) {
  const hw = w / 2, hh = h / 2, hd = d / 2;

  // 6 face definitions: positions (4 × vec3) and outward normal
  const FACES = [
    // Front (+Z)
    { pos: [-hw,-hh, hd,  hw,-hh, hd,  hw, hh, hd, -hw, hh, hd], n: [0,0,1]  },
    // Back (-Z)
    { pos: [ hw,-hh,-hd, -hw,-hh,-hd, -hw, hh,-hd,  hw, hh,-hd], n: [0,0,-1] },
    // Left (-X)
    { pos: [-hw,-hh,-hd, -hw,-hh, hd, -hw, hh, hd, -hw, hh,-hd], n: [-1,0,0] },
    // Right (+X)
    { pos: [ hw,-hh, hd,  hw,-hh,-hd,  hw, hh,-hd,  hw, hh, hd], n: [1,0,0]  },
    // Top (+Y)
    { pos: [-hw, hh, hd,  hw, hh, hd,  hw, hh,-hd, -hw, hh,-hd], n: [0,1,0]  },
    // Bottom (-Y)
    { pos: [-hw,-hh,-hd,  hw,-hh,-hd,  hw,-hh, hd, -hw,-hh, hd], n: [0,-1,0] },
  ];

  const N = FACES.length; // 6

  // UVs are identical per face: bottom-left, bottom-right, top-right, top-left
  const FACE_UVS = [0,1, 1,1, 1,0, 0,0];
  // Indices for two triangles from the quad: 0,1,2, 0,2,3
  const FACE_IDX = [0,1,2, 0,2,3];

  // ── Buffer layout ──────────────────────────────────────────────────────────
  // All indices first (6 × uint16 = 12 bytes per face → 72 total)
  // Then all positions (4 × vec3 × f32 = 48 bytes per face → 288 total)
  // Then all normals  (4 × vec3 × f32 = 48 bytes per face → 288 total)
  // Then all uvs      (4 × vec2 × f32 = 32 bytes per face → 192 total)
  const IDX_PER_FACE = 12;  // 6 × uint16
  const POS_PER_FACE = 48;  // 4 × 3 × f32
  const NRM_PER_FACE = 48;
  const UV_PER_FACE  = 32;  // 4 × 2 × f32

  const IDX_OFF = 0;
  const POS_OFF = N * IDX_PER_FACE;             // 72
  const NRM_OFF = POS_OFF + N * POS_PER_FACE;   // 360
  const UV_OFF  = NRM_OFF + N * NRM_PER_FACE;   // 648
  const TOTAL   = UV_OFF  + N * UV_PER_FACE;    // 840

  const buf = new ArrayBuffer(TOTAL);

  for (let f = 0; f < N; f++) {
    const { pos, n } = FACES[f];
    // Indices
    new Uint16Array(buf, IDX_OFF + f * IDX_PER_FACE, 6).set(FACE_IDX);
    // Positions
    new Float32Array(buf, POS_OFF + f * POS_PER_FACE, 12).set(pos);
    // Normals (same normal for all 4 verts of this face)
    const nrmArr = [...n, ...n, ...n, ...n];
    new Float32Array(buf, NRM_OFF + f * NRM_PER_FACE, 12).set(nrmArr);
    // UVs
    new Float32Array(buf, UV_OFF + f * UV_PER_FACE, 8).set(FACE_UVS);
  }

  // base64-encode the binary buffer
  const raw = new Uint8Array(buf);
  let bin = "";
  for (let i = 0; i < raw.byteLength; i++) bin += String.fromCharCode(raw[i]);
  const b64 = btoa(bin);

  // ── Map each face to an image URL (fall back to first image) ───────────────
  const faceImages = FACES.map((_, f) => imageUrls[f] || imageUrls[0]);

  // De-duplicate: build a unique URL array + lookup
  const uniqueUrls = [...new Set(faceImages)];
  const urlIdx = Object.fromEntries(uniqueUrls.map((u, i) => [u, i]));

  // ── Build glTF accessors ───────────────────────────────────────────────────
  // Accessor layout:
  //   0..5  → index accessors (one per face)
  //   6+    → for each face: POSITION (6+f*3), NORMAL (7+f*3), TEXCOORD_0 (8+f*3)
  const accessors = [];
  for (let f = 0; f < N; f++) {
    accessors.push({
      bufferView: 0,
      byteOffset: f * IDX_PER_FACE,
      componentType: 5123, // UNSIGNED_SHORT
      count: 6,
      type: "SCALAR",
    });
  }
  for (let f = 0; f < N; f++) {
    // POSITION
    accessors.push({
      bufferView: 1, byteOffset: f * POS_PER_FACE,
      componentType: 5126, count: 4, type: "VEC3",
      min: [-hw, -hh, -hd], max: [hw, hh, hd],
    });
    // NORMAL
    accessors.push({
      bufferView: 2, byteOffset: f * NRM_PER_FACE,
      componentType: 5126, count: 4, type: "VEC3",
    });
    // TEXCOORD_0
    accessors.push({
      bufferView: 3, byteOffset: f * UV_PER_FACE,
      componentType: 5126, count: 4, type: "VEC2",
    });
  }

  // One primitive per face
  const primitives = FACES.map((_, f) => ({
    attributes: {
      POSITION:    N + f * 3,
      NORMAL:      N + f * 3 + 1,
      TEXCOORD_0:  N + f * 3 + 2,
    },
    indices: f,
    material: f,
  }));

  const gltf = {
    asset: { version: "2.0", generator: "4U-Toys-MultiFaceAR" },
    scene: 0,
    scenes: [{ nodes: [0] }],
    nodes: [{ mesh: 0, name: "ProductBox" }],
    meshes: [{ name: "Box6Face", primitives }],

    materials: faceImages.map((url, f) => ({
      name: ["Front","Back","Left","Right","Top","Bottom"][f],
      pbrMetallicRoughness: {
        baseColorTexture: { index: urlIdx[url] },
        metallicFactor:  0.0,
        roughnessFactor: 0.65,
      },
      doubleSided: false,
    })),

    textures: uniqueUrls.map((_, i) => ({ source: i, sampler: 0 })),
    samplers: [{ magFilter: 9729, minFilter: 9987, wrapS: 10497, wrapT: 10497 }],
    images:   uniqueUrls.map(url => ({ uri: url })),

    buffers: [{ uri: `data:application/octet-stream;base64,${b64}`, byteLength: TOTAL }],
    bufferViews: [
      { buffer: 0, byteOffset: IDX_OFF, byteLength: N * IDX_PER_FACE, target: 34963 },
      { buffer: 0, byteOffset: POS_OFF, byteLength: N * POS_PER_FACE, target: 34962 },
      { buffer: 0, byteOffset: NRM_OFF, byteLength: N * NRM_PER_FACE, target: 34962 },
      { buffer: 0, byteOffset: UV_OFF,  byteLength: N * UV_PER_FACE,  target: 34962 },
    ],
    accessors,
  };

  return URL.createObjectURL(new Blob([JSON.stringify(gltf)], { type: "application/json" }));
}

// ─────────────────────────────────────────────────────────────────────────────
// ARViewer Component
// Props:
//   model      – URL to a real .glb/.gltf file (optional)
//   images     – Array of product image URLs (used for multi-face box when no model)
//   poster     – Main product image URL (fallback)
//   productName – Display name
// ─────────────────────────────────────────────────────────────────────────────
function ARViewer({ model, images = [], poster, productName = "Product" }) {
  const [loading, setLoading]           = useState(true);
  const [loadError, setLoadError]       = useState(null);
  const [arError, setArError]           = useState(false);
  const [isMobile, setIsMobile]         = useState(false);
  const [canActivateNativeAR, setCanActivateNativeAR] = useState(false);
  const [activeModelUrl, setActiveModelUrl] = useState(null);
  const [faceCount, setFaceCount]       = useState(1); // how many unique textures

  const [webcamActive, setWebcamActive]   = useState(false);
  const [webcamStream, setWebcamStream]   = useState(null);
  const [cameraLoading, setCameraLoading] = useState(false);
  const [showQRModal, setShowQRModal]     = useState(false);
  const [isFullscreen, setIsFullscreen]   = useState(false);
  const [activeFaceLabel, setActiveFaceLabel] = useState(null);

  const mvRef        = useRef(null);
  const videoRef     = useRef(null);
  const containerRef = useRef(null);

  // ── Detect device ──────────────────────────────────────────────────────────
  useEffect(() => {
    const check = () => setIsMobile(
      /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
      window.innerWidth < 768
    );
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  // ── Generate or assign model URL ────────────────────────────────────────────
  useEffect(() => {
    let blobUrl = null;
    let alive   = true;

    const isPlaceholder = !model || model.includes("astronaut");
    if (!isPlaceholder) {
      setActiveModelUrl(model);
      return;
    }

    // Gather all available image URLs for faces
    const allImages = [...new Set([...images.filter(Boolean)])];
    if (allImages.length === 0 && poster) allImages.push(poster);

    if (allImages.length === 0) {
      setActiveModelUrl(null);
      setLoading(false);
      return;
    }

    setLoading(true);

    // Determine box dimensions from the first image's aspect ratio
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.src = allImages[0];

    const build = (aspect = 1) => {
      if (!alive) return;
      const w = 0.25;
      const h = w * Math.min(Math.max(aspect, 0.5), 2.0);
      const d = w * 0.18; // thin depth — like a product package
      blobUrl = generateMultiFaceBoxGltf(allImages, w, h, d);
      setActiveModelUrl(blobUrl);
      setFaceCount(Math.min(allImages.length, 6));
    };

    img.onload  = () => build(img.naturalHeight / img.naturalWidth);
    img.onerror = () => build(1);

    return () => {
      alive = false;
      if (blobUrl?.startsWith("blob:")) URL.revokeObjectURL(blobUrl);
    };
  }, [model, images, poster]);

  // ── model-viewer events ────────────────────────────────────────────────────
  useEffect(() => {
    const mv = mvRef.current;
    if (!mv) return;
    const onLoad = () => {
      setLoading(false);
      setLoadError(null);
      setCanActivateNativeAR(!!mv.canActivateAR);
    };
    const onError = (e) => {
      setLoading(false);
      const t = e?.detail?.type || "";
      if (t === "loadfailure" || !t)
        setLoadError("Could not load the 3D model. Must be a public .glb / .gltf URL.");
    };
    mv.addEventListener("load", onLoad);
    mv.addEventListener("error", onError);
    return () => { mv.removeEventListener("load", onLoad); mv.removeEventListener("error", onError); };
  }, [activeModelUrl]);

  useEffect(() => {
    const mv = mvRef.current;
    if (!mv) return;
    const id = setInterval(() => { if (mv.canActivateAR) setCanActivateNativeAR(true); }, 800);
    return () => clearInterval(id);
  }, [activeModelUrl]);

  useEffect(() => {
    setLoading(true);
    setLoadError(null);
    setArError(false);
    stopWebcam();
  }, [activeModelUrl]);

  useEffect(() => () => { if (webcamStream) webcamStream.getTracks().forEach(t => t.stop()); }, [webcamStream]);

  // ── Camera helpers ─────────────────────────────────────────────────────────
  const startWebcam = async () => {
    setCameraLoading(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment", width: { ideal: 1280 }, height: { ideal: 720 } },
      });
      setWebcamStream(stream);
      if (videoRef.current) { videoRef.current.srcObject = stream; await videoRef.current.play(); }
      setWebcamActive(true);
    } catch {
      alert("Could not access your camera. Please allow camera permission in your browser settings.");
    } finally { setCameraLoading(false); }
  };

  const stopWebcam = () => {
    if (webcamStream) { webcamStream.getTracks().forEach(t => t.stop()); setWebcamStream(null); }
    if (videoRef.current) videoRef.current.srcObject = null;
    setWebcamActive(false);
  };

  const takeSnapshot = async () => {
    const video = videoRef.current, mv = mvRef.current;
    if (!video || !mv) return;
    try {
      const canvas = document.createElement("canvas");
      canvas.width = video.videoWidth || 1280;
      canvas.height = video.videoHeight || 720;
      const ctx = canvas.getContext("2d");
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      const blob = await mv.toBlob({ idealAspect: false });
      const img  = new Image();
      img.src    = URL.createObjectURL(blob);
      img.onload = () => {
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        const a = document.createElement("a");
        a.download = `${productName.replace(/\s+/g, "_")}_AR.png`;
        a.href = canvas.toDataURL("image/png");
        a.click();
        URL.revokeObjectURL(img.src);
      };
    } catch { alert("Unable to take snapshot."); }
  };

  const toggleFullscreen = () => {
    const el = containerRef.current;
    if (!document.fullscreenElement) {
      el?.requestFullscreen?.().then(() => setIsFullscreen(true));
    } else {
      document.exitFullscreen?.().then(() => setIsFullscreen(false));
    }
  };

  const activateNativeAR = () => {
    const mv = mvRef.current;
    if (mv?.canActivateAR) { mv.activateAR(); }
    else {
      setArError(true);
      setTimeout(() => setArError(false), 3500);
      if (!isMobile) startWebcam();
    }
  };

  // Face labels for the orbit buttons
  const FACE_VIEWS = [
    { label: "Front",  orbit: "0deg 90deg 1.8m"   },
    { label: "Back",   orbit: "180deg 90deg 1.8m"  },
    { label: "Left",   orbit: "90deg 90deg 1.8m"   },
    { label: "Right",  orbit: "-90deg 90deg 1.8m"  },
    { label: "Top",    orbit: "0deg 0deg 1.8m"     },
    { label: "Bottom", orbit: "0deg 180deg 1.8m"   },
  ];

  const viewerH = isMobile ? "min(72vw, 400px)" : "520px";

  return (
    <div ref={containerRef} style={{ position: "relative", width: "100%", borderRadius: isFullscreen ? 0 : "20px", overflow: "hidden", background: "linear-gradient(135deg,#0f0c29,#302b63,#24243e)" }}>
      <style>{`
        .arv-wrap model-viewer {
          width: 100%;
          height: ${viewerH};
          background: transparent;
          --poster-color: transparent;
        }
        .arv-wrap model-viewer::part(default-ar-button) { display: none; }

        .arv-bar {
          position: absolute; bottom: 14px; left: 50%; transform: translateX(-50%);
          display: flex; align-items: center; gap: 7px; flex-wrap: wrap; justify-content: center;
          background: rgba(8,5,30,0.82); backdrop-filter: blur(18px); -webkit-backdrop-filter: blur(18px);
          padding: 8px 14px; border-radius: 40px;
          border: 1px solid rgba(255,255,255,0.13); z-index: 10;
          box-shadow: 0 12px 40px rgba(0,0,0,0.55); max-width: 96%;
        }

        .face-bar {
          position: absolute; top: 12px; left: 50%; transform: translateX(-50%);
          display: flex; align-items: center; gap: 5px; flex-wrap: nowrap; overflow-x: auto;
          background: rgba(8,5,30,0.75); backdrop-filter: blur(14px); -webkit-backdrop-filter: blur(14px);
          padding: 6px 12px; border-radius: 30px;
          border: 1px solid rgba(255,255,255,0.12); z-index: 10;
          box-shadow: 0 6px 24px rgba(0,0,0,0.4); max-width: 92%; scrollbar-width: none;
        }
        .face-bar::-webkit-scrollbar { display: none; }

        .arv-btn {
          display: flex; align-items: center; gap: 5px;
          color: #fff; border: none; padding: 8px 13px; border-radius: 28px;
          font-size: 12.5px; font-weight: 700; cursor: pointer; white-space: nowrap;
          transition: all 0.2s ease; font-family: system-ui,sans-serif;
          -webkit-tap-highlight-color: transparent;
        }
        .face-btn {
          display: flex; align-items: center; gap: 4px;
          color: rgba(255,255,255,0.75); border: 1px solid rgba(255,255,255,0.18);
          background: rgba(255,255,255,0.07);
          padding: 5px 11px; border-radius: 20px;
          font-size: 12px; font-weight: 600; cursor: pointer; white-space: nowrap;
          transition: all 0.2s ease; font-family: system-ui,sans-serif;
          -webkit-tap-highlight-color: transparent;
        }
        .face-btn.active {
          background: linear-gradient(135deg,#7c3aed,#4f46e5);
          color: #fff; border-color: transparent;
          box-shadow: 0 3px 10px rgba(124,58,237,0.5);
        }
        .face-btn:hover:not(.active) { background: rgba(255,255,255,0.14); color: #fff; }

        .arv-btn-primary { background: linear-gradient(135deg,#ff4d6d,#c9184a); box-shadow: 0 4px 14px rgba(255,77,109,0.45); }
        .arv-btn-primary:hover { transform: translateY(-1px); box-shadow: 0 7px 20px rgba(255,77,109,0.6); }
        .arv-btn-ar      { background: linear-gradient(135deg,#7c3aed,#4f46e5); box-shadow: 0 4px 14px rgba(124,58,237,0.45); }
        .arv-btn-ar:hover { transform: translateY(-1px); }
        .arv-btn-ghost   { background: rgba(255,255,255,0.1); border: 1px solid rgba(255,255,255,0.16); }
        .arv-btn-ghost:hover { background: rgba(255,255,255,0.2); }
        .arv-btn-danger  { background: linear-gradient(135deg,#e63946,#c9184a); }

        .arv-badge {
          position: absolute; bottom: 62px; left: 14px;
          background: rgba(8,5,30,0.7); backdrop-filter: blur(10px);
          color: rgba(255,255,255,0.85); font-size: 11px; font-weight: 700;
          padding: 4px 11px; border-radius: 18px; z-index: 10;
          border: 1px solid rgba(255,255,255,0.14); font-family: system-ui,sans-serif;
          display: flex; align-items: center; gap: 5px;
        }

        .arv-mob-banner {
          position: absolute; bottom: 62px; right: 14px;
          background: linear-gradient(135deg,rgba(124,58,237,0.92),rgba(79,70,229,0.92));
          color: #fff; font-size: 11px; font-weight: 700;
          padding: 5px 12px; border-radius: 20px; z-index: 10;
          border: 1px solid rgba(255,255,255,0.25); font-family: system-ui,sans-serif;
          cursor: pointer; animation: arPulse 2s ease-in-out infinite;
          -webkit-tap-highlight-color: transparent;
        }
        @keyframes arPulse {
          0%,100% { box-shadow: 0 0 0 0 rgba(124,58,237,0.6); }
          50%      { box-shadow: 0 0 0 7px rgba(124,58,237,0); }
        }
        .live-dot {
          width: 7px; height: 7px; background: #39ff14; border-radius: 50%;
          display: inline-block; box-shadow: 0 0 7px #39ff14;
          animation: livePulse 1.5s infinite;
        }
        @keyframes livePulse {
          0%   { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(57,255,20,.7); }
          70%  { transform: scale(1);    box-shadow: 0 0 0 5px rgba(57,255,20,0); }
          100% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(57,255,20,0); }
        }
        @media (max-width: 480px) {
          .arv-bar  { gap: 5px; padding: 6px 10px; }
          .arv-btn  { padding: 7px 10px; font-size: 12px; }
          .face-bar { padding: 5px 10px; }
          .face-btn { padding: 4px 9px; font-size: 11px; }
        }
      `}</style>

      <div className="arv-wrap" style={{ position: "relative" }}>

        {/* Webcam */}
        <video ref={videoRef} autoPlay playsInline muted style={{ position:"absolute",top:0,left:0,width:"100%",height:"100%",objectFit:"cover",zIndex:1,display:webcamActive?"block":"none",pointerEvents:"none" }} />

        {/* Loading overlay */}
        <AnimatePresence>
          {loading && !loadError && (
            <motion.div initial={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.4 }}
              style={{ position:"absolute",inset:0,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:16,background:"linear-gradient(135deg,#0f0c29,#302b63)",zIndex:20 }}>
              <motion.div animate={{ rotate: 360 }} transition={{ duration: 1.4,repeat:Infinity,ease:"linear" }}
                style={{ width:52,height:52,border:"3px solid rgba(255,255,255,0.1)",borderTopColor:"#7c3aed",borderRadius:"50%" }} />
              <span style={{ color:"rgba(255,255,255,0.7)",fontSize:14,fontFamily:"system-ui,sans-serif" }}>
                Building 3D Model…
              </span>
              <span style={{ color:"rgba(255,255,255,0.4)",fontSize:12,fontFamily:"system-ui,sans-serif" }}>
                {faceCount === 1 ? "1 image → 6 faces" : `${faceCount} images → 6 faces`}
              </span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Camera loading */}
        <AnimatePresence>
          {cameraLoading && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              style={{ position:"absolute",inset:0,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:12,background:"rgba(8,5,30,0.88)",backdropFilter:"blur(8px)",zIndex:15 }}>
              <motion.div animate={{ rotate: 360 }} transition={{ duration: 1.2,repeat:Infinity,ease:"linear" }}
                style={{ width:38,height:38,border:"3px solid rgba(255,255,255,0.15)",borderTopColor:"#39ff14",borderRadius:"50%" }} />
              <span style={{ color:"#fff",fontSize:14,fontWeight:600,fontFamily:"system-ui,sans-serif" }}>Accessing Camera…</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Error overlay */}
        {loadError && (
          <div style={{ position:"absolute",inset:0,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:14,padding:24,textAlign:"center",background:"linear-gradient(135deg,#0f0c29,#302b63)",zIndex:20 }}>
            <span style={{ fontSize:40 }}>⚠️</span>
            <p style={{ color:"#ff4d6d",fontWeight:700,fontSize:15,margin:0,fontFamily:"system-ui,sans-serif" }}>Failed to Load 3D Model</p>
            <p style={{ color:"rgba(255,255,255,0.5)",fontSize:13,margin:0,fontFamily:"system-ui,sans-serif",maxWidth:320 }}>{loadError}</p>
          </div>
        )}

        {/* AR error toast */}
        <AnimatePresence>
          {arError && (
            <motion.div initial={{ opacity:0,y:10 }} animate={{ opacity:1,y:0 }} exit={{ opacity:0 }}
              style={{ position:"absolute",bottom:80,left:"50%",transform:"translateX(-50%)",background:"rgba(230,57,70,0.93)",color:"#fff",padding:"10px 18px",borderRadius:12,fontSize:13,whiteSpace:"nowrap",zIndex:30,fontFamily:"system-ui,sans-serif" }}>
              📱 Native AR unavailable — switched to Camera view
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Face navigation bar (top) ── */}
        {!loadError && !loading && !webcamActive && (
          <div className="face-bar">
            <Layers size={13} color="rgba(255,255,255,0.5)" />
            {FACE_VIEWS.map((v) => (
              <button
                key={v.label}
                className={`face-btn ${activeFaceLabel === v.label ? "active" : ""}`}
                onClick={() => {
                  const mv = mvRef.current;
                  if (mv) mv.cameraOrbit = v.orbit;
                  setActiveFaceLabel(v.label);
                }}
              >
                {v.label}
              </button>
            ))}
          </div>
        )}

        {/* Live / mode badge */}
        {!loadError && (
          <div className="arv-badge">
            {webcamActive ? (
              <><span className="live-dot" /> Camera AR</>
            ) : (
              <><span>🥽</span><span>360° · {faceCount === 1 ? "1-Tex" : `${faceCount}-Tex`}</span></>
            )}
          </div>
        )}

        {/* Mobile AR nudge */}
        {!loadError && !loading && isMobile && !webcamActive && (
          <button className="arv-mob-banner" onClick={activateNativeAR}>
            ✨ {isIOS() ? "AR Quick Look" : isAndroid() ? "View in Room" : "Try AR"}
          </button>
        )}

        {/* model-viewer */}
        {activeModelUrl && (
          <model-viewer
            ref={mvRef}
            src={activeModelUrl}
            alt={`3D model of ${productName}`}
            ar
            ar-modes="webxr scene-viewer quick-look"
            camera-controls
            touch-action="pan-y"
            auto-rotate={!webcamActive}
            auto-rotate-delay="1000"
            rotation-per-second="20deg"
            camera-orbit="45deg 70deg 1.8m"
            min-camera-orbit="auto auto 0.6m"
            max-camera-orbit="auto auto 4m"
            shadow-intensity={webcamActive ? "0.3" : "1.4"}
            shadow-softness="0.85"
            exposure="1.2"
            environment-image="neutral"
            poster={poster || ""}
            style={{ width:"100%",height:viewerH,background:"transparent",position:"relative",zIndex:2 }}
          />
        )}

        {/* Action bar (bottom) */}
        {!loading && !loadError && (
          <div className="arv-bar">
            {webcamActive ? (
              <>
                <button className="arv-btn arv-btn-primary" onClick={takeSnapshot}><Download size={14} /> Save Photo</button>
                <button className="arv-btn arv-btn-danger"  onClick={stopWebcam}><VideoOff size={14} /> Stop Camera</button>
              </>
            ) : (
              <>
                <button className="arv-btn arv-btn-ar" onClick={activateNativeAR}>
                  <Sparkles size={14} />
                  {isIOS() ? "AR Quick Look" : isAndroid() ? "View in Room" : "Place in Room"}
                </button>
                {!isMobile && (
                  <button className="arv-btn arv-btn-primary" onClick={startWebcam}><Camera size={14} /> Camera AR</button>
                )}
                {!isMobile && (
                  <button className="arv-btn arv-btn-ghost" onClick={() => setShowQRModal(true)}><QrCode size={14} /> Scan on Phone</button>
                )}
                <button className="arv-btn arv-btn-ghost" onClick={toggleFullscreen} title="Fullscreen"><Maximize2 size={14} /></button>
                <button className="arv-btn arv-btn-ghost" title="Reset view"
                  onClick={() => { setActiveFaceLabel(null); if (mvRef.current) mvRef.current.cameraOrbit = "45deg 70deg 1.8m"; }}>
                  <RotateCcw size={14} />
                </button>
              </>
            )}
          </div>
        )}
      </div>

      {/* QR Modal */}
      <AnimatePresence>
        {showQRModal && (
          <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}
            style={{ position:"fixed",inset:0,background:"rgba(0,0,0,0.85)",backdropFilter:"blur(14px)",WebkitBackdropFilter:"blur(14px)",zIndex:9999,display:"flex",alignItems:"center",justifyContent:"center",padding:24 }}
            onClick={() => setShowQRModal(false)}>
            <motion.div initial={{ scale:0.9,y:30 }} animate={{ scale:1,y:0 }} exit={{ scale:0.9,y:30 }}
              transition={{ type:"spring",damping:24,stiffness:220 }}
              style={{ background:"linear-gradient(135deg,rgba(15,12,41,0.97),rgba(48,43,99,0.97))",border:"1px solid rgba(255,255,255,0.18)",borderRadius:28,padding:32,maxWidth:360,width:"100%",textAlign:"center",boxShadow:"0 24px 64px rgba(0,0,0,0.7)" }}
              onClick={e => e.stopPropagation()}>
              <div style={{ display:"flex",justifyContent:"flex-end",marginBottom:8 }}>
                <button onClick={() => setShowQRModal(false)} style={{ background:"rgba(255,255,255,0.1)",border:"none",borderRadius:"50%",width:32,height:32,color:"#fff",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center" }}><X size={16}/></button>
              </div>
              <div style={{ display:"inline-flex",padding:12,borderRadius:"50%",background:"rgba(124,58,237,0.2)",marginBottom:16 }}>
                <QrCode size={36} color="#7c3aed" />
              </div>
              <h3 style={{ margin:"0 0 8px",color:"#fff",fontSize:20,fontWeight:800,fontFamily:"system-ui,sans-serif" }}>Scan for Mobile AR</h3>
              <p style={{ margin:"0 0 20px",color:"rgba(255,255,255,0.6)",fontSize:13.5,lineHeight:1.5,fontFamily:"system-ui,sans-serif" }}>
                Point your phone camera at this QR code to place <strong>{productName}</strong> in your real room using all {faceCount} product images as 3D textures.
              </p>
              <div style={{ background:"#fff",padding:14,borderRadius:18,display:"inline-block",marginBottom:20,boxShadow:"0 12px 32px rgba(0,0,0,0.35)" }}>
                <img src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(window.location.href)}`}
                  alt="Scan to view in AR" style={{ width:200,height:200,display:"block",borderRadius:6 }} />
              </div>
              <div style={{ display:"flex",gap:10,justifyContent:"center",flexWrap:"wrap" }}>
                {["🍎 iOS — Quick Look","🤖 Android — Scene Viewer"].map(b => (
                  <span key={b} style={{ background:"rgba(255,255,255,0.08)",border:"1px solid rgba(255,255,255,0.14)",color:"rgba(255,255,255,0.65)",fontSize:11,fontWeight:600,padding:"5px 12px",borderRadius:20 }}>{b}</span>
                ))}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default ARViewer;