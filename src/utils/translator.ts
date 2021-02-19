import TranslationModel, { TranslationDocument } from "../models/TranslationModel.js"
import { log } from "./log.js"

let document: TranslationDocument | null = null

export async function translateTeamName(input: string): Promise<string> {
    if (document == null) {
        document = (await TranslationModel.findOne())!.toObject()
    }

    if (document![input] != null) {
        log.info(`[Translator] Translated ${input} to ${document![input]}`)
        return document![input]
    } else {
        return input
    }
}