import schedule from "node-schedule"
import axios from "axios"
import dotenv from "dotenv"
dotenv.config()

import "./utils/date.js"
import * as db from "./database.js"
import { scheduleLivePulling } from "./live-fixtures/live-fixtures.js"
import { log } from "./utils/log.js"

export const FOOTBALL_API_KEY = process.env.FOOTBALL_API_KEY
export const FOOTBALL_API_BASE_URL = "https://v3.football.api-sports.io"
const job = schedule.scheduleJob("0 0 0 * * *", async function () {
    start()
})

export interface Fixture {
    fixture: any
    league: any
    teams: any
    goals: any
    score: any
}

export interface League {
    id: number
    name: string
    type: string
    logo: string
    country: object
    currentSeason: object
    lastUpdated: Number
}

if (process.env.NODE_ENV === "development") {
    start()
} else {
    log.info(`No default execute because environment is set to ${process.env.NODE_ENV}.`)
}

async function start() {
    await db.createConnection().then(async e => {
        // const leagues = await getLeagues();

        // for (const league of leagues) {
        //     await upcomingMatches(league.id);
        // }
    })
    await scheduleLivePulling()
}

async function upcomingMatches(leagueId: number, days = 30) {
    log.info("Fetching upcoming matches")
    const dates = [new Date(), new Date().addDays(days)].map(date => date.parse())

    const url = `${FOOTBALL_API_BASE_URL}/fixtures?league=${leagueId}&season=2020&from=${dates[0]}&to=${dates[1]}`
    const {
        data: { response },
    } = await axios.get(url, {
        headers: {
            "X-RapidAPI-Key": FOOTBALL_API_KEY,
        },
    })

    for (const item of response) {
        await db
            .insertFixture(item)
            .then(() => log.info(`Inserted fixture ${item.fixture.id} into database`))
            .catch(err => log.err(err))
    }
}

async function getLeagues() {
    log.header("Fetching leagues")

    const leagues: League[] = []
    const leaguesToSearch = [2, 78, 79, 81] // Pull from db

    log.info("Going for the football api call...")
    const { data } = await axios.get(`${FOOTBALL_API_BASE_URL}/leagues`, {
        headers: {
            "X-RapidAPI-Key": FOOTBALL_API_KEY,
        },
    })

    const fixtures = data.response as any[]
    log.info(`Received ${fixtures.length} fixtures from the football api`)
    const filtered = fixtures.filter((fixture: any) => leaguesToSearch.includes(fixture.league.id))
    filtered.forEach((el: any) => {
        const league: League = {
            id: el.league.id,
            name: el.league.name,
            type: el.league.type,
            logo: el.league.logo,
            country: el.country,
            currentSeason: el.seasons[el.seasons.length - 1],
            lastUpdated: Date.now(),
        }
        db.insertLeague(league)
            .then(res => log.info(res))
            .catch(err => log.err(err))
        leagues.push(league)
    })
    return leagues
}
