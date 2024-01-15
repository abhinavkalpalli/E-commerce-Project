const mongoose = require( 'mongoose' ) 

const Schema = mongoose.Schema

const contactSchema = Schema({
    Email : {
        type : String,
        required : true
    },
    Idea : {
        type : String,
        required : true
    },

    contact : {
        type : Number,
        required : true
    }

})

module.exports = mongoose.model('contact', contactSchema )