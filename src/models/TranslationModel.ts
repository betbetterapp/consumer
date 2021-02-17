import mongoose from "mongoose"
import { Model } from "./model.js"

const { Schema } = mongoose

export interface TranslationDocument {
    [old: string]: string
}

export default mongoose.model<Model<TranslationDocument>>("Translation", new Schema(), "translations")