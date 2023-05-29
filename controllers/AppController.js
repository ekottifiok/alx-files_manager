import redisClient from '../utils/redis';
import dbClient from '../utils/db';

export default class AppController {
  static getStatus (_req, res) {
    return res.status(200).json({
      redis: redisClient.isAlive(),
      db: dbClient.isAlive()
    });
  }

  static async getStats (_req, res) {
    return res.status(200).json({
      users: await dbClient.nbUsers(),
      files: await dbClient.nbFiles()
    });
  }
}
