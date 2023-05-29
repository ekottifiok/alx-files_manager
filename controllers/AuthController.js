import { v4 as uuidv4 } from 'uuid';
import redisClient from '../utils/redis';

export default class AuthController {
  static async getConnect (req, res) {
    const { user } = req;
    const token = uuidv4();
    // set the token to the user and expires for 24 hours
    await redisClient.set(`auth_${token}`, user._id.toString(), 86400);
    return res.status(200).json({ token });
  }

  static async getDisonnect (req, res) {
    await redisClient.del(`auth_${req.xtoken}`);
    return res.status(204).send();
  }
}
