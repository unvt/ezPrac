# ex3-added
production package for a postgis data base


## install
```console
git clone https://github.com/unvt/ezPrac
cd ezPrac/ex3-add
docker run -it --rm -v ${PWD}:/data unvt/nanban
cd /data
npm install
vi config/default.hjson //edit config info, e.g. host, dbUser, dbPassword, etc.
vi modify.js
node index.js
```

## Possible workflow
run "tile-join" to convert mbtiles into pbf tiles.  
```console
/usr/local/bin/tile-join --no-tile-size-limit -e (pbf location) (input mbtiles) --no-tile-compression
```
  
