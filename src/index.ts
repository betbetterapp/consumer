import schedule from "node-schedule";
import axios from "axios";
import dotenv from "dotenv";
dotenv.config();

import "./utils/date.js";
import FixtureCollectionModel from "./models/FixtureCollectionModel.js";
import LeagueModel from "./models/LeaugeModel.js";
import { createConnection } from "./database.js";

const FOOTBALL_API_KEY = process.env.FOOTBALL_API_KEY;
const FOOTBALL_API_BASE_URL = "https://v3.football.api-sports.io";
const job = schedule.scheduleJob("0 0 0 * * *", async function () {
    start();
});

export interface Fixture {
    leagueId: number;
    items: [object];
}

export interface League {
    id: number;
    name: string;
    type: string;
    logo: string;
    country: object;
    currentSeason: object;
    lastUpdated: Date;
}

if (process.env.NODE_ENV === "development") {
    start();
} else {
    console.log(`No default execute because environment is set to ${process.env.NODE_ENV}.`);
    process.exit(0);
}

async function start() {
    try {
        await createConnection();
        const leagues = await getLeagues();

        leagues.map(league => {
            upcomingMatches(league.id);
        });
    } catch (error) {
        console.log("Error while creating connection to database:", error);
    }
}

async function upcomingMatches(leagueId: number, days = 30) {
    console.log("Fetching upcoming matches");
    const dates = [new Date(), new Date().addDays(days)].map(date => date.parse());

    const url = `${FOOTBALL_API_BASE_URL}/fixtures?league=${leagueId}&season=2020&from=${dates[0]}&to=${dates[1]}`;

    try {
        const {
            data: { response },
        } = await axios.get(url, {
            headers: {
                "X-RapidAPI-Key": FOOTBALL_API_KEY,
            },
        });
        const fixture: Fixture = {
            leagueId: leagueId,
            items: response,
        };
        const fixtureToSave = new FixtureCollectionModel(fixture);
        fixtureToSave.save(err => {
            if (err) return console.log("Error while saving fixture!", err);
            console.log(`Fixtures for league with id ${fixtureToSave.leagueId} saved.`);
        });
    } catch (error) {
        throw new Error(error);
    }
}

async function getLeagues() {
    console.log("Fetching leagues");

    const leagues: League[] = [];
    const leaguesToSearch = [2, 78, 79, 81]; // Pull from db

    try {
        const { data } = await axios.get(`https://${FOOTBALL_API_BASE_URL}/leagues`, {
            headers: {
                "X-RapidAPI-Key": FOOTBALL_API_KEY,
            },
        });

        const fixtures = data.response;
        const filtered = fixtures.filter((fixture: any) => leaguesToSearch.includes(fixture.league.id));

        filtered.forEach((el: any) => {
            const league: League = {
                id: el.league.id,
                name: el.league.name,
                type: el.league.type,
                logo: el.league.logo,
                country: el.country,
                currentSeason: el.seasons[el.seasons.length - 1],
                lastUpdated: new Date(),
            };
            const leagueToSave = new LeagueModel(league);
            leagueToSave.save(err => {
                if (err) return console.log("Error while saving league!", err);
                console.log(`League with id ${leagueToSave.id} saved.`);
            });

            leagues.push(leagueToSave);
        });
        return leagues; // store in db
    } catch (error) {
        throw new Error(error);
    }
}
