import { WebSocket } from "ws";
import { RoomManager } from "./RoomManager";
import { OutgoingMessage } from "./types";
import client from "@repo/db/client";
import jwt, { JwtPayload } from "jsonwebtoken";
import { JWT_PASSWORD } from "./config";

function getRandomString(length: number) {
    const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    let result = "";
    for (let i = 0; i < length; i++) {
        result += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    return result;
}

export class User {
    public id: string;
    public userId?: string;
    private spaceId?: string;
    public x: number;
    public y: number;
    private ws: WebSocket;

    constructor(ws: WebSocket) {
        this.id = getRandomString(10);
        this.x = 0;
        this.y = 0;
        this.ws = ws;
        this.initHandlers()
    }

    initHandlers() {
        this.ws.on("message", async (data) => {
            console.log(data)
            const parsedData = JSON.parse(data.toString());
            console.log(parsedData)
            console.log("parsedData")
            switch (parsedData.type) {
                case "join":
                    console.log("join received")
                    const spaceId = parsedData.payload.spaceId;
                    const token = parsedData.payload.token;
                    const userId = (jwt.verify(token, JWT_PASSWORD) as JwtPayload).userId
                    if (!userId) {
                        this.ws.close()
                        return
                    }
                    console.log("join received 2")
                    this.userId = userId
                    const space = await client.space.findFirst({
                        where: {
                            id: spaceId
                        }
                    })
                    
                    console.log("join received 3")
                    if (!space) {
                        this.ws.close()
                        return;
                    }
                    console.log("join received 4")
                    this.spaceId = spaceId
                    // Use grid dimensions instead of pixel dimensions
                    // Canvas is 800x600 with 50px grid = 16x12 grid cells
                    const gridWidth = 16;  // 800/50
                    const gridHeight = 12; // 600/50
                    this.x = Math.floor(Math.random() * gridWidth);
                    this.y = Math.floor(Math.random() * gridHeight);
                    
                    // Get existing users BEFORE adding current user to room
                    const existingUsers = RoomManager.getInstance().rooms.get(spaceId)?.map((u) => ({
                        userId: u.userId,
                        x: u.x,
                        y: u.y
                    })) ?? [];
                    
                    // Add current user to room
                    RoomManager.getInstance().addUser(spaceId, this);
                    
                    // Send space-joined message with existing users
                    this.send({
                        type: "space-joined",
                        payload: {
                            userId: this.userId,
                            spawn: {
                                x: this.x,
                                y: this.y
                            },
                            users: existingUsers
                        }
                    });
                    console.log("Space joined - sent to user:", this.userId, "at position:", this.x, this.y);
                    console.log("Existing users in space:", existingUsers.length);
                    console.log("Broadcasting user-joined to other users in space:", this.spaceId);
                    RoomManager.getInstance().broadcast({
                        type: "user-joined",
                        payload: {
                            userId: this.userId,
                            x: this.x,
                            y: this.y
                        }
                    }, this, this.spaceId!);
                    break;
                case "move":
                    const moveX = parsedData.payload.x;
                    const moveY = parsedData.payload.y;
                    const xDisplacement = Math.abs(this.x - moveX);
                    const yDisplacement = Math.abs(this.y - moveY);
                    
                    // Check if movement is valid (1 step in any direction)
                    const isValidMovement = (xDisplacement == 1 && yDisplacement == 0) || (xDisplacement == 0 && yDisplacement == 1);
                    
                    // Check if new position is within canvas boundaries
                    // Canvas is 800x600 with 50px grid = 16x12 grid cells (0-15, 0-11)
                    const isWithinBounds = moveX >= 0 && moveX < 16 && moveY >= 0 && moveY < 12;
                    
                    if (isValidMovement && isWithinBounds) {
                        this.x = moveX;
                        this.y = moveY;
                        RoomManager.getInstance().broadcast({
                            type: "movement",
                            payload: {
                                userId: this.userId,
                                x: this.x,
                                y: this.y
                            }
                        }, this, this.spaceId!);
                        return;
                    }
                    
                    this.send({
                        type: "movement-rejected",
                        payload: {
                            x: this.x,
                            y: this.y
                        }
                    });
                    
            }
        });
    }

    destroy() {
        RoomManager.getInstance().broadcast({
            type: "user-left",
            payload: {
                userId: this.userId
            }
        }, this, this.spaceId!);
        RoomManager.getInstance().removeUser(this, this.spaceId!);
    }

    send(payload: OutgoingMessage) {
        this.ws.send(JSON.stringify(payload));
    }
}