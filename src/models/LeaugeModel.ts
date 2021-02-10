import mongoose from "mongoose";
import { League } from "..";
import { Model } from "./model.js";
const { Schema } = mongoose;

const LeagueSchema = new Schema({
    id: {
        type: Number,
        required: true,
    },
    name: {
        type: String,
        required: true,
    },

    type: {
        type: String,
        required: true,
    },
    logo: {
        type: String,
        required: true,
    },
    country: {
        type: Object,
        required: true,
    },
    currentSeason: {
        type: Object,
        required: true,
    },
    lastUpdated: {
        type: Date,
        default: new Date(),
    },
});

export default mongoose.model<Model<League>>("League", LeagueSchema, "leagues");
