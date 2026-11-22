"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import { Canvas, useFrame } from "@react-three/fiber";

const SIZE = 80;

const VERTEX_SHADER = /* glsl */ `
  precision highp float;

  uniform float uTime;
  uniform float uActive;

  varying vec3 vNormal;
  varying vec3 vViewDir;

  // Ashima 3D simplex noise (MIT). Source: github.com/ashima/webgl-noise
  vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
  vec4 mod289(vec4 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
  vec4 permute(vec4 x) { return mod289(((x * 34.0) + 1.0) * x); }
  vec4 taylorInvSqrt(vec4 r) { return 1.79284291400159 - 0.85373472095314 * r; }

  float snoise(vec3 v) {
    const vec2 C = vec2(1.0 / 6.0, 1.0 / 3.0);
    const vec4 D = vec4(0.0, 0.5, 1.0, 2.0);

    vec3 i = floor(v + dot(v, C.yyy));
    vec3 x0 = v - i + dot(i, C.xxx);

    vec3 g = step(x0.yzx, x0.xyz);
    vec3 l = 1.0 - g;
    vec3 i1 = min(g.xyz, l.zxy);
    vec3 i2 = max(g.xyz, l.zxy);

    vec3 x1 = x0 - i1 + C.xxx;
    vec3 x2 = x0 - i2 + C.yyy;
    vec3 x3 = x0 - D.yyy;

    i = mod289(i);
    vec4 p = permute(permute(permute(
              i.z + vec4(0.0, i1.z, i2.z, 1.0))
            + i.y + vec4(0.0, i1.y, i2.y, 1.0))
            + i.x + vec4(0.0, i1.x, i2.x, 1.0));

    float n_ = 0.142857142857;
    vec3 ns = n_ * D.wyz - D.xzx;

    vec4 j = p - 49.0 * floor(p * ns.z * ns.z);

    vec4 x_ = floor(j * ns.z);
    vec4 y_ = floor(j - 7.0 * x_);

    vec4 x = x_ * ns.x + ns.yyyy;
    vec4 y = y_ * ns.x + ns.yyyy;
    vec4 h = 1.0 - abs(x) - abs(y);

    vec4 b0 = vec4(x.xy, y.xy);
    vec4 b1 = vec4(x.zw, y.zw);

    vec4 s0 = floor(b0) * 2.0 + 1.0;
    vec4 s1 = floor(b1) * 2.0 + 1.0;
    vec4 sh = -step(h, vec4(0.0));

    vec4 a0 = b0.xzyw + s0.xzyw * sh.xxyy;
    vec4 a1 = b1.xzyw + s1.xzyw * sh.zzww;

    vec3 p0 = vec3(a0.xy, h.x);
    vec3 p1 = vec3(a0.zw, h.y);
    vec3 p2 = vec3(a1.xy, h.z);
    vec3 p3 = vec3(a1.zw, h.w);

    vec4 norm = taylorInvSqrt(vec4(dot(p0, p0), dot(p1, p1), dot(p2, p2), dot(p3, p3)));
    p0 *= norm.x;
    p1 *= norm.y;
    p2 *= norm.z;
    p3 *= norm.w;

    vec4 m = max(0.6 - vec4(dot(x0, x0), dot(x1, x1), dot(x2, x2), dot(x3, x3)), 0.0);
    m = m * m;
    return 42.0 * dot(m * m, vec4(dot(p0, x0), dot(p1, x1), dot(p2, x2), dot(p3, x3)));
  }

  void main() {
    float d = snoise(position * 1.3 + uTime * 0.35) * (0.12 + 0.06 * uActive);
    vec3 displaced = position + normal * d;

    vec4 mv = modelViewMatrix * vec4(displaced, 1.0);
    vNormal = normalize(normalMatrix * normal);
    vViewDir = -mv.xyz;

    gl_Position = projectionMatrix * mv;
  }
`;

