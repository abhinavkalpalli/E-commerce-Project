const bcrypt =require('bcryptjs')
const userSchema=require('../models/userModel')
const verificationController = require('./verificationController')
const adminSchema = require('../models/adminSchema')
const cartSchema=require('../models/cartModel')

module.exports={
//Get user login page
    getUserLogin:async(req,res)=>{
        try{
            res.render('auth/userLogin',{err:req.flash('error')})
        }catch(error){
            error.message
        }
    },
    //User Login
    doUserLogin: async(req,res)=>{
        try{
            userData=await userSchema.findOne({email:req.body.email})
            if(userData && userData.isAdmin!==1){
                if(userData.isBlocked === false){
                    const password=await bcrypt.compare(req.body.password,userData.password)
                    if(password){
                        if(userData.isVerified){
                            const productCount=await cartSchema.findOne({userId:userData._id})
                            req.session.user=userData._id
                            if(productCount){
                            req.session.productCount=productCount.items.length
                            }else{
                                req.session.productCount=0
                            }
                            
                            res.redirect('/shop')
                        }else{
                            const newOtp = verificationController.sendEmail(req.body.email, req.body.lastName)
                            await userSchema.updateOne({email : req.body.email},{
                                $set :{ 'token.otp' : newOtp , 'token.generatedTime' : new Date()}
                            })
                            req.session.unVerfiedMail = req.body.email
                            res.redirect( '/otp-verification')
                        }
                    }else{
                        req.flash('error','Incorrect password')
                        res.redirect('/login')
                    }
                }else{
                    const password=await bcrypt.compare(req.body.password,userData.password)
                    if(password){
                        //if user is blocked
                        req.flash('error','blocked user')
                        res.redirect('/login')
                    }else{
                        //For incorrect password
                        req.flash('error','incorrect Password')
                        res.redirect('/login')
                    }
                }
            }else{
                //incorrect Username
                req.flash('error','Incorrect email')
                res.redirect('/login')
            }
        }catch(error){
            res.redirect('/500')
            console.log(error)
        
        }
    },
    //Userlogout
    doUserLogout:(req,res)=>{
        try{
            req.session.user=null
            req.session.productCount=0;
            res.redirect('/login')
        }catch(error){
            res.redirect('/500')
            console.log(error)
        }
    },
    //getting User Signup page
    getUserSignup:(req,res)=>{
        
        res.render('auth/userSignup',{err:req.flash('userExist')})
    },
    //user Signup
    doUserSignup:async(req,res)=>{
        try{
            const {referral}=req.body

            //checking if there any existing user
            const userData=await userSchema.findOne({email:req.body.email})

            //if user exist
            if(userData){
                req.flash('userExist','User already exist..')
                return res.redirect('/signup')
            }
            else{
                const otp=verificationController.sendMail(req.body.email)
                const password=await bcrypt.hash(req.body.password,12)
                const user=new userSchema({
                    firstName:req.body.firstName,
                    lastName:req.body.lastName,
                    email:req.body.email,
                    isAdmin:0,
                    mobile:req.body.mobile,
                    password:password,
                    token:{
                        otp:otp,
                        generatedTime:new Date()
                    }
                })
                await user.save()
                if(referral){
                    await userSchema.updateOne({email:req.body.email},{
                        $set:{
                            isReferred:referral
                        }
                    })
                }
                req.session.unVerfiedMail=req.body.email
                req.session.referral=referral
                res.redirect('/otp-verification')
            }
        }catch(error){
            res.redirect('/500')
        }    
    },

    //otp page
    getSignupOtp:(req,res)=>{
        res.render('auth/signup-otp')
    },

    //signup verification
    signupVerification: async(req,res)=>{
        try{
            const entertime=new Date()
            let {val1,val2,val3,val4,val5,val6}=req.body
            userotp=val1+val2+val3+val4+val5+val6
            const referral=req.session.referral

            //checking otp in database
            const otpCheck=await userSchema.findOne({email:req.session.unVerfiedMail,'token.otp':userotp})
        const isAdmin=await userSchema.findOne({email:req.session.unVerfiedMail})
        
            //if otp matched
            if(otpCheck){

                //calculating the expire of OTP
                const timeDiff=(new Date(entertime)-otpCheck.token.generatedTime)/1000/60
                if(timeDiff<=1){
                    const referralCode=verificationController.referralCodeGenerator();
                    //if expiry time is not over
                    await userSchema.updateOne({email:otpCheck.email},{$set:
                        {
                        isVerified:true,
                        referralCode:referralCode
                        }
                })
                if(referral){
                    await userSchema.updateOne({referralCode:referral},{
                        $inc:{
                            wallet:50
                        },
                        $push:{
                            walletHistory:{
                                date:Date.now(),
                                amount:50,
                                message:'Referral bonus'
                            }
                        }
                    })
                    await userSchema.updateOne({_id:otpCheck._id},{
                        $inc:{
                            wallet:100
                        },
                        $push:{

                            walletHistory:{
                                date:Date.now(),
                                amount:100,
                                message:'Join bonus'
                            }
                        }
                    })
                }
                req.session.user=otpCheck._id;
                req.session.unVerfiedMail=null
                    if (isAdmin.isAdmin===0){
                        req.session.user=otpCheck._id
                    res.redirect('/shop') }
                }
            }else{
                res.redirect('/otp-verification')
            }
            
        }catch(error){
            res.redirect('/500')
        }
    },
    //admin login
    getAdminLogin:async (req,res)=>{
        res.render('auth/adminLogin',{err:false})
    },
    doAdminLogin:async(req,res)=>{
        try{
            const adminData=await adminSchema.findOne({email:req.body.email})
            if(adminData && adminData.isAdmin ==1){
                const password=await bcrypt.compare(req.body.password,adminData.password)
                if(password){
                    req.session.admin=adminData._id
                    res.redirect('/admin')
                }else{
                    res.render('auth/adminLogin',{
                        err:'Incorrect Password'
                    })
                }
            }else{
                res.render('auth/adminLogin',{
                    err:'Incorrect Email'
                })
            }

        }catch(error){
            res.redirect('/500')
        }
    },
    doAdminLogout:(req,res)=>{
        try{
            req.session.admin=null
            res.redirect('/admin/admin-login')
        }catch(error){
            res.redirect('/500')
        }
    },
    //otp resend
    resendOtp:async(req,res)=>{
        try{
            let email=req.session.unVerfiedMail
            const otp=verificationController.sendMail(email)
            await userSchema.updateOne({email:email},{$set:{
                token:{
                    otp:otp,
                    generatedTime:new Date()
                }
            }
            })
            res.redirect('/otp-verification')  
        }
        catch(error){
            res.redirect('/500')
        }

    },
    forgotresendOtp:async(req,res)=>{
        try{
            let email=req.session.unVerfiedMail
            const otp=verificationController.sendMail(email)
            await userSchema.updateOne({email:email},{$set:{
                token:{
                    otp:otp,
                    generatedTime:new Date()
                }
            }
            })
            res.render('auth/forgot-password-otp')
        }
        catch(error){
            res.redirect('/500')
        }

    },
    
    adminSignup:(req,res)=>{
        const {referral}=req.query
        res.render('auth/adminSignup',{err:req.flash('userExist'),referral:referral})
    },
    //user Signup
    doAdminSignup:async(req,res)=>{
        try{
            const {referral}=req.body
            
            //checking if there any existing user
            const adminData=await adminSchema.findOne({email:req.body.email})

            //if user exist
            if(adminData){
                req.flash('userExist','User already exist..')
                return res.redirect('/adminsign')
            }
            else{
                const otp=verificationController.sendMail(req.body.email)
                
                const password=await bcrypt.hash(req.body.password,12)
                const admin=new adminSchema({
                    firstName:req.body.firstName,
                    lastName:req.body.lastName,
                    email:req.body.email,
                    mobile:req.body.mobile,
                    password:password,
                    token:{
                        otp:otp,
                        generatedTime:new Date()
                    }
                })
                await admin.save()
                req.session.unVerfiedMail=req.body.email
                res.redirect('/adotp-verification')
            }
        }catch(error){
            res.redirect('/500')
        
        }    
    },
    adminsignupVerification: async(req,res)=>{
        try{

            const entertime=new Date()
            let {val1,val2,val3,val4,val5,val6}=req.body
            adminotp=val1+val2+val3+val4+val5+val6

            //checking otp in database
            const otpCheck=await adminSchema.findOne({email:req.session.unVerfiedMail,'token.otp':adminotp})
        

            //if otp matched
            if(otpCheck){

                //calculating the expire of OTP
                const timeDiff=(new Date(entertime)-otpCheck.token.generatedTime)/1000/60
                if(timeDiff<=1){
                    const referralCode=verificationController.referralCodeGenerator();
                    //if expiry time is not over
                    await adminSchema.updateOne({email:otpCheck.email},{$set:
                        {
                        isVerified:true,
                        referralCode:referralCode
                        }
                })
                req.session.admin=otpCheck._id;
                req.session.unVerfiedMail=null
                    res.redirect('/admin')
                    }
                    
            }else{
                res.redirect('/adotp-verification')                
            }            
        }catch(error){
            res.redirect('/500')
        }
    },
    admingetSignupOtp:(req,res)=>{
        res.render('auth/adsignup-otp')
    },
    getForgotPassword:async(req,res)=>{
        res.render('auth/forgot-password',{err:req.flash('existErr')})
    },
    fogotPassword:async(req,res)=>{
        try{
            const emailExist=await userSchema.findOne({email:req.body.email})
            if(emailExist){
                const newOtp=verificationController.sendMail(req.body.email,req.body.lastName)
                await userSchema.updateOne({email:req.body.email},{
                    $set:{
                        'token.otp':newOtp,'token.generatedTime':new Date()
                    }
                })
                req.session.unVerfiedMail=req.body.email
                res.render('auth/forgot-password-otp')
            }else{
                req.flash('existErr','Mail not exist')
                res.redirect('/forgot-password')
            }
        }catch(error){
            res.redirect('/500')
        }
    },
    forgotPasswordOtpVerification:async(req,res)=>{
        try{
             const enterTime = new Date()
            let { val1, val2, val3, val4, val5, val6 } = req.body
            userOtp = val1 + val2 + val3 + val4 + val5 + val6
    
            // Checking otp in database
            const otpCheck = await userSchema.findOne({email: req.session.unVerfiedMail, 'token.otp' : userOtp })
    
            // If Otp matched
            if( otpCheck ) { 
    
                //Calculating the expire of the OTP
                const timeDiff =  (new Date(enterTime) - otpCheck.token.generatedTime) / 1000 / 60
                if( timeDiff <= 60 ) {
                    console.log('otp matched');
                    // If expiry time is valid setting isVerified as true
                    res.render('auth/passwordReEnter',{
                        err : req.flash('err')
                    })
                   // If TimedOut
                } else {
                    console.log('timout');
                    res.redirect( '/otp-verification' )
                }
    
                // If not OTP in database
            } else {
                console.log('otp not matched');
                res.redirect('/otp-verification')
            }
            
        }catch(error){
            res.redirect('/500')
        }
    },
    newPassword:async(req,res)=>{
        try{
            const password=await bcrypt.hash(req.body.password,12)
            await userSchema.findOneAndUpdate({email:req.session.unVerfiedMail,isBlocked:false},{
                $set:{
                    password:password
                }
            })
            res.redirect('/login')
        }catch(error){
            res.redirect('/500')
        }
    },
    getchangepassword:async(req,res)=>{
        res.render('auth/changepassword',{err:req.flash('existErr')})
    },
    changepassword: async (req, res) => {
        try {
            const user = req.session.user;
            const { oldpassword, password, confirmPassword } = req.body;
            const userExist = await userSchema.findOne({ _id: user });
    
            if (userExist) {
                const isPasswordMatch = await bcrypt.compare(oldpassword, userExist.password);
    
                if (isPasswordMatch) {
                    const hashedNewPassword = await bcrypt.hash(password, 12);
                    await userSchema.updateOne({ _id: user }, { $set: { password: hashedNewPassword } });
                    return res.status(200).json({ success: true });
                } else {
                    return res.status(401).json({ oldpasswordwrong: true});                    
                }
            } else {
                return res.status(404).json({ success: false, err: 'User not found' });
            }
        } catch (error) {
            return res.status(500).json({ success: false, err: 'Internal Server Error' });
        }
    }
}