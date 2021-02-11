import mongoose from "mongoose";
import { Fixture } from "..";
const { Schema } = mongoose;

import { Model } from "./model.js";

const FixtureCollectionSchema = new Schema({
    leagueId: {
        type: Number,
        required: true,
    },
    items: {
        type: [Object],
        default: [],
        required: true,
    },
    lastUpdated: {
        type: Date,
        default: Date.now(),
        required: true,
    },
});

export default mongoose.model<Model<Fixture>>("Fixture", FixtureCollectionSchema, "fixtures");
