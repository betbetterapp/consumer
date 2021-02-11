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
    const fixtureToSave = new FixtureCollectionModel(data);
    return new Promise(async (resolve, reject) => {
        try {
            await FixtureCollectionModel.findOneAndDelete({ leagueId: data.leagueId });
        } catch (error) {
            console.log("Error while deleting document:", error);
        }
        fixtureToSave.save(error => {
            if (error) reject(error);
            resolve(`Fixtures for league with id ${fixtureToSave.leagueId} saved.`);
        });
    });
}

export async function insertLeague(data: League) {
    const leagueToSave = new LeagueModel(data);
    return new Promise<string>(async (resolve, reject) => {
        try {
            await LeagueModel.findOneAndDelete({ id: data.id });
        } catch (error) {
            console.log("Error while deleting document:", error);
        }
        leagueToSave.save(error => {
            if (error) reject(2); // TODO: Return string & send full error with telegram bot
            resolve(`League with id ${leagueToSave.id} saved.`);
        });
    });
}
