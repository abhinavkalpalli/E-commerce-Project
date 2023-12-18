const express=require('express')
const userController=require('../controllers/userController')
const isAuth=require('../middleware/isAuth')
const isBlocked=require('../middleware/isBlocked')
const orderController = require('../controllers/orderController')

const router=express.Router()

router.get('/profile',isAuth.userAuth,userController.getUserProfile)
router.put('/edit-profile',isAuth.userAuth,isBlocked.isBlocked,userController.editProfile)

router.get('/address',isAuth.userAuth,userController.getAddress)
router.get( '/add-address', isAuth.userAuth, userController.getAddAddress )
 router.post( '/add-address', isAuth.userAuth, userController.addAddress)
 router.patch( '/remove-address/:id', isAuth.userAuth, userController.removeAddress )
 router.get( '/edit-address/:id', isAuth.userAuth, userController.getEditAddress )
 router.post( '/edit-address', isAuth.userAuth, userController.editAddress )  

 router.get('/orders',isAuth.userAuth,isBlocked.isBlocked,orderController.getOrders)
 router.get('/view-order-products/:id',isAuth.userAuth,isBlocked.isBlocked,orderController.userOrderProducts)
 router.patch('/cancel-order',isAuth.userAuth,isBlocked.isBlocked,orderController.userCancelOrder)
 router.get('/getReturn/:id',isAuth.userAuth,isBlocked.isBlocked,orderController.getReturn)


 router.post( '/verify-payment', isAuth.userAuth,isBlocked.isBlocked ,userController.razorpayVerifyPayment )
 router.post( '/return-order', isAuth.userAuth,isBlocked.isBlocked, orderController.returnOrder )

 router.get('/wallet',isAuth.userAuth,isBlocked.isBlocked,userController.getwalletHistory)
 
module.exports= router