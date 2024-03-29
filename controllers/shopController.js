const userSchema=require('../models/userModel');
const categorySchema=require('../models/categoryModel')
const productSchema=require('../models/productModel')
const {search}=require('../routers/shopRouter');
const paginationHelper=require('../helpers/paginationHelper');
const cartHelper = require('../helpers/cartHelper');
const addressSchema=require('../models/addressModel')
const cartSchema=require('../models/cartModel')
const couponHelper=require('../helpers/couponHelper')
const brandSchema=require('../models/brandModel')
const bannerSchema = require( '../models/bannerModel' )
const contactSchema=require('../models/contactModel')

module.exports={
    //Getting home page
    getHome:async(req,res)=>{
            const banners = await bannerSchema.find({
                status: true,
                $and: [
                    { startingDate: { $lte: new Date() } },
                    { expiryDate: { $gte: new Date() } }
                ]
            });
        const products =await productSchema.find({status:true}).populate({
            path : 'offer',
            match :  { startingDate : { $lte : new Date() }, expiryDate : { $gte : new Date() }}
        })
        .populate({
            path : 'category',
            populate : {
                path : 'offer',
                match : { startingDate : { $lte : new Date() }, expiryDate : { $gte : new Date() }}
            }
        })
        res.render('shop/home',{products:products,banners : banners})
    
    },
    //Getshop
    getShop:async(req,res)=>{
        try{
            const {cat,brand,search}=req.query
            const userLoggedin=req.session.user
            let page=Number(req.query.page);
            if(isNaN(page)|| page<1){
                page=1;
            }
            const condition={status:true}
            if(cat){
                condition.category=cat
            }
            if(brand){
                condition.brand=brand
            }
            if(search){
                condition.$or=[
                    {name:{$regex:search,$options:"i"}},
                    {description:{$regex:search,$options:"i"}}
                ]
            }
            const productCount=await productSchema.find(condition).count()
            const products=await productSchema.find(condition).populate({
                path : 'offer',
                match :  { startingDate : { $lte : new Date() }, expiryDate : { $gte : new Date() }}
            })
            .populate({
                path : 'category',
                populate : {
                    path : 'offer',
                    match : { startingDate : { $lte : new Date() }, expiryDate : { $gte : new Date() }}
                }
            })
            .skip( ( page - 1 ) * paginationHelper.ITEMS_PER_PAGE ).limit( paginationHelper.ITEMS_PER_PAGE )  // Pagination
            const category = await categorySchema.find({ status: true }) 
            const brands = await brandSchema.find({status:true})
            const startingNo = (( page - 1) * paginationHelper.ITEMS_PER_PAGE ) + 1
            const endingNo = Math.min(startingNo + paginationHelper.ITEMS_PER_PAGE)
            res.render( 'shop/shop', {
                userLoggedin:userLoggedin,
                products  : products,
                category : category,
                brands : brands,
                totalCount : productCount,
                currentPage : page,
                hasNextPage : page * paginationHelper.ITEMS_PER_PAGE < productCount, // Checks is there is any product to show to next page
                hasPrevPage : page > 1,
                nextPage : page + 1,
                prevPage : page -1,
                lastPage : Math.ceil( productCount / paginationHelper.ITEMS_PER_PAGE||1 ),
                startingNo : startingNo,
                endingNo : endingNo,
                cat : cat,
                brand : brand,
                search : search
            })
        }catch(error){
            res.redirect('/500')
        }
    },
    //Single product
    getSingleProduct:async(req,res)=>{
        try{
            const product = await productSchema.find({ _id : req.params.id, status : true })
            .populate({
                path : 'offer',
                match :  { startingDate : { $lte : new Date() }, expiryDate : { $gte : new Date() }}
            })
            .populate({
                path : 'category',
                populate : {
                    path : 'offer',
                    match : { startingDate : { $lte : new Date() }, expiryDate : { $gte : new Date() }}
                }
            }).populate({
                path: 'review.userId',
            });  
            res.render( 'shop/single-product', {
                product : product,})    
        }catch(error){
            res.redirect('/500')
        }
    },
    //Checkout page
    getCheckout : async( req, res ) => {
        try {
            const { user } = req.session
            const cartAmount = await cartHelper.totalCartPrice( user )
            const cart = await cartSchema.findOne({ userId : user })
            const userDetails = await userSchema.findOne({ _id : user })
            let discounted
            if( cart && cart.coupon && cartAmount && cartAmount.length > 0 ) {
                discounted = await couponHelper.discountPrice( cart.coupon, cartAmount[0].total )
            }
            const address = await userSchema.findOne({ _id : user }).populate( 'address' )
            const addresses = address.address.reverse()
            const flashMessages = req.flash()
            res.render( 'shop/checkout', {
                cartAmount : cartAmount,
                address : addresses,
                discounted : discounted,
                user : userDetails,
                 messages: flashMessages 

            })
        } catch ( error ) {
            res.redirect('/500')

        }
    },

    getCheckoutAddAddress:async(req,res)=>{
        res.render('shop/checkout-address')
    },
    //Adding checkout address
    checkoutAddAddress:async(req,res)=>{
        try{
            const address=new addressSchema({
                fullName:req.body.fullName,
                mobile:req.body.mobile,
                landmark:req.body.street,
                village:req.body.village,
                city:req.body.city,
                street:req.body.street,
                pincode:req.body.pincode,
                state:req.body.state,
                country:req.body.country,
                userId:req.session.user
            })
            const result=await address.save()
            await userSchema.updateOne({_id:req.session.user},{
                $push:{
                    address:result._id
                }
            })
            res.redirect('/checkout')
        }catch(error){
            res.redirect('/500')
        }
    },
    //Product review
    review:async(req,res)=>{
        try{
            const {rating,comment,productId}=req.body
            const {user}=req.session
            const product=await productSchema.findById(productId)
            const exist=product.review.find((item)=>item.userId==user)


            if(exist){
                res.json({userExist:true,message:'Already reviewed'})
            }else{
            const rated={
                userId:user,
                rating:rating,
                comment:comment
            }
            
            product.review.push(rated);
            await product.save();
            
            let totalrating=0
            for(item of product.review){
                totalrating+=item.rating
            }
            let averagerating=totalrating/product.review.length
            product.rating=averagerating/5*100
            await product.save()
            res.json({success:true,message:'Success'})
            }
        }catch(error){
            console.log(error.message);
            res.redirect('/500')
        }
    },
    contactus:async(req,res)=>{
        res.render('shop/contact')
    },
    contactsubmit:async(req,res)=>{
        try{
      const {email,phone,idea}=req.body
      const comments=await contactSchema({
        Email:email,
        Idea:idea,
        contact:phone
      })
      await comments.save()
    }catch(error){
        res.redirect('/500')
        
    }
    },


}