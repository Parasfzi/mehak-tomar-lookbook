const express = require('express');
const router = express.Router();
const Style = require('../models/Style');
const Image = require('../models/Image');
const { authMiddleware } = require('./auth');

// @route   GET /api/styles
// @desc    Get all styles with their images
// @access  Public
router.get('/', async (req, res) => {
    try {
        const styles = await Style.find().sort({ order: 1 });
        // We will fetch images for each style separately or use aggregate to avoid massive single payloads
        res.json(styles);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   GET /api/styles/:slug/images
// @desc    Get images for a specific style by slug
// @access  Public
router.get('/:slug/images', async (req, res) => {
    try {
        const style = await Style.findOne({ slug: req.params.slug });
        if (!style) {
            return res.status(404).json({ msg: 'Style not found' });
        }
        const images = await Image.find({ styleId: style._id }).sort({ order: 1 });
        res.json(images);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   POST /api/styles
// @desc    Create a style
// @access  Private (Admin)
router.post('/', authMiddleware, async (req, res) => {
    try {
        const { title, slug } = req.body;

        let style = await Style.findOne({ slug });
        if (style) {
            return res.status(400).json({ msg: 'Style slug already exists' });
        }

        const count = await Style.countDocuments();

        style = new Style({
            title,
            slug,
            order: count // append to end
        });

        await style.save();
        res.json(style);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   PUT /api/styles/:id
// @desc    Update a style
// @access  Private (Admin)
router.put('/:id', authMiddleware, async (req, res) => {
    try {
        const { title, slug } = req.body;

        let style = await Style.findById(req.params.id);
        if (!style) return res.status(404).json({ msg: 'Style not found' });

        if (title) style.title = title;
        if (slug) {
            // Check if new slug exists on another style
            let existingSlug = await Style.findOne({ slug, _id: { $ne: req.params.id } });
            if (existingSlug) return res.status(400).json({ msg: 'Slug already in use' });
            style.slug = slug;
        }

        await style.save();
        res.json(style);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   PUT /api/styles/reorder/batch
// @desc    Reorder styles
// @access  Private (Admin)
router.put('/reorder/batch', authMiddleware, async (req, res) => {
    try {
        const { orderDetails } = req.body; // Array of { id, order }

        for (let detail of orderDetails) {
            await Style.findByIdAndUpdate(detail.id, { order: detail.order });
        }

        res.json({ msg: 'Styles reordered successfully' });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   DELETE /api/styles/:id
// @desc    Delete a style and its images
// @access  Private (Admin)
router.delete('/:id', authMiddleware, async (req, res) => {
    try {
        const style = await Style.findById(req.params.id);
        if (!style) {
            return res.status(404).json({ msg: 'Style not found' });
        }

        // Optional: Delete images from Cloudinary before deleting records
        // ...

        await Image.deleteMany({ styleId: req.params.id });
        await Style.findByIdAndDelete(req.params.id);

        res.json({ msg: 'Style removed' });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

module.exports = router;
