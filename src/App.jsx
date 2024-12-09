import { useState, useEffect, useRef } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import { useSpring, animated } from "@react-spring/three";
import * as THREE from "three";
import RedThree from "./components/Scene";
import { TextureLoader } from "three";

function App() {
  const tileSize = 150; // Fixed tile size
  const [gridSize, setGridSize] = useState({ rows: 40, cols: 40 });
  const [tilePositions, setTilePositions] = useState([]);
  const [treePositions, setTreePositions] = useState(new Set());
  const [dragging, setDragging] = useState(false);
  const [offset, setOffset] = useState([0, 0]);
  const lastMousePosition = useRef([0, 0]);
  const tileTexture = useRef();

  const expansionThreshold = tileSize * 5; // Expand 40-50 tiles earlier

  useEffect(() => {
    // Preload texture
    tileTexture.current = new TextureLoader().load("/floor2.jpg");
  }, []);

  useEffect(() => {
    const generateGridAndTrees = () => {
      const positions = [];
      const treeSet = new Set();
      const { rows, cols } = gridSize;

      for (let row = 0; row < rows; row++) {
        for (let col = 0; col < cols; col++) {
          const x = col * tileSize - (cols * tileSize) / 2 + tileSize / 2;
          const z = row * tileSize - (rows * tileSize) / 2 + tileSize / 2;
          positions.push([x, -1, z]);
        }
      }

      while (treeSet.size < Math.floor(rows * cols * 0.05)) {
        const randomIndex = Math.floor(Math.random() * positions.length);
        const treePosition = positions[randomIndex].toString();
        treeSet.add(treePosition);
      }

      setTilePositions(positions);
      setTreePositions(new Set([...treeSet]));
    };

    generateGridAndTrees();
  }, [gridSize, tileSize]);

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

      checkAndExpandGrid(newOffsetX, newOffsetZ);

      return [newOffsetX, newOffsetZ];
    });

    lastMousePosition.current = [event.clientX, event.clientY];
  };

  const handlePointerUp = () => setDragging(false);

  const checkAndExpandGrid = (offsetX, offsetZ) => {
    const halfGridWidth = (gridSize.cols * tileSize) / 2;
    const halfGridHeight = (gridSize.rows * tileSize) / 2;

    if (
      Math.abs(offsetX) > halfGridWidth - expansionThreshold ||
      Math.abs(offsetZ) > halfGridHeight - expansionThreshold
    ) {
      setGridSize((prev) => ({
        rows: prev.rows + 40,
        cols: prev.cols + 40,
      }));
    }
  };

  const handleTileClick = (tilePosition) => {
    setTreePositions((prev) => {
      const positionKey = tilePosition.toString();
      const newTreeSet = new Set(prev);

      if (newTreeSet.has(positionKey)) return newTreeSet;

      newTreeSet.add(positionKey);
      return newTreeSet;
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

          {[...treePositions].map((pos, index) => (
            <TreePop key={index} position={pos.split(",").map(Number)} />
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
