const mongoose = require('mongoose');

const ImageSchema = new mongoose.Schema({
    styleId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Style',
        required: true,
    },
    imageUrl: {
        type: String,
        required: true,
    },
    aspectRatio: {
        type: String, // e.g., '1:1', '4:5', '9:16'
        default: 'auto',
    },
    order: {
        type: Number,
        default: 0,
    },
    publicId: {
        type: String, // from cloudinary to delete later if needed
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
});

module.exports = mongoose.model('Image', ImageSchema);
