

module.exports = class keyGen {
  constructor(client) {
    this.client = client;
    this.keys = {};
    this.shortUrl = {};
    this.setDbSize();

     // todo: get max from redis
   
  }
  setDbSize(){
    this.client.keys('newKey_*',(err,result)=>{
      console.log(result)
      this.size = result.length
    })
  }
  generateShortUrl(req,res) {
    let url = req.body.url;
    return this.client.get(url,(err,result)=>{
      if (result) {
        return res.status(200).json({shortUrl:result});
      } else {
        this.keys[url] = `newKey_${this.size++}`;
        this.shortUrl[this.keys[url]] = url;
        this.client.set(this.keys[url], url);
        this.client.set(url, this.keys[url]);
        return res.status(200).json({ shortUrl: this.keys[url],url:url});
      }
    });
  }
  getUrlFromShrotUrl(req,res,su) {
    const shortUrl = su || req.body.shortUrl;
    if (!this.shortUrl[shortUrl]) {
      return this.client.get(shortUrl,(err,result) => {
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
    return this.client.get(key,(err,result)=>{
      return result;
    });
    
    
  }
  
}