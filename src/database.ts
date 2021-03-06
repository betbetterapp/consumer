import mongoose from "mongoose"
import dotenv from "dotenv"
import { Fixture, League } from "./index.js"
import LiveFixtureModel, { LiveFixture } from "./models/LiveFixtureModel.js"
import FixtureModel from "./models/FixtureModel.js"
import LeagueModel from "./models/LeaugeModel.js"
import { translateTeamName } from "./utils/translator.js"
import { log } from "./utils/log.js"

dotenv.config()

export function createConnection() {
    return mongoose
        .connect(process.env.MONGO_URI!!, { useNewUrlParser: true, useUnifiedTopology: true, useFindAndModify: false })
        .then(() => {
            console.log("> Successfully connected to db")
        })
        .catch(err => {
            throw new Error(err)
        })
}

export async function insertFixture(data: Fixture) {
    data.teams.home.name = await translateTeamName(data.teams.home.name)
    data.teams.away.name = await translateTeamName(data.teams.away.name)
    return FixtureModel.updateOne({ "fixture.id": data.fixture.id }, { $set: data }, { upsert: true, new: true })
}

export async function insertLiveFixture(data: LiveFixture) {
    data.teams.home.name = await translateTeamName(data.teams.home.name)
    data.teams.away.name = await translateTeamName(data.teams.away.name)
    return LiveFixtureModel.updateOne({ "fixture.id": data.fixture.id }, { $set: data }, { upsert: true, new: true })
}

export async function insertLeague(data: League) {
    return LeagueModel.updateOne({ id: data.id }, { $set: data }, { upsert: true, new: true })
}
