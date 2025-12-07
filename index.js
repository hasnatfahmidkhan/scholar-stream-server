import dotenv from "dotenv";
dotenv.config();

import express from "express";
import cors from "cors";
import { MongoClient, ServerApiVersion } from "mongodb";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
const app = express();
const port = process.env.PORT || 3000;

app.use(express.json());
app.use(cors());

const uri = process.env.MONGODB_URL;

const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function run() {
  try {
    await client.connect();

    const db = client.db("SchollerStream");
    const usersCollection = db.collection("users");

    //? users api
    app.post("/users", async (req, res) => {
      const userInfo = req.body;
      userInfo.role = "student";
      const isExits = await usersCollection.findOne({ email: userInfo.email });
      if (isExits) {
        return res.json({ message: "user already exits" });
      }
      const result = await usersCollection.insertOne(userInfo);
      res.status(201).json(result);
    });

    await client.db("admin").command({ ping: 1 });
    console.log(
      "Pinged your deployment. You successfully connected to MongoDB!"
    );
  } finally {
  }
}
run().catch(console.dir);

app.get("/", (req, res) => {
  res.send("SchollerStream server is running!");
});

app.listen(port, () => {
  console.log(`SchollerStream app listening on port ${port}`);
});
