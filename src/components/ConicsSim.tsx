import React, { useState, useEffect, useRef, useMemo } from "react";
import { ConicsSimState } from "../types";
import { 
  HelpCircle, Info, Compass, RotateCw, Play, Pause, Layers, 
  Orbit, Sun, Activity, Zap, Radio, CheckCircle, Move, Eye
} from "lucide-react";

interface ConicsSimProps {
  state: ConicsSimState;
  onChange: (state: ConicsSimState) => void;
  onExplainRequest: () => void;
}

export default function ConicsSim({ state, onChange, onExplainRequest }: ConicsSimProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Animation and interactivity states
  const [rotation, setRotation] = useState({ alpha: 45, beta: 20 });
  const [zoom, setZoom] = useState(1.1);
  const [autoRotate, setAutoRotate] = useState(true);
  const [isPlaying, setIsPlaying] = useState(true);
  const [animTime, setAnimTime] = useState(0);
  
  const isDraggingRef = useRef(false);
  const lastMousePosRef = useRef({ x: 0, y: 0 });

  // Handle animation timer
  useEffect(() => {
    let animationId: number;
    const update = () => {
      if (isPlaying) {
        setAnimTime((prev) => (prev + 0.015) % (Math.PI * 2));
      }
      if (autoRotate && state.is3d) {
        setRotation((prev) => ({
          ...prev,
          alpha: (prev.alpha + 0.15) % 360,
        }));
      }
      animationId = requestAnimationFrame(update);
    };
    animationId = requestAnimationFrame(update);
    return () => cancelAnimationFrame(animationId);
  }, [isPlaying, autoRotate, state.is3d]);

  // Handle mouse/touch drag rotation in 3D
  const handleMouseDown = (e: React.MouseEvent) => {
    if (!state.is3d) return;
    isDraggingRef.current = true;
    setAutoRotate(false);
    lastMousePosRef.current = { x: e.clientX, y: e.clientY };
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDraggingRef.current || !state.is3d) return;
    const dx = e.clientX - lastMousePosRef.current.x;
    const dy = e.clientY - lastMousePosRef.current.y;
    
    setRotation((prev) => ({
      alpha: (prev.alpha - dx * 0.45) % 360,
      beta: Math.max(-80, Math.min(80, prev.beta - dy * 0.45)),
    }));
    
    lastMousePosRef.current = { x: e.clientX, y: e.clientY };
  };

  const handleMouseUpOrLeave = () => {
    isDraggingRef.current = false;
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    if (!state.is3d || e.touches.length === 0) return;
    isDraggingRef.current = true;
    setAutoRotate(false);
    lastMousePosRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDraggingRef.current || !state.is3d || e.touches.length === 0) return;
    const dx = e.touches[0].clientX - lastMousePosRef.current.x;
    const dy = e.touches[0].clientY - lastMousePosRef.current.y;
    
    setRotation((prev) => ({
      alpha: (prev.alpha - dx * 0.45) % 360,
      beta: Math.max(-80, Math.min(80, prev.beta - dy * 0.45)),
    }));
    
    lastMousePosRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
  };

  // Predefined applications
  const applications = useMemo(() => {
    return {
      circle: [
        { id: "wheel", name: "យន្តការកង់វិល (Wheels)", desc: "ចលនាវិលជុំវិញផ្ចិតថេរ រាល់ចំនុចលើកង់មានចម្ងាយស្មើគ្នានៅគ្រប់វិនាទី។" },
        { id: "orbit_circle", name: "គន្លងរង្វង់ផែនដី (Circular Orbits)", desc: "ចលនាផ្កាយរណបហោះជុំវិញផែនដីដែលមានកាំថេរ លំនឹងកម្លាំងទំនាញ។" }
      ],
      ellipse: [
        { id: "planetary", name: "គន្លងភពប្រព័ន្ធព្រះអាទិត្យ (Planetary Orbits)", desc: "ភពធ្វើដំណើរតាមគន្លងអេលីបជុំវិញព្រះអាទិត្យដែលស្ថិតនៅកំណុំម្ខាង (Kepler's Law)។" },
        { id: "whispering", name: "ស្ថាបត្យកម្មបន្ទប់ខ្សឹប (Whispering Gallery)", desc: "រលកសម្លេង radiating ចេញពីកំណុំម្ខាង ជះទង្គិចជញ្ជាំងអេលីបរួចប្រមូលផ្តុំនៅកំណុំម្ខាងទៀតយ៉ាងច្បាស់។" }
      ],
      parabola: [
        { id: "satellite", name: "ចានផ្កាយរណប (Satellite Dish)", desc: "រលកសញ្ញាស្របគ្នាដែលចូលមក ប៉ះផ្ទៃប៉ារ៉ាបូល រួចឆ្លុះទៅប្រមូលផ្តុំយ៉ាងខ្លាំងចំកំណុំ (Receiver)។" },
        { id: "headlight", name: "ចង្កៀងបំភ្លឺមុខឡាន (Car Headlight)", desc: "ពន្លឺចេញពីអំពូលចំកំណុំឆ្លុះជះចេញជាកាំរស្មីពន្លឺស្របគ្នាត្រង់ទៅមុខឆ្ងាយ។" },
        { id: "projectile", name: "គន្លងគ្រាប់បោះ (Projectile Motion)", desc: "វត្ថុហោះហើរក្នុងខ្យល់រងឥទ្ធិពលកម្លាំងទំនាញបង្កើតបានគន្លងប៉ារ៉ាបូលយ៉ាងល្អឥតខ្ចោះ។" }
      ],
      hyperbola: [
        { id: "flyby", name: "គន្លងឆ្វៀល کشាញផែនដី (Planetary Flyby)", desc: "ដុំកមែត ឬយានអវកាសមកពីក្រៅប្រព័ន្ធរងទំនាញទាញបង្កើតគន្លងអ៊ីពែបូល រួចហោះចេញបាត់។" },
        { id: "shockwave", name: "រលកសម្លេងយន្តហោះ (Supersonic Sonic Boom)", desc: "យន្តហោះល្បឿនលឿនបង្កើតរលកសម្លេងរាងកោន បង្កើតបន្ទាត់អ៊ីពែបូលប៉ះលើផ្ទៃដី។" },
        { id: "loran", name: "ប្រព័ន្ធរ៉ាដានាវាចរណ៍ LORAN (Loran Radar)", desc: "ការគណនាផលសងពេលវេលាទទួលសញ្ញាពីស្ថានីយពីរ បង្ហាញទីតាំងនាវានៅលើបន្ទាត់អ៊ីពែបូល។" }
      ]
    };
  }, []);

  // Set default app if missing or invalid
  useEffect(() => {
    const validApps = applications[state.mode];
    const isCurrentAppValid = validApps.some((app) => app.id === state.selectedApp);
    if (!isCurrentAppValid && validApps.length > 0) {
      onChange({ ...state, selectedApp: validApps[0].id });
    }
  }, [state.mode]);

  // Calculate mathematical indicators for current state
  const mathValues = useMemo(() => {
    const a = state.paramA;
    const b = state.paramB;
    const h = state.h;
    const k = state.k;

    let eccentricity = 0;
    let foci: { x: number; y: number }[] = [];
    let vertexes: { x: number; y: number }[] = [];
    let equation = "";

    switch (state.mode) {
      case "circle":
        eccentricity = 0;
        foci = [{ x: h, y: k }];
        vertexes = [
          { x: h + a, y: k },
          { x: h - a, y: k },
          { x: h, y: k + a },
          { x: h, y: k - a }
        ];
        equation = `(x - ${h.toFixed(1)})² + (y - ${k.toFixed(1)})² = ${Math.pow(a, 2).toFixed(1)}`;
        break;

      case "ellipse": {
        const major = Math.max(a, b);
        const minor = Math.min(a, b);
        const cVal = Math.sqrt(Math.max(0, major * major - minor * minor));
        eccentricity = cVal / major;
        if (a >= b) {
          foci = [
            { x: h - cVal, y: k },
            { x: h + cVal, y: k }
          ];
          vertexes = [
            { x: h - a, y: k },
            { x: h + a, y: k }
          ];
        } else {
          foci = [
            { x: h, y: k - cVal },
            { x: h, y: k + cVal }
          ];
          vertexes = [
            { x: h, y: k - b },
            { x: h, y: k + b }
          ];
        }
        equation = `\\frac{(x - ${h.toFixed(1)})²}{${(a*a).toFixed(1)}} + \\frac{(y - ${k.toFixed(1)})²}{${(b*b).toFixed(1)}} = 1`;
        break;
      }

      case "parabola": {
        // paramA acts as the focal distance 4p
        const p = a / 4 || 0.1;
        eccentricity = 1.0;
        // Horizontal parabola opening to the right: (y - k)^2 = 4p(x - h)
        foci = [{ x: h + p, y: k }];
        vertexes = [{ x: h, y: k }];
        equation = `(y - ${k.toFixed(1)})² = ${a.toFixed(1)}(x - ${h.toFixed(1)})`;
        break;
      }

      case "hyperbola": {
        const cVal = Math.sqrt(a * a + b * b);
        eccentricity = cVal / a;
        foci = [
          { x: h - cVal, y: k },
          { x: h + cVal, y: k }
        ];
        vertexes = [
          { x: h - a, y: k },
          { x: h + a, y: k }
        ];
        equation = `\\frac{(x - ${h.toFixed(1)})²}{${(a*a).toFixed(1)}} - \\frac{(y - ${k.toFixed(1)})²}{${(b*b).toFixed(1)}} = 1`;
        break;
      }
    }

    return { eccentricity, foci, vertexes, equation };
  }, [state]);

  // Canvas drawing loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let width = canvas.width;
    let height = canvas.height;
    const centerX = width / 2;
    const centerY = height / 2;

    const scaleFactor = 28 * zoom;

    ctx.clearRect(0, 0, width, height);

    // Projection method mapping 3D space to 2D screen coordinates
    const project3D = (x: number, y: number, z: number) => {
      if (!state.is3d) {
        // Simple 2D orthographic
        return {
          x: centerX + x * scaleFactor * 1.2,
          y: centerY - y * scaleFactor * 1.2,
          visible: true
        };
      }

      const radAlpha = (rotation.alpha * Math.PI) / 180;
      const radBeta = (rotation.beta * Math.PI) / 180;

      // Z rotation (Yaw)
      const x1 = x * Math.cos(radAlpha) - y * Math.sin(radAlpha);
      const y1 = x * Math.sin(radAlpha) + y * Math.cos(radAlpha);
      const z1 = z;

      // X rotation (Pitch)
      const x2 = x1;
      const y2 = y1 * Math.cos(radBeta) - z1 * Math.sin(radBeta);
      const z2 = y1 * Math.sin(radBeta) + z1 * Math.cos(radBeta);

      const d = 18; // Camera distance
      const distanceScale = d / (d + y2);

      return {
        x: centerX + x2 * scaleFactor * distanceScale * 1.15,
        y: centerY - z2 * scaleFactor * distanceScale * 1.15,
        visible: y2 > -d
      };
    };

    // Draw grid plane or reference coordinate axes
    const drawReferenceAxes = () => {
      const origin = project3D(0, 0, 0);
      const maxAx = 7.5;

      ctx.lineWidth = 1.2;
      ctx.font = "bold 9px monospace";

      // 2D grid/axes
      if (!state.is3d) {
        ctx.strokeStyle = "rgba(148, 163, 184, 0.08)";
        ctx.beginPath();
        for (let i = -8; i <= 8; i++) {
          const ptX1 = project3D(i, -8, 0);
          const ptX2 = project3D(i, 8, 0);
          ctx.moveTo(ptX1.x, ptX1.y);
          ctx.lineTo(ptX2.x, ptX2.y);

          const ptY1 = project3D(-8, i, 0);
          const ptY2 = project3D(8, i, 0);
          ctx.moveTo(ptY1.x, ptY1.y);
          ctx.lineTo(ptY2.x, ptY2.y);
        }
        ctx.stroke();

        // Standard 2D Cartesian axes
        const tipX = project3D(maxAx, 0, 0);
        const tipY = project3D(0, maxAx, 0);
        const negX = project3D(-maxAx, 0, 0);
        const negY = project3D(0, -maxAx, 0);

        ctx.strokeStyle = "rgba(100, 116, 139, 0.4)";
        ctx.beginPath();
        ctx.moveTo(negX.x, negX.y);
        ctx.lineTo(tipX.x, tipX.y);
        ctx.moveTo(negY.x, negY.y);
        ctx.lineTo(tipY.x, tipY.y);
        ctx.stroke();

        ctx.fillStyle = "#ef4444";
        ctx.fillText("X+", tipX.x + 4, tipX.y + 3);
        ctx.fillStyle = "#10b981";
        ctx.fillText("Y+", tipY.x - 3, tipY.y - 5);
        return;
      }

      // 3D Grid Plane (XY at Z = 0)
      ctx.strokeStyle = "rgba(148, 163, 184, 0.04)";
      ctx.beginPath();
      for (let i = -6; i <= 6; i++) {
        const p1 = project3D(i, -6, 0);
        const p2 = project3D(i, 6, 0);
        ctx.moveTo(p1.x, p1.y);
        ctx.lineTo(p2.x, p2.y);

        const p3 = project3D(-6, i, 0);
        const p4 = project3D(6, i, 0);
        ctx.moveTo(p3.x, p3.y);
        ctx.lineTo(p4.x, p4.y);
      }
      ctx.stroke();

      // Draw 3D Primary Axes
      const tipX = project3D(maxAx, 0, 0);
      const tipY = project3D(0, maxAx, 0);
      const tipZ = project3D(0, 0, maxAx);
      const axisOrigin = project3D(0, 0, 0);

      ctx.strokeStyle = "rgba(239, 68, 68, 0.35)"; // Red X
      ctx.beginPath(); ctx.moveTo(axisOrigin.x, axisOrigin.y); ctx.lineTo(tipX.x, tipX.y); ctx.stroke();
      ctx.fillStyle = "rgba(239, 68, 68, 0.75)"; ctx.fillText("X+", tipX.x + 5, tipX.y + 3);

      ctx.strokeStyle = "rgba(16, 185, 129, 0.35)"; // Green Y
      ctx.beginPath(); ctx.moveTo(axisOrigin.x, axisOrigin.y); ctx.lineTo(tipY.x, tipY.y); ctx.stroke();
      ctx.fillStyle = "rgba(16, 185, 129, 0.75)"; ctx.fillText("Y+", tipY.x + 5, tipY.y - 4);

      ctx.strokeStyle = "rgba(59, 130, 246, 0.35)"; // Blue Z
      ctx.beginPath(); ctx.moveTo(axisOrigin.x, axisOrigin.y); ctx.lineTo(tipZ.x, tipZ.y); ctx.stroke();
      ctx.fillStyle = "rgba(59, 130, 246, 0.75)"; ctx.fillText("Z+", tipZ.x - 4, tipZ.y - 5);
    };

    // --- DRAW 1. MATH MODE 3D DOUBLE CONE VIEW ---
    if (state.appMode === "math" && state.is3d) {
      drawReferenceAxes();

      // Cone Parameters
      const numRings = 16;
      const ringHeightStep = 0.35;
      const coneAngleCoeff = 0.7; // Radius ratio r = |z| * coeff

      // Draw Double-Naped Cone wireframe (Blue/Slate)
      ctx.lineWidth = 0.8;
      ctx.strokeStyle = "rgba(100, 116, 139, 0.15)";
      
      // Draw rings of the cone
      for (let i = -numRings; i <= numRings; i++) {
        if (i === 0) continue; // skip apex node
        const z = i * ringHeightStep;
        const radius = Math.abs(z) * coneAngleCoeff;

        ctx.beginPath();
        for (let th = 0; th <= 360; th += 15) {
          const rad = (th * Math.PI) / 180;
          const pt = project3D(radius * Math.cos(rad), radius * Math.sin(rad), z);
          if (th === 0) ctx.moveTo(pt.x, pt.y);
          else ctx.lineTo(pt.x, pt.y);
        }
        ctx.closePath();
        ctx.stroke();
      }

      // Draw generator lines connecting top and bottom of the double cone
      ctx.strokeStyle = "rgba(51, 65, 85, 0.2)";
      ctx.beginPath();
      const zTop = numRings * ringHeightStep;
      const rTop = zTop * coneAngleCoeff;
      for (let th = 0; th < 360; th += 30) {
        const rad = (th * Math.PI) / 180;
        const pTop = project3D(rTop * Math.cos(rad), rTop * Math.sin(rad), zTop);
        const pBot = project3D(rTop * Math.cos(rad + Math.PI), rTop * Math.sin(rad + Math.PI), -zTop);
        ctx.moveTo(pTop.x, pTop.y);
        ctx.lineTo(pBot.x, pBot.y);
      }
      ctx.stroke();

      // Draw the Slicing Intersection Plane
      // Let plane be defined by angle tilt relative to horizontal (XY plane)
      // Angle values suggested for conics: circle=0, ellipse=18, parabola=35, hyperbola=72
      let planeTiltAngle = 0;
      let planeHeightOffset = state.k * 0.4; // linked to translation

      switch (state.mode) {
        case "circle": planeTiltAngle = 0; break;
        case "ellipse": planeTiltAngle = 18; break;
        case "parabola": planeTiltAngle = 35; break; // parallel to cone generator: angle ~ 35deg
        case "hyperbola": planeTiltAngle = 72; break; // steep angle intersecting both nappes
      }

      const radTilt = (planeTiltAngle * Math.PI) / 180;
      const tanTilt = Math.tan(radTilt);

      // Define plane boundary corners in XY
      const pSize = 5.2;
      const pCorners = [
        { x: -pSize, y: -pSize },
        { x: pSize, y: -pSize },
        { x: pSize, y: pSize },
        { x: -pSize, y: pSize }
      ];

      // Slicing plane corners projected
      const pCornersProj = pCorners.map((c) => {
        const zPlane = planeHeightOffset + c.x * tanTilt;
        return project3D(c.x, c.y, zPlane);
      });

      // Fill plane with very soft orange/yellow transparent fill
      ctx.fillStyle = "rgba(245, 158, 11, 0.09)";
      ctx.strokeStyle = "rgba(245, 158, 11, 0.3)";
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.moveTo(pCornersProj[0].x, pCornersProj[0].y);
      for (let i = 1; i < 4; i++) ctx.lineTo(pCornersProj[i].x, pCornersProj[i].y);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // --- CALCULATE AND DRAW THE DYNAMIC 3D INTERSECTION CURVE (VIBRANT CYAN) ---
      ctx.strokeStyle = "#06b6d4";
      ctx.lineWidth = 3.2;
      ctx.shadowColor = "#06b6d4";
      ctx.shadowBlur = 6;
      ctx.beginPath();

      const numPoints = 120;
      const a_coeff = state.paramA * 0.7;
      const b_coeff = state.paramB * 0.7;

      if (state.mode === "circle") {
        const r = a_coeff;
        for (let i = 0; i <= numPoints; i++) {
          const theta = (i / numPoints) * Math.PI * 2;
          const px = r * Math.cos(theta);
          const py = r * Math.sin(theta);
          const pProj = project3D(px, py, planeHeightOffset);
          if (i === 0) ctx.moveTo(pProj.x, pProj.y);
          else ctx.lineTo(pProj.x, pProj.y);
        }
      } 
      else if (state.mode === "ellipse") {
        const el_a = a_coeff * 1.1;
        const el_b = b_coeff * 1.1;
        for (let i = 0; i <= numPoints; i++) {
          const theta = (i / numPoints) * Math.PI * 2;
          const px = el_a * Math.cos(theta);
          const py = el_b * Math.sin(theta);
          // Z varies according to the tilt angle of the plane
          const pz = planeHeightOffset + px * tanTilt;
          const pProj = project3D(px, py, pz);
          if (i === 0) ctx.moveTo(pProj.x, pProj.y);
          else ctx.lineTo(pProj.x, pProj.y);
        }
      } 
      else if (state.mode === "parabola") {
        // Parabola is defined when plane slope equals the cone generator slope (tanTilt = coneAngleCoeff)
        // Draw parabolic curve points in 3D nappe
        for (let i = 0; i <= numPoints; i++) {
          const t = ((i / numPoints) - 0.5) * 6.5; // range
          // x = y^2 / (4p) - offset
          const py = t;
          const px = (t * t) / (4 * (a_coeff || 0.5)) - 1.2;
          const pz = planeHeightOffset + px * tanTilt;

          // Limit to physical cone dimensions
          if (Math.abs(pz) < numRings * ringHeightStep) {
            const pProj = project3D(px, py, pz);
            if (i === 0 || ctx.lineWidth === 3.2 && t === -3.25) ctx.moveTo(pProj.x, pProj.y);
            else ctx.lineTo(pProj.x, pProj.y);
          }
        }
      } 
      else if (state.mode === "hyperbola") {
        // Plane is steeper than the cone generator. It cuts both nappes!
        // We draw two branches
        // Branch 1 (Upper nappe / Right)
        ctx.setLineDash([]);
        for (let b = 0; b < 2; b++) {
          ctx.beginPath();
          const sign = b === 0 ? 1 : -1;
          for (let i = 0; i <= numPoints; i++) {
            const t = ((i / numPoints) - 0.5) * 3.5;
            const px = sign * a_coeff * Math.cosh(t);
            const py = b_coeff * Math.sinh(t);
            const pz = planeHeightOffset + px * tanTilt;

            if (Math.abs(pz) < numRings * ringHeightStep) {
              const pProj = project3D(px, py, pz);
              if (i === 0) ctx.moveTo(pProj.x, pProj.y);
              else ctx.lineTo(pProj.x, pProj.y);
            }
          }
          ctx.stroke();
        }
      }

      ctx.stroke();
      ctx.shadowBlur = 0; // reset glow
      ctx.setLineDash([]);
    }

    // --- DRAW 2. MATH MODE 2D ANALYTICAL GRAPH VIEW ---
    else if (state.appMode === "math" && !state.is3d) {
      drawReferenceAxes();

      // Sliders parameters
      const h = state.h;
      const k = state.k;
      const a = state.paramA;
      const b = state.paramB;

      ctx.lineWidth = 3.0;
      ctx.strokeStyle = "#0ea5e9";
      ctx.shadowColor = "rgba(14, 165, 233, 0.4)";
      ctx.shadowBlur = 8;

      // Dynamic sampling for smooth curve plotting
      ctx.beginPath();
      const pointsCount = 180;

      if (state.mode === "circle") {
        for (let i = 0; i <= pointsCount; i++) {
          const theta = (i / pointsCount) * Math.PI * 2;
          const px = h + a * Math.cos(theta);
          const py = k + a * Math.sin(theta);
          const pt = project3D(px, py, 0);
          if (i === 0) ctx.moveTo(pt.x, pt.y);
          else ctx.lineTo(pt.x, pt.y);
        }
        ctx.stroke();

        // Draw Center C
        const pC = project3D(h, k, 0);
        ctx.fillStyle = "#eab308";
        ctx.beginPath(); ctx.arc(pC.x, pC.y, 4.5, 0, 2 * Math.PI); ctx.fill();
        ctx.fillText(`Center C (${h.toFixed(1)}, ${k.toFixed(1)})`, pC.x + 8, pC.y - 5);

        // Draw Radius Line to animated interactive point P
        const thetaP = animTime;
        const pX = h + a * Math.cos(thetaP);
        const pY = k + a * Math.sin(thetaP);
        const pP = project3D(pX, pY, 0);

        ctx.strokeStyle = "rgba(245, 158, 11, 0.7)";
        ctx.lineWidth = 1.5;
        ctx.setLineDash([3, 3]);
        ctx.beginPath();
        ctx.moveTo(pC.x, pC.y);
        ctx.lineTo(pP.x, pP.y);
        ctx.stroke();
        ctx.setLineDash([]);

        ctx.fillStyle = "#f97316";
        ctx.beginPath(); ctx.arc(pP.x, pP.y, 5, 0, 2 * Math.PI); ctx.fill();
        ctx.fillText(`P (${pX.toFixed(1)}, ${pY.toFixed(1)})`, pP.x + 8, pP.y + 12);
        ctx.fillStyle = "#fff";
        ctx.fillText(`R = ${a.toFixed(1)}`, (pC.x + pP.x)/2 - 15, (pC.y + pP.y)/2 - 5);
      } 
      else if (state.mode === "ellipse") {
        for (let i = 0; i <= pointsCount; i++) {
          const theta = (i / pointsCount) * Math.PI * 2;
          const px = h + a * Math.cos(theta);
          const py = k + b * Math.sin(theta);
          const pt = project3D(px, py, 0);
          if (i === 0) ctx.moveTo(pt.x, pt.y);
          else ctx.lineTo(pt.x, pt.y);
        }
        ctx.stroke();

        // Draw Center C
        const pC = project3D(h, k, 0);
        ctx.fillStyle = "#fff";
        ctx.beginPath(); ctx.arc(pC.x, pC.y, 4, 0, 2 * Math.PI); ctx.fill();
        ctx.fillText(`Center (${h.toFixed(1)}, ${k.toFixed(1)})`, pC.x + 8, pC.y - 5);

        // Draw Foci
        mathValues.foci.forEach((f, idx) => {
          const pF = project3D(f.x, f.y, 0);
          ctx.fillStyle = "#ec4899"; // Pink
          ctx.beginPath(); ctx.arc(pF.x, pF.y, 4.5, 0, 2 * Math.PI); ctx.fill();
          ctx.fillText(`F${idx + 1} (${f.x.toFixed(1)}, ${f.y.toFixed(1)})`, pF.x - 15, pF.y + 14);
        });

        // Interactive point P on Ellipse showing Focal Distance Property: PF1 + PF2 = 2a
        const thetaP = animTime;
        const pX = h + a * Math.cos(thetaP);
        const pY = k + b * Math.sin(thetaP);
        const pP = project3D(pX, pY, 0);

        // Draw Focal connectors
        ctx.lineWidth = 1.2;
        ctx.setLineDash([3, 3]);
        mathValues.foci.forEach((f, idx) => {
          const pF = project3D(f.x, f.y, 0);
          ctx.strokeStyle = idx === 0 ? "#f43f5e" : "#8b5cf6";
          ctx.beginPath();
          ctx.moveTo(pF.x, pF.y);
          ctx.lineTo(pP.x, pP.y);
          ctx.stroke();
        });
        ctx.setLineDash([]);

        // Interactive Point
        ctx.fillStyle = "#eab308";
        ctx.beginPath(); ctx.arc(pP.x, pP.y, 5, 0, 2 * Math.PI); ctx.fill();
        ctx.fillText(`P (${pX.toFixed(1)}, ${pY.toFixed(1)})`, pP.x + 8, pP.y - 8);

        // Display string on graph
        ctx.fillStyle = "#cbd5e1";
        ctx.font = "11px sans-serif";
        ctx.fillText(`PF₁ + PF₂ = 2a = ${(2 * Math.max(a, b)).toFixed(1)} (ថេរ)`, pC.x - 60, centerY + 130);
      } 
      else if (state.mode === "parabola") {
        // (y-k)^2 = 4p(x-h) => x = (y-k)^2 / 4p + h
        const p = a / 4 || 0.1;
        
        for (let i = 0; i <= pointsCount; i++) {
          // sample y
          const py = k + ((i / pointsCount) - 0.5) * 12;
          const px = Math.pow(py - k, 2) / (4 * p) + h;
          const pt = project3D(px, py, 0);
          if (i === 0) ctx.moveTo(pt.x, pt.y);
          else ctx.lineTo(pt.x, pt.y);
        }
        ctx.stroke();

        // Draw Vertex V
        const pV = project3D(h, k, 0);
        ctx.fillStyle = "#10b981";
        ctx.beginPath(); ctx.arc(pV.x, pV.y, 4.5, 0, 2 * Math.PI); ctx.fill();
        ctx.fillText(`Vertex V (${h.toFixed(1)}, ${k.toFixed(1)})`, pV.x - 15, pV.y - 8);

        // Draw Focus F
        const pF = project3D(h + p, k, 0);
        ctx.fillStyle = "#ec4899";
        ctx.beginPath(); ctx.arc(pF.x, pF.y, 4.5, 0, 2 * Math.PI); ctx.fill();
        ctx.fillText(`Focus F (${(h+p).toFixed(1)}, ${k.toFixed(1)})`, pF.x + 8, pF.y - 5);

        // Draw Directrix Line: x = h - p
        const directrixX = h - p;
        const pDirTop = project3D(directrixX, k + 6, 0);
        const pDirBot = project3D(directrixX, k - 6, 0);
        ctx.strokeStyle = "#f43f5e";
        ctx.lineWidth = 1.8;
        ctx.setLineDash([5, 4]);
        ctx.beginPath();
        ctx.moveTo(pDirTop.x, pDirTop.y);
        ctx.lineTo(pDirBot.x, pDirBot.y);
        ctx.stroke();
        ctx.setLineDash([]);
        ctx.fillStyle = "#f43f5e";
        ctx.fillText(`Directrix: x = ${directrixX.toFixed(1)}`, pDirTop.x - 90, pDirTop.y + 15);

        // Point P on Parabola showing: d(P, F) = d(P, Directrix)
        // Set interactive animated position
        const pY = k + Math.sin(animTime) * 3.5;
        const pX = Math.pow(pY - k, 2) / (4 * p) + h;
        const pP = project3D(pX, pY, 0);

        // Connection lines
        ctx.strokeStyle = "#eab308";
        ctx.lineWidth = 1.5;
        ctx.setLineDash([3, 3]);
        ctx.beginPath();
        ctx.moveTo(pF.x, pF.y);
        ctx.lineTo(pP.x, pP.y); // P to F
        const pProjDirectrix = project3D(directrixX, pY, 0);
        ctx.lineTo(pProjDirectrix.x, pProjDirectrix.y); // P to Directrix
        ctx.stroke();
        ctx.setLineDash([]);

        // Interactive point
        ctx.fillStyle = "#eab308";
        ctx.beginPath(); ctx.arc(pP.x, pP.y, 5, 0, 2 * Math.PI); ctx.fill();
        ctx.fillText(`P (${pX.toFixed(1)}, ${pY.toFixed(1)})`, pP.x + 8, pP.y - 8);

        // Focus and directrix points
        ctx.fillStyle = "#f97316";
        ctx.beginPath(); ctx.arc(pProjDirectrix.x, pProjDirectrix.y, 4, 0, 2 * Math.PI); ctx.fill();

        ctx.fillStyle = "#cbd5e1";
        ctx.fillText(`ចម្ងាយ d(P, F) = d(P, Directrix) = ${Math.sqrt(Math.pow(pX - (h+p), 2) + Math.pow(pY - k, 2)).toFixed(1)}`, pV.x - 70, centerY + 130);
      } 
      else if (state.mode === "hyperbola") {
        // Horizontal hyperbola: (x-h)^2/a^2 - (y-k)^2/b^2 = 1 => x = h +/- a * sqrt(1 + (y-k)^2/b^2)
        // Left & Right branches
        for (let branch = 0; branch < 2; branch++) {
          ctx.beginPath();
          const sign = branch === 0 ? 1 : -1;
          for (let i = 0; i <= pointsCount; i++) {
            const py = k + ((i / pointsCount) - 0.5) * 12;
            const term = 1 + Math.pow(py - k, 2) / (b * b);
            const px = h + sign * a * Math.sqrt(term);
            const pt = project3D(px, py, 0);
            if (i === 0) ctx.moveTo(pt.x, pt.y);
            else ctx.lineTo(pt.x, pt.y);
          }
          ctx.stroke();
        }

        // Draw Center C
        const pC = project3D(h, k, 0);
        ctx.fillStyle = "#fff";
        ctx.beginPath(); ctx.arc(pC.x, pC.y, 4, 0, 2 * Math.PI); ctx.fill();
        ctx.fillText(`Center (${h.toFixed(1)}, ${k.toFixed(1)})`, pC.x + 8, pC.y - 5);

        // Draw Asymptote lines: y - k = +/- (b/a)(x - h)
        ctx.strokeStyle = "rgba(148, 163, 184, 0.3)";
        ctx.lineWidth = 1.0;
        ctx.setLineDash([4, 4]);
        
        const asmX1 = h - 6;
        const asmX2 = h + 6;
        const asmY1_pos = k + (b/a) * (asmX1 - h);
        const asmY2_pos = k + (b/a) * (asmX2 - h);
        const asmY1_neg = k - (b/a) * (asmX1 - h);
        const asmY2_neg = k - (b/a) * (asmX2 - h);

        ctx.beginPath();
        const pAsm1_1 = project3D(asmX1, asmY1_pos, 0);
        const pAsm1_2 = project3D(asmX2, asmY2_pos, 0);
        ctx.moveTo(pAsm1_1.x, pAsm1_1.y);
        ctx.lineTo(pAsm1_2.x, pAsm1_2.y);

        const pAsm2_1 = project3D(asmX1, asmY1_neg, 0);
        const pAsm2_2 = project3D(asmX2, asmY2_neg, 0);
        ctx.moveTo(pAsm2_1.x, pAsm2_1.y);
        ctx.lineTo(pAsm2_2.x, pAsm2_2.y);
        ctx.stroke();
        ctx.setLineDash([]);

        // Draw Foci
        mathValues.foci.forEach((f, idx) => {
          const pF = project3D(f.x, f.y, 0);
          ctx.fillStyle = "#ec4899";
          ctx.beginPath(); ctx.arc(pF.x, pF.y, 4.5, 0, 2 * Math.PI); ctx.fill();
          ctx.fillText(`F${idx + 1} (${f.x.toFixed(1)}, ${f.y.toFixed(1)})`, pF.x - 15, pF.y + 14);
        });

        // Interactive point P on Right branch
        const tVal = Math.sin(animTime) * 1.5;
        const pX = h + a * Math.cosh(tVal);
        const pY = k + b * Math.sinh(tVal);
        const pP = project3D(pX, pY, 0);

        // Connection lines to foci
        ctx.strokeStyle = "#eab308";
        ctx.lineWidth = 1.3;
        ctx.setLineDash([3, 3]);
        mathValues.foci.forEach((f) => {
          const pF = project3D(f.x, f.y, 0);
          ctx.beginPath(); ctx.moveTo(pF.x, pF.y); ctx.lineTo(pP.x, pP.y); ctx.stroke();
        });
        ctx.setLineDash([]);

        // Point
        ctx.fillStyle = "#eab308";
        ctx.beginPath(); ctx.arc(pP.x, pP.y, 5, 0, 2 * Math.PI); ctx.fill();
        ctx.fillText(`P (${pX.toFixed(1)}, ${pY.toFixed(1)})`, pP.x + 8, pP.y - 8);

        // Hyperbolic subtraction property |PF1 - PF2| = 2a
        const dist1 = Math.sqrt(Math.pow(pX - mathValues.foci[0].x, 2) + Math.pow(pY - mathValues.foci[0].y, 2));
        const dist2 = Math.sqrt(Math.pow(pX - mathValues.foci[1].x, 2) + Math.pow(pY - mathValues.foci[1].y, 2));
        ctx.fillStyle = "#cbd5e1";
        ctx.fillText(`|PF₁ - PF₂| = 2a = ${(2 * a).toFixed(1)} (ថេរ)`, pC.x - 60, centerY + 130);
      }

      ctx.shadowBlur = 0;
    }

    // --- DRAW 3. REAL-WORLD APPLICATIONS (INFOGRAPHIC CONVERTER) ---
    else if (state.appMode === "realworld") {
      // Background space aesthetic
      ctx.fillStyle = "rgba(15, 23, 42, 0.4)";

      switch (state.selectedApp) {
        case "wheel": {
          // Circle Wheel application
          const radius = 90 * zoom;
          const wCenterX = centerX;
          const wCenterY = centerY - 15;

          // Drawing wheel body
          ctx.strokeStyle = "#475569";
          ctx.lineWidth = 8;
          ctx.beginPath();
          ctx.arc(wCenterX, wCenterY, radius, 0, 2 * Math.PI);
          ctx.stroke();

          // Outer tire rubber
          ctx.strokeStyle = "#1e293b";
          ctx.lineWidth = 18;
          ctx.beginPath();
          ctx.arc(wCenterX, wCenterY, radius + 10, 0, 2 * Math.PI);
          ctx.stroke();

          // Wheel treads (lines on wheel to show rotation)
          ctx.strokeStyle = "rgba(255, 255, 255, 0.15)";
          ctx.lineWidth = 4;
          for (let a = 0; a < 360; a += 30) {
            const rad = ((a + animTime * 45) * Math.PI) / 180;
            const x1 = wCenterX + (radius + 5) * Math.cos(rad);
            const y1 = wCenterY + (radius + 5) * Math.sin(rad);
            const x2 = wCenterX + (radius + 17) * Math.cos(rad);
            const y2 = wCenterY + (radius + 17) * Math.sin(rad);
            ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke();
          }

          // Wheel spokes
          ctx.strokeStyle = "#94a3b8";
          ctx.lineWidth = 2.5;
          for (let a = 0; a < 360; a += 45) {
            const rad = ((a + animTime * 45) * Math.PI) / 180;
            ctx.beginPath();
            ctx.moveTo(wCenterX, wCenterY);
            ctx.lineTo(wCenterX + radius * Math.cos(rad), wCenterY + radius * Math.sin(rad));
            ctx.stroke();
          }

          // Center Hub
          ctx.fillStyle = "#f1f5f9";
          ctx.beginPath(); ctx.arc(wCenterX, wCenterY, 18, 0, 2 * Math.PI); ctx.fill();
          ctx.strokeStyle = "#64748b"; ctx.lineWidth = 3; ctx.stroke();

          // Velocity vector (tangential) and centripetal acceleration vector (cyan/red)
          const angleRad = (animTime * 45 * Math.PI) / 180;
          const rimX = wCenterX + radius * Math.cos(angleRad);
          const rimY = wCenterY + radius * Math.sin(angleRad);

          // Tangential Velocity Vector
          const velX = rimX + 65 * Math.cos(angleRad + Math.PI / 2);
          const velY = rimY + 65 * Math.sin(angleRad + Math.PI / 2);
          ctx.strokeStyle = "#06b6d4"; ctx.lineWidth = 3;
          ctx.beginPath(); ctx.moveTo(rimX, rimY); ctx.lineTo(velX, velY); ctx.stroke();
          // Arrow head
          const velAngle = angleRad + Math.PI / 2;
          ctx.fillStyle = "#06b6d4";
          ctx.beginPath();
          ctx.moveTo(velX, velY);
          ctx.lineTo(velX - 10 * Math.cos(velAngle - 0.4), velY - 10 * Math.sin(velAngle - 0.4));
          ctx.lineTo(velX - 10 * Math.cos(velAngle + 0.4), velY - 10 * Math.sin(velAngle + 0.4));
          ctx.fill();

          // Centripetal Acceleration Vector (pointing inward to center)
          ctx.strokeStyle = "#ef4444"; ctx.lineWidth = 2.2;
          ctx.beginPath(); ctx.moveTo(rimX, rimY); ctx.lineTo(wCenterX, wCenterY); ctx.stroke();

          ctx.fillStyle = "#06b6d4";
          ctx.font = "bold 11px sans-serif";
          ctx.fillText("ល្បឿនខ្សែកោង (Tangential Velocity v)", velX - 45, velY - 10);
          ctx.fillStyle = "#ef4444";
          ctx.fillText("សន្ទុះចូលផ្ចិត (Centripetal Acceleration a_c)", (rimX + wCenterX)/2 - 30, (rimY + wCenterY)/2 - 5);
          break;
        }

        case "orbit_circle": {
          // Circular orbit around Earth
          const earthR = 52;
          const orbitR = 125 * zoom;

          // Draw Earth at center
          const earthGrad = ctx.createRadialGradient(centerX - 10, centerY - 10, 5, centerX, centerY, earthR);
          earthGrad.addColorStop(0, "#38bdf8");
          earthGrad.addColorStop(0.4, "#0284c7");
          earthGrad.addColorStop(0.9, "#0f172a");
          ctx.fillStyle = earthGrad;
          ctx.beginPath(); ctx.arc(centerX, centerY, earthR, 0, 2 * Math.PI); ctx.fill();

          // Orbit Line
          ctx.strokeStyle = "rgba(56, 189, 248, 0.25)";
          ctx.lineWidth = 1;
          ctx.setLineDash([4, 4]);
          ctx.beginPath(); ctx.arc(centerX, centerY, orbitR, 0, 2 * Math.PI); ctx.stroke();
          ctx.setLineDash([]);

          // Satellite animated position
          const sRad = animTime;
          const satX = centerX + orbitR * Math.cos(sRad);
          const satY = centerY + orbitR * Math.sin(sRad);

          // Draw Satellite
          ctx.fillStyle = "#94a3b8";
          ctx.beginPath(); ctx.arc(satX, satY, 6, 0, 2 * Math.PI); ctx.fill();
          // solar panels
          ctx.strokeStyle = "#0ea5e9"; ctx.lineWidth = 3;
          ctx.beginPath();
          ctx.moveTo(satX - 14 * Math.cos(sRad + Math.PI/2), satY - 14 * Math.sin(sRad + Math.PI/2));
          ctx.lineTo(satX + 14 * Math.cos(sRad + Math.PI/2), satY + 14 * Math.sin(sRad + Math.PI/2));
          ctx.stroke();

          // Velocity Vector
          const vx = satX - 50 * Math.sin(sRad);
          const vy = satY + 50 * Math.cos(sRad);
          ctx.strokeStyle = "#06b6d4"; ctx.lineWidth = 2.5;
          ctx.beginPath(); ctx.moveTo(satX, satY); ctx.lineTo(vx, vy); ctx.stroke();

          // Gravity pull vector
          ctx.strokeStyle = "#ef4444"; ctx.lineWidth = 2.2;
          ctx.beginPath(); ctx.moveTo(satX, satY); ctx.lineTo(centerX, centerY); ctx.stroke();

          ctx.fillStyle = "#fff";
          ctx.font = "bold 11px sans-serif";
          ctx.fillText("ផែនដី (Earth)", centerX - 30, centerY + 4);
          ctx.fillStyle = "#06b6d4";
          ctx.fillText("ល្បឿន v (Orbital Velocity)", vx + 8, vy);
          ctx.fillStyle = "#ef4444";
          ctx.fillText("កម្លាំងទាញ F_g", (satX + centerX)/2 - 15, (satY + centerY)/2 - 5);
          break;
        }

        case "planetary": {
          // Elliptical planetary orbit around the Sun at Focus 1
          const orbit_a = 150 * zoom;
          const orbit_b = 95 * zoom;
          // semi-major, semi-minor
          const c = Math.sqrt(orbit_a * orbit_a - orbit_b * orbit_b);

          // Focus 1 (Sun offset from center by c)
          const sunX = centerX + c;
          const sunY = centerY;

          // Draw orbit ellipse path
          ctx.strokeStyle = "rgba(249, 115, 22, 0.25)";
          ctx.lineWidth = 1.2;
          ctx.beginPath();
          ctx.ellipse(centerX, centerY, orbit_a, orbit_b, 0, 0, 2 * Math.PI);
          ctx.stroke();

          // Draw Sun at focus
          ctx.beginPath();
          const sunGrad = ctx.createRadialGradient(sunX, sunY, 3, sunX, sunY, 26);
          sunGrad.addColorStop(0, "#fffbeb");
          sunGrad.addColorStop(0.3, "#f59e0b");
          sunGrad.addColorStop(0.8, "#ea580c");
          sunGrad.addColorStop(1, "transparent");
          ctx.fillStyle = sunGrad;
          ctx.arc(sunX, sunY, 26, 0, 2 * Math.PI);
          ctx.fill();

          // Kepler's second law equal-area sweep segment representation
          // Calculate planet angle in ellipse based on animTime
          // Kepler speed helper (faster when closer to sun)
          const theta = animTime;
          // Radius vector from Sun to planet
          // Parametric coordinates of planet relative to ellipse center
          const pX_rel = orbit_a * Math.cos(theta);
          const pY_rel = orbit_b * Math.sin(theta);
          const pX = centerX + pX_rel;
          const pY = centerY + pY_rel;

          // Sweep lines
          ctx.strokeStyle = "rgba(245, 158, 11, 0.12)";
          ctx.fillStyle = "rgba(245, 158, 11, 0.05)";
          ctx.beginPath();
          ctx.moveTo(sunX, sunY);
          // sweep area
          for (let th = theta - 0.25; th <= theta + 0.25; th += 0.05) {
            ctx.lineTo(centerX + orbit_a * Math.cos(th), centerY + orbit_b * Math.sin(th));
          }
          ctx.closePath();
          ctx.fill();
          ctx.stroke();

          // Draw Planet
          ctx.fillStyle = "#3b82f6";
          ctx.beginPath(); ctx.arc(pX, pY, 7.5, 0, 2 * Math.PI); ctx.fill();
          ctx.strokeStyle = "#fff"; ctx.lineWidth = 1; ctx.stroke();

          // Direction vector (Gravity pull)
          ctx.strokeStyle = "#ef4444"; ctx.lineWidth = 1.8;
          ctx.beginPath(); ctx.moveTo(pX, pY); ctx.lineTo(sunX, sunY); ctx.stroke();

          // Text metrics
          ctx.fillStyle = "#fbbf24";
          ctx.font = "bold 11px sans-serif";
          ctx.fillText("ព្រះអាទិត្យ (Sun) ចំកំណុំ Focus", sunX - 60, sunY - 32);
          ctx.fillStyle = "#3b82f6";
          ctx.fillText("ភព (Planet) គន្លងអេលីប", pX + 12, pY - 5);
          break;
        }

        case "whispering": {
          // Elliptical Whispering Gallery sound reflection
          const a = 145 * zoom;
          const b = 100 * zoom;
          const c = Math.sqrt(a * a - b * b);

          const f1x = centerX - c;
          const f2x = centerX + c;
          const fY = centerY;

          // Draw elliptic dome outline
          ctx.strokeStyle = "rgba(139, 92, 246, 0.6)"; // Violet
          ctx.lineWidth = 4;
          ctx.beginPath();
          ctx.ellipse(centerX, centerY, a, b, 0, 0, 2 * Math.PI);
          ctx.stroke();

          // Translucen background dome
          ctx.fillStyle = "rgba(139, 92, 246, 0.03)";
          ctx.beginPath(); ctx.ellipse(centerX, centerY, a, b, 0, 0, 2 * Math.PI); ctx.fill();

          // Foci (People whispering and listening)
          ctx.fillStyle = "#10b981"; // Person 1
          ctx.beginPath(); ctx.arc(f1x, fY, 6, 0, 2 * Math.PI); ctx.fill();
          ctx.fillText("👤 អ្នកខ្សឹប (F1)", f1x - 30, fY - 12);

          ctx.fillStyle = "#06b6d4"; // Person 2
          ctx.beginPath(); ctx.arc(f2x, fY, 6, 0, 2 * Math.PI); ctx.fill();
          ctx.fillText("👤 អ្នកស្តាប់ (F2)", f2x - 30, fY - 12);

          // Animated sound waves
          const waveProgress = (animTime / (Math.PI * 2)); // 0 to 1
          const numRays = 8;
          
          ctx.lineWidth = 1.3;
          ctx.strokeStyle = "rgba(139, 92, 246, 0.4)";

          for (let i = 0; i < numRays; i++) {
            // angle of sound ray emitting from f1
            const angle = (i / numRays) * Math.PI * 2;
            
            // Vector from focus 1: fx = f1x + r cos, fy = fY + r sin
            // Solve for intersection with ellipse: (x/a)^2 + (y/b)^2 = 1
            // Let x = f1x + r cos, y = fY + r sin
            // This yields a quadratic in r. Let's approximate or compute carefully
            // Standard analytical intersection:
            const cos = Math.cos(angle);
            const sin = Math.sin(angle);
            // solve ( (f1x + r cos)/a )^2 + ( (r sin)/b )^2 = 1
            // (f1x/a + r cos/a)^2 + r^2 sin^2/b^2 = 1
            // r^2 (cos^2/a^2 + sin^2/b^2) + r (2 f1x cos / a^2) + (f1x^2/a^2 - 1) = 0
            const A_quad = (cos*cos)/(a*a) + (sin*sin)/(b*b);
            const B_quad = (2 * f1x * cos) / (a*a);
            const C_quad = (f1x*f1x)/(a*a) - 1;
            const disc = B_quad*B_quad - 4*A_quad*C_quad;
            if (disc >= 0) {
              const r_int = (-B_quad + Math.sqrt(disc)) / (2 * A_quad);
              
              // Intersection point with dome
              const ix = f1x + r_int * cos;
              const iy = fY + r_int * sin;

              // Sound ray travels from F1 to Dome to F2
              const pathPart1X = f1x + (ix - f1x) * Math.min(1, waveProgress * 2);
              const pathPart1Y = fY + (iy - fY) * Math.min(1, waveProgress * 2);

              ctx.beginPath();
              ctx.moveTo(f1x, fY);
              ctx.lineTo(pathPart1X, pathPart1Y);
              ctx.stroke();

              if (waveProgress > 0.5) {
                const subProg = (waveProgress - 0.5) * 2; // 0 to 1
                const pathPart2X = ix + (f2x - ix) * subProg;
                const pathPart2Y = iy + (fY - iy) * subProg;

                ctx.strokeStyle = "rgba(6, 182, 212, 0.4)";
                ctx.beginPath();
                ctx.moveTo(ix, iy);
                ctx.lineTo(pathPart2X, pathPart2Y);
                ctx.stroke();
              }
            }
          }

          ctx.fillStyle = "#8b5cf6";
          ctx.font = "bold 10px sans-serif";
          ctx.fillText("រលកសម្លេងឆ្លុះប្រមូលផ្តុំចំកំណុំយ៉ាងត្រឹមត្រូវបំផុត", centerX - 100, centerY + b + 22);
          break;
        }

        case "satellite": {
          // Satellite dish reflection (incoming parallel space waves converging at Focus)
          const focalP = 42;
          const dishWidth = 180 * zoom;

          // Plot parabolic dish
          ctx.strokeStyle = "#94a3b8"; ctx.lineWidth = 4;
          ctx.beginPath();
          for (let x = -dishWidth/2; x <= dishWidth/2; x += 3) {
            // y = x^2 / 4p
            const y = (x * x) / (4 * focalP);
            // translate origin to centerX, centerY + 50
            if (x === -dishWidth/2) ctx.moveTo(centerX + x, centerY + 80 - y);
            else ctx.lineTo(centerX + x, centerY + 80 - y);
          }
          ctx.stroke();

          // Draw focus receiver horn at Focus (centerX, centerY + 80 - focalP)
          const fX = centerX;
          const fY = centerY + 80 - focalP;
          
          ctx.strokeStyle = "#ef4444"; ctx.lineWidth = 2.5;
          ctx.beginPath(); ctx.moveTo(centerX, centerY + 80); ctx.lineTo(fX, fY); ctx.stroke();
          ctx.fillStyle = "#ef4444";
          ctx.beginPath(); ctx.arc(fX, fY, 8, 0, 2 * Math.PI); ctx.fill();
          ctx.fillText("📡 គ្រឿងទទួល (F)", fX + 12, fY - 2);

          // Animate incoming parallel electromagnetic rays
          const rayTime = (animTime % Math.PI) / Math.PI; // 0 to 1
          const stepRays = 6;
          
          ctx.strokeStyle = "rgba(56, 189, 248, 0.65)"; ctx.lineWidth = 1.3;
          for (let i = -stepRays/2; i <= stepRays/2; i++) {
            if (i === 0) continue;
            const xPos = i * (dishWidth / stepRays) * 0.9;
            const domeY = (xPos * xPos) / (4 * focalP);
            const dishY = centerY + 80 - domeY;

            // Raw incoming ray from deep space down to dish
            const startY = centerY - 130;
            const currentY = startY + (dishY - startY) * Math.min(1, rayTime * 1.5);
            
            ctx.beginPath();
            ctx.moveTo(centerX + xPos, startY);
            ctx.lineTo(centerX + xPos, currentY);
            ctx.stroke();

            // Reflected ray path from Dish back to Focus receiver
            if (rayTime > 0.66) {
              const reflectProg = (rayTime - 0.66) * 3; // 0 to 1
              const rx = centerX + xPos + (fX - (centerX + xPos)) * reflectProg;
              const ry = dishY + (fY - dishY) * reflectProg;

              ctx.strokeStyle = "rgba(239, 68, 68, 0.6)";
              ctx.beginPath();
              ctx.moveTo(centerX + xPos, dishY);
              ctx.lineTo(rx, ry);
              ctx.stroke();
            }
          }

          ctx.fillStyle = "#fff";
          ctx.fillText("រស្មីរលកសញ្ញាពីទីអវកាស (Incoming Parallel Signals)", centerX - 120, centerY - 145);
          break;
        }

        case "headlight": {
          // Car headlight (Focus light emitting parallel rays out)
          const focalP = 35;
          const dishWidth = 140 * zoom;

          // Draw Parabolic reflector
          ctx.strokeStyle = "#475569"; ctx.lineWidth = 5;
          ctx.beginPath();
          for (let y = -dishWidth/2; y <= dishWidth/2; y += 3) {
            // x = y^2 / 4p
            const x = (y * y) / (4 * focalP);
            // we place vertex at centerX - 50
            if (y === -dishWidth/2) ctx.moveTo(centerX - 80 + x, centerY + y);
            else ctx.lineTo(centerX - 80 + x, centerY + y);
          }
          ctx.stroke();

          // Light source bulb at Focus
          const fX = centerX - 80 + focalP;
          const fY = centerY;

          // Glowing background gradient for bulb
          const glowG = ctx.createRadialGradient(fX, fY, 2, fX, fY, 22);
          glowG.addColorStop(0, "#fff");
          glowG.addColorStop(0.35, "rgba(253, 224, 71, 0.8)");
          glowG.addColorStop(1, "transparent");
          ctx.fillStyle = glowG;
          ctx.beginPath(); ctx.arc(fX, fY, 22, 0, 2 * Math.PI); ctx.fill();

          ctx.fillStyle = "#eab308";
          ctx.beginPath(); ctx.arc(fX, fY, 6, 0, 2 * Math.PI); ctx.fill();
          ctx.strokeStyle = "#fff"; ctx.lineWidth = 1; ctx.stroke();
          ctx.fillText("💡 អំពូលពន្លឺចំ Focus (F)", fX - 35, fY - 14);

          // Rays emitting out of Focus to reflector, and bouncing forward in parallel lines
          const rayTime = (animTime % Math.PI) / Math.PI;
          const numRays = 10;
          ctx.strokeStyle = "rgba(253, 224, 71, 0.65)"; ctx.lineWidth = 1.4;

          for (let i = 0; i < numRays; i++) {
            const angle = Math.PI - 1.25 + (i / numRays) * 2.5; // fan out towards parabolic shell
            const cos = Math.cos(angle);
            const sin = Math.sin(angle);

            // Distance to intersection with x = y^2 / 4p + (centerX-80)
            // relative: r cos = y^2/4p => r cos = r^2 sin^2 / 4p => r = 4p cos / sin^2
            // Let's solve analytically for line: x = fX + r cos, y = fY + r sin
            // Intersect with x = (y-fY)^2/4p + (centerX-80) => fX + r cos = r^2 sin^2/4p + fX - p
            // r^2 sin^2/4p - r cos - p = 0
            const A = (sin*sin)/(4*focalP);
            const B = -cos;
            const C = -focalP;
            const disc = B*B - 4*A*C;
            if (disc >= 0 && Math.abs(sin) > 0.01) {
              const r_int = (-B + Math.sqrt(disc)) / (2 * A);
              const ix = fX + r_int * cos;
              const iy = fY + r_int * sin;

              // Emitting ray
              const curX = fX + (ix - fX) * Math.min(1, rayTime * 1.5);
              const curY = fY + (iy - fY) * Math.min(1, rayTime * 1.5);
              ctx.beginPath();
              ctx.moveTo(fX, fY);
              ctx.lineTo(curX, curY);
              ctx.stroke();

              // Reflected parallel straight ray shooting to the right (parallel to axis)
              if (rayTime > 0.66) {
                const reflX = ix + 180 * (rayTime - 0.66) * 3;
                ctx.beginPath();
                ctx.moveTo(ix, iy);
                ctx.lineTo(reflX, iy);
                ctx.stroke();
              }
            }
          }

          ctx.fillStyle = "#eab308";
          ctx.fillText("កាំរស្មីពន្លឺស្របគ្នាត្រង់ទៅមុខ (Parallel Headlight Beams)", centerX + 60, centerY - 65);
          break;
        }

        case "projectile": {
          // Projectile Parabolic motion
          const pAngle = 45; // degrees
          const pVel = 14;
          const pGravity = 9.81;

          // Plot standard ground
          ctx.strokeStyle = "rgba(100, 116, 139, 0.4)"; ctx.lineWidth = 2;
          ctx.beginPath(); ctx.moveTo(centerX - 240, centerY + 100); ctx.lineTo(centerX + 240, centerY + 100); ctx.stroke();

          // Standard kinematic equations to compute points
          // y = x * tan(theta) - g * x^2 / (2 * v^2 * cos^2(theta))
          const startX = centerX - 200;
          const startY = centerY + 100;

          const rad = (pAngle * Math.PI) / 180;
          const cos = Math.cos(rad);
          const sin = Math.sin(rad);

          // Render trajectory path
          ctx.strokeStyle = "rgba(16, 185, 129, 0.3)"; ctx.lineWidth = 1.5;
          ctx.setLineDash([4, 4]);
          ctx.beginPath();
          const scaleMult = 24;
          let landingX = 0;

          for (let px_coord = 0; px_coord < 25; px_coord += 0.2) {
            const h_dist = px_coord;
            const v_dist = h_dist * Math.tan(rad) - (pGravity * h_dist * h_dist) / (2 * pVel * pVel * cos * cos);
            const drawX = startX + h_dist * scaleMult;
            const drawY = startY - v_dist * scaleMult;

            if (drawY > startY) {
              landingX = drawX;
              break;
            }
            if (px_coord === 0) ctx.moveTo(drawX, drawY);
            else ctx.lineTo(drawX, drawY);
          }
          ctx.stroke();
          ctx.setLineDash([]);

          // Animated ball on trajectory
          const timeProgress = (animTime % (Math.PI * 2)) / (Math.PI * 2); // 0 to 1
          const maxTime = (2 * pVel * sin) / pGravity; // total flying time
          const currentT = timeProgress * maxTime;

          const curH = pVel * cos * currentT;
          const curV = pVel * sin * currentT - 0.5 * pGravity * currentT * currentT;

          const ballX = startX + curH * scaleMult;
          const ballY = startY - curV * scaleMult;

          if (ballY <= startY) {
            // Draw basket launcher
            ctx.fillStyle = "#334155";
            ctx.fillRect(startX - 12, startY - 20, 24, 20);

            // Ball shadow projection on ground
            ctx.fillStyle = "rgba(0, 0, 0, 0.25)";
            ctx.beginPath(); ctx.ellipse(ballX, startY, 7, 2, 0, 0, 2 * Math.PI); ctx.fill();

            // Draw glowing projectile
            ctx.fillStyle = "#10b981";
            ctx.beginPath(); ctx.arc(ballX, ballY, 8, 0, 2 * Math.PI); ctx.fill();
            ctx.strokeStyle = "#fff"; ctx.lineWidth = 1.5; ctx.stroke();

            // Velocity vector at current position
            const vx_now = pVel * cos;
            const vy_now = pVel * sin - pGravity * currentT;
            const angle_now = Math.atan2(-vy_now, vx_now);

            ctx.strokeStyle = "#0ea5e9"; ctx.lineWidth = 2;
            const vecLen = 40;
            ctx.beginPath();
            ctx.moveTo(ballX, ballY);
            ctx.lineTo(ballX + vecLen * Math.cos(angle_now), ballY + vecLen * Math.sin(angle_now));
            ctx.stroke();
          }

          ctx.fillStyle = "#fff";
          ctx.font = "bold 11px sans-serif";
          ctx.fillText("គន្លងវត្ថុហោះប៉ារ៉ាបូល (Parabolic Projectile Trajectory)", startX + 20, startY - 140);
          break;
        }

        case "flyby": {
          // Hyperbolic planetary gravity assist flyby deflection
          const fly_a = 52 * zoom;
          const fly_b = 68 * zoom;

          // Planet at focus F1
          const c = Math.sqrt(fly_a * fly_a + fly_b * fly_b);
          const planetX = centerX + c - 30;
          const planetY = centerY;

          // Draw Jupiter / planet
          const pGrad = ctx.createRadialGradient(planetX - 8, planetY - 8, 3, planetX, planetY, 32);
          pGrad.addColorStop(0, "#f87171"); // orangeish red
          pGrad.addColorStop(0.5, "#dc2626");
          pGrad.addColorStop(0.95, "#450a0a");
          ctx.fillStyle = pGrad;
          ctx.beginPath(); ctx.arc(planetX, planetY, 32, 0, 2 * Math.PI); ctx.fill();

          // Planet atmospheric rings
          ctx.strokeStyle = "rgba(239, 68, 68, 0.3)"; ctx.lineWidth = 1.5;
          ctx.beginPath(); ctx.ellipse(planetX, planetY, 44, 15, -0.2, 0, 2 * Math.PI); ctx.stroke();

          // Hyperbola path: x = h + a cosh(t), y = b sinh(t) (relative to center)
          // Let hyperbola center be at centerX - 30
          const h_center = centerX - 35;
          
          ctx.strokeStyle = "rgba(244, 63, 94, 0.3)"; ctx.lineWidth = 1.5;
          ctx.setLineDash([4, 4]);
          ctx.beginPath();
          for (let i = 0; i < 100; i++) {
            const t = ((i / 100) - 0.5) * 5.2; // range
            const px = h_center + fly_a * Math.cosh(t);
            const py = centerY + fly_b * Math.sinh(t);
            if (i === 0) ctx.moveTo(px, py);
            else ctx.lineTo(px, py);
          }
          ctx.stroke();
          ctx.setLineDash([]);

          // Animated probe hoving along path
          const t_anim = ((animTime / (Math.PI*2)) - 0.5) * 4.6; // -2.3 to +2.3
          const probeX = h_center + fly_a * Math.cosh(t_anim);
          const probeY = centerY + fly_b * Math.sinh(t_anim);

          // Draw probe
          ctx.fillStyle = "#fbbf24";
          ctx.beginPath(); ctx.arc(probeX, probeY, 5, 0, 2 * Math.PI); ctx.fill();
          ctx.strokeStyle = "#fff"; ctx.lineWidth = 1; ctx.stroke();

          // Gravitational pull vector from Jupiter
          ctx.strokeStyle = "#ef4444"; ctx.lineWidth = 1.8;
          ctx.beginPath(); ctx.moveTo(probeX, probeY); ctx.lineTo(planetX, planetY); ctx.stroke();

          // Space probe velocity vector (tangent to hyperbola)
          const dx_dt = fly_a * Math.sinh(t_anim);
          const dy_dt = fly_b * Math.cosh(t_anim);
          const v_angle = Math.atan2(dy_dt, dx_dt);

          ctx.strokeStyle = "#0ea5e9"; ctx.lineWidth = 2.2;
          ctx.beginPath();
          ctx.moveTo(probeX, probeY);
          ctx.lineTo(probeX + 45 * Math.cos(v_angle), probeY + 45 * Math.sin(v_angle));
          ctx.stroke();

          ctx.fillStyle = "#fff";
          ctx.font = "bold 11px sans-serif";
          ctx.fillText("ភពយក្ស Jupiter (Focus F)", planetX - 60, planetY - 42);
          ctx.fillStyle = "#0ea5e9";
          ctx.fillText("ល្បឿនយានកើនឡើងខ្ពស់ (Gravity Assist v)", probeX + 10, probeY - 10);
          break;
        }

        case "shockwave": {
          // Supersonic Shockwaves sonic boom hyperbola
          const jetX = centerX + 180 * Math.cos(animTime) * 0.7;
          const jetY = centerY - 55;

          // Draw ground line
          const groundY = centerY + 90;
          ctx.strokeStyle = "#64748b"; ctx.lineWidth = 3;
          ctx.beginPath(); ctx.moveTo(centerX - 240, groundY); ctx.lineTo(centerX + 240, groundY); ctx.stroke();

          // Suppress noise / Draw supersonic jet
          ctx.fillStyle = "#f1f5f9";
          ctx.beginPath();
          ctx.moveTo(jetX, jetY);
          ctx.lineTo(jetX - 25, jetY - 8);
          ctx.lineTo(jetX - 22, jetY);
          ctx.lineTo(jetX - 30, jetY + 6);
          ctx.closePath();
          ctx.fill();

          // Draw Mach cone expanding (hyperbolic shape touching ground)
          // Intersection of a sphere (sound propagation) and plane/line of flight
          ctx.strokeStyle = "rgba(239, 68, 68, 0.4)"; ctx.lineWidth = 2;
          ctx.setLineDash([3, 3]);

          // Sound origin circles
          for (let s = 1; s <= 4; s++) {
            const delayDist = s * 45;
            const r_circ = delayDist * 1.35; // Mach number > 1
            ctx.beginPath();
            ctx.arc(jetX - delayDist, jetY, r_circ, 0, 2 * Math.PI);
            ctx.stroke();
          }
          ctx.setLineDash([]);

          // Hyperbola intersection line on ground
          const MachAngle = 32 * Math.PI / 180;
          const slope = Math.tan(MachAngle);

          // Draw shockwave boundary line
          ctx.strokeStyle = "#ef4444"; ctx.lineWidth = 2.5;
          ctx.beginPath();
          ctx.moveTo(jetX, jetY);
          // Left hyperbolic boundary lines hitting ground
          ctx.lineTo(jetX - 160, jetY + 160 * slope);
          ctx.moveTo(jetX, jetY);
          ctx.lineTo(jetX - 160, jetY - 160 * slope);
          ctx.stroke();

          // Label
          ctx.fillStyle = "#fff";
          ctx.font = "bold 11px sans-serif";
          ctx.fillText("យន្តហោះល្បឿនលឿនជាងសម្លេង (Supersonic Flight)", jetX - 110, jetY - 22);
          ctx.fillStyle = "#ef4444";
          ctx.fillText("រលកសម្លេង Sonic Boom (Hyperbolic Envelope)", centerX - 120, groundY + 22);
          break;
        }

        case "loran": {
          // LORAN navigation: constant difference in distance from two stations creates hyperbolas
          const st1X = centerX - 120;
          const st2X = centerX + 120;
          const stY = centerY;

          // Draw station towers
          ctx.fillStyle = "#38bdf8";
          ctx.beginPath(); ctx.arc(st1X, stY, 7, 0, 2 * Math.PI); ctx.fill();
          ctx.fillText("📡 ស្ថានីយ A", st1X - 25, stY - 14);

          ctx.beginPath(); ctx.arc(st2X, stY, 7, 0, 2 * Math.PI); ctx.fill();
          ctx.fillText("📡 ស្ថានីយ B", st2X - 25, stY - 14);

          // Draw LORAN hyperbolic paths for different constant differences in distance
          ctx.lineWidth = 1.0;
          ctx.strokeStyle = "rgba(100, 116, 139, 0.25)";
          
          const aVals = [30, 60, 90];
          const bVal = 55;

          aVals.forEach((a_par) => {
            // Draw hyperbola branch
            for (let b = 0; b < 2; b++) {
              ctx.beginPath();
              const sign = b === 0 ? 1 : -1;
              for (let t = -1.8; t <= 1.8; t += 0.05) {
                const px = centerX + sign * a_par * Math.cosh(t);
                const py = centerY + bVal * Math.sinh(t);
                if (t === -1.8) ctx.moveTo(px, py);
                else ctx.lineTo(px, py);
              }
              ctx.stroke();
            }
          });

          // Moving ship on one of the hyperbolas
          // Choose a = 60
          const t_ship = Math.sin(animTime * 0.6) * 1.3;
          const shipX = centerX + 60 * Math.cosh(t_ship);
          const shipY = centerY + 55 * Math.sinh(t_ship);

          // Draw Ship
          ctx.fillStyle = "#eab308";
          ctx.fillRect(shipX - 10, shipY - 6, 20, 12);
          ctx.fillStyle = "#fff";
          ctx.beginPath();
          ctx.moveTo(shipX - 10, shipY - 6);
          ctx.lineTo(shipX + 4, shipY - 14);
          ctx.lineTo(shipX + 10, shipY - 6);
          ctx.closePath();
          ctx.fill();
          ctx.fillText("🚢 នាវាចរ", shipX - 22, shipY + 22);

          // Signal waves traveling from stations to ship
          const waveP = (animTime * 1.5) % 1.0;
          
          // distance from St1
          const d1 = Math.sqrt(Math.pow(shipX - st1X, 2) + Math.pow(shipY - stY, 2));
          const d2 = Math.sqrt(Math.pow(shipX - st2X, 2) + Math.pow(shipY - stY, 2));

          // Draw line paths
          ctx.strokeStyle = "rgba(56, 189, 248, 0.45)"; ctx.lineWidth = 1.2;
          ctx.setLineDash([2, 4]);
          ctx.beginPath(); ctx.moveTo(st1X, stY); ctx.lineTo(shipX, shipY); ctx.stroke();
          ctx.strokeStyle = "rgba(139, 92, 246, 0.45)";
          ctx.beginPath(); ctx.moveTo(st2X, stY); ctx.lineTo(shipX, shipY); ctx.stroke();
          ctx.setLineDash([]);

          // Signal propagation spheres
          ctx.strokeStyle = "#38bdf8"; ctx.lineWidth = 1;
          ctx.beginPath(); ctx.arc(st1X, stY, d1 * waveP, 0, 2 * Math.PI); ctx.stroke();
          ctx.strokeStyle = "#a855f7";
          ctx.beginPath(); ctx.arc(st2X, stY, d2 * waveP, 0, 2 * Math.PI); ctx.stroke();

          // Print constant delta distance calculation on canvas
          ctx.fillStyle = "#cbd5e1";
          ctx.font = "11px monospace";
          ctx.fillText(`|ចម្ងាយ d(A, Ship) - d(B, Ship)| = ថេរ`, centerX - 100, centerY + 130);
          break;
        }
      }
    }

  }, [state, rotation, zoom, animTime, mathValues]);

  // Handle container resizing correctly
  useEffect(() => {
    const handleResize = () => {
      const canvas = canvasRef.current;
      const container = containerRef.current;
      if (!canvas || !container) return;
      canvas.width = container.clientWidth;
      canvas.height = container.clientHeight;
    };

    handleResize();
    const observer = new ResizeObserver(handleResize);
    if (containerRef.current) observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  const handleSliderChange = (key: keyof ConicsSimState, val: number) => {
    onChange({ ...state, [key]: val });
  };

  const getConicName = () => {
    switch (state.mode) {
      case "circle": return "រង្វង់ (Circle)";
      case "ellipse": return "អេលីប (Ellipse)";
      case "parabola": return "ប៉ារ៉ាបូល (Parabola)";
      case "hyperbola": return "អ៊ីពែបូល (Hyperbola)";
    }
  };

  return (
    <div id="conics-sim-wrapper" className="flex flex-col h-full bg-slate-900/40 border border-white/10 rounded-2xl overflow-hidden backdrop-blur-md shadow-2xl animate-fade-in">
      
      {/* Simulation Header banner */}
      <div className="flex flex-wrap items-center justify-between px-6 py-4 bg-black/40 border-b border-white/10 gap-3">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-cyan-500/10 text-cyan-400 rounded-xl">
            <Layers className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-sm md:text-base font-bold text-white font-sans tracking-tight">
              ពិសោធន៍បន្ទាត់កោងកោនិក (Conic Sections Interactive Simulator)
            </h3>
            <p className="text-[10px] text-slate-400 uppercase tracking-wider font-mono">
              ស្វែងយល់ពីប្រសព្វរូបធរណីមាត្រ សមីការវិភាគ និងទម្រង់អនុវត្តក្នុងជីវភាពជាក់ស្តែង
            </p>
          </div>
        </div>
        <button
          id="btn-conics-explain"
          onClick={onExplainRequest}
          className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white rounded-xl text-xs font-semibold shadow-lg shadow-cyan-500/20 transition-all duration-200"
        >
          <HelpCircle className="w-4 h-4" />
          ពន្យល់រូបមន្តដោយគ្រូ AI
        </button>
      </div>

      {/* Simulator View Container */}
      <div ref={containerRef} className="flex-1 relative min-h-[350px] md:min-h-[440px] overflow-hidden bg-gradient-to-b from-[#060a12] to-black">
        {/* Ambient grids and glow overlays */}
        <div className="absolute inset-0 opacity-5 pointer-events-none" style={{ backgroundImage: "radial-gradient(circle at 1px 1px, #475569 1px, transparent 0)", backgroundSize: "32px 32px" }}></div>
        <div className="absolute top-1/3 left-1/3 w-96 h-96 bg-cyan-500/5 blur-[130px] rounded-full pointer-events-none"></div>
        <div className="absolute bottom-1/3 right-1/3 w-96 h-96 bg-purple-500/5 blur-[130px] rounded-full pointer-events-none"></div>

        {/* Dynamic information overlay */}
        <div className="absolute top-4 right-4 flex flex-col gap-1.5 z-10 text-right pointer-events-none bg-black/80 p-4 rounded-xl border border-white/10 backdrop-blur-md max-w-[240px]">
          <span className="text-[10px] font-bold text-cyan-400 uppercase tracking-wider">ព័ត៌មានផ្នែកកោនិក</span>
          <div className="text-sm font-bold text-white tracking-wide">
            {getConicName()}
          </div>
          {state.appMode === "math" ? (
            <div className="space-y-1 mt-1 text-left">
              <div className="text-[10px] text-slate-400 font-mono">
                 eccentricity (e) = <span className="text-yellow-400 font-semibold">{mathValues.eccentricity.toFixed(2)}</span>
              </div>
              <div className="text-[10px] text-slate-400 font-mono truncate">
                 h = <span className="text-cyan-400">{state.h.toFixed(1)}</span>, k = <span className="text-cyan-400">{state.k.toFixed(1)}</span>
              </div>
              <div className="text-[10px] text-slate-400 font-mono">
                 a = <span className="text-orange-400">{state.paramA.toFixed(1)}</span>{state.mode !== "circle" && state.mode !== "parabola" && (
                  <> , b = <span className="text-orange-400">{state.paramB.toFixed(1)}</span></>
                )}
              </div>
              <div className="h-[1px] bg-white/10 my-1.5"></div>
              <div className="text-[10px] text-cyan-300 font-mono bg-cyan-950/40 p-1.5 rounded border border-cyan-800/20 truncate">
                {mathValues.equation}
              </div>
            </div>
          ) : (
            <div className="text-left mt-1.5">
              <span className="text-[9px] bg-orange-500/20 text-orange-300 px-1.5 py-0.5 rounded border border-orange-500/30 uppercase tracking-wider font-semibold">
                កម្មវិធីអនុវត្ត
              </span>
              <p className="text-[11px] text-slate-300 mt-1 leading-relaxed">
                {applications[state.mode].find((app) => app.id === state.selectedApp)?.desc}
              </p>
            </div>
          )}
        </div>

        {/* Action Controls Inside Frame */}
        <div className="absolute bottom-4 left-4 flex flex-col gap-2 z-10">
          {state.appMode === "math" && state.is3d && (
            <div className="flex items-center gap-1.5 pointer-events-none bg-black/60 px-3 py-1.5 rounded-lg border border-white/5 text-[9px] text-slate-400 font-medium">
              <Move className="w-3.5 h-3.5 text-cyan-400" />
              <span>ចុចអូសលើរូប (Drag) ដើម្បីបង្វិលរូបធរណីមាត្រ 3D</span>
            </div>
          )}
          
          {state.appMode === "realworld" && (
            <div className="flex items-center gap-2 bg-black/85 p-1.5 rounded-xl border border-white/10 shadow-lg backdrop-blur-sm">
              <button
                onClick={() => setIsPlaying(!isPlaying)}
                className={`p-2 rounded-lg transition-all ${isPlaying ? "bg-red-500/20 text-red-400" : "bg-green-500/20 text-green-400"}`}
                title={isPlaying ? "ផ្អាក" : "ចាក់បញ្ចាំង"}
              >
                {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
              </button>
              <span className="text-[10px] text-slate-400 px-1 font-semibold uppercase tracking-wider">
                {isPlaying ? "កំពុងចាក់បញ្ចាំងចលនា" : "បានផ្អាកចលនា"}
              </span>
            </div>
          )}
        </div>

        <canvas 
          ref={canvasRef} 
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUpOrLeave}
          onMouseLeave={handleMouseUpOrLeave}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleMouseUpOrLeave}
          className={`absolute inset-0 w-full h-full block z-0 ${state.is3d && state.appMode === "math" ? "cursor-grab active:cursor-grabbing" : ""}`} 
        />
      </div>

      {/* Simulator Control Dashboard (Lower area) */}
      <div className="bg-black/60 backdrop-blur-xl border-t border-white/10 p-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* Column 1: Mode Selectors */}
          <div className="lg:col-span-4 flex flex-col justify-between gap-4 border-b lg:border-b-0 lg:border-r border-white/10 pb-6 lg:pb-0 lg:pr-6">
            <div>
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-2">ប្រភេទកោនិក (Conic Sections)</label>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { id: "circle", name: "រង្វង់ (Circle)", desc: "e = 0" },
                  { id: "ellipse", name: "អេលីប (Ellipse)", desc: "0 < e < 1" },
                  { id: "parabola", name: "ប៉ារ៉ាបូល (Parabola)", desc: "e = 1" },
                  { id: "hyperbola", name: "អ៊ីពែបូល (Hyperbola)", desc: "e > 1" }
                ].map((item) => {
                  const isSelected = state.mode === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => onChange({ ...state, mode: item.id as any })}
                      className={`flex flex-col items-start p-2 rounded-xl text-xs transition-all border ${
                        isSelected
                          ? "bg-cyan-500/20 text-cyan-300 border-cyan-500/40 font-bold shadow-inner"
                          : "bg-white/5 text-slate-400 border-transparent hover:bg-white/10"
                      }`}
                    >
                      <span>{item.name}</span>
                      <span className="text-[9px] text-slate-500 font-mono mt-0.5">{item.desc}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block">របៀបនៃការវិភាគ (Visualization)</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => onChange({ ...state, appMode: "math" })}
                  className={`flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl text-xs font-semibold border transition-all ${
                    state.appMode === "math"
                      ? "bg-yellow-500/20 text-yellow-300 border-yellow-500/40"
                      : "bg-white/5 text-slate-400 border-transparent hover:bg-white/10"
                  }`}
                >
                  <Compass className="w-3.5 h-3.5 text-yellow-400" />
                  ធរណីមាត្រគណិត
                </button>
                <button
                  onClick={() => onChange({ ...state, appMode: "realworld" })}
                  className={`flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl text-xs font-semibold border transition-all ${
                    state.appMode === "realworld"
                      ? "bg-orange-500/20 text-orange-300 border-orange-500/40 animate-pulse"
                      : "bg-white/5 text-slate-400 border-transparent hover:bg-white/10"
                  }`}
                >
                  <Zap className="w-3.5 h-3.5 text-orange-400" />
                  កម្មវិធីអនុវត្តជាក់ស្តែង
                </button>
              </div>
            </div>
          </div>

          {/* Column 2: Parameters and Sliders depending on appMode */}
          <div className="lg:col-span-8 flex flex-col gap-4">
            {state.appMode === "math" ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {/* Math settings Left Pane */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">របៀបបង្ហាញ</span>
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">ប៉ារ៉ាម៉ែត្ររាង (Shape scale a, b)</span>
                  </div>

                  {/* Dimension view toggle */}
                  <div className="grid grid-cols-2 gap-2 p-1 bg-slate-950/40 rounded-xl border border-white/5">
                    <button
                      onClick={() => onChange({ ...state, is3d: false })}
                      className={`py-1.5 rounded-lg text-xs font-semibold transition-all ${
                        !state.is3d ? "bg-cyan-500/25 text-cyan-300" : "text-slate-400 hover:text-white"
                      }`}
                    >
                      2D Graph View
                    </button>
                    <button
                      onClick={() => onChange({ ...state, is3d: true })}
                      className={`py-1.5 rounded-lg text-xs font-semibold transition-all ${
                        state.is3d ? "bg-cyan-500/25 text-cyan-300" : "text-slate-400 hover:text-white"
                      }`}
                    >
                      3D Cone Section
                    </button>
                  </div>

                  {state.is3d && (
                    <div className="flex items-center justify-between py-1 bg-slate-950/20 px-2 rounded border border-white/5 text-xs">
                      <span className="text-slate-400">បង្វិលស្វ័យប្រវត្ត (3D Auto Rotate)</span>
                      <button
                        onClick={() => setAutoRotate(!autoRotate)}
                        className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          autoRotate ? "bg-green-500/15 text-green-400" : "bg-slate-800 text-slate-400"
                        }`}
                      >
                        {autoRotate ? "បើក" : "បិទ"}
                      </button>
                    </div>
                  )}

                  {/* Slider a / Radius */}
                  <div className="space-y-1 mt-2">
                    <div className="flex justify-between text-xs text-slate-400">
                      <span>{state.mode === "circle" ? "កាំ R (Radius)" : "មេគុណមាត្រដ្ឋាន a"}</span>
                      <span className="font-mono text-cyan-400 font-bold">{state.paramA.toFixed(1)}</span>
                    </div>
                    <input
                      type="range"
                      min="1.5"
                      max="5.5"
                      step="0.1"
                      value={state.paramA}
                      onChange={(e) => handleSliderChange("paramA", parseFloat(e.target.value))}
                      className="w-full h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-500"
                    />
                  </div>

                  {/* Slider b (disabled for circle and parabola) */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs text-slate-400">
                      <span>មេគុណមាត្រដ្ឋាន b</span>
                      <span className="font-mono text-cyan-400 font-bold">
                        {state.mode === "circle" || state.mode === "parabola" ? "N/A" : state.paramB.toFixed(1)}
                      </span>
                    </div>
                    <input
                      type="range"
                      min="1.5"
                      max="5.5"
                      step="0.1"
                      disabled={state.mode === "circle" || state.mode === "parabola"}
                      value={state.paramB}
                      onChange={(e) => handleSliderChange("paramB", parseFloat(e.target.value))}
                      className="w-full h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-500 disabled:opacity-20 disabled:cursor-not-allowed"
                    />
                  </div>
                </div>

                {/* Math settings Right Pane (Offsets) */}
                <div className="space-y-3">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">
                    {state.mode === "parabola" ? "កូអរដោនេកំពូល V(h, k)" : "កូអរដោនេផ្ចិត C(h, k)"}
                  </span>

                  {/* Slider h (X offset of center) */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs text-slate-400">
                      <span>ទីតាំងអ័ក្សដេក h (Horizontal offset)</span>
                      <span className="font-mono text-yellow-400 font-bold">{state.h.toFixed(1)}</span>
                    </div>
                    <input
                      type="range"
                      min="-4.0"
                      max="4.0"
                      step="0.2"
                      disabled={state.is3d}
                      value={state.h}
                      onChange={(e) => handleSliderChange("h", parseFloat(e.target.value))}
                      className="w-full h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-yellow-500 disabled:opacity-25"
                    />
                  </div>

                  {/* Slider k (Y offset of center / plane height offset in 3D) */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs text-slate-400">
                      <span>{state.is3d ? "កម្ពស់ប្លង់កាត់ z_plane" : "ទីតាំងអ័ក្សឈរ k (Vertical offset)"}</span>
                      <span className="font-mono text-yellow-400 font-bold">{state.k.toFixed(1)}</span>
                    </div>
                    <input
                      type="range"
                      min="-4.0"
                      max="4.0"
                      step="0.2"
                      value={state.k}
                      onChange={(e) => handleSliderChange("k", parseFloat(e.target.value))}
                      className="w-full h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-yellow-500"
                    />
                  </div>

                  <div className="p-3 bg-slate-950/45 rounded-xl border border-white/5 text-[11px] text-slate-400 leading-relaxed space-y-1">
                    <div className="font-semibold text-white">និយមន័យកោនិក៖</div>
                    {state.mode === "circle" && "រង្វង់ គឺជាសំណុំចំនុចក្នុងប្លង់ដែលមានចម្ងាយស្មើគ្នាចំផ្ចិត C។"}
                    {state.mode === "ellipse" && "អេលីប គឺជាសំណុំចំនុចដែលមានផលបូកចម្ងាយទៅកាន់កំណុំពីរថេរ PF₁ + PF₂ = 2a។"}
                    {state.mode === "parabola" && "ប៉ារ៉ាបូល គឺជាសំណុំចំនុចដែលមានចម្ងាយពីកំណុំ F ស្មើចម្ងាយទៅបន្ទាត់ប្រាប់ទិស d(P,F) = d(P,D)។"}
                    {state.mode === "hyperbola" && "អ៊ីពែបូល គឺជាសំណុំចំនុចដែលមានផលសងចម្ងាយពីកំណុំពីរជាតម្លៃដាច់ខាតថេរ |PF₁ - PF₂| = 2a។"}
                  </div>
                </div>
              </div>
            ) : (
              // Real-world Applications parameters and selection
              <div className="flex flex-col gap-3 h-full justify-between">
                <div>
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-2">
                    ជ្រើសរើសការអនុវត្តជាក់ស្តែងសម្រាប់៖ {getConicName()}
                  </span>
                  <div className="flex flex-wrap gap-2">
                    {applications[state.mode].map((app) => (
                      <button
                        key={app.id}
                        onClick={() => onChange({ ...state, selectedApp: app.id })}
                        className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold transition-all border ${
                          state.selectedApp === app.id
                            ? "bg-orange-500/20 text-orange-300 border-orange-500/40 shadow-inner font-bold"
                            : "bg-white/5 text-slate-400 border-transparent hover:bg-white/10"
                        }`}
                      >
                        <Eye className="w-3.5 h-3.5 text-orange-400" />
                        {app.name}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="p-4 bg-gradient-to-r from-orange-500/10 to-transparent rounded-2xl border border-orange-500/15 text-xs text-slate-300 leading-relaxed">
                  <div className="font-bold text-orange-400 mb-1 flex items-center gap-1.5">
                    <CheckCircle className="w-4 h-4 text-orange-400" />
                    ការពន្យល់បែបវិទ្យាសាស្ត្រ (Scientific Explanation)
                  </div>
                  {state.selectedApp === "wheel" && (
                    "យន្តការកង់វិល (Wheel mechanism) ដំណើរការវិលជុំវិញអ័ក្សកណ្តាលបង្កើតបានជាចលនារង្វង់ নিখិល។ រាល់ចំនុចដែលនៅលើកង់ មានកាំ r ស្មើៗគ្នា ជួយរក្សាលំនឹង និងសម្រួលដល់ការកាត់បន្ថយកម្លាំងកកិតពេលវិលលើផ្លូវថ្នល់។"
                  )}
                  {state.selectedApp === "orbit_circle" && (
                    "ផ្កាយរណបធ្វើចលនាជុំវិញផែនដីតាមគន្លងរង្វង់ নিখិល (Circular orbit) នៅពេលដែលកម្លាំងទំនាញរបស់ផែនដី ស្មើនឹងកម្លាំង centrifugal ដែលជួយឱ្យផ្កាយរណបហោះហើរដោយមិនបាត់បង់ល្បឿន និងកម្ពស់។"
                  )}
                  {state.selectedApp === "planetary" && (
                    "ច្បាប់ទី១ របស់លោក Kepler ចែងថា គ្រប់គន្លងភពទាំងអស់វិលជុំវិញព្រះអាទិត្យតាមគន្លងរាងអេលីប (Elliptical orbit)។ ល្បឿនរបស់ភពនឹងប្រែប្រួលតាមចម្ងាយ៖ ភពនឹងដើរលឿនបំផុតត្រង់ចំនុច perihelion (ជិតបំផុត) និងយឺតបំផុតត្រង់ aphelion (ឆ្ងាយបំផុត)។"
                  )}
                  {state.selectedApp === "whispering" && (
                    "បន្ទប់ខ្សឹបអេលីប (Whispering gallery) ប្រើប្រាស់លក្ខណៈឆ្លុះរបស់អេលីប។ រលកសម្លេងខ្សឹបខ្សៀវដែលចាកចេញពីកំណុំម្ខាង (Focus F1) ប៉ះផ្ទៃជញ្ជាំង និងឆ្លុះត្រលប់ទៅប្រមូលផ្តុំផ្តុំគ្នាគ្នាចំកំណុំម្ខាងទៀត (Focus F2) យ៉ាងច្បាស់ ទោះជាស្ថិតនៅចម្ងាយឆ្ងាយក៏ដោយ។"
                  )}
                  {state.selectedApp === "satellite" && (
                    "ចានផ្កាយរណប (Satellite parabola dish) មានរូបរាងជាប៉ារ៉ាបូល។ រាល់រលកសញ្ញាដែលធ្វើដំណើរជាបន្ទាត់ស្របគ្នាមកពីទីអវកាស ពេលជះទង្គិចជាមួយចាននឹងឆ្លុះទៅជួបគ្នានៅចំនុចតែមួយចំកំណុំ (Focal receiver) ដែលជួយពង្រីកកម្លាំងរលកសញ្ញាបានយ៉ាងខ្លាំង។"
                  )}
                  {state.selectedApp === "headlight" && (
                    "ចង្កៀងបំភ្លឺមុខឡាន (Car Headlight) ប្រើប្រាស់គោលការណ៍បញ្ច្រាសរបស់ប៉ារ៉ាបូល។ នៅពេលដែលប្រភពពន្លឺ (អំពូល) ត្រូវបានដាក់ចំកំណុំ (Focus F) នោះរាល់កាំរស្មីពន្លឺទាំងអស់ដែលបញ្ចេញពីអំពូល នឹងជះប៉ះផ្ទៃឆ្លុះប៉ារ៉ាបូល រួចឆ្លុះទៅមុខជាខ្សែស្របត្រង់ និងឆ្ងាយ។"
                  )}
                  {state.selectedApp === "projectile" && (
                    "គន្លងគ្រាប់បោះ (Projectile motion) របស់វត្ថុដែលហោះក្នុងលំហអាកាស មានរាងជាប៉ារ៉ាបូល។ នេះគឺដោយសារវត្ថុមានល្បឿនថេរតាមទិសដេក (X) ប៉ុន្តែរងឥទ្ធិពលទំនាញផែនដី (Gravity) បង្កើតសន្ទុះថេរតាមទិសឈរ (Y)។"
                  )}
                  {state.selectedApp === "flyby" && (
                    "គន្លងឆ្វៀល کشាញផែនដី (Gravitational assist / flyby) របស់យានអវកាស ឬដុំកមែត មានទម្រង់ជាអ៊ីពែបូល។ ទំនាញដ៏ខ្លាំងរបស់ភពទាញយានឱ្យបង្កើនល្បឿនយ៉ាងលឿន រួចឆ្វៀលចេញពីភពអមដោយល្បឿនដ៏លឿនឆ្ពោះទៅកាន់ចក្រវាល។"
                  )}
                  {state.selectedApp === "shockwave" && (
                    "នៅពេលដែលយន្តហោះហោះហើរលឿនជាងល្បឿនសម្លេង (Supersonic speed) វានឹងបង្កើតរលកសម្លេងរាងកោនហៅថា Mach cone។ នៅពេលដែលកោននេះជះប៉ះផ្ទៃដីដេក វានឹងបង្កើតជាបន្ទាត់ប៉ះពាល់រាងអ៊ីពែបូល (Hyperbolic sonic boom curve)។"
                  )}
                  {state.selectedApp === "loran" && (
                    "ប្រព័ន្ធរ៉ាដានាវាចរណ៍ LORAN ដំណើរការដោយការគណនាផលសងពេលវេលាទទួលសញ្ញាពីស្ថានីយពីរ។ សំណុំចំនុចដែលមានផលសងចម្ងាយថេរពីស្ថានីយទាំងពីរ បង្កើតបានជាខ្សែអ៊ីពែបូល ដែលជួយនាវាកំណត់ទីតាំងបានយ៉ាងត្រឹមត្រូវ។"
                  )}
                </div>
              </div>
            )}
          </div>

        </div>
      </div>

    </div>
  );
}
