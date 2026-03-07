import { useEffect, useRef } from 'react';
import Grainient from './Grainient';
import './Background.scss';

function Background() {
  const containerRef = useRef(null);

  useEffect(() => {
    const adjustHeight = () => {
      if (containerRef.current) {
        const contentHeight = document.documentElement.scrollHeight;
        containerRef.current.style.height = `${contentHeight}px`;
      }
    };

    adjustHeight();
    window.addEventListener('resize', adjustHeight);
    return () => window.removeEventListener('resize', adjustHeight);
  }, []);

  return (
    <div ref={containerRef} className="background-wrapper">
      <Grainient
        color1="#ffffff"
        color2="#720000"
        color3="#720000"
        timeSpeed={0.25}
        colorBalance={0}
        warpStrength={1}
        warpFrequency={5}
        warpSpeed={2}
        warpAmplitude={50}
        blendAngle={0}
        blendSoftness={0.05}
        rotationAmount={500}
        noiseScale={2}
        grainAmount={0.1}
        grainScale={2}
        grainAnimated={false}
        contrast={1.5}
        gamma={1}
        saturation={1}
        centerX={0}
        centerY={0}
        zoom={0.9}
      />
    </div>
  );
}

export default Background;