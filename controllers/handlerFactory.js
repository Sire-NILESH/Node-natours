const catchAsync = require('./../utils/catchAsync');
const AppError = require('./../utils/appError');
const APIfeatures =  require('./../utils/apiFeatures');

exports.deleteOne = Model => 
    catchAsync(async (req, res, next)=>{

        const doc = await Model.findByIdAndDelete(req.params.id);

        if(!doc){
            return next( new AppError('No documnet found with that id', 404));
        }
        
        res.status(204).json({		//code 204: 'no content'
            status: 'success',
            data:{
            tour : null	//usual delete response.  we dont send deleted data in REST api.
            }
        });
    });


exports.updateOne = Model => catchAsync(async (req, res, next)=>{

    const doc = await Model.findByIdAndUpdate(req.params.id, req.body, {new: true,             
            runValidators: true
        });
    
    if(!doc){
        return next( new AppError('No document found with that id', 404));
    }

    res.status(200).json({
        status: 'success',
        data:{
        data: doc        
        }
    });
});


exports.createOne = Model => catchAsync(async (req, res, next)=>{

    const doc = await Model.create(req.body);

    res.status(201).json({      
        status:'success',
        data:{
            data: doc
            }
    }); 
});


exports.getOne = (Model, popOptions) => catchAsync(async (req,res, next) => {

    let query = Model.findById(req.params.id);
    if(popOptions) query.populate(popOptions);
    const doc = await query;

    if(!doc){
        return next( new AppError('No document found with that id', 404));
    }

    res.status(200).json({
        status: 'success',
        data:{
            data : doc       
        }
    } );
});


exports.getAll = Model => catchAsync(async (req, res, next) =>{

    //Hack: below 2 lines code will ony be used by nested get'reviews' on 'tours' and wont bother others. 
    let filter = {};
    if(req.params.tourId) filter = { tour: req.params.tourId}

    //Build the query
    const features = new APIfeatures(Model.find(filter), req.query)         //filter is only for nested get'reviews' on tours
        .filter()
        .sort()
        .limitField()
        .paginate();
    //above chaining was only possible because each method returns 'this' which is a query.

    //Execute Query
    //const doc = await features.query.explain();
    const doc = await features.query;

    //Send Response
    res.status(200).json({
        status: 'success',
        results: doc.length,
        requestAt : req.requestTime,
        data:{
            data : doc       
        }
    });
});
