This is originally from https://github.com/ubukawa/style-editing

# style-editing
working space for style editing.(Windows environment. With nodejs and docker.)   
Based on "un-vector-tile-toolkit/onyx" and "unvt/naru."
  

# hosting at localhost
```zsh
git clone https://github.com/ubukawa/style-editing  
cd style-editing  
npm install  
```  
Edit the config settings (tile location, etc).  
You can also add vector tiles (pbf or mbtiles)
pbf should be adde under htdocs. mbtiles should be added under mbtiles. (see app.js)  

```zsh
node app.js   
```

# hosting at local host (with Docker)
```zsh
git clone https://github.com/ubukawa/style-editing  
cd style-editing  
```  
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

# making a style file (with Docker)
Edit hocon file manually at hocon directory.  

```zsh
docker run -it --rm -v ${PWD}:/data unvt/nanban
cd /data  
npm install 
rake
``` 
You will obtain style.json at htdocs directory.  
(or you may be able to do this process out of docker)


# map check
At localhost:  
http://localhost:8836/index.html

At maputnik:  
https://maputnik.github.io/editor/?style=http://localhost:8836/style.json

# refereneces  
onyx: https://github.com/un-vector-tile-toolkit/onyx  
naru: https://github.com/unvt/naru

