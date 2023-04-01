import express from 'express';
import path from 'path'
import {fileURLToPath} from 'url';
import fileUpload from 'express-fileupload';
const app = express();
import fs from 'fs'
import { fileTypeFromBuffer } from 'file-type'
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);


app.set('port', process.env.PORT || 3000);
app.set('json spaces', 1)

app.use(fileUpload())

import * as IPFS from 'ipfs-core';
const ipfs = await IPFS.create();

//Routes
app.post('/api/addFile', async (req, res) => {
  try {
    const file = req.files.file;
    const fileAdded = await ipfs.add({
      path: file.name,
      content: file.data
    })
    console.log("fileAdded", fileAdded)
    res.json({
        success: true,
        message: 'File added successfully!',
        data: {
          path: fileAdded.path,
          cid: fileAdded.cid
        }
    });
  } catch (error) {
    console.error(error);
    res.statusCode = 500;
    res.json({
      success: false,
      message: 'Error in upload file',
      error
  });
  }
})

app.get('/api/get-by-cid/:cid', async (req, res) => {
    const cid = req.params.cid    
    console.log("cid", cid)
    try{
      const fileStream = ipfs.cat(cid);

      let fileBuffer = Buffer.alloc(0);
      for await (const chunk of fileStream) {
        fileBuffer = Buffer.concat([fileBuffer, chunk]);
      }
      console.log("fileBuffer", fileBuffer)
      const fileType = await fileTypeFromBuffer(fileBuffer);
      let fileName = cid
      if (fileType) {
        console.log(`El archivo es de tipo ${fileType.mime} y su extensión es ${fileType.ext}`);
        fileName = `${cid}.${fileType.ext}`
      } else {
        console.log('No se pudo determinar el tipo de archivo');
      }
      
      await fs.writeFileSync(fileName, fileBuffer);
      let filePath = path.join(__dirname, "../"+fileName)
      res.download(filePath, fileName, async function(err) {
        if (err) {
          console.error(err);
        } else {
          await fs.unlinkSync(filePath)
        }
      })
    } catch (err) {
      console.error(err);
      res.json({
        success: false,
        error: err
      })
    }
})

app.listen(3000, () => {
    console.log("Server is listening on port 3000")
})