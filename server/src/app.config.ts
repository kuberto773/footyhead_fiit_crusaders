import config from "@colyseus/tools";
import { monitor } from "@colyseus/monitor";
import { playground } from "@colyseus/playground";
import crypto from "crypto";
import db from "../db/init";

/**
 * Import your Room files
 */
import { GameRoom } from "./rooms/GameRoom";
import { matchMaker } from "colyseus";

function generateRandomPassphrase(length: number) {
  const chars = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  const charsLength = chars.length;
  let passphrase = "";

  // Generate random bytes
  crypto.randomBytes(length).forEach((byte) => {
    const randomIdx = byte % charsLength;
    passphrase += chars[randomIdx];
  });

  return passphrase;
}

export default config({
  initializeGameServer: (gameServer) => {
    /**
     * Define your room handlers:
     */
    if (process.env.NODE_ENV !== "production") {
      //   gameServer.simulateLatency(200);
    }
    gameServer.define("game_room", GameRoom).filterBy(["pin"]);
  },

  initializeExpress: (app) => {
    // app.use(cors())
    /**
     * Bind your custom express routes here:
     * Read more: https://expressjs.com/en/starter/basic-routing.html
     */
    app.get("/hello_world", (req, res) => {
      res.send("It's time to kick ass and chew bubblegum!");
    });

    app.get("/play", async (req, res) => {
      const pin = generateRandomPassphrase(6);
      const room = await matchMaker.createRoom("game_room", { pin: pin });

      db.prepare("INSERT INTO game (pin, roomId, active) VALUES (?, ?, ?)").run(
        pin,
        room.roomId,
        0
      );

      res.send({ pin });
    });

    app.get("/play/:pin", async (req, res) => {
      const row = db
        .prepare("SELECT * FROM game WHERE pin = ?")
        .get(req.params.pin) as { pin: string; roomId: string; active: number };

      if (!row || row.active >= 2 || req.params.pin !== row.pin) {
        res.status(404).send({ success: false });
        return;
      }
      res.send({ success: true, pin: req.params.pin, roomId: row.roomId });
    });

    /**
     * Use @colyseus/playground
     * (It is not recommended to expose this route in a production environment)
     */
    if (process.env.NODE_ENV !== "production") {
      app.use("/", playground);
    }

    /**
     * Use @colyseus/monitor
     * It is recommended to protect this route with a password
     * Read more: https://docs.colyseus.io/tools/monitor/#restrict-access-to-the-panel-using-a-password
     */
    app.use("/colyseus", monitor());
  },

  beforeListen: () => {
    /**
     * Before before gameServer.listen() is called.
     */
  },
});
