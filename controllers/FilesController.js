const typeOptions = ['file', 'folder', 'image'];

export default class FilesController {
  static postUpload(req, res) {
    const { user } = req;
    const name = req.body ? req.body.name : null;
    const type = req.body ? req.body.type : null;
    const parentId = req.body ? req.body.parentId : 0;
    const isPublic = req.body ? req.body.isPublic : false;
    const data = req.body ? req.body.data : null;
    if (!name) res.status(400).json({ error: 'Missing Name' });
    if (!type && !typeOptions.includes(type)) {
      res.status(400).json({ error: 'Missing type' });
    }
    if (!data && type != 'folder') res.status(400).json({ error: 'Missing data' });
  }
}