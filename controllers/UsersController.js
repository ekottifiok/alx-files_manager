import sha1 from 'sha1';
import dbClient from '../utils/db';

export default class UsersController {
  static async postNew (req, res) {
    const email = req.body ? req.body.email : null;
    if (!email) {
      return res.status(400).json({ error: 'Missing email' }).end();
    }
    const password = req.body ? req.body.password : null;
    if (!password) {
      return res.status(400).json({ error: 'Missing password' });
    }
    const usersCollection = await dbClient.usersCollection();
    const user = await usersCollection.findOne({ email });
    if (user) {
      return res.status(400).json({ error: 'Already exist' });
    }
    const newUser = await usersCollection
      .insertOne({ email, password: sha1(password) });

    return res.status(201).json({
      email, id: newUser.insertedId.toString()
    });
  }

  static getMe (req, res) {
    const { _id: id, email } = req.user;

    return res.status(200).json({ id, email });
  }
}
