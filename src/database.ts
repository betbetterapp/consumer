import mongoose from "mongoose";
import dotenv from "dotenv";
dotenv.config();

export function createConnection() {
    mongoose.connect(process.env.MONGO_URI!, { useFindAndModify: false, useUnifiedTopology: true, useNewUrlParser: true }, err => {
        if (err) {
            console.log("Failed to connect to db");
            console.log(err);
            return;
        }
        console.log("Connected to db");
    });
}
