const categorySchema=require('../models/categoryModel')
const paginationHelper=require('../helpers/paginationHelper')
const offerSchema=require('../models/offerModel')

module.exports={
    //Get the category
    getCategory:async (req,res)=>{
        try{
            const { search, sortData, sortOrder } = req.query
            let page = Number(req.query.page);
            if (isNaN(page) || page < 1) {
            page = 1;
            }
            const condition = {}
            if ( search ){
                condition.$or = [
                    { category : { $regex : search, $options : "i" }} 
                ]
            }
            const sort = {}
            if( sortData ) {
                if( sortOrder === "Ascending" ){
                    sort[sortData] = 1
                } else {
                    sort[sortData] = -1
                }
            }

            const availableOffers = await offerSchema.find({ status : true, expiryDate : { $gte : new Date() }})
            const categoryCount = await categorySchema.find( condition ).count()
            const category = await categorySchema.find( condition ).populate('offer')
            .sort( sort ).skip(( page - 1 ) * paginationHelper.CATEGORY_PER_PAGE ).limit( paginationHelper.CATEGORY_PER_PAGE )
            res.render( 'admin/category', {
                admin : req.session.admin,
                category : category,
                err : req.flash('categoryExist'),
                success : req.flash('success'),
                currentPage : page,
                hasNextPage : page * paginationHelper.CATEGORY_PER_PAGE < categoryCount,
                hasPrevPage : page > 1,
                nextPage : page + 1,
                prevPage : page -1,
                lastPage : Math.ceil( categoryCount / paginationHelper.CATEGORY_PER_PAGE ),
                search : search,
                sortData : sortData,
                sortOrder : sortOrder,
                availableOffers : availableOffers

            } )
        
        }catch(error){
            res.redirect('/500')
        }
    },
    //Adding category
    addCategory:async(req,res)=>{
        try{
            const cat=req.body.category.toUpperCase()
            const category=await categorySchema.findOne({category:cat})
            if(category){
                req.flash('categoryExist','Category already exist')
                res.redirect('/admin/category')
            }else{
                const categoryName=new categorySchema({category:cat})
                await categoryName.save()
                req.flash('scuccess',`${cat} successfully added to category`)
                res.redirect('/admin/category')
            }
        }catch(error){
            res.redirect('/500')
        }
    },
    //Editing Category 
    getEditCategory:async(req,res)=>{
        try{
            const category = await categorySchema.findOne({_id:req.params.id})
            res.render('admin/edit-category',{
                admin:req.session.admin,
                category:category
            })
        }catch(error){
            res.redirect('/500')
        }
    },
    categorydelete:async(req,res)=>{
        try{
            await categorySchema.deleteOne({_id:req.params.id})
            res.redirect('/admin/category')
        }catch(error){
            res.redirect('/500')
        }
    },
    editCategory:async(req,res)=>{
        try{
            const updatedCategory=req.body.category.toUpperCase()
            const same=await categorySchema.findOne({category:updatedCategory})
            if(same){
                req.flash('categoryExist','Category already exist')
            }else{
            await categorySchema.updateOne({_id:req.body.categoryId},{
                $set:{
                    category:updatedCategory
                }
            })
        }
            res.redirect('/admin/category')
        }catch(error){
            res.redirect('/500')
        }
    },
    listCategory:async(req,res)=>{
        try{
            await categorySchema.updateOne({_id:req.params.id},{$set:{status:true}})
            res.redirect('/admin/category')
        }catch(error){
            res.redirect('/500')
        }
    },
    //soft delete the category
    unlistCategory:async(req,res)=>{
        try{
            await categorySchema.updateOne({_id:req.params.id},{$set:{status:false}})
            res.redirect('/admin/category')
        }catch(error){
            res.redirect('/500')
        }
    },
    //applying category offer
    applyCategoryOffer:async(req,res)=>{
        try{
            const {offerId,categoryId}=req.body
            await categorySchema.updateOne({_id:categoryId},{
                $set:{
                    offer:offerId
                }
            })
            res.json({success:true})
        }catch(error){
            res.redirect('/500')
        }
    },
    //cancel the categry offer
    removeCategoryOffer:async(req,res)=>{
        try{
            const {categoryId}=req.body
            await categorySchema.updateOne({_id:categoryId},{
                $unset:{
                    offer:""
                }
            })
            res.json({success:true})
        }catch(error){
            res.redirect('/500')
        }
    },

}