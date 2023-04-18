import mongoose from "../config/db.js";

const fileSchema = new mongoose.Schema({
  filename: String,
  cid: String
});

const File = mongoose.model('files', fileSchema);

export default File