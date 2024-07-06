import { useRef } from "react";
import { IRefPhaserGame, PhaserGame } from "../game/PhaserGame";
import { useLoaderData, useParams } from "react-router-dom";
import { EventBus } from "../game/EventBus";

export function Game() {
  //  References to the PhaserGame component (game and scene are exposed)
  const phaserRef = useRef<IRefPhaserGame | null>(null);
  const { pin } = useParams();
  const { success, roomId } = useLoaderData() as {
    success: boolean;
    roomId: string;
  };

  const onCurrentActiveScene = (scene: Phaser.Scene) => {
    if (scene.scene.key == "Preloader") {
      EventBus.emit("room-ready", { pin, roomId });
    }
  };

  return (
    success && (
      <PhaserGame ref={phaserRef} currentActiveScene={onCurrentActiveScene} />
    )
  );
}

export default Game;
