'use client';

import Particles, { ParticlesProvider, useParticlesProvider } from '@tsparticles/react';
import type { Engine } from '@tsparticles/engine';
import { loadSlim } from '@tsparticles/slim';
import { useCallback } from 'react';

function ParticlesContent() {
  const { loaded } = useParticlesProvider();

  if (!loaded) return null;

  return (
    <Particles
      id="tsparticles"
      className="absolute inset-0 z-0"
      options={{
        background: { color: { value: 'transparent' } },
        fpsLimit: 60,
        interactivity: {
          events: {
            onHover: { enable: true, mode: 'repulse' },
            resize: { enable: true },
          },
          modes: {
            repulse: { distance: 100, duration: 0.4 },
          },
        },
        particles: {
          color: { value: ['#7c3aed', '#14b8a6', '#a855f7'] },
          links: {
            color: '#7c3aed',
            distance: 150,
            enable: true,
            opacity: 0.15,
            width: 1,
          },
          move: {
            direction: 'none',
            enable: true,
            outModes: { default: 'bounce' },
            random: false,
            speed: 0.6,
            straight: false,
          },
          number: {
            density: { enable: true },
            value: 80,
          },
          opacity: { value: 0.3 },
          shape: { type: 'circle' },
          size: { value: { min: 1, max: 3 } },
        },
        detectRetina: true,
      }}
    />
  );
}

export default function ParticlesBackground() {
  const init = useCallback(async (engine: Engine) => {
    await loadSlim(engine);
  }, []);

  return (
    <ParticlesProvider init={init}>
      <ParticlesContent />
    </ParticlesProvider>
  );
}
