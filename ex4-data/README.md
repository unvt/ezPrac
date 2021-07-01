# EX-4
Simple vector tile server which delivers pbf tiles from mbtiles data. (Windows environment. With nodejs.)   
Based on "un-vector-tile-toolkit/onyx" and "unvt/naru."
  

# hosting at localhost
Edit the config settings (tile location, etc).  
You can also add vector tiles (pbf or mbtiles)
pbf should be adde under htdocs. mbtiles should be added under mbtiles. (see app.js)  

```zsh
npm install
node app.js   
```

# hosting at local host (with Docker)
Edit the config settings (tile location, etc).  
```zsh 
docker run -it --rm -v ${PWD}:/data -p 8836:8836 unvt/nanban
cd /data  
npm install  
npm install sqlite3 (note: I cannot understand, but sqlite was not properly installed with the previous command in my case)  
node app.js  
(ctrl + c to stop)
```  
Go http://localhost:8836/index.html to see if the server is running.  


# refereneces  
onyx: https://github.com/un-vector-tile-toolkit/onyx  
naru: https://github.com/unvt/naru

