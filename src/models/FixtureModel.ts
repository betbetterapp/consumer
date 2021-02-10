import mongoose from "mongoose";
import { Fixture } from "..";
const { Schema } = mongoose;

import { Model } from "./model.js";

const FixtureSchema = new Schema({
    leagueId: {
        type: Number,
        required: true,
    },
    items: {
        type: [Object],
        default: [],
        required: true,
    },
});

export default mongoose.model<Model<Fixture>>("Fixture", FixtureSchema, "fixtures");
