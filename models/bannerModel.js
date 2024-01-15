
const mongoose = require( 'mongoose' )

const Schema = mongoose.Schema

const bannerSchema = Schema( {

    typeHead : {
        type : String 
    },

    mainHead : {
        type : String
    },

    description : {
        type : String 
    },

    image : {
        type : String 
    },

    status : {
        default : true,
        type: Boolean
    },
    startingDate : {
        type : Date,
        required : true
    },
    expiryDate : {
        type : Date,
        required : true
    },

})

module.exports = mongoose.model( 'banner', bannerSchema)