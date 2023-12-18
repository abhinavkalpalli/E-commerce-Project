const express=require('express')

//Getting controllers
const shopController=require('../controllers/shopController');
const isAuth=require('../middleware/isAuth');
const isBlocked=require('../middleware/isBlocked')
const cartController=require('../controllers/cartController');
const orderController=require('../controllers/orderController');
const couponController = require('../controllers/couponController');
const wishlistController=require('../controllers/wishlistController');




const router=express.Router();

//Routers
router.get('/',shopController.getHome)
router.get('/shop',shopController.getShop)
router.get('/products/:id',shopController.getSingleProduct)

router.get('/cart',isAuth.userAuth,isBlocked.isBlocked,cartController.getCart)
router.post('/add-to-cart',cartController.addToCart)
router.post('/decrease-cart',isAuth.userAuth,cartController.deCart)
router.patch('/removeCartItem',isAuth.userAuth,cartController.removeCartItem)

router.get('/checkout',isAuth.userAuth,isBlocked.isBlocked,shopController.getCheckout)
router.get('/add-checkout-address',isAuth.userAuth,isBlocked.isBlocked,shopController.getCheckoutAddAddress)
router.post('/add-checkout-address',isAuth.userAuth,isBlocked.isBlocked,shopController.checkoutAddAddress)

router.post('/place-order',isAuth.userAuth,isBlocked.isBlocked,orderController.placeOrder)
router.get('/confirm-order',isAuth.userAuth,isBlocked.isBlocked,orderController.getConfirmOrder)
router.get('/invoice/:Id',isAuth.userAuth,isBlocked.isBlocked,orderController.invoice)

router.post('/verify-payment',isAuth.userAuth,isBlocked.isBlocked,orderController.razorpayVerifyPayment)

router.post('/apply-coupon',isAuth.userAuth,couponController.applyCoupn)
router.get('/cancelCoupon',isAuth.userAuth,couponController.cancelCouponuser)

router.post('/add-to-wishlist',isAuth.userAuth,wishlistController.addToWishlist)
router.get ( '/wishlist', isAuth.userAuth, wishlistController.getWishlist )
router.put( '/remove-wishlist-item', isAuth.userAuth, wishlistController.removeItem )





module.exports=router