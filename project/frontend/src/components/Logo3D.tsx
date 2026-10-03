"use client";

import { useEffect, useRef } from "react";

export function Logo3D() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let frameId = 0;
    let disposed = false;
    let cleanup: (() => void) | undefined;

    import("three").then((THREE) => {
      if (disposed || !container) return;

      const width = container.clientWidth || 256;
      const height = container.clientHeight || 256;

      const scene = new THREE.Scene();
      const camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 1000);
      const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
      renderer.setSize(width, height);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      container.appendChild(renderer.domElement);

      const geometry = new THREE.TorusKnotGeometry(1, 0.35, 128, 32);
      const material = new THREE.MeshPhongMaterial({
        color: 0xd6e65c,
        shininess: 120,
        specular: 0x444444,
        transparent: true,
        opacity: 0.9,
      });
      const logo = new THREE.Mesh(geometry, material);
      scene.add(logo);

      const light1 = new THREE.PointLight(0xffffff, 1, 100);
      light1.position.set(5, 5, 5);
      scene.add(light1);

      const light2 = new THREE.PointLight(0xd6e65c, 0.5, 100);
      light2.position.set(-5, -5, 5);
      scene.add(light2);

      scene.add(new THREE.AmbientLight(0x404040));
      camera.position.z = 4.5;

      function animate() {
        if (disposed) return;
        logo.rotation.x += 0.008;
        logo.rotation.y += 0.012;
        renderer.render(scene, camera);
        frameId = requestAnimationFrame(animate);
      }
      animate();

      const onResize = () => {
        const w = container.clientWidth || 256;
        const h = container.clientHeight || 256;
        renderer.setSize(w, h);
        camera.aspect = w / h;
        camera.updateProjectionMatrix();
      };
      window.addEventListener("resize", onResize);

      cleanup = () => {
        window.removeEventListener("resize", onResize);
        cancelAnimationFrame(frameId);
        renderer.dispose();
        geometry.dispose();
        material.dispose();
        if (container.contains(renderer.domElement)) {
          container.removeChild(renderer.domElement);
        }
      };
    });

    return () => {
      disposed = true;
      cancelAnimationFrame(frameId);
      cleanup?.();
    };
  }, []);

  return <div ref={containerRef} className="w-full h-full" />;
}
