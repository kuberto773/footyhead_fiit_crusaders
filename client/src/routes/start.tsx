import { useRef } from "react";
import { IRefPhaserGame, PhaserGame } from "../game/PhaserGame";
import { useParams } from "react-router-dom";

function StartGame() {
  //  References to the PhaserGame component (game and scene are exposed)
  const phaserRef = useRef<IRefPhaserGame | null>(null);
  const { pin } = useParams();

  console.log(pin);

  return <PhaserGame ref={phaserRef} />;
}

export default StartGame;
