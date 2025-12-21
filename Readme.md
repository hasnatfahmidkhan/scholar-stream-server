# ⚙️ ScholarStream Server

[![Node.js](https://img.shields.io/badge/Runtime-Node.js-339933?logo=node.js&logoColor=white)](https://nodejs.org/)
[![Express.js](https://img.shields.io/badge/Framework-Express.js-000000?logo=express&logoColor=white)](https://expressjs.com/)
[![MongoDB](https://img.shields.io/badge/Database-MongoDB-47A248?logo=mongodb&logoColor=white)](https://www.mongodb.com/)
[![JWT](https://img.shields.io/badge/Auth-JWT-000000?logo=jsonwebtokens&logoColor=white)](https://jwt.io/)
[![Stripe](https://img.shields.io/badge/Payment-Stripe-008CDD?logo=stripe&logoColor=white)](https://stripe.com/)

The robust backend infrastructure powering the **ScholarStream** platform. This RESTful API manages user authentication, scholarship data, application workflows, payment processing via Stripe, and administrative analytics.

---

## 🔗 Live API URL
- **Base URL:** [https://scholar-stream-server-nine.vercel.app/](https://scholar-stream-server-nine.vercel.app/)
- **Client Repository:** [ScholarStream Client](https://github.com/hasnatfahmidkhan/scholar-stream)

---

## 🛠️ Tech Stack
- **Runtime Environment:** Node.js
- **Web Framework:** Express.js
- **Database:** MongoDB (Native Driver)
- **Authentication:** JSON Web Tokens (JWT) & Cookie Parser
- **Payment Gateway:** Stripe API
- **Security:** CORS, Environment Variables

---

## ✨ Key Server Features
- **Secure Authentication:** Implements JWT (JSON Web Tokens) with HTTP-Only cookies for secure session management.
- **Role-Based Access Control (RBAC):** Middleware (`verifyToken`, `verifyAdmin`, `verifyModerator`) to restrict access based on user roles.
- **Payment Processing:** Integrated Stripe Payment Intents/Sessions to handle secure transactions.
- **Advanced Querying:** Supports search, filtering, and sorting for scholarship data using MongoDB aggregation and query operators.
- **Analytics:** Aggregation pipelines to calculate platform statistics (total users, fees, applications) for the Admin Dashboard.

---

## 🚀 Installation & Local Setup

### 1. Clone the Repository
```bash
git clone https://github.com/hasnatfahmidkhan/scholar-stream-server.git
cd scholar-stream-server
```

### 2. Install Dependencies
```bash 
npm install
```

### 3. Configure Environment Variables
Create a .env file in the root directory and add the following:
```bash
PORT=5000
DB_USER=your_mongodb_username
DB_PASS=your_mongodb_password
ACCESS_TOKEN_SECRET=your_random_secure_string_for_jwt
STRIPE_SECRET_KEY=your_stripe_secret_key
NODE_ENV=development
```

### 4. Run the Server
```bash 
# Production mode
npm start

# Development mode (with Nodemon)
npm run dev
```

### 📡 API Endpoints Overview
#### 🔐 Authentication
| Method | Endpoint | Description |
| :--- | :--- | :--- |
| POST | /getToken | Generate JWT token and set cookie |
| POST | /logout | Clear session and remove cookie |

#### 👤 Users
| Method | Endpoint | Description |
| :--- | :--- | :--- |
| POST | /users | Create a new user (Student) |
| GET | /users | Get all users (Admin only) |
| GET | /users/:email | Get single user details |
| PATCH | /users/role/:id | Update user role (Admin only) |
| DELETE | /users/:id | Delete a user (Admin only) |

#### 🎓 Scholarships
| Method | Endpoint | Description |
| :--- | :--- | :--- |
| GET | /scholarships | Get all scholarships (with search/filter) |
| GET | /scholarship/:id | Get single scholarship details |
| POST | /scholarship | Add a new scholarship (Admin/Mod) |
| PATCH | /scholarship/:id | Update |

#### 📝 Applications
| Method | Endpoint | Description |
| :--- | :--- | :--- |
| POST | /apply | Submit a scholarship application |
| GET | /application/:email | Get applications by user email |
| GET | /all-applications | Get all applications (Moderator) |
| PATCH | /application/status/:id | Update status (Pending/Processing/Completed) |
| PATCH | /application/feedback/:id | Add moderator feedback |

#### 💳 Payments
| Method | Endpoint | Description |
| :--- | :--- | :--- |
| POST | /create-checkout-session | Create Stripe payment session |
| PATCH | /payment/success | Verify payment and update DB status |

#### 📊 Analytics
| Method | Endpoint | Description |
| :--- | :--- | :--- |
| GET | /admin-stats | Get total users, revenue, and application counts |

### 📦 Dependencies
```bash
"dependencies": {
  "bcrypt": "^6.0.0",
  "cookie-parser": "^1.4.7",
  "cors": "^2.8.5",
  "dotenv": "^17.2.3",
  "express": "^5.2.1",
  "jsonwebtoken": "^9.0.3",
  "mongodb": "^7.0.0",
  "stripe": "^20.0.0"
}
```
#### Developed by Hasnat Fahmid Khan
