import mongoose from "mongoose";
import dotenv from "dotenv";
import { Fixture, League } from "./index.js";
import FixtureCollectionModel from "./models/FixtureCollectionModel.js";
import LeagueModel from "./models/LeaugeModel.js";

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

export function insertFixtureCollection(data: Fixture) {
    return FixtureCollectionModel.updateOne({ leagueId: data.leagueId }, { $set: data }, { upsert: true, new: true });
}

export async function insertLeague(data: League) {
    return LeagueModel.updateOne({ id: data.id }, { $set: data }, { upsert: true, new: true });
}