const FRAGMENT_SHADER = /* glsl */ `
  precision highp float;

  uniform float uTime;
  uniform float uActive;
  uniform vec3 uAmber;
  uniform vec3 uPlum;
  uniform vec3 uMint;

  varying vec3 vNormal;
  varying vec3 vViewDir;

  void main() {
    float fresnel = pow(1.0 - abs(dot(normalize(vNormal), normalize(vViewDir))), 2.5);

    // Slow colour cycle: amber -> plum -> mint -> amber.
    float phase = fract(uTime * 0.03) * 3.0;
    vec3 col = mix(uAmber, uPlum, smoothstep(0.0, 1.0, phase));
    col = mix(col, uMint, smoothstep(1.0, 2.0, phase));
    col = mix(col, uAmber, smoothstep(2.0, 3.0, phase));
    col *= (1.0 + 0.4 * uActive);

    float alpha = clamp(fresnel * (0.75 + 0.35 * uActive), 0.0, 1.0);
    gl_FragColor = vec4(col, alpha);
  }
`;

type OrbMeshProps = {
  active: boolean;
};

function OrbMesh({ active }: OrbMeshProps) {
  const meshRef = useRef<THREE.Mesh>(null);

  const material = useMemo(
    () =>
      new THREE.ShaderMaterial({
        vertexShader: VERTEX_SHADER,
        fragmentShader: FRAGMENT_SHADER,
        uniforms: {
          uTime: { value: 0 },
          uActive: { value: 0 },
          uAmber: { value: new THREE.Color("#F2A93B") },
          uPlum: { value: new THREE.Color("#8B5CF6") },
          uMint: { value: new THREE.Color("#3DD9A8") },
        },
        transparent: true,
        depthWrite: false,
      }),
    [],
  );

  // Free the GPU program on unmount.
  useEffect(() => {
    return () => {
      material.dispose();
    };
  }, [material]);

  useFrame((_, delta) => {
    const u = material.uniforms;
    const target = active ? 1 : 0;

    u.uActive.value += (target - u.uActive.value) * Math.min(1, delta * 4);
    u.uTime.value += delta * (1.0 + 1.5 * u.uActive.value);

    const mesh = meshRef.current;
    if (mesh) {
      mesh.rotation.y += delta * (0.15 + 0.6 * u.uActive.value);
      mesh.rotation.x += delta * 0.05;
    }
  });

  return (
    <mesh ref={meshRef} material={material}>
      <icosahedronGeometry args={[1, 24]} />
    </mesh>
  );
}

export type AssistantOrbProps = {
  active?: boolean;
  className?: string;
};

export function AssistantOrb({ active = false, className }: AssistantOrbProps) {
  // null = not checked yet (server render and first client render).
  const [canUseWebGL, setCanUseWebGL] = useState<boolean | null>(null);
  const [reduceMotion, setReduceMotion] = useState(false);

  useEffect(() => {
    const motionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    const syncMotion = () => setReduceMotion(motionQuery.matches);

    syncMotion();
    motionQuery.addEventListener("change", syncMotion);

    const probe = document.createElement("canvas");
    setCanUseWebGL(Boolean(probe.getContext("webgl2") || probe.getContext("webgl")));

    return () => motionQuery.removeEventListener("change", syncMotion);
  }, []);

  const showCanvas = canUseWebGL === true && !reduceMotion;

  return (
    <div
      aria-hidden="true"
      className={className}
      style={{ width: SIZE, height: SIZE }}
    >
      {showCanvas ? (
        <Canvas
          dpr={[1, 2]}
          gl={{ alpha: true, antialias: true }}
          camera={{ position: [0, 0, 3.2], fov: 40 }}
          style={{ width: SIZE, height: SIZE }}
        >
          <OrbMesh active={active} />
        </Canvas>
      ) : (
        <div
          aria-hidden="true"
          className="rounded-full"
          style={{
            width: SIZE,
            height: SIZE,
            background:
              "radial-gradient(circle at 35% 30%, #F2A93B, #8B5CF6 55%, #3DD9A8 100%)",
          }}
        />
      )}
    </div>
  );
}
