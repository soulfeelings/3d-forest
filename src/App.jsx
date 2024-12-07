import { useState, useMemo } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import { a } from '@react-spring/three'; // Import animated component
import RedThree from './components/Scene';

function App() {
  const [visibleCount, setVisibleCount] = useState(10); // Start with a small number of trees

  // Generate positions for all the RedThree components only once
  const positions = useMemo(
    () =>
      Array.from({ length: 100 }, () => [
        (Math.random() - 0.5) * 2000,
        0,
        (Math.random() - 0.5) * 2000,
      ]),
    []
  );

  // Handle click to increase visible tree count
  const handleClick = () => {
    setVisibleCount((prevCount) =>
      Math.min(prevCount + 10, positions.length) // Increment by 10, limit to total trees
    );
  };

  return (
    <div
      style={{ height: '100vh', width: '100vw', cursor: 'pointer' }}
      onClick={handleClick} // Listen for clicks on the entire container
    >
      <Canvas
        style={{ height: '100%', width: '100%' }}
        camera={{ position: [100, 650, 2000], fov: 25, far: 10000 }}
      >
        <ambientLight intensity={0.5} />
        <pointLight position={[10, 10, 10]} />
        <OrbitControls />
        {positions.slice(0, visibleCount).map((position, index) => (
          <a.group
            key={index}
            position={position}
            scale={[0.5, 0.5, 0.5]}
            style={{
              opacity: 0,
              transform: 'scale(0.5)',
              transition: 'opacity 0.5s, transform 0.5s',
            }}
            onPointerEnter={(e) => e.stopPropagation()} // Prevent interaction issues
            onAnimationStart={() => {
              // Optionally trigger any actions at the start of the animation
            }}
            onAnimationEnd={() => {
              // Optionally trigger any actions when the animation ends
            }}
            // Animation logic for appearance
            animate={{
              opacity: 1,
              transform: 'scale(1)',
            }}
            config={{ duration: 500 }} // Smooth appearance over 0.5 seconds
          >
            <RedThree />
          </a.group>
        ))}
      </Canvas>
    </div>
  );
}

export default App;
