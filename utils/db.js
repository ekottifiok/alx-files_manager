import mongodb from 'mongodb';
import { existsSync, readFileSync } from 'fs';


const envLoader = () => {
  const env = process.env.npm_lifecycle_event || 'dev';
  const path = env.includes('test') || env.includes('cover') ? '.env.test' : '.env';

  if (existsSync(path)) {
    const data = readFileSync(path, 'utf-8').trim().split('\n');

    for (const line of data) {
      const delimPosition = line.indexOf('=');
      const variable = line.substring(0, delimPosition);
      const value = line.substring(delimPosition + 1);
      process.env[variable] = value;
    }
  }
};

class DBClient {
  constructor() {
    envLoader();
    const host = process.env.DB_HOST || 'localhost';
    const port = process.env.DB_PORT || 27017;
    const database = process.env.DB_DATABASE || 'files_manager';

    this.client = new mongodb.MongoClient(
      `mongodb://${host}:${port}/${database}`,
      { useUnifiedTopology: true },
    );
    this.client.connect();
  }

  /**
   * check if the mongodb is connected and alive
   * @returns {Boolean}
   */
  isAlive() {
    return this.client.isConnected();
  }

  /**
   * counts the number of items in the users collection
   * @returns {Promise<Number>}
   */
  async nbUsers() {
    return this.client.db().collection('users').countDocuments();
  }

  /**
   * counts the number of items in the files collection
   * @returns {Promise<Number>}
   */
  async nbFiles() {
    return this.client.db().collection('files').countDocuments();
  }

  /**
   * returns data for the users collection
   * @returns {Promise<Collection>}
   */
  async usersCollection() {
    return this.client.db().collection('users');
  }

  /**
   * returns data for the files collection
   * @returns {Promise<Collection>}
   */
  async filesCollection() {
    return this.client.db().collection('files');
  }
}

const dbClient = new DBClient();
export default dbClient;
