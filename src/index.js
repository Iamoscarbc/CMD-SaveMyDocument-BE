import express from 'express';
import path from 'path'
import {fileURLToPath} from 'url';
import fileUpload from 'express-fileupload';
const app = express();
import fs from 'fs'
import { fileTypeFromBuffer } from 'file-type'
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
import bodyParser from 'body-parser'
import "./config/loadEnvironment.js";
import pdfParse from 'pdf-parse'

import { File } from './models/index.js';

app.use(bodyParser.urlencoded({
  extended: true,
  charset: 'UTF-8'
}))

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

    const doc = await File.create({
      filename: file.name,
      cid: fileAdded.cid
    })

    res.json({
        success: true,
        message: 'File added successfully!',
        data: {
          path: fileAdded.path,
          cid: fileAdded.cid
        }
    })
  } catch (error) {
    console.error(error)
    res.statusCode = 500
    res.json({
      success: false,
      message: 'Error in upload file',
      error
    })
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
      console.error(err)
      res.json({
        success: false,
        error: err
      })
    }
})

app.get('/api/get-file-by-search/:param', async (req, res) => {
  try {
    const param = req.params.param
    console.log("param", param)
    let collection = await File.find({ 
      $or: [
        { filename : { $regex : `${param}`, $options: "i" } },
        { cid : { $eq : param} }
      ] 
    })
    
    res.json({
      success: true,
      message: 'File added successfully!',
      data: collection
  })
  } catch (err) {
    console.error(err)
    res.json({
      success: false,
      error: err
    })
  }
})

app.get('/api/get-indicators', async (req, res) => {
    try{
      const files = await File.find()
      res.json({
        success: true,
        message: 'Indicadores',
        data: {
          files: files.length
        }
      })
    } catch (err) {
      console.error(err)
      res.json({
        success: false,
        error: err
      })
    }
})

app.get('/api/get-file-text-by-cid/:cid', async (req, res) => {
  const cid = req.params.cid
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
      if(fileType.ext == 'pdf'){
        let pdfExtract = await pdfParse(readFileSync)
        console.log('File content: ', pdfExtract.text)
        console.log('Total pages: ', pdfExtract.numpages)
        console.log('All content: ', pdfExtract.info)
        res.json({
          success: true,
          data: ''
        })
      }
    } else {
      console.log('No se pudo determinar el tipo de archivo');
      res.json({
        success: false,
        message: 'No coincide con el tipo especificado ".pdf"'
      })
    }
    
    
  } catch (err) {
    console.error(err)
    res.json({
      success: false,
      error: err
    })
  }
})

app.listen(3000, () => {
    console.log("Server is listening on port 3000")
})