const mongoose=require('mongoose')
require('dotenv').config()

module.exports= connection=>{
    const databaseURL=process.env.DATABASE_URL;
    mongoose.connect(databaseURL).then(()=>{
        
        console.log('Database connected successfully...')
    }).catch(err =>{
        console.log(err.message);
    })
}