***

# ⚙️ ScholarStream Server

[![Node.js](https://img.shields.io/badge/Runtime-Node.js-339933?logo=node.js&logoColor=white)](https://nodejs.org/)
[![Express.js](https://img.shields.io/badge/Framework-Express.js-000000?logo=express&logoColor=white)](https://expressjs.com/)
[![MongoDB](https://img.shields.io/badge/Database-MongoDB-47A248?logo=mongodb&logoColor=white)](https://www.mongodb.com/)
[![JWT](https://img.shields.io/badge/Auth-JWT-000000?logo=jsonwebtokens&logoColor=white)](https://jwt.io/)
[![Stripe](https://img.shields.io/badge/Payment-Stripe-008CDD?logo=stripe&logoColor=white)](https://stripe.com/)

The robust backend infrastructure powering the **ScholarStream** platform. This RESTful API manages user authentication, scholarship data, application workflows, payment processing via Stripe, and administrative analytics using advanced MongoDB aggregations.

---

## 🔗 Project Links
- **Live API URL:** [https://scholar-stream-server-nine.vercel.app/](https://scholar-stream-server-nine.vercel.app/)
- **Client Repository:** [ScholarStream Client](https://github.com/hasnatfahmidkhan/scholar-stream)

---

## 🛠️ Tech Stack
- **Runtime:** Node.js
- **Framework:** Express.js
- **Database:** MongoDB (Native Driver)
- **Authentication:** JWT (JSON Web Tokens) with HttpOnly Cookies
- **Payment:** Stripe API (Checkout Sessions)
- **Environment:** Dotenv

---

## ✨ Key Server Features
- **🛡️ Secure Authentication:** Implements JWT with `httpOnly`, `secure`, and `sameSite` cookie attributes for robust session management.
- **👮 Role-Based Access Control (RBAC):** Custom middleware (`verifyToken`, `verifyAdmin`, `verifyModerator`) ensures data integrity.
- **🔒 Super Admin Protection:** Special logic prevents the deletion or demotion of the main Admin account (`isProtected: true`).
- **💳 Secure Payments:** Stripe Payment Intent verification ensures database records are only updated after successful payment confirmation.
- **📈 Advanced Analytics:** Uses MongoDB Aggregation Pipelines (`$group`, `$lookup`, `$unwind`) to generate reports on revenue, top universities, and category popularity.
- **🔍 Public Data APIs:** Lightweight public endpoints for Home Page statistics, top-rated reviews, and trusted university partners.

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
Create a `.env` file in the root directory and add the following:
```env
PORT=5000
MONGODB_URL=mongodb+srv://<username>:<password>@cluster.mongodb.net/SchollerStream
JWT_SECRET=your_secure_random_string
STRIPE_SECRET_KEY=sk_test_...
NODE_ENV=development
DOMAIN_URL=http://localhost:5173
```

### 4. Run the Server
```bash 
# Production start
npm start

# Development mode (Nodemon)
npm run dev
```

---

## 📡 API Endpoints Overview

### 🔐 Auth & Users
| Method | Endpoint | Description | Access |
| :--- | :--- | :--- | :--- |
| POST | `/getToken` | Generate JWT & set Cookie | Public |
| POST | `/logout` | Clear Cookie | Public |
| POST | `/users` | Register new user | Public |
| GET | `/users` | Get all users | Admin |
| PATCH | `/users/role/:id` | Promote/Demote User | Admin |
| DELETE | `/users/:id` | Delete User (Protected Check) | Admin |

### 🎓 Scholarships
| Method | Endpoint | Description | Access |
| :--- | :--- | :--- | :--- |
| GET | `/scholarships` | Get all (Search, Filter, Sort) | Public |
| GET | `/scholarship/:id` | Get details & recommendations | Private |
| POST | `/add-scholarship` | Create new scholarship | Admin |
| PATCH | `/scholarship/:id` | Update scholarship | Admin |
| DELETE | `/scholarship/:id` | Delete scholarship | Admin |

### 📝 Applications & Payment
| Method | Endpoint | Description | Access |
| :--- | :--- | :--- | :--- |
| POST | `/create-checkout-session` | Initialize Stripe Payment | Student |
| PATCH | `/payment/success` | Verify Payment & Save App | Student |
| GET | `/applications` | Get all applications | Moderator |
| GET | `/applications/:email/byUser` | Get my applications | Student |
| PATCH | `/applications/feedback/:id` | Give Feedback | Moderator |
| PATCH | `/applications/:id` | Update Status (Pending/Completed) | Moderator |

### 🏠 Public Home APIs
| Method | Endpoint | Description | Access |
| :--- | :--- | :--- | :--- |
| GET | `/home-stats` | Counts (Users, Reviews, Funds) | Public |
| GET | `/top-universities` | Unique universities list | Public |
| GET | `/top-reviews` | 5-star reviews for slider | Public |

### 📊 Admin Analytics
| Method | Endpoint | Description | Access |
| :--- | :--- | :--- | :--- |
| GET | `/analytics` | Revenue & Application charts data | Admin |

---

## 📂 Database Collections
1.  **`users`**: Stores user profiles, roles, and protection flags.
2.  **`scholarships`**: Stores university details, fees, deadlines, and requirements.
3.  **`applications`**: Stores applicant info, payment transaction IDs, and status.
4.  **`reviews`**: Stores student testimonials and ratings.
5.  **`wishlists`**: Stores bookmarked scholarships for students.

---

## 📦 Main Dependencies
```json
"dependencies": {
  "cookie-parser": "^1.4.7",
  "cors": "^2.8.5",
  "dotenv": "^16.3.1",
  "express": "^4.18.2",
  "jsonwebtoken": "^9.0.2",
  "mongodb": "^6.3.0",
  "stripe": "^14.5.0"
}
```

### 📞 Contact
**Developed by Hasnat Fahmid Khan**