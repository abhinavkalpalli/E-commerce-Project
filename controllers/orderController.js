const orderSchema=require('../models/orderModel')
const cartSchema=require('../models/cartModel')
const productSchema=require('../models/productModel')
const userSchema=require('../models/userModel')
const cartHelper=require('../helpers/cartHelper')
const paginationHelper=require('../helpers/paginationHelper')
const paymentHelper = require('../helpers/paymentHelper')
const crypto=require('crypto')
const {RAZORPAY_KEY_SECRET}=process.env
const couponHelper=require('../helpers/couponHelper')
const couponSchema=require('../models/couponModel')

module.exports={
    //placing order
    placeOrder : async ( req, res ) => {
        try {
          
            const { user } = req.session
            const products =  await cartHelper.totalCartPrice( user )
            const { paymentMethod, addressId, walletAmount } = req.body
            const productCount = await cartHelper.updateQuantity( user )
            if( productCount){
                //If product is not available when we are at checkout
                req.session.productCount-=productCount
            res.json({outofStock:true})
            }else{
            let walletBalance
            if( walletAmount ){
                walletBalance = Number( walletAmount )
            }
            const productItems = products[0].items
            //Inserting individual product details
            const cartProducts = productItems.map( ( items ) => ({
                productId : items.productId,
                quantity : items.quantity,
                price : ( items.totalPrice )
            }))
            const cart = await cartSchema.findOne({ userId : user })
            const totalAmount = await cartHelper.totalCartPrice( user )
            let discounted=0
            if( cart && cart.coupon && totalAmount && totalAmount.length > 0 ) {
                discounted = await couponHelper.discountPrice( cart.coupon, totalAmount[0].total )
                await couponSchema.updateOne({ _id : cart.coupon},{
                    $push : {
                        users : user
                    }
                })
            }
            let discountAmount=0
            if(discounted.discountAmount>0){
             discountAmount=discounted.discountAmount
            }
            const totalPrice = discounted && discounted.discountedTotal ? discounted.discountedTotal : totalAmount[0].total
            let walletUsed, amountPayable
            if( walletAmount ) {
                if( totalPrice > walletBalance ) {
                    amountPayable = totalPrice - walletBalance
                    walletUsed = walletBalance
                } else if( walletBalance > totalPrice ) {
                    amountPayable = 0
                    walletUsed = totalPrice
                }
            } else {
                amountPayable = totalPrice
            }
            const generatedID = Math.floor(100000 + Math.random() * 900000);
            let existingOrder = await orderSchema.findOne({ orderId: generatedID });
    
            // Loop until a unique order ID is generated
            while (existingOrder) {
                generatedID = Math.floor(100000 + Math.random() * 900000);
                existingOrder = orderSchema.findOne({ orderId: generatedID });
            }
    
            // Use the generated unique orderId for the new order
            const orderId = `ORD${generatedID}`;
            
            paymentMethod === 'COD' ? orderStatus = 'Confirmed' : orderStatus = 'Pending';
            if( amountPayable === 0) { orderStatus = 'Confirmed' }
            const order = new orderSchema({
                userId : user,
                orderId:orderId,
                products : cartProducts,
                totalPrice : totalPrice,
                paymentMethod : paymentMethod,
                orderStatus : orderStatus,
                address : addressId,
                walletUsed : walletUsed,
                amountPayable : amountPayable,
                discounted:discountAmount
            })
            const ordered = await order.save()
            // Decreasing quantity
            for( const items of cartProducts ){
                const { productId, quantity } = items
                await productSchema.updateOne({_id : productId},
                    { $inc : { quantity :  -quantity  }})
                } 
            // Deleting cart
            await cartSchema.deleteOne({ userId : user })
            req.session.productCount = 0
            if(  paymentMethod === 'COD' || amountPayable === 0 ){
                // COD
                    if( walletAmount ) {
                        await userSchema.updateOne({ _id : user }, {
                            $inc : {
                                wallet : -walletUsed
                            },
                            $push : {
                                walletHistory : {
                                    date : Date.now(),
                                    amount : -walletUsed,
                                    message : 'Used for purachse'
                                }
                            }
                        })
                    }
                    return res.json({ success : true})
            } else if( paymentMethod === 'razorpay'){
                // Razorpay 
                const payment = await paymentHelper.razorpayPayment( ordered._id, amountPayable )
                res.json({ payment : payment , success : false  })
            }
        }
        } catch ( error ) {
            res.redirect('/500')
        }
    },
    //Invoice
    getConfirmOrder:async(req,res)=>{
        try{
            const {user}=req.session
            await cartHelper.totalCartPrice(user)
            const orders=await orderSchema.find({userId:user}).sort({date:-1}).limit(1) .populate({
                path: 'products.productId',
                populate: {
                  path: 'brand',
                },
              }).populate('address')
            
            if(orders.orderStatus=='Pending'){
                await orderSchema.updateOne({_id:orders._id},{
                    $set:{
                        orderStatus:'Confirmed'
                    }
                })
            }
            
            const lastOrder=await orderSchema.find({userId:user}).sort({date:-1}).limit(1).populate('address').populate({
                path: 'products.productId',
                populate: {
                  path: 'brand',
                },
              })
            res.render('shop/confirm-order',{
                order:lastOrder,
                products:lastOrder[0].products,
            })
        }catch(error){
            res.redirect('/500')
            
        }
    },
    invoice:async(req,res)=>{
        const {user}=req.session
        const {Id}=req.params
        const lastOrder=await orderSchema.find({_id:Id}).sort({date:-1}).limit(1).populate('address').populate('address').populate({
            path: 'products.productId',
            populate: {
              path: 'brand',
            },
          })
        res.render('shop/confirm-order',{
            order:lastOrder,
            products:lastOrder[0].products,
        })
    },
    //Orderlist in admin dashboard
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
            const order=await orderSchema.findOne({_id:id}).populate('products.productId').populate('address').populate('address').populate({
                path: 'products.productId',
                populate: {
                  path: 'brand',
                },
              })
            res.render('admin/order-products',{
                order:order,
                products:order.products,
                admin:true
            })
        }catch(error){
            res.redirect('/500')
        }
    },
    //Getting the orders of users
    getOrders:async(req,res)=>{
        try{
            const {user}=req.session
            const orders=await orderSchema.find({userId:user}).sort({date:-1}).populate('address').populate({
                path: 'products.productId',
                populate: {
                  path: 'brand',
                },
              })
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
    //Ordered products by user
    userOrderProducts:async(req,res)=>{
        try{
            const {id}=req.params
            const order=await orderSchema.findOne({_id:id}).populate('address').populate('address').populate({
                path: 'products.productId',
                populate: {
                  path: 'brand',
                },
              })
            res.render('user/order-products',{
                order:order,
                products:order.products
            })
        }catch(error){
            res.redirect('/500')
        }
    },
    //Cancelling the order
    userCancelOrder:async(req,res)=>{
        
        try{
            const {orderId,status}=req.body
            const {user}=req.session
            const order=await orderSchema.findOne({_id:orderId})
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
            }if(order.orderStatus ==='Confirmed' && order.paymentMethod==='razorpay'){
            
                    await userSchema.updateOne({_id:user},{
                        $inc:{
                            wallet:order.totalPrice
                        },
                        $push:{
                            walletHistory:{
                                date:Date.now(),
                                amount:order.totalPrice,
                                message:"Deposited while cancelled order"
                            }
                        }
                    })
                }
            
            await orderSchema.findOneAndUpdate({_id:orderId},{$set:{orderStatus:status}})
            const newStatus=await orderSchema.findOne({_id:orderId})
            res.status(200).json({success:true,status:newStatus.orderStatus})
        }catch(error){
            res.redirect('/500')
        }
    },
    //Changing order status in admin side
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
                if(order.paymentMethod==='razorpay'){

                    await userSchema.updateOne({_id:order.userId},{
                        $inc:{
                            wallet:order.totalPrice
                        },
                        $push:{
                            walletHistory:{
                                date:Date.now(),
                                amount:order.totalPrice,
                                message:"Deposited while cancelled order"
                            }
                        }
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
    },
    //Razorpay verification
    razorpayVerifyPayment:async(req,res)=>{
        const {response,order}=req.body
        const {user}=req.session
        let hmac=crypto.createHmac('sha256',RAZORPAY_KEY_SECRET)
        hmac.update(response.razorpay_order_id+'|'+response.razorpay_payment_id)
        hmac=hmac.digest('hex')
        if(hmac === response.razorpay_signature){
           
        
            const orders=await orderSchema.findOne({_id:order.receipt})
          
            if(orders.walletUsed){
                await userSchema.updateOne({_id:user},{
                    $inc:{
                        wallet:-orders.walletUsed
                    },
                    $push:{
                        walletHistory:{
                            date:Date.now(),
                            amount:-orders.walletUsed,
                            message:'Used for Purchase'
                        }
                    }
                })
            }
            await orderSchema.updateOne({_id:order.receipt},{
                $set:{orderStatus:"Confirmed"}
            })
            res.json({paid:hmac === response.razorpay_signature})
        }else{
            res.json({paid:false})
        }
    },
   getReturn:async(req,res)=>{
    const orderId=req.params.id
    console.log(orderId)
    res.render('shop/return',{orderId:orderId})
   },
   //Return the order
   returnOrder:async(req,res)=>{
    const orderId=req.query.orderId
    const {user}=req.session
    const reason=req.body.returnReason
    const message=req.body.message
    const order=await orderSchema.findOne({_id:orderId})
    if(reason === 'Other'){
        for(let products of order.products){
            await productSchema.updateOne({_id:products.productId},{
                $inc:{
                    quantity: products.quantity
                }
            })
        }
    }
    await orderSchema.updateOne({_id:orderId},{
        $set:{
            orderStatus:'Returned',ReturnReason:message
        }
    })
    await userSchema.updateOne({_id:user},{
        $inc:{
            wallet:order.totalPrice
        },
        $push:{
            walletHistory:{
                date:new Date(),
                amount:order.totalPrice,
                message:"Deposit on return"
            }
        }
    },)
    res.redirect('/user/orders')
    
   },
   //Sales report
   getSalesReport:async(req,res)=>{
        const {from,to,seeAll,sortData,sortOrder}=req.query
        let page = Number(req.query.page);
            if (isNaN(page) || page < 1) {
            page = 1;
            }
            const conditions={}
            if(from && to){
                conditions.date={
                    $gte:from,
                    $lte:to
                }
            }else if(from){
                conditions.date={
                    $gte:from
                }
            }else if(to){
                conditions.date={
                    $lte:to
                }
            }
            const sort={}
            if(sortData){
                if(sortOrder==="Ascending"){
                    sort[sortData]=1
                }else if(sortOrder==="Descending"){
                    sort[sortData]=-1
                }
            }else{
                sort['date'] = sortOrder === "Ascending" ? 1 : -1;
            }
            const orderCount=await orderSchema.countDocuments()
            const limit = seeAll==="seeAll" ? orderCount:paginationHelper.SALES_PER_PAGE;
            const orders=await orderSchema.find(conditions).sort(sort).skip(( page - 1 ) * paginationHelper.ORDER_PER_PAGE ).limit(limit)
            res.render( 'admin/sales-report', {
                admin : true,
                orders : orders,
                from : from,
                to : to, 
                seeAll : seeAll,
                currentPage : page,
                hasNextPage : page * paginationHelper.SALES_PER_PAGE < orderCount,
                hasPrevPage : page > 1,
                nextPage : page + 1,
                prevPage : page -1,
                lastPage : Math.ceil( orderCount / paginationHelper.SALES_PER_PAGE ),
                sortData : sortData,
                sortOrder : sortOrder
            })  
    
   }

}