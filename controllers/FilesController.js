import { existsSync, mkdir, writeFile } from 'fs';
import { promisify } from 'util';
import { v4 as uuidv4 } from 'uuid';
import { join } from 'path';

import dbClient from '../utils/db';
import { renameObjectProperty, renameListObjectProperty} from '../utils/misc';

const typeOptions = ['file', 'folder', 'image'];
const mkDirAsync = promisify(mkdir);
const writeFileAsync = promisify(writeFile);
const parentPath = process.env.FOLDERPATH || '/tmp/files_manager';


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
    if (!existsSync(parentPath)) await mkDirAsync(parentPath);
    const filesCollection = await dbClient.filesCollection();

    switch (fileObj.type) {
      case 'folder':
        {
          // handles the case of a folder
          const folderPath = join(parentPath, fileObj.name);
          const folderArr = await dbClient.get('files', { name: fileObj.name, type: 'folder' });
          const folder = folderArr[0];
          if (folder) return res.status(400).json({ error: 'Folder already exists' });
          if (!folder || !existsSync(folderPath)) await mkDirAsync(folderPath);
        }
        break;
      case 'file':
      case 'image':

        fileObj.localPath = join(parentPath, uuidv4());

        // check if the user sends a parent location
        {
          let absoluteFilePath = join(parentPath, fileObj.name);
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
          }

          // stores the file
          await writeFileAsync(
            join(absoluteFilePath),
            Buffer.from(data, 'base64'),
          );
        }
        break;

      default:
        break;
    }

    await filesCollection.insertOne(fileObj);
    return res.status(201).json(renameObjectProperty(fileObj, '_id', 'id'));
  }

  static async getIndex(req, res) {
    const userId = req.user._id.toString();
    const files = await dbClient.get('files', { userId });
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
}
