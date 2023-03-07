import express from "express";
import cors from "cors";
import userRoutes from "./routes/userRoutes.js";
import timelineRoutes from "./routes/timelineRoutes.js";


const server = express();
server.use(express.json());
server.use(cors());



server.use([userRoutes, timelineRoutes]);
const PORT = process.env.PORT || 5000;


server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`)
})