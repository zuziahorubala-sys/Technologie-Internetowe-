export const requireJson = (req,res,next)=>{
  if(!req.is('application/json')) return res.status(415).json({error:'Unsupported Media Type: use application/json'});
  next();
};
