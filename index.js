import { serve, file } from "bun";
import { v4 as uuidv4 } from "uuid";

const connections = [];

const server = serve({
  port: 8000,
  fetch: async (request, server) => {
    if (server.upgrade(request)) {
      return new Response(null, { status: 101 });
    }
    return new Response(await file("index.html"), {
      headers: { "Content-Type": "text/html" },
    });
  },
  websocket: {
    open(ws, request) {
      ws.id = uuidv4();
      ws.name = generateRandomName();
      connections.push(ws);

      // Notify all clients about the updated connections
      updateConnections();
    },

    message(ws, message) {
      try {
        const parsedMessage = JSON.parse(message);
        const type = parsedMessage.type;

        switch (type) {
          case "CHAT":
            sendChatMessage(ws, parsedMessage);
            break;
          default:
            console.warn("Unknown message type:", type);
            break;
        }
      } catch (error) {
        console.error("Error parsing message:", error);
      }
    },

    close(ws) {
      console.log(`WebSocket connection closed: ${ws.id}`);
      const index = connections.findIndex((conn) => conn.id === ws.id);
      if (index !== -1) {
        connections.splice(index, 1);
      }

      // Notify all clients about the updated connections
      updateConnections();
    },
  },
});

console.log(`Server running on http://localhost:${server.port}`);

// Helper function to update all clients with the list of connections
function updateConnections() {
  const updateMessage = JSON.stringify({
    type: "UPDATE",
    connections: connections.map((conn) => ({
      id: conn.id,
      name: conn.name,
    })),
  });

  connections.forEach((connection) => {
    connection.send(updateMessage);
  });
}

// Helper function to generate random names
function generateRandomName() {
  const adjectives = [
    "Red",
    "Blue",
    "Green",
    "Yellow",
    "Purple",
    "Orange",
    "Pink",
    "Black",
    "White",
  ];
  const nouns = [
    "Lion",
    "Tiger",
    "Bear",
    "Eagle",
    "Wolf",
    "Dolphin",
    "Elephant",
    "Giraffe",
    "Kangaroo",
  ];

  const randomAdjective =
    adjectives[Math.floor(Math.random() * adjectives.length)];
  const randomNoun = nouns[Math.floor(Math.random() * nouns.length)];
  return randomAdjective + randomNoun;
}

// Helper function to send chat messages
function sendChatMessage(ws, message) {
  const author = ws.name;
  const content = message.content;
  const date = new Date().toLocaleDateString();

  const chatMessage = JSON.stringify({
    type: "CHAT",
    author,
    content,
    date,
  });

  connections.forEach((connection) => {
    connection.send(chatMessage);
  });
}
