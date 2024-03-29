const express=require('express')
const isAuth = require('../middleware/isAuth');                     
const multer=require('multer')
const upload=require('../middleware/multer');
//Getting controllers
const categoryController = require('../controllers/categoryController');
const orderController=require('../controllers/orderController');
const couponController=require('../controllers/couponController');
const offerController=require('../controllers/offerController');
const brandController=require('../controllers/brandController');
const bannerController = require( '../controllers/bannerController' );
const authController=require('../controllers/authController');
const adminController = require('../controllers/adminController');
const productController=require('../controllers/productController')
                            
const router=express.Router()

//routes
router.get('/admin-login',isAuth.adminLoggedOut,authController.getAdminLogin)
router.post('/admin-log',isAuth.adminLoggedOut,authController.doAdminLogin)
router.get( '/logout', isAuth.adminAuth,authController.doAdminLogout )
router.get('/',isAuth.adminAuth,adminController.getAdminHome)


router.get('/userList',isAuth.adminAuth,adminController.getUserList)
router.patch('/block-user/:id',isAuth.adminAuth,adminController.blockUser)
router.patch('/unblock-user/:id',isAuth.adminAuth,adminController.unBlockUser)

router.get('/products',isAuth.adminAuth,productController.getProductsList)
router.get('/add-products',isAuth.adminAuth,productController.getAddProducts)
router.post('/add-products',isAuth.adminAuth,upload.array('image',4),productController.addProducts)
router.get('/delete-product',isAuth.adminAuth,productController.deleteProduct)
router.get('/edit-product/:id',isAuth.adminAuth,productController.getEditProduct)
router.post('/edit-product',isAuth.adminAuth,upload.array('image',4),productController.editProduct)
router.get('/delete-image',isAuth.adminAuth,productController.deleteImage)
router.get('/delete-product/:id',isAuth.adminAuth,productController.deleteProduct)
router.get('/restore-product/:id',isAuth.adminAuth,productController.restoreProduct)

router.get('/category',isAuth.adminAuth,categoryController.getCategory)
router.post('/add-category',isAuth.adminAuth,categoryController.addCategory)
router.get('/edit-category/:id',isAuth.adminAuth,categoryController.getEditCategory)
router.post('/edit-category',isAuth.adminAuth,categoryController.editCategory)
router.get('/list-category/:id',isAuth.adminAuth,categoryController.listCategory)
router.get('/unlist-category/:id',isAuth.adminAuth,categoryController.unlistCategory)

router.get('/delete-category/:id',isAuth.adminAuth,categoryController.categorydelete)

router.get('/brand',isAuth.adminAuth,brandController.getBrand)
router.post('/add-brand',isAuth.adminAuth,brandController.addBrand)
router.get('/edit-brand/:id',isAuth.adminAuth,brandController.getEditBrand)
router.post('/edit-brand',isAuth.adminAuth,brandController.editBrand)
router.get('/list-brand/:id',isAuth.adminAuth,brandController.listBrand)
router.get('/unlist-brand/:id',isAuth.adminAuth,brandController.unlistBrand)

router.get( '/orders', isAuth.adminAuth, orderController.getAdminOrderlist )
router.get('/order-products/:id',isAuth.adminAuth,orderController.orderDetailsforAdmin)
router.patch( '/change-order-status', isAuth.adminAuth, orderController.changeOrderStatus )

router.get('/coupons',isAuth.adminAuth,couponController.getCoupons)
router.get('/add-coupon',isAuth.adminAuth,couponController.getAddCoupon)
router.post('/add-coupon',isAuth.adminAuth,couponController.addCoupon)
router.get('/edit-coupon/:id',isAuth.adminAuth,couponController.getEditCoupon)
router.post('/edit-coupon',isAuth.adminAuth,couponController.editCoupon)
router.patch('/cancel-coupon',isAuth.adminAuth,couponController.cancelCoupon)
router.patch('/Reactive-coupon',isAuth.adminAuth,couponController.ReactiveCoupon)

router.get( '/banner', isAuth.adminAuth, bannerController.getBannerManagement )
router.get( '/add-banner', isAuth.adminAuth, bannerController.getAddBanner )
router.post( '/add-banner', isAuth.adminAuth, upload.single('image'), bannerController.addingBanner )
router.get( '/edit-banner/:id', isAuth.adminAuth, bannerController.getEditBanner )
router.post( '/edit-banner', isAuth.adminAuth, upload.single('image'), bannerController.updateBanner )
router.get( '/delete-banner/:id', isAuth.adminAuth, bannerController.deleteBanner )
router.get( '/restore-banner/:id', isAuth.adminAuth, bannerController.restoreBanner )


router.get('/offers',isAuth.adminAuth,offerController.getOffers)
router.get('/add-offer',isAuth.adminAuth,offerController.getAddOffer)
router.post('/add-offer',isAuth.adminAuth,offerController.addOffer)
router.get( '/edit-offer/:id', isAuth.adminAuth, offerController.getEditOffer )
router.post( '/edit-offer', isAuth.adminAuth, offerController.editOffer )
router.patch( '/cancel-offer', isAuth.adminAuth, offerController.cancelOffer )
router.patch('/activate-offer',isAuth.adminAuth,offerController.activateOffer)
router.patch( '/apply-product-offer', isAuth.adminAuth, productController.applyProductOffer )
router.patch( '/remove-product-offer', isAuth.adminAuth, productController.removeProductOffer )
router.patch( '/apply-category-offer', isAuth.adminAuth, categoryController.applyCategoryOffer )
router.patch( '/remove-category-offer', isAuth.adminAuth, categoryController.removeCategoryOffer )

router.get('/sales-report',isAuth.adminAuth,orderController.getSalesReport)

router.post('/filterchart',isAuth.adminAuth,adminController.filterchart)

router.get('/ideas',isAuth.adminAuth,adminController.ideas)

module.exports=router