import { lobbyServer } from "./lobby.server";

lobbyServer.listen(8001, () => {
  console.log(`Server is running on port 8001`);
});
