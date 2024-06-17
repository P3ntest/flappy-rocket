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
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useLerped } from "./util";
import { useWindowSize } from "usehooks-ts";
import { DropShadowFilter } from "pixi-filters";
import { TextStyle } from "pixi.js";
import { useGameState } from "./stateStore";

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

  const gameState = useGameState((s) => s.state);
  useEffect(() => {
    if (gameState == "game") {
      // reset the game
      setPlayerX(0);
      setPlayerY(100);
      setPipes([]);
      passedPipes.current = new Set();
      setScore(0);
    }
  }, [gameState]);

  const setGameState = useGameState((s) => s.setGameState);

  useTick((delta) => {
    if (gameState !== "game") return;
    const playerSpeed = 3 + passedPipes.current.size * 0.1;
    setPlayerX((y) => y + playerSpeed * delta);

    setPipes((pipes) => {
      // remove pipes that are offscreen
      pipes = pipes.filter((pipe) => pipe.x - playerX > screenWidth / -2 - 500);

      // add new pipes
      if (pipes.length === 0 || pipes[pipes.length - 1].x < playerX + 6000) {
        const gapSize = Math.max(300 - passedPipes.current.size * 16, 150);

        const pipeInterval = Math.max(800 - passedPipes.current.size * 35, 250);

        const gapStart = Math.random() * (totalHeight - gapSize);
        pipes.push({
          x: (pipes[pipes.length - 1]?.x ?? playerX) + pipeInterval,
          gapStart,
          gapSize,
          id: currentPipeId++,
        });
      }
      return pipes;
    });

    // check for collisions
    if (checkIsColliding(playerX, playerY, pipes)) {
      setGameState("gameOver");
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

  const screenWidth = useApp().screen.width;

  const gameOver = gameState === "gameOver";

  return (
    <>
      {/* <TilingSprite
        width={screenWidth}
        height={totalHeight}
        image="circuit.png"
        tint={0xcccccc}
        tilePosition={{
          x: -playerX / 2,
          y: 0,
        }}
      /> */}
      <Container x={screenWidth / 2}>
        <Player
          onRestart={() => {
            setGameState("game");
          }}
          x={playerX}
          y={playerY}
          setPlayerX={setPlayerX}
          setPlayerY={setPlayerY}
          gameOver={gameState !== "game"}
        />
        {pipes.map((pipe) => (
          <Container x={pipe.x - playerX} key={pipe.id} filters={filters}>
            <Pipe {...pipe} />
          </Container>
        ))}
      </Container>
      {gameState !== "mainMenu" && (
        <Text
          text={`Score: ${score}`}
          x={screenWidth / 2}
          anchor={0.5}
          y={gameOver ? totalHeight / 2 + 150 : 40}
          style={
            new TextStyle({
              fill: "#91CA3E",
              fontSize: 55,
              fontWeight: "bold",
              dropShadow: true,
            })
          }
        />
      )}
      {gameState === "mainMenu" && (
        <>
          <Text
            text="Flappy Rocket"
            x={screenWidth / 2}
            anchor={0.5}
            y={totalHeight / 2 - 150}
            style={
              new TextStyle({
                fill: "#91CA3E",
                fontSize: 170,
                fontWeight: "bold",
                dropShadow: true,
              })
            }
          />

          <Text
            text="Press Space to Start"
            x={screenWidth / 2}
            anchor={0.5}
            y={totalHeight / 2}
            style={
              new TextStyle({
                fill: "#91CA3E",
                fontSize: 55,
                fontWeight: "bold",
                dropShadow: true,
              })
            }
          />
        </>
      )}
      {gameOver && (
        <>
          <Text
            text="Game Over"
            x={screenWidth / 2}
            anchor={0.5}
            y={totalHeight / 2}
            style={
              new TextStyle({
                fill: "#91CA3E",
                fontSize: 200,
                fontWeight: "bold",
                dropShadow: true,
              })
            }
          />
          {/* press space to restart */}
          <Text
            text="Press Space to Restart"
            x={screenWidth / 2}
            anchor={0.5}
            y={totalHeight / 2 + 250}
            style={
              new TextStyle({
                fill: "#91CA3E",
                fontSize: 55,
                fontWeight: "bold",
                dropShadow: true,
              })
            }
          />
        </>
      )}
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
  onRestart,
}: {
  x: number;
  y: number;
  setPlayerX: Dispatch<number>;
  setPlayerY: Dispatch<SetStateAction<number>>;
  gameOver: boolean;
  onRestart: () => void;
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

  const flap = useCallback(() => {
    if (gameOver) {
      onRestart();
      return;
    }
    setVelocity(-10);
  }, [gameOver, onRestart]);

  const lastButtonState = useRef(false);
  useTick(() => {
    const gamepad = navigator.getGamepads()[0];
    if (!gamepad) {
      console.log("no gamepad");
      return;
    }
    const buttonState = gamepad.buttons[0].pressed;
    if (buttonState && !lastButtonState.current) {
      flap();
    }
    lastButtonState.current = buttonState;
  });

  useEffect(() => {
    window.addEventListener("gamepadconnected", (event) => {
      console.log("A gamepad connected:", event);
    });

    const listener = (event: KeyboardEvent) => {
      if (event.key === " ") {
        flap();
      }
    };
    window.addEventListener("keydown", listener);
    return () => {
      window.removeEventListener("keydown", listener);
    };
  }, [flap]);

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
