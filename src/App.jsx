import { useState, useMemo } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import * as THREE from 'three'; // Import THREE for fog and other features
import RedThree from './components/Scene';

function App() {
  const [visibleCount, setVisibleCount] = useState(50); // Start with a larger number of trees

  // Generate positions for all the RedThree components only once
  const positions = useMemo(
    () =>
      Array.from({ length: 500 }, () => [
        (Math.random() - 0.5) * 10000, // Spread across entire plane
        0, // Trees positioned at Y=0
        (Math.random() - 0.5) * 10000,
      ]),
    []
  );

  // Handle click to increase visible tree count
  const handleClick = () => {
    setVisibleCount((prevCount) =>
      Math.min(prevCount + 50, positions.length) // Increment by 50, limit to total trees
    );
  };

  return (
    <div
      style={{ height: '100vh', width: '100vw', cursor: 'pointer' }}
      onClick={handleClick} // Listen for clicks on the entire container
    >
      <Canvas
        style={{ height: '100%', width: '100%' }}
        camera={{ position: [100, 650, 2000], fov: 25, far: 20000 }}
        onCreated={({ scene }) => {
          scene.fog = new THREE.Fog(0x4682b4, 1000, 15000); // Sky blue fog (steel blue)
          scene.background = new THREE.Color(0x87ceeb); // Set light blue background (sky blue)
        }}
      >
        <ambientLight intensity={0.5} color={0xb0e0e6} /> {/* Light blue ambient light */}
        <pointLight position={[10, 100, 10]} intensity={1} />
        <OrbitControls
          maxPolarAngle={Math.PI / 2 - 0.1} // Prevent looking below the plane
          minPolarAngle={0} // Restrict camera tilt upwards
        />
        {positions.slice(0, visibleCount).map((position, index) => (
          <group key={index} position={position} scale={[0.5, 0.5, 0.5]}>
            <RedThree />
          </group>
        ))}

        {/* Infinite Ground */}
        <mesh position={[0, -1, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[10000, 10000]} />
          <meshStandardMaterial attach="material" color="green" />
        </mesh>
      </Canvas>
    </div>
  );
}

export default App;
