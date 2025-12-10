require("dotenv").config();

const express = require("express");
const cors = require("cors");
const { MongoClient, ObjectId, ServerApiVersion } = require("mongodb");
const Stripe = require("stripe");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const cookieParser = require("cookie-parser");
const app = express();
const port = process.env.PORT || 3000;

const stripe = Stripe(process.env.STRIPE_SECRET_KEY);

// middleware
app.use(cookieParser());
app.use(express.json());
app.use(
  cors({
    origin: ["http://localhost:5173", "http://localhost:5174"],
    credentials: true,
  })
);
const uri = process.env.MONGODB_URL;

const verifyJWTToken = (req, res, next) => {
  const token = req.cookies?.token;
  if (!token) {
    return res.status(401).send({ message: "unauthorized access" });
  }
  jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
    if (err) {
      return res.status(401).send({ message: "unauthorized access" });
    }
    req.user = decoded;
    next();
  });
};

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

    // get JWT Token
    app.post("/getToken", async (req, res) => {
      const userInfo = req.body;
      const token = jwt.sign(userInfo, process.env.JWT_SECRET, {
        expiresIn: "1h",
      });
      res
        .cookie("token", token, {
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
          sameSite: process.env.NODE_ENV === "production" ? "none" : "strict",
        })
        .send({ success: true });
    });

    app.post("/logout", async (req, res) => {
      res
        .clearCookie("token", {
          maxAge: 0,
          secure: process.env.NODE_ENV === "production",
          sameSite: process.env.NODE_ENV === "production" ? "none" : "strict",
        })
        .send({ success: true });
    });

    //? scholarships api
    app.get("/scholarships", async (req, res) => {
      const {
        limit = 0,
        schCat = "",
        subCat = "",
        loc = "",
        search = "",
        sort = "",
      } = req.query;
      let sortFilter = { applicationFees: 1, scholarshipPostDate: -1 };

      const query = {};
      if (sort === "asc") {
        sortFilter = { applicationFees: 1 };
      }
      if (sort === "dsc") {
        sortFilter = { applicationFees: -1 };
      }
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
        .limit(Number(limit))
        .sort(sortFilter)
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
    app.post("/create-checkout-session", verifyJWTToken, async (req, res) => {
      const {
        totalPrice,
        userName,
        universityName,
        universityImage,
        scholarshipId,
        scholarshipName,
        scholarshipCategory,
        degree,
        applicationFees,
        serviceCharge,
      } = req.body;

      const tokenEmail = req.user.email;
      if (req.body.userEmail !== tokenEmail) {
        return res
          .status(403)
          .send({ message: "Forbidden: You can only apply for yourself" });
      }

      const userEmail = tokenEmail;

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
          return res.json({
            message:
              "You have a pending application. Please pay from your dashboard.",
            insertedId: null,
          });
        }
        // else user already paid
        else {
          return res.json({
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
        cancel_url: `${process.env.DOMAIN_URL}/payment/fail?scholarshipName=${scholarshipName}`,
      });

      res.json({ url: session.url });
    });

    app.patch("/payment/success", verifyJWTToken, async (req, res) => {
      const { sessionId } = req.body;

      try {
        const session = await stripe.checkout.sessions.retrieve(sessionId);
        const { amount_total, metadata, payment_intent, payment_status } =
          session;

        const tokenEmail = req.user.email;

        if (!metadata || !metadata.applicationId || !metadata.userEmail) {
          return res
            .status(400)
            .send({ success: false, message: "Invalid Session Metadata" });
        }

        const { applicationId, userEmail } = metadata;

        if (tokenEmail !== userEmail) {
          return res.status(403).send({
            success: false,
            message: "Forbidden: Access denied. Email mismatch.",
          });
        }

        if (payment_status === "paid") {
          const query = { _id: new ObjectId(applicationId) };

          const updatedDoc = {
            $set: {
              paymentStatus: payment_status,
              transactionId: payment_intent,
              amountPaid: amount_total / 100,
            },
          };

          const applicationUpdate = await applicationsCollection.updateOne(
            query,
            updatedDoc
          );

          if (applicationUpdate.modifiedCount) {
            const applicationInfo = await applicationsCollection.findOne(query);

            return res.status(200).json({
              success: true,
              data: applicationInfo,
              message: "Payment confirmed",
            });
          } else {
            // Handle case where it wasn't modified (maybe already paid)
            // when user reload or again come to the page
            const applicationInfo = await applicationsCollection.findOne(query);

            if (applicationInfo && applicationInfo.paymentStatus === "paid") {
              return res.status(200).json({
                success: true,
                message: "Already Paid",
                data: applicationInfo,
              });
            }
            return res
              .status(400)
              .send({ success: false, message: "Update failed" });
          }
        } else {
          return res
            .status(400)
            .send({ success: false, message: "Payment not completed" });
        }
      } catch (error) {
        console.error("Payment Error:", error);
        return res
          .status(500)
          .send({ success: false, message: "Internal Server Error" });
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
