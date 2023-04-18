import mongoose from 'mongoose'

mongoose.connect(process.env.ATLAS_URI);

export default mongoose