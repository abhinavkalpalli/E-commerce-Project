const orderSchema=require('../models/orderModel')
const cartSchema=require('../models/cartModel')
const productSchema=require('../models/productModel')
const userSchema=require('../models/userModel')
const cartHelper=require('../helpers/cartHelper')
const paginationHelper=require('../helpers/paginationHelper')

module.exports={
    placeorder:async(req,res)=>{
        try{
            const {user}=req.session
            const products=await cartHelper.totalCartPrice(user)
            const {paymentMethod,addressId,walletAmount}=req.body
            let walletBalance
            
            if(walletAmount){
                walletBalance=Number(walletAmount)
            }
            
            const productItems=products[0].items
            console.log(productItems)
            const cartProducts=productItems.map((items)=>({
                productId:items.productId,
                quantity:items.quantity,
                price:(items.totalPrice/items.quantity)
            }))
            console.log(cartProducts)
        
            const totalAmount=await cartHelper.totalCartPrice(user)
            totalPrice=totalAmount[0].total
            let walletUsed,amountPayable
            if(walletAmount){
                if(totalPrice>walletBalance){
                    amountPayable=totalPrice-walletBalance
                    walletUsed=walletBalance
                }else if(walletBalance>totalPrice){
                    amountPayable=0
                    walletUsed=totalPrice
                }
            }else{
                amountPayable=totalPrice
            }
            paymentMethod==='COD'? orderStatus='Confirmed':orderStatus='Pending';
            const order=new orderSchema({
                userId:user,
                products:cartProducts,
                totalPrice:totalPrice,
                paymentMethod:paymentMethod,
                orderStatus:orderStatus,
                address:addressId,
                walletUsed:walletUsed,
                amountPayable:amountPayable
            })
            await order.save()
            //Decreasing the quantity
            for(const items of cartProducts){
                const {productId,quantity}=items
                await productSchema.updateOne({_id:productId},
                    {$inc:{quantity:-quantity}})
            }
            //Deleting cart
            await cartSchema.deleteOne({userId:user})
            req.session.productCount=0
            if(paymentMethod==='COD' || amountPayable==0){
                if(walletAmount){
                    await userSchema.updateOne({_id:user},{
                        $inc:{
                            wallet:-walletUsed
                        },
                        $push:{
                            walletHistory:{
                                date:Date.now(),
                                amount:-walletUsed,
                                message:'Used for purchase'
                            }
                        }
                    })
                }
                return res.json({success:true})
            }
        }catch(error){
            res.redirect('/500')
            console.log(error)
        }
    },
    getConfirmOrder:async(req,res)=>{
        try{
            const {user}=req.session
            await cartHelper.totalCartPrice(user)
            const orders=await orderSchema.find({userId:user}).sort({date:-1}).limit(1).populate('products.productId').populate('address')
            if(orders.orderStatus=='Pending'){
                await orderSchema.updateOne({_id:orders._id},{
                    $set:{
                        orderStatus:'Confirmed'
                    }
                })
            }
            const lastOrder=await orderSchema.find({userId:user}).sort({date:-1}).limit(1).populate('products.productId').populate('address')
            res.render('shop/confirm-order',{
                order:lastOrder,
                products:lastOrder[0].products
            })
        }catch(error){
            res.redirect('/500')
        }
    },
    getAdminOrderlist:async(req,res)=>{
        try{
            const {sortData,sortOrder}=req.query
            let page=Number(req.query.page);
            if(isNaN(page)||page<1){
                page=1;
            }
            const sort={}
            if(sortData){
                
                    if(sortOrder === "Ascending"){
                        sort[sortData]=1
                    }else{
                        sort[sortData]=-1
                    }
                }else{
                    sort['date']=-1
                }
                const ordersCount=await orderSchema.find().count()
                const orders=await orderSchema.find().sort(sort).skip((page-1)*paginationHelper.ORDER_PER_PAGE).populate('userId').populate('products.productId').populate('address')
                res.render( 'admin/orders', {
                    orders : orders,
                    admin : true,
                    currentPage : page,
                    hasNextPage : page * paginationHelper.ORDER_PER_PAGE < ordersCount,
                    hasPrevPage : page > 1,
                    nextPage : page + 1,
                    prevPage : page -1,
                    lastPage : Math.ceil( ordersCount / paginationHelper.ORDER_PER_PAGE ),
                    sortData : sortData,
                    sortOrder : sortOrder
                })
            }catch(error){
                res.redirect('/500')
            }
        
    },
    orderDetailsforAdmin:async(req,res)=>{
        try{
            const {id}=req.params
            const order=await orderSchema.findOne({_id:id}).populate('products.productId').populate('address')
            res.render('admin/order-products',{
                order:order,
                products:order.products,
                admin:true
            })
        }catch(error){
            res.redirect('/500')
        }
    },
    getOrders:async(req,res)=>{
        try{
            const {user}=req.session
            const orders=await orderSchema.find({userId:user}).sort({date:-1}).populate('products.productId').populate('address')
            console.log(orders)
            const userDetails=await userSchema.findOne({_id:user})
            res.render('user/orders',{
                orders:orders,
                user:userDetails,
                now:new Date()
            })
        }catch(error){
            res.redirect('/500')
        }
    },
    userOrderProducts:async(req,res)=>{
        try{
            const {id}=req.params
            const order=await orderSchema.findOne({_id:id}).populate('products.productId').populate('address')
            res.render('user/order-products',{
                order:order,
                products:order.products
            })
        }catch(error){
            res.redirect('/500')
            console.log(error)
        }
    },
    userCancelOrder:async(req,res)=>{
        try{
            const {orderId,status}=req.body
            const {user}=req.session
            const order=await orderSchema.findOne({_id:orderId})
            console.log(order)
            for(let products of order.products){
                await productSchema.updateOne({_id:products.productId},{$inc:{quantity:products.quantity}})
            }
            if(order.orderStatus !=='pending' && order.paymentMethod==='COD'){
                if(order.walletUsed && order.walletUsed>0){
                    await userSchema.updateOne({_id:user},{
                        $inc:{
                            wallet:order.walletUsed
                        },
                        $push:{
                            walletHistory:{
                                date:Date.now(),
                                amount:order.walletUsed,
                                message:"Deposited while cancelled order"
                            }
                        }
                    })
                }
            }
            await orderSchema.findOneAndUpdate({_id:orderId},{$set:{orderStatus:status}})
            const newStatus=await orderSchema.findOne({_id:orderId})
            res.status(200).json({success:true,status:newStatus.orderStatus})
        }catch(error){
            res.redirect('/500')
            console.log(error)
        }
    },
    changeOrderStatus:async(req,res)=>{
        try{
            const {status,orderId}=req.body
            if(status==='Cancelled'){
                //if order cancelled
                const order=await orderSchema.findOne({_id:orderId})
                for(let prodcuts of order.products){
                    await productSchema.updateOne({_id:prodcuts.productId},{
                        $inc:{quantity:prodcuts.quantity}
                    })
                }
                //sets the order status
                await orderSchema.findOneAndUpdate({_id:orderId},{$set:{orderStatus:status}})
            }else{
                //sets the order status
                await orderSchema.findOneAndUpdate({_id:orderId},{$set:{orderStatus:status}})
            }
            const newStatus=await orderSchema.findOne({_id:orderId})
            res.status(200).json({success:true,status:newStatus.orderStatus})
        }
        catch(error){
            res.redirect('/500')
        }
    }

}