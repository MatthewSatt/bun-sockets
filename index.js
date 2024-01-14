import { serve, file } from "bun";
import { v4 as uuidv4 } from "uuid";

const connections = [];

const server = serve({
  port: 8000,
  fetch: async (request, server) => {
    if (server.upgrade(request)) {
      return new Response(null, { status: 101 });
    }
    return new Response(file("index.html"), {
      headers: { "Content-Type": "text/html" },
    });
  },
  websocket: {
    open(ws, request) {
      ws.id = uuidv4();
      ws.name = generateRandomName();
      connections.push(ws);

      connections.forEach((connection) => {
        const newUserMessage = JSON.stringify({
          type: "UPDATE",
          connections: connections,
        });
        connection.send(newUserMessage);
      });
    },

    message(ws, message) {
        try {
          let parsedMessage = JSON.parse(message);
          let type = parsedMessage.type;

          switch(type) {
            case "CHAT":
              sendChatMessage(ws, parsedMessage);
              break;
          }
        } catch (error) {
          console.error("Error parsing message:", error);
        }
      },

    closed(ws) {
      console.log("WebSocket connection closed");
      const index = connections.findIndex(
        (connection) => connection.id === ws.id
      );
      if (index !== -1) {
        connections.splice(index, 1);
      }
    },
  },
});

console.log(`Server running on http://localhost:${server.port}`);

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

const sendChatMessage = (ws, message) => {
    let author = ws.name;
    let content = message.content;
    let date = new Date().toLocaleDateString();

    connections.forEach((connection) => {
        const newChat = JSON.stringify({
          type: "CHAT",
          author: author,
          content: content,
          date: date
        });
        connection.send(newChat);
      });
}
