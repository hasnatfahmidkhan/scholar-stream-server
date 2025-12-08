import dotenv from "dotenv";
dotenv.config();

import express from "express";
import cors from "cors";
import { MongoClient, ObjectId, ServerApiVersion } from "mongodb";
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
    const scholarshipsCollection = db.collection("scholarships");

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

    //? scholarships api
    app.get("/scholarships", async (req, res) => {
      const sort = { applicationFees: 1, scholarshipPostDate: -1 };
      const {
        limit = 0,
        schCat = "",
        subCat = "",
        loc = "",
        search = "",
      } = req.query;

      const query = {};
      if (schCat) {
        query.scholarshipCategory = { $regex: schCat, $options: "i" };
      }
      if (subCat) {
        query.subjectCategory = { $regex: subCat, $options: "i" };
      }
      if (loc) {
        query.universityCountry = { $regex: loc, $options: "i" };
      }

      if (search) {
        query.$or = [
          { scholarshipName: { $regex: search, $options: "i" } },
          { universityName: { $regex: search, $options: "i" } },
          { degree: { $regex: search, $options: "i" } },
        ];
      }

      const result = await scholarshipsCollection
        .find(query)
        .sort(sort)
        .toArray();
      res.status(200).json(result);
    });

    app.get("/scholarship/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await scholarshipsCollection.findOne(query);
      res.status(200).json(result);
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
