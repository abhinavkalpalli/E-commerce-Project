const express=require('express')
const router=express.Router()


const authController=require('../controllers/authController')
const isAuth=require('../middleware/isAuth')



router.get('/login',isAuth.userLoggedout,authController.getUserLogin)
router.post('/login',isAuth.adminLoggedOut,authController.doUserLogin)
router.get('/signup',isAuth.userLoggedout,authController.getUserSignup)
router.get('/logout',isAuth.userAuth,authController.doUserLogout)
router.post('/signup',isAuth.userLoggedout,authController.doUserSignup)
router.get('/otp-verification',isAuth.userLoggedout,authController.getSignupOtp)
router.post('/otp-verification',isAuth.userLoggedout,authController.signupVerification)
router.get('/resend-otp',isAuth.userLoggedout,authController.resendOtp)
router.get('/forgotresendotp',isAuth.userLoggedout,authController.forgotresendOtp)
router.get('/adminsign',isAuth.adminLoggedOut,authController.adminSignup)
router.post('/adminsign',isAuth.adminLoggedOut,authController.doAdminSignup)
router.get('/adotp-verification',isAuth.adminLoggedOut,authController.admingetSignupOtp)
router.post('/adotp-verification',isAuth.adminLoggedOut,authController.adminsignupVerification)
router.get( '/forgot-password', isAuth.userLoggedout, authController.getForgotPassword)
router.post( '/forgot-password', isAuth.userLoggedout, authController.fogotPassword)
router.post( '/password-otp-verification', isAuth.userLoggedout, authController.forgotPasswordOtpVerification  )
router.post( '/new-password', isAuth.userLoggedout, authController.newPassword)
router.get('/change-password',isAuth.userAuth,authController.getchangepassword)
router.post('/change-password',isAuth.userAuth,authController.changepassword)


module.exports=router;