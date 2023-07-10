import { Connection, Model, Document } from 'mongoose';
import { appCollections } from './lib/app.config';

export interface MongooseContext {
    connection: Connection,
    models: {
        [key in typeof appCollections as string]: Model<Document>
    }
}
