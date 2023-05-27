import sha1 from 'sha1';
import dbClient from '../utils/db';


export default class UsersController {
  static async postNew(req, res) {
    const email = req.body ? req.body.email : null;
    if (!email) {
      res.status(400).json({ error: 'Missing email' }).end();
      return;
    }
    const password = req.body ? req.body.password : null;
    if (!password) {
      res.status(400).json({ error: 'Missing password' }).end();
      return;
    }
    const usersCollection = await dbClient.usersCollection();
    const user = await usersCollection.findOne({ email });
    if (user) {
      res.status(400).json({ error: 'Already exist' }).end();
      return;
    }
    const newUser = await usersCollection
      .insertOne({ email, password: sha1(password) });

    res.status(201).json({ email, id: newUser.insertedId.toString() });
  }

  static getMe(req, res) {
    const { user } = req;

    res.status(200).json({ email: user.email, id: user._id.toString() });
  }
}
