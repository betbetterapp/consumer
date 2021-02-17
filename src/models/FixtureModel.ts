import mongoose from "mongoose";
import { Fixture } from "..";
const { Schema } = mongoose;

import { Model } from "./model.js";

const FixtureSchema = new Schema({
    fixture: {
        type: Object,
        required: true
    },
    league: {
        type: Object,
        required: true
    },
    teams: {
        type: Object,
        required: true
    },
    goals: {
        type: Object,
        required: true
    },
    score: {
        type: Object,
        required: true
    }
})

export default mongoose.model<Model<Fixture>>("Fixture", FixtureSchema, "fixtures");
