const userSchema=require('../models/userModel')
const addressSchema=require('../models/addressModel')
const crypto=require('crypto')
const paymentHelper=require('../helpers/paymentHelper')

module.exports={
    //User profile
    getUserProfile:async(req,res)=>{
        try{
            
            const user=await userSchema.findOne({_id:req.session.user})
            res.render('user/profile',{user:user})
        }catch(error){
            res.redirect('/500')
        }
    },
    getAddAddress:(req,res)=>{
        res.render('user/add-address')
    },
    //Adding address
    addAddress:async(req,res)=>{
        try{
            const address=new addressSchema({
                fullName:req.body.fullName,
                mobile:req.body.mobile,
                landmark:req.body.landmark,
                street:req.body.street,
                village:req.body.village,
                city:req.body.city,
                pincode:req.body.pincode,
                state:req.body.state,
                country:req.body.country,
                userId:req.session.user
            })
            const result=await address.save()
            await userSchema.updateOne({_id:req.session.user},{
                $push:{address:result._id}
            })
            res.redirect('/user/address')
        }catch(error){
            res.redirect('/500')
        }
    },
    getAddress:async(req,res)=>{
        try{
            const user=await userSchema.find({_id:req.session.user}).populate({
                path:'address',
                model:'address',
                match:{status:true}
            })
            res.render('user/address',{
                user:user[0],
                address:user[0].address,
        
            })
        }catch(error){
            res.redirect('/500')
        }
    },
    //Removing address
    removeAddress:async(req,res)=>{
        try{
            const addressId=req.params.id
            await addressSchema.updateOne({_id:addressId},{$set:{status:false}})
            await userSchema.updateOne({_id:req.session.user},{$pull:{address:addressId}})
            res.status(200).json({success:true})
        }catch(error){
            res.redirect('/500')
        }
    },
    getEditAddress:async(req,res)=>{
        try{
            const addressId=req.params.id
            const address=await addressSchema.findOne({_id:addressId})
            res.render('user/edit-address',{address:address})
        }catch(error){
            res.redirect('/500')
        }
    },
    editAddress:async(req,res)=>{
        const addressId=req.body.id
        try{
            await addressSchema.updateOne({_id:addressId},{
                $set:{
                    fullName:req.body.fullName,
                    mobile:req.body.mobile,
                    landmark:req.body.landmark,
                    street:req.body.street,
                    village:req.body.village,
                    city:req.body.city,
                    pincode:req.body.pincode,
                    state:req.body.state,
                    country:req.body.country   
                }
            })
            res.redirect('/user/address')
        }catch(error){
            res.redirect('/500')
        }
    },
    //Edit profile
    editProfile:async(req,res)=>{
        try{
            await userSchema.updateOne({_id:req.session.user},{
                $set:{
                    firstName : req.body.firstName,
                    lastName : req.body.lastName,
                    mobile : req.body.mobile,
                    email : req.body.email
                }
            })
            res.status(200).json({success:true})
        }catch(error){
            res.redirect('/500')
        }
    },
    razorpayVerifyPayment : async( req, res ) => {
        const { user } = req.session
        const { order } = req.body
        await userSchema.updateOne({ _id : user }, {
            $inc : {
                wallet : ( order.amount ) / 100
            },
            $push : {
                walletHistory : {
                    date : Date.now(),
                    amount : ( order.amount ) / 100,
                    message : "Deposit from payment gateway"
                }
            }
        })
        res.json({ paid : true })
    },
    //Wallet history
    getwalletHistory:async(req,res)=>{
        try{
            const {user}=req.session
            const userDetails=await userSchema.findOne({_id:user})
            if (userDetails) {
                // Sort walletHistory based on the date field in descending order (latest first)
                userDetails.walletHistory.sort((a, b) => b.date - a.date);
              }
            res.render('user/wallet',{user:userDetails})

        }catch(error){
            res.redirect('/500')
        }
    }
}