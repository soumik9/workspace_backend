import { Schema } from "mongoose";

export const PhoneCountrySchema = new Schema({
    code: {
        type: String,
        required: [true, 'Country code is required'],
    },
    name: {
        type: String,
        required: [true, 'Country name is required'],
    },
    dial_code: {
        type: String,
        required: [true, 'Country dial code is required'],
    },
}, { _id: false });

export const DocumentSchema = new Schema({
    path: {
        type: String,
        required: [true, 'Document path is required'],
    },
    original_name: {
        type: String,
        required: [true, 'Document original name is required'],
    },
    unique_name: {
        type: String,
        required: [true, 'Document unique name is required'],
    },
}, { _id: false });