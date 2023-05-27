import sha1 from 'sha1';
import dbClient from '../utils/db';
import redisClient from '../utils/redis';

/**
 * Fetches the user detail from the database using Authorization in the request
 * @param {Request} req sent by the user
 * @returns Promise<_id: ObjectId, email: string, password: string> || null
 */
async function getUserAuth(auth) {
  if (auth.length !== 2 || auth[0] !== 'Basic') return null;
  const token = Buffer.from(auth[1], 'base64').toString();
  const sepPos = token.indexOf(':');
  const [email, password] = [token.substring(0, sepPos), sha1(token.substring(sepPos + 1))];
  const user = await (await dbClient.usersCollection()).findOne({ email, password });
  return user || null;
}

/**
 * Fetches the user details from the database using X-Token in the request
 * @param {Request} req sent by the user
 * @returns Promise<_id: ObjectId, email: string, password: string> || null
 */
async function getUserXToken(token) {
  const userId = await redisClient.get(`auth_${token}`);
  if (!userId) return null;
  const user = await (await dbClient.usersCollection())
    .findById(userId);
  return [user, token] || [null, null];
}

/**
 * Gets the user
 * @param {Request} req the users request
 * @param {Response} res the response to the user
 * @param {Next} next the next function to be ran
 * @returns Promise<_id: ObjectId, email: string, password: string> || null
 */
export default async function Authenticate(req, res, next) {
  let user = null;
  const [auth, token] = [req.headers.authorization, req.headers['x-token']];
  if (auth || token) {
    if (auth) user = await getUserAuth(auth.split(' '));
    else if (token) user = await getUserXToken(token);
    if (!user) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }
    [req.user, req.token] = [user, token];
  }
  next();
}
