import {
  Container,
  Sprite,
  Stage,
  Text,
  TilingSprite,
  useApp,
  useTick,
} from "@pixi/react";
import {
  Dispatch,
  SetStateAction,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useLerped } from "./util";
import { useWindowSize } from "usehooks-ts";
import { DropShadowFilter, GlitchFilter } from "pixi-filters";

export function MainStage() {
  const window = useWindowSize();

  return (
    <Stage
      options={{
        backgroundColor: "#2bd5ff",
        height: window.height,
        width: window.width,
        antialias: true,
      }}
      style={{
        height: "100vh",
        width: "100vw",
      }}
      height={window.height}
      width={window.width}
    >
      <Game />
    </Stage>
  );
}

type Pipe = {
  x: number;
  gapStart: number;
  gapSize: number;
  id: number;
};
let currentPipeId = 0;

function Game() {
  const [playerX, setPlayerX] = useState(0);
  const [playerY, setPlayerY] = useState(100);

  const [pipes, setPipes] = useState<Pipe[]>([]);

  const passedPipes = useRef(new Set<number>());
  const [score, setScore] = useState(0);

  const totalHeight = useApp().screen.height;

  const [gameOver, setGameOver] = useState(false);

  useTick((delta) => {
    if (gameOver) {
      return;
    }
    setPlayerX((y) => y + 3 * delta);

    setPipes((pipes) => {
      // remove pipes that are offscreen
      pipes = pipes.filter((pipe) => pipe.x - playerX > -3000);

      // add new pipes
      if (pipes.length === 0 || pipes[pipes.length - 1].x < playerX + 6000) {
        const gapSize = 200 + Math.random() * 200;
        const gapStart = Math.random() * (totalHeight - gapSize);
        pipes.push({
          x: (pipes[pipes.length - 1]?.x ?? playerX) + 800,
          gapStart,
          gapSize,
          id: currentPipeId++,
        });
      }
      return pipes;
    });

    // check for collisions
    if (checkIsColliding(playerX, playerY, pipes)) {
      setGameOver(true);
    }

    // check for passed pipes
    for (const pipe of pipes) {
      if (pipe.x < playerX && !passedPipes.current.has(pipe.id)) {
        passedPipes.current.add(pipe.id);
      }
    }
    setScore(passedPipes.current.size);
  });

  const filters = useMemo(() => {
    return [new DropShadowFilter()];
  }, []);

  return (
    <>
      <Text text={`Score: ${score}`} x={10} y={10} />
      <Container x={1000}>
        <Player
          x={playerX}
          y={playerY}
          setPlayerX={setPlayerX}
          setPlayerY={setPlayerY}
          gameOver={gameOver}
        />
        {pipes.map((pipe) => (
          <Container x={pipe.x - playerX} key={pipe.id} filters={filters}>
            <Pipe {...pipe} />
          </Container>
        ))}
      </Container>
    </>
  );
}

function checkIsColliding(playerX: number, playerY: number, pipes: Pipe[]) {
  const PLAYER_RADIUS = 20;
  const PIPE_WIDTH = 100;

  for (const pipe of pipes) {
    // pipes are centered around their x position
    if (
      playerX + PLAYER_RADIUS > pipe.x &&
      playerX - PLAYER_RADIUS < pipe.x + PIPE_WIDTH
    ) {
      if (
        playerY - PLAYER_RADIUS < pipe.gapStart ||
        playerY + PLAYER_RADIUS > pipe.gapStart + pipe.gapSize
      ) {
        return true;
      }
    }
  }
  return false;
}

function Pipe(pipe: { x: number; gapStart: number; gapSize: number }) {
  const totalHeight = useApp().screen.height;
  return (
    <>
      <TilingSprite
        image="/server.png"
        tilePosition={0}
        height={pipe.gapStart}
        tileScale={0.3}
      />
      <TilingSprite
        image="/server.png"
        tilePosition={0}
        height={totalHeight - pipe.gapStart - pipe.gapSize}
        tileScale={0.3}
        y={pipe.gapStart + pipe.gapSize}
      />
    </>
  );
}

function Player({
  y,
  setPlayerX,
  setPlayerY,
  gameOver,
}: {
  x: number;
  y: number;
  setPlayerX: Dispatch<number>;
  setPlayerY: Dispatch<SetStateAction<number>>;
  gameOver: boolean;
}) {
  const [velocity, setVelocity] = useState(0);

  const totalHeight = useApp().screen.height;

  const filter = useMemo(() => new DropShadowFilter(), []);
  //   const glitchFilter = useMemo(() => new GlitchFilter(), []);
  const filters = useMemo(() => {
    // if (gameOver) {
    //   return [glitchFilter, filter];
    // }
    return [filter];
  }, [
    filter,
    //  glitchFilter, gameOver
  ]);

  useTick((delta) => {
    if (gameOver) {
      return;
    }
    setVelocity((v) => {
      const newV = v + 0.4 * delta;
      setPlayerY((y) => {
        const newY = y + newV * delta;
        // cap to screen
        return Math.min(Math.max(newY, 0), totalHeight);
      });
      return newV;
    });
  });

  const flap = () => {
    setVelocity(-10);
  };

  useEffect(() => {
    const listener = (event: KeyboardEvent) => {
      if (event.key === " ") {
        flap();
      }
    };
    window.addEventListener("keydown", listener);
    return () => {
      window.removeEventListener("keydown", listener);
    };
  }, []);

  const SPRITE_ROTATION_OFFSET = 0.55;
  // rotation: when the player is falling, the rocket should point down, and when the player is rising, the rocket should point up. when the player is not moving, the rocket should point to the right.
  const rotation =
    Math.min(Math.max((velocity / 10) * 0.8, -0.6), 0.6) +
    SPRITE_ROTATION_OFFSET;

  const lerpedRotation = useLerped(rotation, 0.1);

  return (
    <Sprite
      filters={filters}
      image="/Rocket_color.png"
      y={y}
      rotation={lerpedRotation}
      anchor={0.5}
      scale={0.15}
      pointerdown={(event) => {
        setPlayerX(event.data.global.x);
        setPlayerY(event.data.global.y);
      }}
    />
  );
}
