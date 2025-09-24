import { WebSocket } from "ws";
import { RoomManager } from "./RoomManager";
import { OutgoingMessage } from "./types";
// Mock Prisma client for now to avoid configuration issues
const client = {
  user: {
    findUnique: () => Promise.resolve(null),
    create: () => Promise.resolve({ id: 1, username: "test" }),
    update: () => Promise.resolve({ id: 1, username: "test" }),
  },
  space: {
    findFirst: () => Promise.resolve({ id: 1, name: "Test Space" }),
    findMany: () => Promise.resolve([]),
    create: () => Promise.resolve({ id: 1, name: "Test Space" }),
    update: () => Promise.resolve({ id: 1, name: "Test Space" }),
    delete: () => Promise.resolve({ id: 1 }),
  },
  element: {
    findMany: () => Promise.resolve([]),
    create: () => Promise.resolve({ id: 1 }),
    update: () => Promise.resolve({ id: 1 }),
    delete: () => Promise.resolve({ id: 1 }),
  },
};
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
    public username?: string;
    private spaceId?: string;
    public x: number;
    public y: number;
    public health: number;
    private ws: WebSocket;

    constructor(ws: WebSocket) {
        this.id = getRandomString(10);
        this.x = 0;
        this.y = 0;
        this.health = 100;
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
                    const decoded = jwt.verify(token, JWT_PASSWORD) as JwtPayload
                    const userId = decoded.userId
                    if (!userId) {
                        this.ws.close()
                        return
                    }
                    console.log("join received 2")
                    this.userId = userId
                    
                    // Fetch user data to get username
                    const userData = await client.user.findUnique({
                        where: { id: userId }
                    })
                    this.username = userData?.username || `User ${userId}`
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
                        username: u.username,
                        x: u.x,
                        y: u.y,
                        health: u.health
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
                            username: this.username,
                            x: this.x,
                            y: this.y,
                            health: this.health
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
                                username: this.username,
                                x: this.x,
                                y: this.y,
                                health: this.health
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
                    break;
                case "shoot":
                    const bullet = parsedData.payload.bullet;
                    if (bullet && bullet.owner === this.userId) {
                        // Broadcast bullet to all users in the room
                        RoomManager.getInstance().broadcast({
                            type: "bullet-shot",
                            payload: {
                                bullet: {
                                    id: bullet.id,
                                    x: bullet.x,
                                    y: bullet.y,
                                    direction: bullet.direction,
                                    speed: bullet.speed,
                                    owner: bullet.owner
                                }
                            }
                        }, this, this.spaceId!);
                    }
                    break;
                case "bullet-hit":
                    const hitUserId = parsedData.payload.targetUserId;
                    const damage = parsedData.payload.damage || 20;
                    
                    if (hitUserId && this.spaceId) {
                        const roomUsers = RoomManager.getInstance().rooms.get(this.spaceId) || [];
                        const targetUser = roomUsers.find(u => u.userId === hitUserId);
                        
                        if (targetUser && targetUser.health > 0) {
                            targetUser.health = Math.max(0, targetUser.health - damage);
                            
                            // Broadcast health update to all users
                            RoomManager.getInstance().broadcast({
                                type: "health-update",
                                payload: {
                                    userId: hitUserId,
                                    health: targetUser.health,
                                    damage: damage,
                                    attackerId: this.userId
                                }
                            }, this, this.spaceId);
                            
                            // If health reaches 0, broadcast player death
                            if (targetUser.health <= 0) {
                                RoomManager.getInstance().broadcast({
                                    type: "player-death",
                                    payload: {
                                        userId: hitUserId,
                                        killerId: this.userId
                                    }
                                }, this, this.spaceId);
                            }
                        }
                    }
                    break;
                    
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