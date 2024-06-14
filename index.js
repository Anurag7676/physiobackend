const express = require("express");
const cors = require("cors");
const admin = require("firebase-admin");
const serviceAccount = require("./key.json");

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();

const port = process.env.PORT || 3000;

app.get("/", (req, res) => {
  res.send("Hello World!");
});

// Endpoint to add chat data
app.post("/add-data", async (req, res) => {
  console.log("called");
  try {
    const userId = req.body.userId;
    const chat = req.body.chat;

    // Create a reference to the user's chat collection
    const userChatsRef = db.collection("users").doc(userId).collection("chats");

    // Add a new chat document with a generated ID
    await userChatsRef.add({
      chat: chat,
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
    });

    res.status(200).send("Chat history saved successfully");
  } catch (error) {
    console.error("Error saving chat history:", error);
    res.status(500).send("Error saving chat history");
  }
});

// Endpoint to get all chat sessions for a specific user
app.get("/get-chats/:userId", async (req, res) => {
  try {
    const userId = req.params.userId;

    // Create a reference to the user's chat collection
    const userChatsRef = db.collection("users").doc(userId).collection("chats");

    // Retrieve chat documents
    const snapshot = await userChatsRef.orderBy("timestamp").get();

    if (snapshot.empty) {
      res.status(404).send("No chat history found");
      return;
    }

    const chatHistory = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    res.status(200).json(chatHistory);
  } catch (error) {
    console.error("Error retrieving chat history:", error);
    res.status(500).send("Error retrieving chat history");
  }
});

app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
