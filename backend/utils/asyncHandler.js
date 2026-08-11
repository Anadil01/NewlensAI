const asyncHandler = (fn) =>{  // Here fn is controller function 
    return (req , res ,next) => {
        Promise
        .resolve(fn(req, res , next))
        .catch(next)
    }
}

module.exports = asyncHandler;