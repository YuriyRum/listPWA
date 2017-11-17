// initialize DB for any browser
var inddb = window.indexedDB || window.mozIndexedDB || window.webkitIndexedDB || window.msIndexedDB || window.shimIndexedDB;
var dbname = "totdata";

function openDB(){
	var request = inddb.open(dbname, 1);
	return new Promise(function(resolve, reject){
		request.onupgradeneeded = function(){
			var db = request.result;
			var store = db.createObjectStore("themes",{keyPath:"name"});
			store.createIndex("primary",["name"]);					
		};		
		request.onsuccess = function(){			
			resolve(request);
		};		
		
		request.onerror = function(){
			reject("DB error");
		};
	});	
};	

function themeClickHandler(e){
	// do navigation
	console.log(this);
};

function deleteFromView(){	
	var scope = this;	
	scope.list.splice(scope.$index,1);	
	scope.$apply();
};	

function createOnView(){
	var scope = this;	
	var len = scope.list.length;
	
	for(var i=0;i<len;i++){
		if(scope.list[i].name === scope.newTheme.name) return;
	};
	
	scope.list.push(scope.newTheme);		
	scope.newTheme = {};
	scope.$apply();
};

function themeDelete(index){
	var itemToBeDeleted = this.item;
	console.log(this);
	var scope = this.$parent;
	openDB().then(function(request){
		var db = request.result;
		var tr = db.transaction("themes",'readwrite');				
		tr.objectStore("themes").delete(itemToBeDeleted.name).onsuccess = deleteFromView.bind(scope);		
	});	
};

function createTheme(scope){				
		scope.newTheme = {
			name:scope.newThemeName,
			listOfLists:[]		
		};
		
		openDB().then(function(request){
			var db = request.result;
			var tr = db.transaction("themes",'readwrite');														
			tr.objectStore("themes").put(scope.newTheme).onsuccess =  createOnView.bind(scope);		
		});				
};

(function(){
	"use strict";
	var app = angular.module("listApp", ["ngTouch","ngAnimate"]);
	
	app.animation(".slide", [function(){		
		return {
			add: function(element, doneFn){												
				jQuery(element).slideIn(1000,doneFn);
			},	
			
			remove: function(element, doneFn){				
				jQuery(element).slideOut(1000,doneFn);
			}
		}
	}]);
	
	app.directive("onNewEnter", function(){
		return function(scope,element,attributes){			
			element.bind("keydown keypress", function(event){								
				console.log(event.which);
				if(event.which===13){
					scope.showPopup = false;		
					if(scope.newThemeName){
						createTheme(scope);	
						scope.$apply();
						scope.newThemeName = "";						
					};					
					event.preventDefault();	
				}else if(event.which===27){
					scope.showPopup = false;
					scope.$apply();
				};
			});
		};
	});
	
	app.controller("listController", function($scope){		
		openDB().then(function(request){
			// read data at start					
			var db = request.result;
			var tr = db.transaction("themes",'readwrite');
			
			// register event handlers
			document.getElementById("butAdd").addEventListener("click",function(){							
				$scope.$apply(function(){
					$scope.showPopup = true;				
				});			
			});									
			
			return new Promise(function(resolve,reject){
				tr.objectStore("themes").getAll().onsuccess = function(e){					
					resolve(e.target.result);
				};					
			});	
		}).then(function(data){	
			$scope.$apply(function(){
				$scope.list = data;				
			});			
		});	    
		$scope.themeClick = themeClickHandler;	
		$scope.showActions = false;
		$scope.themeDelete = themeDelete;
		$scope.newThemeName = "";
		$scope.newTheme = {};
		$scope.addTheme = function(){
			this.showPopup = true;
			this.$apply();
			alert(this.showPopup);
		}.bind($scope);
	});				

	// register service worker	
	if("serviceWorker" in navigator){
		navigator.
		serviceWorker.
		register("./service-worker.js");
	};
	
})();