import FixtureModel from "../models/FixtureModel.js"
import { Fixture, FixtureLeague, FOOTBALL_API_BASE_URL, FOOTBALL_API_KEY } from "../index.js"
import schedule from "node-schedule"
import axios from "axios"
import { log } from "../utils/log.js"
import c from "chalk"
import * as db from "../database.js"
import LiveFixtureModel, { LiveFixture } from "../models/LiveFixtureModel.js"

let fixturesPerJob: { [identifier: string]: Fixture[] }

// contains the amount of minutes for every job to wait before its next request
let requestDelayPerJob: { [identifier: string]: number }

const totalAvailableRequests = 85

export async function scheduleLivePulling() {
    const fixtures = await getAllFixtureItems()
    const fixturesToday = fixtures.filter(fixture => {
        const date = new Date(fixture.fixture.timestamp * 1000)
        const today = new Date()

        const status = fixture.fixture.status.short
        if (status === "PST" || status === "SUSP") {
            return false
        }
        return date.isSameDay(today)
    })

    if (fixturesToday.length > 0) {
        log.header("Matches today")
        fixturesToday.map(fixture => stringify(fixture)).forEach(match => log.info(match))

        log.header("Scheduling live pulling jobs")
        const alreadyScheduled: string[] = []
        fixturesPerJob = {}

        const queued: (() => Promise<void>)[] = []
        const queue = (func: () => Promise<void>) => queued.push(func)

        for (const fixture of fixturesToday) {
            const identifier = `${fixture.league.id}@${fixture.fixture.timestamp}`
            if (alreadyScheduled.includes(identifier)) {
                log.info(`Already got queued job including ${stringify(fixture)}`)
            } else {
                queue(async () => await scheduleJob(fixture.league, fixture.fixture.timestamp))
                log.info(`Created new job for ${stringify(fixture)}`)
                alreadyScheduled.push(identifier)
            }
            fixturesPerJob[identifier] = (fixturesPerJob[identifier] ?? []).concat(fixture)
        }

        requestDelayPerJob = {}
        Object.keys(fixturesPerJob).forEach(identifier => {
            const fixtures = fixturesPerJob[identifier]
            const share = fixtures.length / fixturesToday.length
            const requests = totalAvailableRequests * share
            requestDelayPerJob[identifier] = Math.ceil(110 / requests)
        })

        for (const it of queued) {
            await it()
        }
    } else {
        log.info("There are no matches today!")
    }
}

async function scheduleJob(league: FixtureLeague, startTime: number) {
    const coveredFixtures = fixturesPerJob[`${league.id}@${startTime}`]
    log.header(`Scheduling job for ${coveredFixtures.length} fixture(s)...`)
    coveredFixtures.forEach(it => log.info(c.gray("> ") + stringify(it)))

    const myRequestDelay = requestDelayPerJob[`${league.id}@${startTime}`]
    const timeoutInMillis = myRequestDelay * 60 * 1000
    log.info("Request delay: " + c.red(myRequestDelay + " min"))

    const action = async () => {
        log.info(`Starting live pulling for ${stringifyLeague(league)}...`)
        if (await pullLiveFixtures(league, startTime, coveredFixtures)) {
            const id = setInterval(async () => {
                if (!(await pullLiveFixtures(league, startTime, coveredFixtures))) {
                    clearInterval(id)
                    log.info(`Finished live pulling for ${stringifyLeague(league)}`)
                }
            }, timeoutInMillis)
        } else {
            log.err(`First live pull for ${stringifyLeague(league)} failed, abandoning...`)
        }
    }

    const date = new Date(startTime * 1000 + 120_000)
    const job = schedule.scheduleJob(date, action)

    if (job == null) {
        log.warn("Match has already started, instantly invoking job")
        await action()
    }
}

async function pullLiveFixtures(league: FixtureLeague, startTime: number, coveredFixtures: Fixture[]): Promise<boolean> {
    try {
        const url = `${FOOTBALL_API_BASE_URL}/fixtures?live=all&league=${league.id}`
        const { data } = await axios.get(url, { headers: { "X-RapidAPI-Key": FOOTBALL_API_KEY } })
        const response: LiveFixture[] = data.response

        if (data.errors.length > 0) {
            log.err(`An error occurred while pulling live fixtures for league ${league.name}`)
            log.info("Data:", data)
            return false
        } else if (response.length === 0 && Date.now() > startTime * 1000 + 600_000) {
            log.info(`No more live games for league in ${league.name}`)

            const matchEnd = await ensureMatchEnd(coveredFixtures)
            if (matchEnd.finished) {
                for (const match of matchEnd.matches) {
                    log.info(`Inserting fixture with ${match.fixture.id} in fixture collection.`)
                    await FixtureModel.updateOne({ "fixture.id": match.fixture.id }, { $set: match })
                    await LiveFixtureModel.deleteOne({ "fixture.id": match.fixture.id })
                }
                return false
            }
        }

        for (const item of response) {
            await db
                .insertLiveFixture(item)
                .then(() => log.info(`Inserted live fixture ${item.fixture.id} into database`))
                .catch(err => log.err(err))
        }
        return true
    } catch (e) {
        log.err(`An error occurred while pulling live fixtures for league ${league.name}`)
        log.info(e)
        return false
    }
}

async function ensureMatchEnd(fixtures: Fixture[]) {
    let allFinished = true
    const url = `${FOOTBALL_API_BASE_URL}/fixtures?league=${fixtures[0].league.id}&season=2020&date=${new Date().parse()}`
    const { data } = await axios.get(url, { headers: { "X-RapidAPI-Key": FOOTBALL_API_KEY } })
    const response: Fixture[] = data.response
    log.header("Ensuring match end")
    log.info("League id:", fixtures[0].league.id)
    let matches: Fixture[] = []

    console.log("ALL Fixtures", data)
    for (const match of response) {
        fixtures.forEach(fixture => {
            const matchStatus = match.fixture.status.short
            if (fixture.fixture.id === match.fixture.id) {
                const invalidMatchStatus = ["FT", "AET", "PEN", "PST", "CANC", "ABD"]
                if (!invalidMatchStatus.includes(matchStatus)) {
                    allFinished = false
                } else {
                    matches.push(match)
                }
            }
        })
    }
    log.info(allFinished ? "All matches ended" : "Matches are still running")
    return { finished: allFinished, matches }
}

function stringify(fixture: Fixture): string {
    const date = new Date(fixture.fixture.timestamp * 1000)

    return (
        c.yellow("Match") +
        c.gray("(") +
        c.magenta(fixture.teams.home.name) +
        c.white(" vs ") +
        c.magenta(fixture.teams.away.name) +
        c.gray(" @ ") +
        c.white(date.formatClock()) +
        c.white(" in ") +
        c.white(fixture.league.name) +
        c.gray(")")
    )
}

function stringifyLeague(league: FixtureLeague): string {
    return c.yellow("League") + c.gray("(") + c.magenta(league.name) + c.gray(" #") + c.white(league.id) + c.gray(")")
}

function getAllFixtureItems(): Promise<Fixture[]> {
    return FixtureModel.find().catch(err => {
        console.error("An error occurred while loading all fixture items from the database")
        console.error(err)
        return []
    })
}
