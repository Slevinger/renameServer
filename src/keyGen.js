


module.exports = class keyGen {
  constructor(redis) {
    this.redis = redis;
    this.redis.init(process.env.RDS_PORT, (err, reply) =>{
      if (err) throw err;
      this.keys = {};
      this.shortUrl = {};
      this.setDbSize();
      console.log('Redis running successfully!');
    })
     // todo: get max from redis
   
  }
  setDbSize(){
    this.redis.client.keys('newKey_*',(err,result)=>{
      console.log(result)
      this.size = result.length
    })
  }
  generateShortUrl(req,res) {
    let url = req.body.url;
    return this.redis.client.get(url,(err,result)=>{
      if (result) {
        return res.status(200).json({shortUrl:result});
      } else {
        this.keys[url] = `newKey_${this.size++}`;
        this.shortUrl[this.keys[url]] = url;
        this.redis.client.set(this.keys[url], url);
        this.redis.client.set(url, this.keys[url]);
        return res.status(200).json({ shortUrl: this.keys[url],url:url});
      }
    });
  }
  getUrlFromShrotUrl(req,res,su) {
    const shortUrl = su || req.body.shortUrl;
    if (!this.shortUrl[shortUrl]) {
      return this.redis.client.get(shortUrl,(err,result) => {
         if (result){
           return res.status(200).json({url:result});
         } else {
           return res.status(401).json({err:'no such listing'});
         }
      })
    } else {
      return res.status(200).json({url:this.shortUrl[shortUrl]});
    }
  }
  getFromRedis(key){
    return this.redis.client.get(key,(err,result)=>{
      return result;
    });
    
    
  }
  
}