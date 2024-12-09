import { useState, useEffect, useRef } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import { useSpring, animated } from "@react-spring/three";
import * as THREE from "three";
import RedThree from "./components/Scene";
import { TextureLoader } from "three";

function App() {
  const tileSize = 150; // Fixed tile size
  const [gridSize] = useState({ rows: 40, cols: 40 }); // Number of rows and columns
  const [tilePositions, setTilePositions] = useState([]);
  const [treePositions, setTreePositions] = useState([]);
  const [dragging, setDragging] = useState(false); // Track dragging state
  const [offset, setOffset] = useState([0, 0]); // Offset in X and Z directions
  const lastMousePosition = useRef([0, 0]); // Store last mouse position

  const tileTexture = useRef(); // Use ref to store the texture

  // Preload texture
  useEffect(() => {
    tileTexture.current = new TextureLoader().load("/floor2.jpg");
  }, []);

  // Set fixed grid size and initialize random trees
  useEffect(() => {
    const positions = [];
    const treeSet = new Set(); // To avoid duplicate positions
    const { rows, cols } = gridSize;
    const treeCount = Math.floor((rows * cols) * 0.05); // 5% of the grid filled with trees

    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        const x = col * tileSize - (cols * tileSize) / 2 + tileSize / 2;
        const z = row * tileSize - (rows * tileSize) / 2 + tileSize / 2;
        positions.push([x, -1, z]);
      }
    }

    // Randomly pick tree positions
    while (treeSet.size < treeCount) {
      const randomIndex = Math.floor(Math.random() * positions.length);
      treeSet.add(positions[randomIndex].toString()); // Use string representation to avoid duplicates
    }

    setTilePositions(positions);
    setTreePositions([...treeSet].map((pos) => pos.split(",").map(Number))); // Convert back to number arrays
  }, [gridSize, tileSize]);

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

  // Dragging movement
  const handlePointerMove = (event) => {
    if (!dragging) return;
    const [lastX, lastY] = lastMousePosition.current;
    const deltaX = event.clientX - lastX;
    const deltaY = event.clientY - lastY;

    // Calculate new offset
    setOffset(([prevX, prevZ]) => {
      const newX = prevX + deltaX * 1;
      const newZ = prevZ + deltaY * 1;

      // Get canvas dimensions
      const canvasWidth = window.innerWidth;
      const canvasHeight = window.innerHeight;

      // Calculate boundaries
      const maxOffsetX = (gridSize.cols * tileSize)/3 - canvasWidth / 2;
      const maxOffsetZ = (gridSize.rows * tileSize)/3  - canvasHeight / 2;

      // Clamp the offset within the boundaries
      const clampedX = Math.max(-maxOffsetX, Math.min(maxOffsetX, newX));
      const clampedZ = Math.max(-maxOffsetZ, Math.min(maxOffsetZ, newZ));

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
        style={{ height: "100%", width: "100%", background: "transparent" }}
        orthographic
        camera={{
          position: [0, 800, 600],
          zoom: 0.7,
          near: 0.1,
          far: 2000,
        }}
        onCreated={({ scene }) => {
          scene.background = null;
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
            <mesh
              key={index}
              position={position}
              rotation={[-Math.PI / 2, 0, 0]}
              onClick={() => handleTileClick(position)}
            >
              <planeGeometry args={[tileSize, tileSize]} />
              <meshStandardMaterial map={tileTexture.current} />

              <lineSegments>
                <edgesGeometry
                  attach="geometry"
                  args={[new THREE.PlaneGeometry(tileSize, tileSize)]}
                />
                <lineBasicMaterial attach="material" color="black" />
              </lineSegments>
            </mesh>
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
