"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { RefObject } from "react";
import * as THREE from "three";
import { Canvas, useFrame, useThree } from "@react-three/fiber";

type Mode = "loading" | "webgl" | "static";

const GRID_X = 160;
const GRID_Z = 88; // 160 x 88 = 14,080 points
const GRID_HALF_X = 8;
const GRID_HALF_Z = 8;

const VERTEX_SHADER = /* glsl */ `
  precision highp float;

  attribute float aSeed;
  uniform float uTime;
  uniform vec2 uMouse;
  uniform float uPixelRatio;

  varying float vH;
  varying float vSeed;

  void main() {
    vec3 p = position;
    float x = p.x + uTime * 0.05;
    float z = p.z + uTime * 0.05;

    // Scaled so the peak displacement is about 0.6.
    float h = (sin(x * 0.9 + uTime * 0.8) * 0.45
            + sin(z * 0.7 - uTime * 0.6 + x * 0.2) * 0.35
            + sin((x + z) * 1.6 + uTime * 1.3) * 0.12) * 0.65;

    float d = distance(vec2(p.x, p.z), uMouse);
    float bulge = exp(-d * d * 0.5) * 0.35;

    vec3 pos = vec3(p.x, h + bulge, p.z);
    vec4 mv = modelViewMatrix * vec4(pos, 1.0);
    gl_Position = projectionMatrix * mv;

    // Size falls off with depth, with a floor of 2 device pixels.
    float size = 3.5 * uPixelRatio * (7.0 / -mv.z);
    gl_PointSize = max(size, 2.0 * uPixelRatio);

    vH = clamp(0.5 + (h + bulge) / 1.2, 0.0, 1.0);
    vSeed = aSeed;
  }
`;

const FRAGMENT_SHADER = /* glsl */ `
  precision highp float;

  uniform float uLight;

  varying float vH;
  varying float vSeed;

  void main() {
    float d = length(gl_PointCoord - 0.5);
    float a = 1.0 - smoothstep(0.0, 0.5, d);

    vec3 navy = vec3(0.043, 0.165, 0.333);
    vec3 teal = vec3(0.055, 0.624, 0.557);

    vec3 col = mix(navy, teal, vH);
    col = mix(col, teal, uLight * 0.5);

    float alpha = mix(0.35, 0.85, vH) * mix(1.0, 0.7, uLight) * (0.7 + 0.3 * vSeed);
    gl_FragColor = vec4(col, a * alpha);
  }
`;

function hasWebGL(): boolean {
  const probe = document.createElement("canvas");
  return Boolean(probe.getContext("webgl2") || probe.getContext("webgl"));
}

function isDarkTheme(): boolean {
  return document.documentElement.classList.contains("dark");
}

