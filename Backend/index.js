import express from "express";
import mongoose from "mongoose";
import bodyParser from "body-parser";
import dotenv from "dotenv";

const app = express()
app.use(bodyParser.json());
dotenv.config();

const PORT = process.env.PORT || 5000;
const MONGOURI = process.env.MONGO_URI;

mongoose
        .connect(MONGOURI)
        .then(()=>{
              console.log("DB connected successfully.")
              app.listen(PORT,()=>{
                    console.log(`Server is running on port :${PORT} `)
              });
        })
         .catch((error) => console.log(error));
        