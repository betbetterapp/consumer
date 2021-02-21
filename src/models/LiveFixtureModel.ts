import mongoose from "mongoose"
import { Model } from "./model.js"

const { Schema } = mongoose

const LiveFixtureSchema = new Schema({
    fixture: {
        type: Object,
    },
    league: {
        type: Object,
    },
    teams: {
        type: Object,
    },
    goals: {
        type: Object,
    },
    score: {
        type: Object,
    },
    events: {
        type: [Object],
    },
})

export interface LiveFixture {
    fixture: {
        id: number
        referee: string | null
        timezone: string
        timestamp: number
        periods: {
            first: number
            second: number
        }
        venue: {
            id: number | null
            name: string
            city: string
        }
        status: {
            long: string
            short: string
            elapsed: number
        }
    }
    league: {
        id: number
        name: string
        country: string
        logo: string
        flag: string
        season: number
        round: string
    }
    teams: {
        home: {
            id: number
            name: string
            logo: string
            winner: boolean
        }
        away: {
            id: number
            name: string
            logo: string
            winner: boolean
        }
    }
    goals: {
        home: number
        away: number
    }
    score: object
    events: object[]
}

export default mongoose.model<Model<LiveFixture>>("LiveFixture", LiveFixtureSchema, "live")
