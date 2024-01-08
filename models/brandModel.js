const mongoose=require('mongoose')

const Schema=mongoose.Schema
const brandSchema=Schema({
    brand:{
        type:String,
        required:true
    },
    status:{
        type:Boolean,
        required:true,
        default:true
    }

})

module.exports=mongoose.model('brand',brandSchema)