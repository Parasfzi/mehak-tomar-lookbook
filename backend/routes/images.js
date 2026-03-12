const express = require('express');
const router = express.Router();
const Image = require('../models/Image');
const Style = require('../models/Style');
const { authMiddleware } = require('./auth');
const { upload, cloudinary } = require('../config/cloudinary');

// @route   POST /api/images/upload
// @desc    Upload an image
// @access  Private (Admin)
router.post('/upload', authMiddleware, (req, res) => {
    upload.single('image')(req, res, async (err) => {
        if (err) {
            console.error('Multer Upload Error:', err);
            return res.status(500).json({ msg: 'Upload Error', error: err.message || err });
        }

        try {
            const { styleId, aspectRatio } = req.body;

            if (!req.file) {
                return res.status(400).json({ msg: 'No file uploaded' });
            }

            const style = await Style.findById(styleId);
            if (!style) {
                return res.status(404).json({ msg: 'Style not found' });
            }

            const count = await Image.countDocuments({ styleId });

            const newImage = new Image({
                styleId,
                imageUrl: req.file.path,
                publicId: req.file.filename,
                aspectRatio: aspectRatio || 'auto',
                order: count
            });

            await newImage.save();
            res.json(newImage);
        } catch (err) {
            console.error('Image Upload Catch Error Keys:', Object.keys(err));
            console.error('Image Upload Catch Error JSON:', JSON.stringify(err, Object.getOwnPropertyNames(err)));
            res.status(500).json({ msg: 'Server Error' });
        }
    });
});

// @route   PUT /api/images/reorder/batch
// @desc    Reorder images within a style
// @access  Private (Admin)
router.put('/reorder/batch', authMiddleware, async (req, res) => {
    try {
        const { orderDetails } = req.body; // Array of { id, order }

        for (let detail of orderDetails) {
            await Image.findByIdAndUpdate(detail.id, { order: detail.order });
        }

        res.json({ msg: 'Images reordered successfully' });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   PUT /api/images/:id/move
// @desc    Move image to another style
// @access  Private (Admin)
router.put('/:id/move', authMiddleware, async (req, res) => {
    try {
        const { targetStyleId } = req.body;

        const image = await Image.findById(req.params.id);
        if (!image) return res.status(404).json({ msg: 'Image not found' });

        const targetStyle = await Style.findById(targetStyleId);
        if (!targetStyle) return res.status(404).json({ msg: 'Target style not found' });

        image.styleId = targetStyleId;
        const count = await Image.countDocuments({ styleId: targetStyleId });
        image.order = count; // place at end of new style

        await image.save();
        res.json(image);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   DELETE /api/images/:id
// @desc    Delete an image
// @access  Private (Admin)
router.delete('/:id', authMiddleware, async (req, res) => {
    try {
        const image = await Image.findById(req.params.id);
        if (!image) {
            return res.status(404).json({ msg: 'Image not found' });
        }

        // Delete from cloudinary
        if (image.publicId) {
            await cloudinary.uploader.destroy(image.publicId);
        }

        await Image.findByIdAndDelete(req.params.id);
        res.json({ msg: 'Image removed' });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

module.exports = router;
