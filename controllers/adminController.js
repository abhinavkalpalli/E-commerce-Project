const userSchema=require('../models/userModel')
const paginationHelper=require('../helpers/paginationHelper')
const productSchema=require('../models/productModel')
const verificationController=require('../controllers/verificationController')


module.exports={
    getAdminHome:async(req,res)=>{
        try{
            const promises=[
                productSchema.find({status:true}).count(),
                userSchema.find({isBlocked:false,isVerified:true,isAdmin:0}).count()
            ]
            const results=await Promise.all(promises)
            const productCount=results[0]
            const userCount=results[1]
            res.render('admin/dashboard',{
                admin:req.session.admin,
                productCount:productCount,
                userCount:userCount
            })
        }catch(error){
            res.redirect('/500')
        }
    },
    getUserList:async(req,res)=>{
        try{
            const {search,sortData,sortOrder}=req.query
            let page=Number(req.query.page);
            if(isNaN(page) || page<1){
                page=1;
            }
            const condition={isAdmin:0}
            const sort={}
            if(sortData){
                if(sortOrder === "Ascending"){
                    sort[sortData]=1
                }else{
                    sort[sortData]=-1
                }
            }
            if(search){
                condition.$or=[
                    {firstName:{$regex:search,$options:"i"}},
                    {lastName:{$regex:search,$options:"i"}},
                    {email:{$regex:search,$options:"i"}},
                    {mobile:{$regex:search,$options:"i"}}
                ]
            }
                const userCount=await userSchema.find(condition)
                const userList=await userSchema.find(condition).sort(sort).skip((page-1)*paginationHelper.USERS_PER_PAGE).limit(paginationHelper.USERS_PER_PAGE)

                res.render('admin/userList',{
                    userList:userList,
                    admin:req.session.admin,
                    currentPage:page,
                    hasNextPage:page*paginationHelper.USERS_PER_PAGE<userCount,
                    hasPrevPage:page<1,
                    nextPage:page+1,
                    prevPage:page-1,
                    lastPage:Math.ceil(userCount/paginationHelper.USERS_PER_PAGE),
                    search:search,
                    sortData:sortData,
                    sortOrder:sortOrder
                })
            
        }catch(error){
            res.redirect('/500')
        }
    },
    blockUser:async(req,res)=>{
        try{
            const userId=req.params.id
            const userData=await userSchema.findById(userId)
            await userData.updateOne({$set:{isBlocked:true}})

            //checks if the user is in same browser
            if(req.session.user === userId){
                delete req.session.user
            }

            const sessions =req.sessionStore.sessions;
            for(const sessionId in sessions){
                const session=JSON.parse(sessions[sessionId]);
                if(session.user===userId){
                    delete sessions[sessionId];
                    break;
                }
            }
            res.json({success:true})
        }catch(error){
            res.redirect('/500')
        }
    },
    unBlockUser:async(req,res)=>{
        try{
            const userId=req.params.id
            const userData=await userSchema.findById(userId)
            await userData.updateOne({$set:{isBlocked:false}})
            res.json({success:true})
        }catch(error){
            console.log(error)
            res.redirect('/500')
        }
    },
   
}