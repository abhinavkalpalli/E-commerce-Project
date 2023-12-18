const mongoose=require('mongoose')
const Schema=mongoose.Schema

const orderSchema=Schema({
    userId:{
        type:mongoose.Schema.Types.ObjectId,
        ref:'user',
        required:true
    },
    orderId:{
        type:String,
        default:'ORD'
    },
    products:[{
        productId:{
            type:mongoose.Types.ObjectId,
            ref:'product',
            required:true
        },
        quantity:{
            type:Number,
            required:true
        },
        price:{
            type:Number,
            required:true
        }
    }],
    totalPrice:{
        type:Number,
        required:true
    },
    paymentMethod:{
        type:String,
        required:true
    },
    paymentReference:{
        type:String,
    },
    walletUsed:{
        type:Number,
        required:false
    },
    amountPayable:{
        type:Number,
        required:false
    },
    orderStatus:{
        type:String,
        default:'Pending'
    },
    address:{
        type:mongoose.Schema.Types.ObjectId,
        ref:'address',
        required:true
    },
    date:{
        type:Date,
        default:Date.now
    },
    ReturnReason:{
        type:String,
        required:false
    }
})
module.exports=mongoose.model('order',orderSchema)