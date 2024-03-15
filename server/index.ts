import { lobbyServer } from "./lobby.server";
import { gameServer } from "./src/game.server";

lobbyServer.listen(8001, () => {
  console.log("Lobby server is running on port 8001");
});

gameServer.listen(8002, () => {
  console.log("Game server running on port 8002");
});
