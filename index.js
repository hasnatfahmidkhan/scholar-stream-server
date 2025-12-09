import dotenv from "dotenv";
dotenv.config();

import express from "express";
import cors from "cors";
import { MongoClient, ObjectId, ServerApiVersion } from "mongodb";
import Stripe from "stripe";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
const app = express();
const port = process.env.PORT || 3000;
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
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
    const applicationsCollection = db.collection("applications");

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
        .find(query, {
          projection: {
            postedUserEmail: 0,
            serviceCharge: 0,
            universityCity: 0,
            universityWorldRank: 0,
          },
        })
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

    //! payment api
    app.post("/create-checkout-session", async (req, res) => {
      const {
        totalPrice,
        userName,
        userEmail,
        universityName,
        universityImage,
        scholarshipId,
        scholarshipName,
        scholarshipCategory,
        degree,
        applicationFees,
        serviceCharge,
      } = req.body;

      const isScholarshipExits = await scholarshipsCollection.findOne({
        _id: new ObjectId(scholarshipId),
      });

      if (!isScholarshipExits) {
        return res.status(404).json({ message: "Scholarship not found" });
      }

      const isExitsApplication = await applicationsCollection.findOne({
        scholarshipId: scholarshipId,
        userEmail: userEmail,
      });

      if (isExitsApplication) {
        // if user unpaid then show this message
        if (isExitsApplication.paymentStatus === "unpaid") {
          return res.status(409).json({
            message:
              "You have a pending application. Please pay from your dashboard.",
            insertedId: null,
          });
        }
        // else user already paid
        else {
          return res.status(409).json({
            message:
              "You have already completed the application for this scholarship.",
            insertedId: null,
          });
        }
      }

      // if user not apply then insert data
      const applicationInfo = {
        scholarshipId,
        userEmail,
        userName,
        universityName,
        scholarshipCategory,
        degree,
        applicationFees,
        serviceCharge,
        applicationStatus: "pending",
        paymentStatus: "unpaid",
        applicationDate: new Date().toISOString(),
      };

      const applicatioinResult = await applicationsCollection.insertOne(
        applicationInfo
      );

      // Create Stripe Session
      const session = await stripe.checkout.sessions.create({
        payment_method_types: ["card"],
        line_items: [
          {
            price_data: {
              currency: "usd",
              product_data: {
                name: `Application for: ${scholarshipName}`,
                description: `University: ${universityName}`,
                images: [universityImage],
              },
              unit_amount: Math.round(totalPrice * 100),
            },
            quantity: 1,
          },
        ],
        customer_email: userEmail,
        mode: "payment",
        metadata: {
          applicationId: applicatioinResult.insertedId.toString(),
          scholarshipId: scholarshipId,
          userEmail: userEmail,
        },
        success_url: `${process.env.DOMAIN_URL}/payment/success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${process.env.DOMAIN_URL}/payment/fail`,
      });

      res.json({ url: session.url });
    });

    app.post("/payment-success", async (req, res) => {
      const { sessionId } = req.body;
      const session = await stripe.checkout.sessions.retrieve(sessionId);
      // console.log(session);
      const { amount_total, metadata, payment_intent, payment_status } =
        session;
      const { userEmail, userName } = metadata;
      if (payment_status === "paid") {
      }
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