function createGrid(): THREE.BufferGeometry {
  const count = GRID_X * GRID_Z;
  const positions = new Float32Array(count * 3);
  const seeds = new Float32Array(count);
  let k = 0;

  for (let i = 0; i < GRID_X; i++) {
    for (let j = 0; j < GRID_Z; j++) {
      const x = -GRID_HALF_X + (i / (GRID_X - 1)) * GRID_HALF_X * 2;
      const z = -GRID_HALF_Z + (j / (GRID_Z - 1)) * GRID_HALF_Z * 2;
      positions[k * 3] = x;
      positions[k * 3 + 1] = 0;
      positions[k * 3 + 2] = z;
      seeds[k] = Math.random();
      k++;
    }
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute("aSeed", new THREE.BufferAttribute(seeds, 1));
  return geometry;
}

type SceneProps = {
  rootRef: RefObject<HTMLDivElement | null>;
};

function FlowScene({ rootRef }: SceneProps) {
  const gl = useThree((s) => s.gl);
  const camera = useThree((s) => s.camera);

  const materialRef = useRef<THREE.ShaderMaterial>(null);
  const mouseTarget = useRef(new THREE.Vector2());
  const lightRef = useRef(!isDarkTheme());

  const geometry = useMemo(() => createGrid(), []);
  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uMouse: { value: new THREE.Vector2() },
      uLight: { value: 0 },
      uPixelRatio: { value: 1 },
    }),
    [],
  );

  // Point the camera across the plane.
  useEffect(() => {
    camera.lookAt(0, -0.3, 0);
  }, [camera]);

  // Pointer and theme observers.
  useEffect(() => {
    const onPointerMove = (e: PointerEvent) => {
      const ndcX = (e.clientX / window.innerWidth) * 2 - 1;
      const ndcY = 1 - (e.clientY / window.innerHeight) * 2;
      // The top of the screen is the far edge, at negative z, so z = -ndcY * GRID_HALF_Z.
      mouseTarget.current.set(ndcX * GRID_HALF_X, -ndcY * GRID_HALF_Z);
    };

    const mo = new MutationObserver(() => {
      lightRef.current = !isDarkTheme();
    });
    mo.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    });

    window.addEventListener("pointermove", onPointerMove, { passive: true });

    return () => {
      mo.disconnect();
      window.removeEventListener("pointermove", onPointerMove);
    };
  }, [rootRef]);

  // Dispose GPU resources on unmount.
  useEffect(() => {
    return () => {
      geometry.dispose();
      materialRef.current?.dispose();
    };
  }, [geometry]);

  useFrame((_, delta) => {
    uniforms.uTime.value += Math.min(delta, 0.05);
    uniforms.uMouse.value.lerp(mouseTarget.current, 0.06);
    uniforms.uLight.value = lightRef.current ? 1 : 0;
    uniforms.uPixelRatio.value = gl.getPixelRatio();
  });

  return (
    <group>
      <points geometry={geometry}>
        <shaderMaterial
          ref={materialRef}
          vertexShader={VERTEX_SHADER}
          fragmentShader={FRAGMENT_SHADER}
          uniforms={uniforms}
          transparent
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </points>
    </group>
  );
}

export default function FlowField() {
  const rootRef = useRef<HTMLDivElement>(null);
  const [mode, setMode] = useState<Mode>("loading");
  // Drives the Canvas render loop: runs only while in view and the tab is visible.
  const [active, setActive] = useState(true);

  useEffect(() => {
    const motionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");

    const resolveMode = () => {
      setMode(motionQuery.matches || !hasWebGL() ? "static" : "webgl");
    };

    resolveMode();
    motionQuery.addEventListener("change", resolveMode);
    return () => motionQuery.removeEventListener("change", resolveMode);
  }, []);

  useEffect(() => {
    const root = rootRef.current;
    let inView = true;

    const sync = () => {
      setActive(inView && !document.hidden);
    };

    const io = new IntersectionObserver(
      ([entry]) => {
        inView = entry.isIntersecting;
        sync();
      },
      { threshold: 0 },
    );
    if (root) io.observe(root);

    document.addEventListener("visibilitychange", sync);
    sync();

    return () => {
      io.disconnect();
      document.removeEventListener("visibilitychange", sync);
    };
  }, []);

  return (
    <div ref={rootRef} className="absolute inset-0 h-full w-full" aria-hidden="true">
      {mode === "webgl" ? (
        <Canvas
          dpr={[1, 1.75]}
          gl={{ alpha: true, antialias: false, powerPreference: "high-performance" }}
          camera={{ position: [0, 1.6, 7], fov: 45 }}
          frameloop={active ? "always" : "never"}
        >
          <FlowScene rootRef={rootRef} />
        </Canvas>
      ) : mode === "static" ? (
        <div
          className="absolute inset-0 h-full w-full"
          style={{
            background:
              "radial-gradient(60% 50% at 30% 60%, rgba(14,159,142,0.22), transparent 70%), radial-gradient(50% 50% at 75% 40%, rgba(11,42,85,0.5), transparent 70%)",
          }}
        />
      ) : null}
    </div>
  );
}
