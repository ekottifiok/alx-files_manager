import Queue from 'bull/lib/queue';
import { promises as fs } from 'fs';
import imgThumbnail from 'image-thumbnail';
import { join } from 'path';
import dbClient from './utils/db';
import Mailer from './utils/mailer';

const fileQueue = new Queue('generate thumbnails');
const userQueue = new Queue('sending emails');
const imageSizes = [500, 250, 100];

fileQueue.process(async (job, done) => {
  const { fileId, userId, name } = job.data;

  if (!fileId) throw new Error('Missing fileId');
  if (!userId) throw new Error('Missing userId');

  console.log(`Processing job ${name}`);

  const { name: fileName, localPath, userId: fileUserId } = await dbClient.getById('files', fileId);
  if (!localPath || !fileUserId || fileUserId !== userId) throw new Error('File not found');
  job.progress(20);

  imageSizes.map((async (size) => {
    const filePath = join(localPath, fileName);
    const buffer = await imgThumbnail(filePath, { width: size });
    job.progress(50);

    console.log(`Generating file: ${localPath}, size: ${size}`);
    await fs.writeFile(`${filePath}_${size}`, buffer);
    job.progress(100);
    done();
  }));
});

userQueue.process(async (job, done) => {
  const { userId } = job.data;

  if (!userId) throw new Error('Missing userId');

  const { email } = await dbClient.getById('users', userId);
  if (!email) throw new Error('User not found');

  console.log(`Welcome ${email}!`);
  try {
    const mailSubject = 'Welcome to ALX-Files_Manager by Ifiok Ekott';
    job.progress(75);
    const mailContent = [
      '<div>',
      '<h3>Hello {{user.name}},</h3>',
      'Welcome to <a href="https://github.com/B3zaleel/alx-files_manager">',
      'ALX-Files_Manager</a>, ',
      'a simple file management API built with Node.js by ',
      '<a href="https://github.com/ekottifiok">Ifiok Ekott</a>. ',
      'We hope it meets your needs.',
      '</div>',
    ].join('');
    Mailer.sendMail(Mailer.buildMessage(email, mailSubject, mailContent));
    done();
  } catch (err) {
    done(err);
  }
});

export default fileQueue;
