const {v4:uuidv4}=require('uuid')
const nodemailer=require('nodemailer')
const otpGenerator=require('otp-generator')
require('dotenv').config()

const transporter=nodemailer.createTransport({
    service:'gmail',
    auth:{
        user:process.env.USER_MAIL,
        pass:process.env.PASS
    }
});
//Fucntion for generating random otp
function generateOtp(){
    try{
        const otp=otpGenerator.generate(6,{
            upperCaseAlphabets:false,
            lowerCaseAlphabets:false,
            specialChars:false
        })
        return otp
    }catch(error){
        res.redirect('/500')
    }
}
module.exports={
    sendMail:(email)=>{
        try{
            const otp=generateOtp()
            transporter.sendMail({
                to:email,
                from:process.env.USER_MAIL,
                subject:'OTP verification',
                html:`<h1> Hey ,Your OTP is ${otp}</h1><br>
                <p> Note: The OTP only valid for 1 minute`
            })
            return otp
        }catch(error){
            res.redirect('/500')
        }
    },
    referralCodeGenerator:()=>{
        //function to generate a random alphanuemeric code
        function generateRandomCode(length){
            const charset='ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
            let randomCode='';
            for(let i=0;i<length;i++){
                const randomIndex=Math.floor(Math.random()*charset.length);
                randomCode+=charset[randomIndex]
            }
            return randomCode;
        }
        //generate a unique user ID
        const uniqueUserId=uuidv4();

        //generate randomcode
        const referralCode=generateRandomCode(6);

        //Combine user ID and referral code to create the referral ID
        const referralId=`${uniqueUserId}=${referralCode}`;

        return referralId;
    },
}