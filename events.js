import { GamePhase, LaneAxis, Direction } from "./objects.js";

export function selectLaneFromKeyboard(event, game) {
  switch (event.key) {
    case "ArrowUp": {
      if (game.labyrinth.selectedLaneY - 2 > 0) {
        game.labyrinth.selectedLaneY -= 2;
      }
      else {
        game.labyrinth.selectedLaneY = game.labyrinth.dimension - 2;
      }
      game.labyrinth.selectLane(LaneAxis.HORIZONTAL);
      game.labyrinth.fillSelectedLane("green");
    } break;

    case "ArrowDown": {
      if (game.labyrinth.selectedLaneY + 2 < game.labyrinth.dimension) {
        game.labyrinth.selectedLaneY += 2;
      }
      else {
        game.labyrinth.selectedLaneY = 1;
      }
      game.labyrinth.selectLane(LaneAxis.HORIZONTAL);
      game.labyrinth.fillSelectedLane("green");
    } break;

    case "ArrowLeft": {
      if (game.labyrinth.selectedLaneX - 2 > 0) {
        game.labyrinth.selectedLaneX -= 2;
      }
      else {
        game.labyrinth.selectedLaneX = game.labyrinth.dimension - 2;
      }
      game.labyrinth.selectLane(LaneAxis.VERTICAL);
      game.labyrinth.fillSelectedLane("green");
    } break;

    case "ArrowRight": {
      if (game.labyrinth.selectedLaneX + 2 < game.labyrinth.dimension) {
        game.labyrinth.selectedLaneX += 2;
      }
      else {
        game.labyrinth.selectedLaneX = 1;
      }
      game.labyrinth.selectLane(LaneAxis.VERTICAL);
      game.labyrinth.fillSelectedLane("green");
    } break;

    case "Enter": {
      if (game.labyrinth.selectionAxis == LaneAxis.VERTICAL &&
          game.labyrinth.laneEntryPoint != Direction.UP  &&
          game.labyrinth.laneEntryPoint != Direction.DOWN) 
      {
        game.labyrinth.laneEntryPoint = Direction.UP
      }
      else if (game.labyrinth.selectionAxis == LaneAxis.HORIZONTAL &&
               game.labyrinth.laneEntryPoint != Direction.LEFT  &&
               game.labyrinth.laneEntryPoint != Direction.RIGHT)
      {
        game.labyrinth.laneEntryPoint = Direction.LEFT
      }
      game.labyrinth.moveOuterTileToEntryPoint();

      game.gamePhase = GamePhase.MOVE_LANE;
      game.labyrinth.fillSelectedLane("purple");
    } break;
  }
}

export function moveLaneFromKeyboard(event, game) {
  switch (event.key) {
    case "Escape": {
      game.gamePhase = GamePhase.SELECT_LANE;
      game.labyrinth.fillSelectedLane("green");
    } break;

    case "ArrowLeft": {
      if (game.labyrinth.selectionAxis == LaneAxis.HORIZONTAL) {
        game.labyrinth.laneEntryPoint = Direction.LEFT;
        game.labyrinth.moveOuterTileToEntryPoint();
      }
    } break;

    case "ArrowRight": {
      if (game.labyrinth.selectionAxis == LaneAxis.HORIZONTAL) {
        game.labyrinth.laneEntryPoint = Direction.RIGHT;
        game.labyrinth.moveOuterTileToEntryPoint();
      }
    } break;

    case "ArrowUp": {
      if (game.labyrinth.selectionAxis == LaneAxis.VERTICAL) {
        game.labyrinth.laneEntryPoint = Direction.UP;
        game.labyrinth.moveOuterTileToEntryPoint();
      }
    } break;

    case "ArrowDown": {
      if (game.labyrinth.selectionAxis == LaneAxis.VERTICAL) {
        game.labyrinth.laneEntryPoint = Direction.DOWN;
        game.labyrinth.moveOuterTileToEntryPoint();
      }
    } break;

    case "Enter": {
      game.labyrinth.moveLane();
      if (!game.labyrinth.getOuterTile().haveTreasure) {
        game.labyrinth.getOuterTile().material.color.setColorName("white");
      }
      else {
        game.labyrinth.getOuterTile().material.color.setColorName("gold");
      }
      //TODO: Player path finding and then GamePhase.MOVE_PLAYER 
      // Remove these two lines bellow once TODO done
      game.labyrinth.fillSelectedLane("green");
      game.gamePhase = GamePhase.SELECT_LANE;
    } break;
  }
}
