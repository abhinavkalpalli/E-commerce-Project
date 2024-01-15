//Database connection
require('./config/database')()
require('mongoose')
require('dotenv').config()
const express=require('express')
const path=require('path')
const flash=require('connect-flash')
const session=require('express-session')
const nocache=require('nocache')
const moment=require('moment')
const errorController = require('./controllers/errorController')

const app=express();
app.use(express.json())
app.use(express.urlencoded({extended:false}))

//Getting Routers from the router folder
const authRouter=require('./routers/authRouter');
const shopRouter=require('./routers/shopRouter');
const adminRouter=require('./routers/adminRouter');
const userRouter=require('./routers/userRouter')

//Using nocache
app.use(nocache())

//session
app.use(session({
    resave:false,
    secret:process.env.KEY,
    saveUninitialized:false
}))

//using connect-flash message
app.use(flash())

// Date format
const shortDateFormat ='MMM Do YY'

//Middle ware for moment date
app.locals.moment=moment;
app.locals.shortDateFormat=shortDateFormat;

//Setting view engine(EJS)
app.set('view engine','ejs');
app.set('views','views');


//Settong static puplic folder
app.use(express.static(path.join(__dirname,'public')));

//setting local variable
app.use((req,res,next)=>{
    res.locals.userLoggedin=req.session.user
        res.locals.productCount=req.session.productCount
   
    next()
})

//using routers

app.use(authRouter);
app.use(shopRouter);
app.use('/admin',adminRouter);
app.use('/user',userRouter)
app.use('/500',errorController.get500)
app.use('/404',errorController.get404)
app.all('*',async(req,res)=>{
    res.redirect('/404')
})

const PORT=process.env.PORT||3000;
app.listen(PORT,()=>{
    console.log(`Server connected.. at http://localhost:${PORT}/`)
})