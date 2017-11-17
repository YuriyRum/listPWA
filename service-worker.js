var cacheName = "TreeOfThings-cache-1"; 
var filesToCache = [
  '/',
  '/manifest.json',
  '/index.html',
  '/js/app.js',  
  '/images/clear.png',
  '/images/cloudy-scattered-showers.png',
  '/images/cloudy.png',
  '/images/fog.png',
  '/images/ic_add_white_24px.svg',  
  '/images/partly-cloudy.png',
  '/images/rain.png',
  '/images/scattered-showers.png',
  '/images/sleet.png',
  '/images/snow.png',
  '/images/thunderstorm.png',
  '/images/wind.png',
  "/images/OOjs_UI_icon_trash_apex.svg",
  '/styles/app.css'
];

function cacheAssets(){
	return caches.open(cacheName).then(function(cache){
		return cache.addAll(filesToCache);
	});
};

// caching resources
self.addEventListener("install", function(e){	
	e.waitUntil(cacheAssets());
});

// create DB & indeces
self.addEventListener("activate", function(e){		
	//e.waitUntil();	
});

self.addEventListener("fetch", function(e){		    
	e.respondWith(caches.match(e.request).then(function(response){		
		return response||fetch(e.request);
	}));
});