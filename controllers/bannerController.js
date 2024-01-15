
const bannerSchema = require( '../models/bannerModel' )
const paginationHelper = require( '../helpers/paginationHelper' )

module.exports = {

    getBannerManagement : async ( req, res ) => {
        try {
            const { search, page: rawPage } = req.query
            let page = parseInt(rawPage,10);
            if (isNaN(page) || page < 1) {
            page = 1;
            }
            const condition = {}

            if ( search ){
                condition.$or = [
                    { typeHead : { $regex : search, $options : "i" }},
                    { mainHead : { $regex : search, $options : "i" }},
                    { description : { $regex : search, $options : "i" }}
                ]
            }
            const bannersCount = await bannerSchema.find( condition ).count()
            const banners = await bannerSchema.find( condition )
            .skip(( page - 1 ) * paginationHelper.BANNER_PER_PAGE ).limit( paginationHelper.BANNER_PER_PAGE )

            res.render( 'admin/banner-management',{
                banners : banners,
                admin : req.session.admin,
                success : req.flash('success'),
                currentPage : page,
                hasNextPage : (page * paginationHelper.BANNER_PER_PAGE) < bannersCount,
                hasPrevPage : page > 1,
                nextPage : page + 1,
                prevPage : page -1,
                lastPage : Math.ceil( bannersCount / paginationHelper.BANNER_PER_PAGE ),
                search : search
            })

        } catch(error) {
            res.redirect('/500')
        }
        
    },

    getAddBanner : async ( req, res ) => {
        res.render( 'admin/add-banner',{
            admin : req.session.admin,
            success : req.flash('success')
        })
    },

    addingBanner : async( req, res ) => {
        try {
            const banner = new bannerSchema({
                mainHead : req.body.mainHead,
                typeHead : req.body.type,
                description : req.body.description,
                image : req.file.filename,
                startingDate:req.body.startingDate,
                expiryDate:req.body.expiryDate
            })
            await banner.save()
            req.flash('success','Banner Added Succussfully...')
            res.redirect( '/admin/banner' )
            
        } catch (error) {
            res.redirect('/500')

        }
    },

    getEditBanner : async( req, res ) => {
        try {
            const banner = await bannerSchema.findById(req.params.id)
            res.render( 'admin/edit-banner',{
                banner : banner,
                admin : req.session.admin,
                err : req.flash('err'),
                success : req.flash('success')
            } ) 

        } catch (error) {
            res.redirect('/500')

        }
    },
    updateBanner : async ( req, res ) => {
        try {
      
            
            if(req.file && req.file.filename){
              
                const updatedBanner = {
                    mainHead : req.body.mainHead,
                    typeHead : req.body.type,
                    description : req.body.description,
                    image : req.file.filename,
                    startingDate:req.body.startingDate,
                    expiryDate:req.body.expiryDate
                }
                
                await bannerSchema.updateOne({ _id : req.body.bannerId},{
                    $set :  updatedBanner 
                })
            }else{
                
            const updatedBanner = {
                mainHead : req.body.mainHead,
                typeHead : req.body.type,
                description : req.body.description,
                startingDate:req.body.startingDate,
                expiryDate:req.body.expiryDate
            }
            
            await bannerSchema.updateOne({ _id : req.body.bannerId},{
                $set :  updatedBanner 
            })
        }
            req.flash('success','Banner Updated')
            res.redirect( '/admin/banner' )

        } catch (error) {
            res.redirect('/500')
            console.log(error)

      }
    },

    deleteBanner : async ( req, res ) => {
        try {

            await bannerSchema.updateOne({ _id : req.params.id },{ status : false })
            res.redirect('/admin/banner')
            
        } catch (error) {
            res.redirect('/500')

        }
    },

    restoreBanner : async ( req, res ) => {
        try {

            await bannerSchema.updateOne({ _id : req.params.id },{ status : true })
            res.redirect('/admin/banner')
            
        } catch (error) {
            res.redirect('/500')

        }
    }
}