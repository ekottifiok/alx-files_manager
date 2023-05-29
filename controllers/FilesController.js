import {
  existsSync, mkdirSync, promises as fs,
} from 'fs';
import { v4 as uuidv4 } from 'uuid';
import { join } from 'path';
import { contentType } from 'mime-types';
import { ObjectID } from 'mongodb';
import Queue from 'bull/lib/queue';

import dbClient from '../utils/db';
import {
  renameObjectProperty, renameListObjectProperty, removeUndefined, getListFromObjectValues,
} from '../utils/misc';

const typeOptions = ['file', 'folder', 'image'];

const parentPath = process.env.FOLDERPATH || '/tmp/files_manager';
const maxFilesPage = 10;
const imageSizes = ['500', '250', '100'];
const fileQueue = new Queue('generate thumbnails');


export default class FilesController {
  static async postUpload(req, res) {
    const fileObj = {
      userId: req.user._id.toString(),
      name: req.body.name,
      type: req.body.type,
      parentId: req.body.parentId || 0,
      isPublic: req.body.isPublic || false,
    };
    const { data } = req.body;
    if (!fileObj.name) {
      return res.status(400).json({ error: 'Missing Name' });
    }
    if (!fileObj.type && !typeOptions.includes(fileObj.type)) {
      return res.status(400).json({ error: 'Missing type' });
    }
    if (!data && fileObj.type !== 'folder') {
      return res.status(400).json({ error: 'Missing data' });
    }
    if (!existsSync(parentPath)) await fs.mkdir(parentPath);
    const filesCollection = await dbClient.filesCollection();

    switch (fileObj.type) {
      case 'folder':
        {
          // handles the case of a folder
          const folderPath = join(parentPath, fileObj.name);
          const folderArr = await dbClient.get('files', { name: fileObj.name, type: 'folder' });
          const folder = folderArr[0];
          if (folder || existsSync(folderPath)) return res.status(400).json({ error: 'Folder already exists' });
          await fs.mkdir(folderPath);
        }
        break;
      case 'file':
      case 'image':

        // check if the user sends a parent location
        {
          let absoluteFilePath = null;
          if (fileObj.parentId !== 0) {
            const absoluteParentPath = join(parentPath, fileObj.parentId);
            absoluteFilePath = join(absoluteParentPath, fileObj.name);
            // checks the database if the folder exists
            const parentArr = await dbClient.get('files', { type: 'folder', name: fileObj.parentId });
            const parent = parentArr[0];

            // if parent does not exist or exist but not in the folder
            if (!parent || !existsSync(absoluteParentPath)) {
              return res.status(400).json({ error: 'Parent not found' });
            }

            // if parent type must be a folder
            if (parent.type !== 'folder') {
              return res.status(400).json({ error: 'Parent is not a folder' });
            }

            fileObj.localPath = absoluteParentPath;

            // check if file already exists
            if (existsSync(absoluteFilePath)) {
              return res.status(400).json({ error: 'File already exists' });
            }
          } else {
            fileObj.localPath = join(parentPath, uuidv4());
            absoluteFilePath = join(fileObj.localPath, fileObj.name);
            if (!existsSync(fileObj.localPath)) await mkdirSync(fileObj.localPath);
          }

          // stores the file
          await fs.writeFile(
            absoluteFilePath,
            Buffer.from(data, 'base64'),
          );
        }
        break;

      default:
        break;
    }

    const fileSaved = await filesCollection.insertOne(fileObj);
    const fileId = fileSaved.insertedId.toString();
    const { userId } = fileObj;
    if (fileObj.type === 'image') {
      fileQueue.add({
        fileId,
        userId,
        name: `Image Thumbnail for ${userId} ${fileId}`,
      });
    }

    return res.status(201).json(renameObjectProperty(fileObj, '_id', 'id'));
  }

  static async getIndex(req, res) {
    const userId = req.user._id.toString();
    const {
      name, type, parentId, qPage,
    } = req.query;
    const page = Number.parseInt(qPage, 0);
    const getParameters = {
      ...{ userId }, ...removeUndefined({ name, type, parentId }),
    };

    const files = await (await (await dbClient.filesCollection())
      .find(getParameters)).skip(page * maxFilesPage).limit(maxFilesPage).toArray();
    if (!files) return res.status(404).json({ error: 'Not Found' });
    return res.status(200).json(renameListObjectProperty(files, '_id', 'id'));
  }

  static async getShow(req, res) {
    const { id } = req.params;
    let file = await dbClient.getById('files', id);
    if (!file) return res.status(404).json({ error: 'Not Found' });
    file = renameObjectProperty(file, '_id', 'id');
    return file ? res.status(200).json(file) : res.status(404).json({ error: 'Not found' });
  }

  static async putPublish(req, res) {
    const { id } = req.params;
    const file = await dbClient.getById('files', id);
    if (!file) return res.status(404).json({ error: 'Not found' });
    file.isPublic = true;
    await (await dbClient.filesCollection())
      .updateOne({ _id: new ObjectID(id) }, { $set: { isPublic: true } });
    return res.status(200).json(renameObjectProperty(file, '_id', 'id'));
  }

  static async putUnpublish(req, res) {
    const { id } = req.params;
    const file = await dbClient.getById('files', id);
    if (!file) return res.status(404).json({ error: 'Not found' });
    file.isPublic = false;
    console.log(new ObjectID(id));
    await (await dbClient.filesCollection())
      .updateOne({ _id: new ObjectID(id) }, { $set: { isPublic: false } });
    return res.status(200).json(renameObjectProperty(file, '_id', 'id'));
  }

  static async getFile(req, res) {
    const { id } = req.params;
    const { size } = req.query;
    const file = await dbClient.getById('files', id);
    if (!file || !file.isPublic) return res.status(404).json({ error: 'Not found' });
    if (file.type === 'folder') return res.status(404).json({ error: 'A folder doesn\'t have content' });

    const absoluteFilePath = join(file.localPath, `${file.name}${imageSizes.includes(size) && `_${size}`}`);

    if (!existsSync(absoluteFilePath)) return res.status(404).json({ error: 'Not found' });

    return res.status(200).set({
      'Content-Type': contentType(file.name) || 'text/plain; charset=utf-8',
    }).sendFile(absoluteFilePath);
  }
}
