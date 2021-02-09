import schedule from "node-schedule";
import axios from "axios";
import dotenv from "dotenv";
dotenv.config();

import "./utils/date.js";
import Fixture from "./models/Fixture.js";
import { createConnection } from "./database.js";

const FOOTBALL_API_KEY = process.env.FOOTBALL_API_KEY;

interface League {
    id: number;
    name: string;
    type: string;
    logo: string;
}

interface Fixture {
    league: League;
    country: object;
    seasons: object[];
}

const job = schedule.scheduleJob("0 0 0 * * *", async function () {
    start();
});

if (process.env.NODE_ENV === "development") start();

async function start() {
    try {
        await createConnection();
    } catch (error) {
        console.log("Error while creating connection to database:", error);
    }
    const leagues = await getLeagues();
    const fixturePromises = leagues.map(async league => {
        return { leagueId: league.id, items: await upcomingMatches(league.id) };
    });
    const fixtures = await Promise.all(fixturePromises);
    fixtures.forEach(fixture => {
        const fixtureToSave = new Fixture({
            leagueId: fixture.leagueId,
            items: fixture.items,
        });
        fixtureToSave.save(err => {
            if (err) return console.log("Error while saving fixture!", err);
            console.log(`Fixture with id ${fixtureToSave.leagueId} saved.`);
        });
    });
}

async function upcomingMatches(leagueId: number, days = 30) {
    console.log("Fetching upcoming matches");
    const dates = [new Date(), new Date().addDays(days)].map(date => date.parse());

    const url = `https://v3.football.api-sports.io/fixtures?league=${leagueId}&season=2020&from=${dates[0]}&to=${dates[1]}`;

    try {
        const {
            data: { response },
        } = await axios.get(url, {
            headers: {
                "X-RapidAPI-Key": FOOTBALL_API_KEY,
            },
        });
        return response;
    } catch (error) {
        throw new Error(error);
    }
}

async function getLeagues() {
    console.log("Fetching leagues");

    const leagues: League[] = [];
    const leaguesToSearch = [2, 78, 79, 81]; // Pull from db

    try {
        const { data } = await axios.get(`https://v3.football.api-sports.io/leagues`, {
            headers: {
                "X-RapidAPI-Key": FOOTBALL_API_KEY,
            },
        });

        const fixtures: Fixture[] = data.response;
        const filtered = fixtures.filter((fixture: Fixture) => leaguesToSearch.includes(fixture.league.id));

        filtered.forEach(el => {
            const league = {
                id: el.league.id,
                name: el.league.name,
                type: el.league.type,
                logo: el.league.logo,
                country: el.country,
                currentSeason: el.seasons[el.seasons.length - 1],
            };
            leagues.push(league);
        });
        return leagues; // store in db
    } catch (error) {
        throw new Error(error);
    }
}
