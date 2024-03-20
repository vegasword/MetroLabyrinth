import express from "express";
import { createServer } from "http";
import { Server, Socket } from "socket.io";
import { Vector3 } from "three";

import * as GAME from "./game";

export const gameServer = createServer(express());
const io = new Server(gameServer, {
  cors: { origin: "http://localhost:5173", methods: ["GET", "POST"] }
});

let game = new GAME.Instance();

io.on("connection", (socket : Socket) => {
  socket.emit("server:onConnected", { 
    dimension: game.labyrinth.dimension, 
    phase: game.phase,
    tiles: game.labyrinth.tiles,
    pawns: game.labyrinth.pawns,
    treasures: game.labyrinth.treasures
  });  
  
  socket.on("client:selectEntry", (entryPoint : Vector3) => {
    const outerTile = game.labyrinth.getOuterTile();
    outerTile.move(entryPoint.x, entryPoint.z, true, socket);
    game.labyrinth.moveTreasureIfExists(outerTile, entryPoint.x, entryPoint.z, socket);
  });

  socket.on("client:rotateTile", () => {
    game.labyrinth.getOuterTile().rotate(1, GAME.Rotation.CLOCKWISE, socket);
  })
});
