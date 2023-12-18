const userSchema=require('../models/userModel');
const categorySchema=require('../models/categoryModel')
const productSchema=require('../models/productModel')
const {search}=require('../routers/shopRouter');
const paginationHelper=require('../helpers/paginationHelper');
const cartHelper = require('../helpers/cartHelper');
const addressSchema=require('../models/addressModel')

module.exports={
    getHome:async(req,res)=>{
        const products =await productSchema.find({status:true}).populate('category')
        res.render('shop/home',{products:products})
    
    },
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
                path:'category'
            })
            .skip( ( page - 1 ) * paginationHelper.ITEMS_PER_PAGE ).limit( paginationHelper.ITEMS_PER_PAGE )  // Pagination
            const category = await categorySchema.find({ status: true }) 
            const brands = await productSchema.distinct( 'brand' )
            const startingNo = (( page - 1) * paginationHelper.ITEMS_PER_PAGE ) + 1
            const endingNo = startingNo + paginationHelper.ITEMS_PER_PAGE
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
                lastPage : Math.ceil( productCount / paginationHelper.ITEMS_PER_PAGE ),
                startingNo : startingNo,
                endingNo : endingNo,
                cat : cat,
                brand : brand,
                search : search
            })
        }catch(error){
            res.redirect('/500')
            console.log(error)
        }
    },
    getSingleProduct:async(req,res)=>{
        try{
            const userLoggedin=req.session.user
            const product=await productSchema.find({_id:req.params.id,status:true}).populate('category').limit(4)
            const related=await productSchema.find({status:true}).populate('category').limit(4)
            res.render('shop/single-product',{
                product:product,
                related:related
            })
        }catch(error){
            res.redirect('/500')
            console.log(error)
        }
    },
    getCheckout:async(req,res)=>{
        try{
            const{user}=req.session
            const cartAmount=await cartHelper.totalCartPrice(user)
            const cart=await categorySchema.findOne({userId:user})
            const userDetails=await userSchema.findOne({_id:user})
            const address=await userSchema.findOne({_id:user}).populate('address')
            const addresses=address.address.reverse()
            res.render('shop/checkout',{
                cartAmount:cartAmount,
                address:addresses,
                user:userDetails
            })

        }catch(error){
            res.redirect('/500')
        }
    },
    getCheckoutAddAddress:async(req,res)=>{
        res.render('shop/checkout-address')
    },
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
            console.log(error)
        }
    }
}