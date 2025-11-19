require("dotenv").config();
const express = require("express");
const cors = require("cors");
const path = require("path");
const connectDB = require("./config/db");
const authRoutes = require("./routes/authRoutes");
const postsRoutes = require("./routes/postsRoutes");
const userRoutes = require("./routes/userRoutes");
const sectionRoutes = require("./routes/sectionRoutes");
const commentRoutes = require('./routes/commentRoutes');

const app = express();

connectDB();


app.use(cors());
app.use(express.json());

app.use(express.static(path.join(__dirname, "../frontend/public")));

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "../frontend/public/src/html/index.html"));
});

app.use(
  "/assets/uploads",
  express.static(path.join(__dirname, "../frontend/public/assets/uploads"))
);

app.use("/api/auth", authRoutes);
app.use("/api/posts", postsRoutes);
app.use("/api/users", userRoutes);
app.use('/api', commentRoutes);
app.use("/api/sections", sectionRoutes);

const PORT = 5000;
app.listen(PORT, () =>
  console.log(`Server running on http://localhost:${PORT}`)
);
