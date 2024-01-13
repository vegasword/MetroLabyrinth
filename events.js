import { GamePhase, LaneAxis, Direction } from "./objects.js";

export function selectLaneFromKeyboard(event, game) {
  switch (event.key) {
    case "ArrowUp": {
      if (game.labyrinth.selectedLaneY == -1) {
        game.labyrinth.selectedLaneY = 1;
      }
      else if (game.labyrinth.selectedLaneY - 2 > 0) {
        game.labyrinth.selectedLaneY -= 2;
      }
      game.labyrinth.selectLane(LaneAxis.HORIZONTAL);
      game.labyrinth.fillSelectedLane("green");
    } break;

    case "ArrowDown": {
      if (game.labyrinth.selectedLaneY + 2 < game.labyrinth.dimension) {
        game.labyrinth.selectedLaneY += 2;
      }
      game.labyrinth.selectLane(LaneAxis.HORIZONTAL);
      game.labyrinth.fillSelectedLane("green");
    } break;

    case "ArrowLeft": {
      if (game.labyrinth.selectedLaneX == -1) {
        game.labyrinth.selectedLaneX = 1;
      }
      else if (game.labyrinth.selectedLaneX - 2 > 0) {
        game.labyrinth.selectedLaneX -= 2;
      }
      game.labyrinth.selectLane(LaneAxis.VERTICAL);
      game.labyrinth.fillSelectedLane("green");
    } break;

    case "ArrowRight": {
      if (game.labyrinth.selectedLaneX + 2 < game.labyrinth.dimension) {
        game.labyrinth.selectedLaneX += 2;
      }
      game.labyrinth.selectLane(LaneAxis.VERTICAL);
      game.labyrinth.fillSelectedLane("green");
    } break;

    case "Enter": {
      if (game.labyrinth.selectionAxis == LaneAxis.VERTICAL &&
          game.labyrinth.laneMoveDirection != Direction.UP  &&
          game.labyrinth.laneMoveDirection != Direction.DOWN) 
      {
        game.labyrinth.laneMoveDirection = Direction.UP
      }
      else if (game.labyrinth.selectionAxis == LaneAxis.HORIZONTAL &&
               game.labyrinth.laneMoveDirection != Direction.LEFT  &&
               game.labyrinth.laneMoveDirection != Direction.RIGHT)
      {
        game.labyrinth.laneMoveDirection = Direction.LEFT
      }
      game.labyrinth.moveOutterTileToEntryPoint();

      game.gamePhase = GamePhase.MOVE_LANE;
      game.labyrinth.fillSelectedLane("yellow");
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
        game.labyrinth.laneMoveDirection = Direction.LEFT;
        game.labyrinth.moveOutterTileToEntryPoint();
      }
    } break;

    case "ArrowRight": {
      if (game.labyrinth.selectionAxis == LaneAxis.HORIZONTAL) {
        game.labyrinth.laneMoveDirection = Direction.RIGHT;
        game.labyrinth.moveOutterTileToEntryPoint();
      }
    } break;

    case "ArrowUp": {
      if (game.labyrinth.selectionAxis == LaneAxis.VERTICAL) {
        game.labyrinth.laneMoveDirection = Direction.UP;
        game.labyrinth.moveOutterTileToEntryPoint();
      }
    } break;

    case "ArrowDown": {
      if (game.labyrinth.selectionAxis == LaneAxis.VERTICAL) {
        game.labyrinth.laneMoveDirection = Direction.DOWN;
        game.labyrinth.moveOutterTileToEntryPoint();
      }
    } break;

    case "Enter": {
      game.labyrinth.moveLane();
      game.labyrinth.fillSelectedLane("green");
      game.labyrinth._getOutterTile().material.color.setColorName("white");
      //TODO: Player path finding and then GamePhase.MOVE_PLAYER 
      game.gamePhase = GamePhase.SELECT_LANE; // To remove one TODO done
    } break;
  }
}
