import sha1 from 'sha1';
import { ObjectId } from 'mongodb';
import dbClient from '../utils/db';
import redisClient from '../utils/redis';

const [pathAuth, pathXToken] = [
  ['/connect'],
  [
    '/users/me',
    '/disconnect',
    '/files',
    '/files/:id',
    '/files/:id/publish',
    '/files/:id/unpublish',
  ],
];

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
  const userId = new ObjectId(await redisClient.get(`auth_${token}`));
  if (!userId) return null;
  const user = await dbClient.getById('users', userId);
  return user || null;
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
  const [auth, xtoken] = [req.headers.authorization, req.headers['x-token']];
  const { path } = req;

  if ((pathAuth.includes(path) && !auth) || (pathXToken.includes(path) && !xtoken)) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }
  if (auth || xtoken) {
    user = auth ? await getUserAuth(auth.split(' ')) : await getUserXToken(xtoken);
    if (!user) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }
    [req.user, req.xtoken] = [user, xtoken];
  }

  next();
}
