import { useState, useEffect, useMemo, useRef } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import { useSpring, animated } from "@react-spring/three";
import * as THREE from "three";
import RedThree from "./components/Scene";
import { TextureLoader } from "three";

function App() {
  const tileSize = 150; // Fixed tile size
  const [gridSize] = useState({ rows: 40, cols: 40 }); // Number of rows and columns
  const [treePositions, setTreePositions] = useState([]);
  const [dragging, setDragging] = useState(false); // Track dragging state
  const [offset, setOffset] = useState([0, 0]); // Offset in X and Z directions
  const lastMousePosition = useRef([0, 0]); // Store last mouse position

  const tileTexture = useRef(); // Use ref to store the texture

  // Preload texture
  useEffect(() => {
    tileTexture.current = new TextureLoader().load("/floor2.jpg");
  }, []);

  // Memoize tile positions
  const tilePositions = useMemo(() => {
    const positions = [];
    const { rows, cols } = gridSize;

    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        const x = col * tileSize - (cols * tileSize) / 2 + tileSize / 2;
        const z = row * tileSize - (rows * tileSize) / 2 + tileSize / 2;
        positions.push([x, -1, z]);
      }
    }
    return positions;
  }, [gridSize, tileSize]);

  // Randomly initialize tree positions
  useEffect(() => {
    const treeSet = new Set();
    const treeCount = Math.floor((gridSize.rows * gridSize.cols) * 0.05); // 5% of the grid filled with trees

    while (treeSet.size < treeCount) {
      const randomIndex = Math.floor(Math.random() * tilePositions.length);
      treeSet.add(tilePositions[randomIndex].toString()); // Avoid duplicates
    }

    setTreePositions([...treeSet].map((pos) => pos.split(",").map(Number))); // Convert back to number arrays
  }, [tilePositions, gridSize]);

  // Add tree on clicked tile
  const handleTileClick = (tilePosition) => {
    setTreePositions((prev) => {
      const alreadyExists = prev.some(
        ([x, y, z]) => x === tilePosition[0] && z === tilePosition[2]
      );
      return alreadyExists ? prev : [...prev, tilePosition];
    });
  };

  // Start dragging
  const handlePointerDown = (event) => {
    setDragging(true);
    lastMousePosition.current = [event.clientX, event.clientY];
  };

  const handlePointerMove = (event) => {
    if (!dragging) return;
  
    const [lastX, lastY] = lastMousePosition.current;
    const deltaX = event.clientX - lastX;
    const deltaY = event.clientY - lastY;
  
    setOffset(([prevX, prevZ]) => {
      const newX = prevX + deltaX;
      const newZ = prevZ + deltaY;
  
      // 50% boundary for both X and Z directions
      const boundaryX = (gridSize.cols * tileSize * 0.5) / 2; // 50% of grid on X-axis
      const boundaryZ = (gridSize.rows * tileSize * 0.5) / 2; // 50% of grid on Z-axis
  
      // Clamp offsets within boundaries
      const clampedX = Math.max(-boundaryX, Math.min(boundaryX, newX));
      const clampedZ = Math.max(-boundaryZ, Math.min(boundaryZ, newZ));
  
      return [clampedX, clampedZ];
    });
  
    lastMousePosition.current = [event.clientX, event.clientY];
  };
  
  
  // Stop dragging
  const handlePointerUp = () => {
    setDragging(false);
  };

  return (
    <div
      style={{ height: "100vh", width: "100vw" }}
      onMouseDown={handlePointerDown}
      onMouseMove={handlePointerMove}
      onMouseUp={handlePointerUp}
      onMouseLeave={handlePointerUp} // Stop dragging if mouse leaves the canvas
    >
      <Canvas
        style={{ height: "100%", width: "100%" }}
        orthographic
        camera={{
          position: [0, 800, 600],
          zoom: 0.7,
          near: 0.1,
          far: 2000,
        }}
        onCreated={({ scene }) => {
          scene.background = new THREE.Color("lightgray");
        }}
      >
        <ambientLight intensity={0.5} color={0xb0e0e6} />
        <pointLight position={[10, 100, 10]} intensity={1} />
        <OrbitControls
          enableRotate={false}
          enableZoom={true}
          enablePan={true}
          screenSpacePanning={true}
          target={[0, -1, 0]}
          maxPolarAngle={Math.PI / 2 - 0.1}
          minZoom={0.5}
          maxZoom={0.8}
        />

        {/* Group with Offset */}
        <group position={[offset[0], 0, offset[1]]}>
          {/* Tiled Ground */}
          {tilePositions.map((position, index) => (
  <group key={index} position={position}>
    {/* Tile */}
    <mesh
      rotation={[-Math.PI / 2, 0, 0]}
      onClick={() => handleTileClick(position)}
    >
      <planeGeometry args={[tileSize, tileSize]} />
      <meshStandardMaterial map={tileTexture.current} />
    </mesh>
    
    {/* Border */}
    <lineSegments>
      <edgesGeometry args={[new THREE.PlaneGeometry(tileSize,2*tileSize)]} />
      <lineBasicMaterial color="black" />
    </lineSegments>
  </group>
))}


          {/* Trees with Animation */}
          {treePositions.map((position, index) => (
            <TreePop key={index} position={position} />
          ))}
        </group>
      </Canvas>
    </div>
  );
}

// Tree component with animation
const TreePop = ({ position }) => {
  const { scale } = useSpring({
    from: { scale: 0 },
    to: { scale: 0.5 },
    config: { tension: 200, friction: 15 },
  });

  return (
    <animated.group position={position} scale={scale}>
      <RedThree />
    </animated.group>
  );
};

export default App;
