export const notFound=(req,res)=>res.status(404).json({error:'Not found'});
export const errorHandler=(err,req,res,next)=>{
  console.error(err);
  res.status(500).json({error:'Internal Server Error'});
};
