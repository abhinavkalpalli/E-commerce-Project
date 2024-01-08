const brandSchema=require('../models/brandModel')
const paginationHelper=require('../helpers/paginationHelper')


module.exports={
    getBrand:async (req,res)=>{
        try{
            const { search, sortData, sortOrder } = req.query
            let page = Number(req.query.page);
            if (isNaN(page) || page < 1) {
            page = 1;
            }
            const condition = {}
            if ( search ){
                condition.$or = [
                    { brand : { $regex : search, $options : "i" }} 
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

           
            const brandCount = await brandSchema.find( condition ).count()
            const brand = await brandSchema.find( condition )
            .sort( sort ).skip(( page - 1 ) * paginationHelper.CATEGORY_PER_PAGE ).limit( paginationHelper.CATEGORY_PER_PAGE )
            res.render( 'admin/brand', {
                admin : req.session.admin,
                brand : brand,
                err : req.flash('brandExist'),
                success : req.flash('success'),
                currentPage : page,
                hasNextPage : page * paginationHelper.CATEGORY_PER_PAGE < brandCount,
                hasPrevPage : page > 1,
                nextPage : page + 1,
                prevPage : page -1,
                lastPage : Math.ceil( brandCount / paginationHelper.CATEGORY_PER_PAGE ),
                search : search,
                sortData : sortData,
                sortOrder : sortOrder,
                

            } )
        
        }catch(error){
            res.redirect('/500')
            console.log(error)
        }
    },
    addBrand:async(req,res)=>{
        try{
            const br=req.body.brand.toUpperCase()
            const brand=await brandSchema.findOne({brand:br})
            if(brand){
                req.flash('brandExist','Brand already exist')
                res.redirect('/admin/brand')
            }else{
                const brandName=new brandSchema({brand:br})
                await brandName.save()
                req.flash('scuccess',`${br} successfully added to category`)
                res.redirect('/admin/brand')
            }
        }catch(error){
            res.redirect('/500')
        }
    },
    getEditBrand:async(req,res)=>{
        try{
            const brand = await brandSchema.findOne({_id:req.params.id})
            res.render('admin/edit-brand',{
                admin:req.session.admin,
                brand:brand
            })
        }catch(error){
            res.redirect('/500')
        }
    },
    editBrand:async(req,res)=>{
        try{
            const updatedBrand=req.body.brand.toUpperCase()
            const same=await brandSchema.findOne({brand:updatedBrand})
            if(same){
                req.flash('brandExist','Brand already exist')
                
            }else{
            await brandSchema.updateOne({_id:req.body.brandId},{
                $set:{
                    brand:updatedBrand
                }
            })
            
        }
        res.redirect('/admin/brand')
        }catch(error){
            res.redirect('/500')
            console.log(error)
        }
    },
    listBrand:async(req,res)=>{
        try{
            await brandSchema.updateOne({_id:req.params.id},{$set:{status:true}})
            res.redirect('/admin/brand')
        }catch(error){
            res.redirect('/500')
        }
    },
    unlistBrand:async(req,res)=>{
        try{
            await brandSchema.updateOne({_id:req.params.id},{$set:{status:false}})
            res.redirect('/admin/brand')
        }catch(error){
            res.redirect('/500')
        }
    },


}