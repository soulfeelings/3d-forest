import { useState, useEffect, useRef } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import { useSpring, animated } from "@react-spring/three";
import * as THREE from "three";
import RedThree from "./components/Scene";
import { TextureLoader } from "three";

function App() {
  const tileSize = 150; // Fixed tile size
  const [gridSize, setGridSize] = useState({ rows: 40, cols: 40 }); // Dynamic grid size
  const [tilePositions, setTilePositions] = useState([]);
  const [treePositions, setTreePositions] = useState([]);
  const [dragging, setDragging] = useState(false);
  const [offset, setOffset] = useState([0, 0]);
  const lastMousePosition = useRef([0, 0]);
  const tileTexture = useRef();

  const expansionThreshold = tileSize * 10; // Trigger expansion earlier

  // Preload texture
  useEffect(() => {
    tileTexture.current = new TextureLoader().load("/floor2.jpg");
  }, []);

  // Initialize grid and trees
  useEffect(() => {
    const generateGridAndTrees = () => {
      const positions = [];
      const treeSet = new Set();
      const { rows, cols } = gridSize;
      const treeCount = Math.floor(rows * cols * 0.05);

      for (let row = 0; row < rows; row++) {
        for (let col = 0; col < cols; col++) {
          const x = col * tileSize - (cols * tileSize) / 2 + tileSize / 2;
          const z = row * tileSize - (rows * tileSize) / 2 + tileSize / 2;
          positions.push([x, -1, z]);
        }
      }

      while (treeSet.size < treeCount) {
        const randomIndex = Math.floor(Math.random() * positions.length);
        treeSet.add(positions[randomIndex].toString());
      }

      setTilePositions(positions);
      setTreePositions([...treeSet].map((pos) => pos.split(",").map(Number)));
    };

    generateGridAndTrees();
  }, [gridSize, tileSize]);

  // Handle dragging
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
      const newOffsetX = prevX + deltaX;
      const newOffsetZ = prevZ + deltaY;

      // Check for grid expansion
      checkAndExpandGrid(newOffsetX, newOffsetZ);

      return [newOffsetX, newOffsetZ];
    });

    lastMousePosition.current = [event.clientX, event.clientY];
  };

  const handlePointerUp = () => setDragging(false);

  const checkAndExpandGrid = (offsetX, offsetZ) => {
    const halfGridWidth = (gridSize.cols * tileSize) / 2;
    const halfGridHeight = (gridSize.rows * tileSize) / 2;

    // Expand grid if the user is near the edge
    if (
      offsetX > halfGridWidth - expansionThreshold ||
      offsetX < -halfGridWidth + expansionThreshold ||
      offsetZ > halfGridHeight - expansionThreshold ||
      offsetZ < -halfGridHeight + expansionThreshold
    ) {
      setGridSize((prev) => ({
        rows: prev.rows + 80,
        cols: prev.cols + 80,
      }));
    }
  };

  const handleTileClick = (tilePosition) => {
    setTreePositions((prev) => {
      const alreadyExists = prev.some(
        ([x, y, z]) => x === tilePosition[0] && z === tilePosition[2]
      );
      return alreadyExists ? prev : [...prev, tilePosition];
    });
  };

  return (
    <div
      style={{ height: "100vh", width: "100vw" }}
      onMouseDown={handlePointerDown}
      onMouseMove={handlePointerMove}
      onMouseUp={handlePointerUp}
      onMouseLeave={handlePointerUp}
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

        <group position={[offset[0], 0, offset[1]]}>
          <group position={[offset[0], 0, offset[1]]}>
            {/* Tiled Ground with Borders */}
            {tilePositions.map((position, index) => (
              <mesh
                key={index}
                position={position}
                rotation={[-Math.PI / 2, 0, 0]}
                onClick={() => handleTileClick(position)}
              >
                {/* Tile Geometry */}
                <planeGeometry args={[tileSize, tileSize]} />
                <meshStandardMaterial map={tileTexture.current} />

                {/* Black Border */}
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

          {treePositions.map((position, index) => (
            <TreePop key={index} position={position} />
          ))}
        </group>
      </Canvas>
    </div>
  );
}

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
