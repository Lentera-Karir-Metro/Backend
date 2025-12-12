// File: src/controllers/batchOperationsController.js
/**
 * @fileoverview Batch Operations Controller - Operasi bulk untuk admin
 * Menangani delete multiple users, courses, learning paths, modules, etc.
 */
const db = require('../../models');
const { User, Course, LearningPath, Module, Sequelize } = db;
const { Op } = Sequelize;

/**
 * @function deleteMultipleUsers
 * @description Menghapus multiple users sekaligus
 * @route POST /api/v1/admin/batch/users/delete
 * @body {array} ids - Array user IDs yang akan dihapus
 * @access Private/Admin
 */
const deleteMultipleUsers = async (req, res) => {
  const { ids } = req.body;

  if (!Array.isArray(ids) || ids.length === 0) {
    return res.status(400).json({ 
      success: false,
      message: 'IDs harus berupa array dan tidak boleh kosong' 
    });
  }

  try {
    const deleteCount = await User.destroy({
      where: {
        id: { [Op.in]: ids }
      }
    });

    return res.status(200).json({
      success: true,
      message: `${deleteCount} user berhasil dihapus`,
      deletedCount: deleteCount
    });
  } catch (err) {
    console.error('Error deleteMultipleUsers:', err);
    return res.status(500).json({ 
      success: false,
      message: 'Gagal menghapus multiple users', 
      error: err.message 
    });
  }
};

/**
 * @function deactivateMultipleUsers
 * @description Menonaktifkan multiple users sekaligus
 * @route POST /api/v1/admin/batch/users/deactivate
 * @body {array} ids - Array user IDs yang akan dinonaktifkan
 * @access Private/Admin
 */
const deactivateMultipleUsers = async (req, res) => {
  const { ids } = req.body;

  if (!Array.isArray(ids) || ids.length === 0) {
    return res.status(400).json({ 
      success: false,
      message: 'IDs harus berupa array dan tidak boleh kosong' 
    });
  }

  try {
    const updateCount = await User.update(
      { status: 'inactive' },
      { where: { id: { [Op.in]: ids } } }
    );

    return res.status(200).json({
      success: true,
      message: `${updateCount[0]} user berhasil dinonaktifkan`,
      deactivatedCount: updateCount[0]
    });
  } catch (err) {
    console.error('Error deactivateMultipleUsers:', err);
    return res.status(500).json({ 
      success: false,
      message: 'Gagal menonaktifkan multiple users', 
      error: err.message 
    });
  }
};

/**
 * @function deleteMultipleCourses
 * @description Menghapus multiple courses sekaligus (CASCADE DELETE ke modules)
 * @route POST /api/v1/admin/batch/courses/delete
 * @body {array} ids - Array course IDs yang akan dihapus
 * @access Private/Admin
 */
const deleteMultipleCourses = async (req, res) => {
  const { ids } = req.body;

  if (!Array.isArray(ids) || ids.length === 0) {
    return res.status(400).json({ 
      success: false,
      message: 'IDs harus berupa array dan tidak boleh kosong' 
    });
  }

  try {
    const deleteCount = await Course.destroy({
      where: {
        id: { [Op.in]: ids }
      }
    });

    return res.status(200).json({
      success: true,
      message: `${deleteCount} course berhasil dihapus`,
      deletedCount: deleteCount
    });
  } catch (err) {
    console.error('Error deleteMultipleCourses:', err);
    return res.status(500).json({ 
      success: false,
      message: 'Gagal menghapus multiple courses', 
      error: err.message 
    });
  }
};

/**
 * @function deleteMultipleLearningPaths
 * @description Menghapus multiple learning paths sekaligus (CASCADE DELETE ke courses dan modules)
 * @route POST /api/v1/admin/batch/learning-paths/delete
 * @body {array} ids - Array learning path IDs yang akan dihapus
 * @access Private/Admin
 */
const deleteMultipleLearningPaths = async (req, res) => {
  const { ids } = req.body;

  if (!Array.isArray(ids) || ids.length === 0) {
    return res.status(400).json({ 
      success: false,
      message: 'IDs harus berupa array dan tidak boleh kosong' 
    });
  }

  try {
    const deleteCount = await LearningPath.destroy({
      where: {
        id: { [Op.in]: ids }
      }
    });

    return res.status(200).json({
      success: true,
      message: `${deleteCount} learning path berhasil dihapus`,
      deletedCount: deleteCount
    });
  } catch (err) {
    console.error('Error deleteMultipleLearningPaths:', err);
    return res.status(500).json({ 
      success: false,
      message: 'Gagal menghapus multiple learning paths', 
      error: err.message 
    });
  }
};

/**
 * @function deleteMultipleModules
 * @description Menghapus multiple modules sekaligus
 * @route POST /api/v1/admin/batch/modules/delete
 * @body {array} ids - Array module IDs yang akan dihapus
 * @access Private/Admin
 */
const deleteMultipleModules = async (req, res) => {
  const { ids } = req.body;

  if (!Array.isArray(ids) || ids.length === 0) {
    return res.status(400).json({ 
      success: false,
      message: 'IDs harus berupa array dan tidak boleh kosong' 
    });
  }

  try {
    const deleteCount = await Module.destroy({
      where: {
        id: { [Op.in]: ids }
      }
    });

    return res.status(200).json({
      success: true,
      message: `${deleteCount} module berhasil dihapus`,
      deletedCount: deleteCount
    });
  } catch (err) {
    console.error('Error deleteMultipleModules:', err);
    return res.status(500).json({ 
      success: false,
      message: 'Gagal menghapus multiple modules', 
      error: err.message 
    });
  }
};

/**
 * @function updateMultipleLearningPathStatus
 * @description Mengubah status (publish/draft) multiple learning paths
 * @route POST /api/v1/admin/batch/learning-paths/update-status
 * @body {array} ids - Array learning path IDs, {string} status - 'published' atau 'draft'
 * @access Private/Admin
 */
const updateMultipleLearningPathStatus = async (req, res) => {
  const { ids, status } = req.body;

  if (!Array.isArray(ids) || ids.length === 0) {
    return res.status(400).json({ 
      success: false,
      message: 'IDs harus berupa array dan tidak boleh kosong' 
    });
  }

  if (!['published', 'draft'].includes(status)) {
    return res.status(400).json({ 
      success: false,
      message: 'Status harus "published" atau "draft"' 
    });
  }

  try {
    const updateCount = await LearningPath.update(
      { status },
      { where: { id: { [Op.in]: ids } } }
    );

    return res.status(200).json({
      success: true,
      message: `${updateCount[0]} learning path berhasil diperbarui menjadi "${status}"`,
      updatedCount: updateCount[0]
    });
  } catch (err) {
    console.error('Error updateMultipleLearningPathStatus:', err);
    return res.status(500).json({ 
      success: false,
      message: 'Gagal mengubah status multiple learning paths', 
      error: err.message 
    });
  }
};

module.exports = {
  deleteMultipleUsers,
  deactivateMultipleUsers,
  deleteMultipleCourses,
  deleteMultipleLearningPaths,
  deleteMultipleModules,
  updateMultipleLearningPathStatus
};
