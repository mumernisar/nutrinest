const express = require('express');
const router  = express.Router();
const userController      = require('../controllers/user.controller');
const { protect, restrictTo } = require('../middleware/auth');

router.use(protect);

router.get('/me',                         userController.getMe);
router.patch('/me',                       userController.updateMe);
router.delete('/me',                      userController.deleteMe);

router.get('/me/bookmarks',               userController.getBookmarks);
router.post('/me/bookmarks',              userController.addBookmark);
router.delete('/me/bookmarks/:bookmarkId',userController.removeBookmark);

router.get('/',                           restrictTo('admin'), userController.getAllUsers);
router.get('/:userId',                    restrictTo('admin'), userController.getUserById);
router.patch('/:userId/role',             restrictTo('admin'), userController.updateUserRole);
router.patch('/:userId/toggle-active',    restrictTo('admin'), userController.toggleUserActive);

module.exports = router;
