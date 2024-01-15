const orderSchema=require('../models/orderModel')

const todayIncome=async(today,now)=>{
    const todayOrders=await orderSchema.aggregate([
        {
            $match:{
                date:{
                    $gte:today,
                    $lt:now
                },
                orderStatus:{
                    $nin:["Pending","Returned"]
                }
            }
        },
        {
            $unwind:"$products"
        },
        {
            $group:{
                _id:null,
                todayIncome:
                {
                    $sum:{
                        $multiply:
                        [
                            {$toDouble:"$products.quantity"},
                            {$toDouble:"$products.price"}
                        ]
                    }
                }
            }
        },
        {
            $project:
            {
                todayIncome:1
            }
        }
    ])
    const todayIncome=todayOrders.length>0? todayOrders[0].todayIncome:0;
    return todayIncome
}

const yesterdayIncome=async(today,yesterday)=>{
    const yesterdayOrders=await orderSchema.aggregate([
        {
            $match:{
                date:{
                    $gte:yesterday,
                    $lt:today
                },
                orderStatus:{
                    $nin:["Pending","Returned"]
                }
            }
        },
        {
            $unwind:"$products"
        },
        {
            $group:{
                _id:null,
                yesterdayIncome:{
                    $sum:{
                        $multiply:[
                            {$toDouble:"$products.quantity"},
                            {$toDouble:"$products.price"}
                        ]
                    }
                }
            }
        },{
            $project:{
                yesterdayIncome:1
            }
        }
    ])
    const yesterdayIncome=yesterdayOrders.length>0?yesterdayOrders[0].yesterdayIncome:0
    return yesterdayIncome
}
const totalRevenue=async()=>{
    const revenue=await orderSchema.aggregate([
        {
            $match:{
                orderStatus:{
                    $nin:["Pending","Returned"]
                }
            }
        },
        {
            $group:
            {
                _id:null,
                revenue:{
                    $sum:"$totalPrice"
                }
            }
        }
    ])
    const totalRevenue=revenue.length>0?revenue[0].revenue:0
    return totalRevenue
}
const currentMonthRevenue=async(currentMonthStartDate,now)=>{
    const currentMonthRevenue=await orderSchema.aggregate([
        {
            $match:
            {
                date:
                {
                    $gte:currentMonthStartDate,
                    $lt:now
                },
                orderStatus:
                {
                    $nin:["Pending","Returned"]
                }
            }
        },
        {
            $group:{
                _id:null,
                currentMonthRevenue:
                {
                    $sum:"$totalPrice"
                }
            }
        }
    ])
    const result=currentMonthRevenue.length>0?currentMonthRevenue[0].currentMonthRevenue:0
    return result
}
const previousMonthRevenue = async ( previousMonthStartDate, previousMonthEndDate ) => {
    const previousMonthRevenue = await orderSchema.aggregate([
        {
            $match : 
            {
                date : 
                {
                    $gte : previousMonthStartDate,
                    $lt : previousMonthEndDate
                },
                orderStatus :
                {
                    $nin : ["Pending","Returned"]
                }
            }
        },
        {
            $group : 
            {
                _id : null,
                previousMonthRevenue : 
                {
                    $sum : "$totalPrice"
                }
            }
        }
    ])
    const result = previousMonthRevenue.length > 0 ? previousMonthRevenue[0].previousMonthRevenue : 0
    return result
}
const paymentMethodAmount=async()=>{
    const paymentMethodTotal=await orderSchema.aggregate([
        {
            $match:{
                orderStatus:{
                    $nin:["Pending","Returned"]
                }
            }
        },{
            $group:{
                _id:"$paymentMethod",
                amount:{
                    $sum:"$totalPrice"
                }
            }
        }
    ])
    const result=paymentMethodTotal.length > 0 ?paymentMethodTotal:0
    return result
}
    const dailyChart = async (startDate, endDate) => {
       

        // If endDate is not provided, set it to today
       

        const matchStage = {
            $match: {
                orderStatus: {
                    $nin: ["Pending", "Returned"]
                },
                date: {
                    $gte: new Date(startDate),
                    $lte: new Date(endDate)
                }
            }
        };

        // Add other stages as needed for your aggregation pipeline
        const groupStage = {
            $group: {
                _id: {
                    $dateToString: {
                        format: "%Y-%m-%d",
                        date: "$date"
                    }
                },
                dailyrevenue: {
                    $sum: "$totalPrice"
                }
            }
        };

        const sortStage = {
            $sort: {
                _id: 1
            }
        };

        const limitStage = {
            $limit: 14
        };

        // Example usage of matchStage, groupStage, sortStage, and limitStage
        const dailyOrders = await orderSchema.aggregate([
            matchStage,
            groupStage,
            sortStage,
            limitStage
            // Add other stages as needed
        ]);

        const result = dailyOrders || 0;
        return result;
    }


const categorySales=async()=>{
    const catSales=await orderSchema.aggregate([
        {
            $match:{
                orderStatus:
                {
                    $nin:["Pending","Returned"]
                }
            }
        },
        {
            $unwind:"$products"
        },
        {
            $lookup:
            {
                from:"products",
                localField:"products.productId",
                foreignField:"_id",
                as:"categories"
            }
        },
        {
            $unwind:"$categories"
        },{
            $lookup:{
                from:"categories",
                localField:"categories.category",
                foreignField:"_id",
                as:"category"
            }
        },{
            $unwind:"$category"
        },
        {
            $group:{
                _id:"$category.category",
                qty:{
                    $sum:"$products.quantity"
                }
            }
        }
    ])
    return catSales
}
module.exports = {
    yesterdayIncome,
    todayIncome,
    totalRevenue,
    currentMonthRevenue,
    previousMonthRevenue,
    paymentMethodAmount,
    dailyChart,
    categorySales
}