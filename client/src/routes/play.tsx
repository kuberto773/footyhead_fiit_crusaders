import { Form, Link, useActionData } from "react-router-dom";
import { Button, Title } from "../layout";
import { useEffect, useState } from "react";

function GameLobby() {
  const [PIN, setPin] = useState<string>();
  const { pin } = (useActionData() as { pin: string }) || {};

  useEffect(() => {
    setPin(pin);
  }, [pin]);

  const prettyPrint = (str?: string) =>
    str && `${str.slice(0, 3)}-${str.slice(3)}`;

  return (
    <>
      <Title>Footy Head</Title>
      <div className="lobby-card honk-font">
        <div className="lobby-card--title">Start a new Game</div>
        <div className="lobby-card--desc">Your PIN:</div>
        <div className="lobby-card--pin">{prettyPrint(PIN)}</div>
      </div>
      <div style={{ display: "flex" }}>
        <Link to="../">
          <Button>← Go Back</Button>
        </Link>
        <Form id="create-pin" method="post">
          {PIN ? (
            <Link to={PIN}>
              <Button>Start Game</Button>
            </Link>
          ) : (
            <Button>Create PIN</Button>
          )}
        </Form>
      </div>
    </>
  );
}

export default GameLobby;
