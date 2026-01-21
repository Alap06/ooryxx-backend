const Announcement = require('../models/Announcement');

// @desc    Get active announcements for public display
// @route   GET /api/announcements/active
// @access  Public
exports.getActiveAnnouncements = async (req, res) => {
  try {
    const announcements = await Announcement.getActiveAnnouncements();
    
    res.status(200).json({
      success: true,
      count: announcements.length,
      data: announcements
    });
  } catch (error) {
    console.error('Error fetching active announcements:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des annonces'
    });
  }
};

// @desc    Get all announcements (admin)
// @route   GET /api/announcements
// @access  Private/Admin
exports.getAllAnnouncements = async (req, res) => {
  try {
    const { type, isActive, page = 1, limit = 20 } = req.query;
    
    const filter = {};
    if (type) filter.type = type;
    if (isActive !== undefined) filter.isActive = isActive === 'true';
    
    const announcements = await Announcement.find(filter)
      .sort({ priority: -1, createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit))
      .populate('createdBy', 'firstName lastName');
    
    const total = await Announcement.countDocuments(filter);
    
    res.status(200).json({
      success: true,
      count: announcements.length,
      total,
      totalPages: Math.ceil(total / limit),
      currentPage: parseInt(page),
      data: announcements
    });
  } catch (error) {
    console.error('Error fetching announcements:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des annonces'
    });
  }
};

// @desc    Get single announcement
// @route   GET /api/announcements/:id
// @access  Private/Admin
exports.getAnnouncement = async (req, res) => {
  try {
    const announcement = await Announcement.findById(req.params.id)
      .populate('createdBy', 'firstName lastName');
    
    if (!announcement) {
      return res.status(404).json({
        success: false,
        message: 'Annonce non trouvée'
      });
    }
    
    res.status(200).json({
      success: true,
      data: announcement
    });
  } catch (error) {
    console.error('Error fetching announcement:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération de l\'annonce'
    });
  }
};

// @desc    Create announcement
// @route   POST /api/announcements
// @access  Private/Admin
exports.createAnnouncement = async (req, res) => {
  try {
    const announcementData = {
      ...req.body,
      createdBy: req.user._id
    };
    
    const announcement = await Announcement.create(announcementData);
    
    res.status(201).json({
      success: true,
      message: 'Annonce créée avec succès',
      data: announcement
    });
  } catch (error) {
    console.error('Error creating announcement:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Erreur lors de la création de l\'annonce'
    });
  }
};

// @desc    Update announcement
// @route   PUT /api/announcements/:id
// @access  Private/Admin
exports.updateAnnouncement = async (req, res) => {
  try {
    const announcement = await Announcement.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    
    if (!announcement) {
      return res.status(404).json({
        success: false,
        message: 'Annonce non trouvée'
      });
    }
    
    res.status(200).json({
      success: true,
      message: 'Annonce mise à jour avec succès',
      data: announcement
    });
  } catch (error) {
    console.error('Error updating announcement:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Erreur lors de la mise à jour de l\'annonce'
    });
  }
};

// @desc    Delete announcement
// @route   DELETE /api/announcements/:id
// @access  Private/Admin
exports.deleteAnnouncement = async (req, res) => {
  try {
    const announcement = await Announcement.findByIdAndDelete(req.params.id);
    
    if (!announcement) {
      return res.status(404).json({
        success: false,
        message: 'Annonce non trouvée'
      });
    }
    
    res.status(200).json({
      success: true,
      message: 'Annonce supprimée avec succès'
    });
  } catch (error) {
    console.error('Error deleting announcement:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la suppression de l\'annonce'
    });
  }
};

// @desc    Toggle announcement active status
// @route   PATCH /api/announcements/:id/toggle
// @access  Private/Admin
exports.toggleAnnouncement = async (req, res) => {
  try {
    const announcement = await Announcement.findById(req.params.id);
    
    if (!announcement) {
      return res.status(404).json({
        success: false,
        message: 'Annonce non trouvée'
      });
    }
    
    announcement.isActive = !announcement.isActive;
    await announcement.save();
    
    res.status(200).json({
      success: true,
      message: `Annonce ${announcement.isActive ? 'activée' : 'désactivée'}`,
      data: announcement
    });
  } catch (error) {
    console.error('Error toggling announcement:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la modification de l\'annonce'
    });
  }
};
