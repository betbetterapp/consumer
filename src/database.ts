import mongoose from "mongoose";
import dotenv from "dotenv";
dotenv.config();

console.log(process.env.MONGO_URI);

export function createConnection() {
    return new Promise((resolve, reject) => {
        mongoose.connect(process.env.MONGO_URI!, { useFindAndModify: false, useUnifiedTopology: true, useNewUrlParser: true }, err => {
            if (err) {
                console.log("Error db", err);
                reject(err);
            } else {
                console.log("Connected to db");
                resolve("Connected to db");
            }
        });
    });
}
