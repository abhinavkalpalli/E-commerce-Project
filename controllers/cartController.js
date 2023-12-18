const cartHelper = require('../helpers/cartHelper');
const cartSchema=require('../models/cartModel')
const productSchema=require('../models/productModel')
module.exports={
    getCart:async(req,res)=>{
        try{ 
            const {user}=req.session;
    
            const productCount =await cartHelper.updateQuantity(user)
            if(productCount ===1 ){
                req.session.productCount--
            }
            const updatedCart=await cartSchema.findOne({userId:user}).populate({
                path:'items.productId',
                populate:[{
                    path:'category'
                }]
            })
            const totalPrice=await cartHelper.totalCartPrice(user)
            if(updatedCart && updatedCart.items>0){
                req.session.productCount=updatedCart.items.length
            }
            res.render('shop/cart',{
                cartItems:updatedCart,
                totalAmount:totalPrice,
            })
        }catch(error){
            res.redirect('/500')
            console.log(error)
        }
    },
    addToCart:async (req,res)=>{
        try{
            if(req.session.user){
                userId=req.session.user;
                productId=req.body.productId;

                //getting stock qty
                const Quantity=await productSchema.findOne({_id:productId},{quantity:1})
                //checking the cart is exist
                const cart=await cartSchema.findOne({userId:userId})
                const stockQuantity=Quantity.quantity
                if(stockQuantity>0){
                    if(cart){
                        const exist=cart.items.find(item=>item.productId==productId)
                        if(exist){
                            const availableQuantity=stockQuantity-exist.quantity
                            if(availableQuantity>0){
                                await cartSchema.updateOne({userId:userId,'items.productId':productId},
                                {$inc:{'items.$.quantity':1}})
                                const totalPrice=await cartHelper.totalCartPrice(userId)
                                res.status(200).json({success:true,message:'Added to cart',login:true,totalPrice:totalPrice})
                            }
                            else{
                                //if cart quantity and available quantity are same
                                res.json({message:"oops! It seems you have reached the maximum quantity of products available",login:true,outOfStock:true})
                            }
                            //if product is not exist at cart
                        }else{
                            await cartSchema.updateOne({userId:userId},{$push:{items:{productId:productId}}})
                            //increasing product count in session
                            req.session.productCount++
                            res.status(200).json({success:true,message:'Added to cart',newItem:true,login:true})
                        }
                        //if cart not exit!!

                    }else{
                        //creating new cart
                        const newCart=new cartSchema({userId:req.session.user,
                        items:[{productId:productId}]})
                        await newCart.save()
                        req.session.productCount++
                        res.status(200).json({
                            success:'Added to cart',
                            login:true,
                            newItem:true
                        })
                    }
                } else{
                    res.json({error:true,message:'out of stock',login:true,outOfStock:true})
                }
            }
            else{
                res.json({login:false})
            }
        }catch(error){
            res.redirect('/500')
        }
    },
    deCart:async(req,res)=>{
            try{
                const {user}=req.session
                const {productId}=req.body
                const updatedCart=await cartSchema.findOneAndUpdate({
                    userId:user,
                    'items':{$elemMatch:{productId:productId,quantity:{$gte:2}}}
                },
                {$inc:{'items.$.quantity':-1}},
                {new:true}
                );
                if(updatedCart){
                    const totalPrice=await cartHelper(user)
                    res.status(200).json({success:true,message:'cart item decreased',totalPrice:totalPrice})
                }else{
                    res.json({success:false,message:`can't decrease the quantity`})
                }
        }catch(error){
                res.redirect('/500')
        }
    },
    removeCartItem:async(req,res)=>{
        try{
            
            const {user}=req.session
            const {itemId}=req.body
            const hai=await cartSchema.updateOne({userId:user,'items._id':itemId},
            {$pull:{items:{_id:itemId}}})
            req.session.productCount--
            if(req.session.productCount===0){
                await cartSchema.deleteOne({userId:user})
            }
            const totalPrice=await cartHelper.totalCartPrice(user)
            const cart=await cartSchema.findOne({userId:user})
            res.status(200).json({success:true,message:'Item removed',removeItem:true,totalPrice:totalPrice})
        }catch(error){
            res.redirect('/500')
        }
    }    

}