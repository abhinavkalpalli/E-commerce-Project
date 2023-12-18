
const cartSchema=require('../models/cartModel')
const mongoose=require('mongoose')

module.exports={
    updateQuantity:async(user)=>{
        try{
            const cartItems=await cartSchema.findOne({userId:user}).populate('items.productId');
            console.log(cartItems)
            if(cartItems){
                for(let items of cartItems.items){
                    //if cart have more quantity than stock 
                    if(items && items.productId.quantity>0 && items.productId.quantity<items.quantity){
                        newQuantity=items.productId.quantity
                        await cartSchema.updateOne({userId:user,'items.productId':items.productId._id},{$set:{'items.$.quantity':newQuantity}})
                        //if stock quantity is 0 then item will remove from cart
                    }else if(items && items.productId.quantity<1){
                        await cartSchema.updateOne({userId:user,'items.productId':items.productId._id},{$pull:{items:{productId:items.productId._id}}})
                        return 1
                    }   
             }
                return 0
            }
        }catch(error){
            res.redirect('/500')
        }
    },
    totalCartPrice:async(user)=>{
        try{
            const totalPrice=await cartSchema.aggregate([
                {
                    $match:{userId:new mongoose.Types.ObjectId(user)}
                },
                {
                    $unwind:'$items'
                },
                {
                    $lookup:{
                        from:'products',
                        localField:"items.productId",
                        foreignField:'_id',
                        as:'product'
                    }
                },
                {
                    $unwind:'$product'
                },
                {
                    $lookup:{
                        from:'categories',
                        let:{categoryId:"$product.category"},
                        pipeline:[
                            {
                                $match:{
                                    $expr:{$eq:['$_id','$$categoryId']}
                                }
                            }
                        ],
                        as:"category"
                    }
                },
                {
                    $unwind:{
                        path:"$category"
                    }
                },
                {
                    $addFields:{
                        totalPricePerItem:{
                            $multiply:[
                                "$product.price","$items.quantity"
                            ]
                        }
                    }
                },
                {
                    $addFields:{
                        totalPricePerItem:{$trunc:"$totalPricePerItem"}
                    }
                },
                {
                    $group:{
                        _id:"$_id",
                        userId:{$first:"$userId"},
                        items:{
                            $push:{
                                _id:"$items._id",
                                productId:'$items.productId',
                                productName:'$product.name',
                                quantity:'$items.quantity',
                                totalPrice:'$totalPricePerItem'
                            }
                        },
                        total:{$sum:"$totalPricePerItem"}
                    }
                   
                }
            ]);
            return totalPrice
        }catch(error){
            console.log(error)
        }
    }
}