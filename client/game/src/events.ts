/*
export function placeTile(event : MouseEvent, client : GameClient) {
  if (event.button == 0) {
    game.labyrinth.moveLane();
    game.labyrinth.playerPathFinding(game.getPlayerTile());
    if (game.labyrinth.pathFoundTiles.length == 1) {
      game.nextRound();
      game.phase = GamePhase.PLACE_TILE;
    } else {
      game.phase = GamePhase.MOVE_PLAYER;
    }
  }
}

export function movePlayer(e : MouseEvent, client : GameClient) {
  if (e.button == 0) {
    let ndc = new THREE.Vector2(
      (e.clientX / gameViewport.clientWidth) * 2 - 1.5,
      -(e.clientY / gameViewport.clientHeight) * 2 + 1
    );
    game.raycaster.setFromCamera(ndc, game.camera.perspective);
    
    const pathFoundTilesMeshes = game.labyrinth.pathFoundTiles.map(({mesh})=>mesh);
    let intersects = game.raycaster.intersectObjects(pathFoundTilesMeshes);
    if (intersects.length > 0) {
      let tilePosition = intersects[0].object.position;
      game.labyrinth.pawns[game.currentPawn].move(tilePosition.x, tilePosition.z);
      game.phase = GamePhase.PLACE_TILE;
      game.nextRound();
    }
  }
}
*/
