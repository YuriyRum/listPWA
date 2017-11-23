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

function themeClickHandler(index){		
	this.scope.sharedText.index = index;
	this.scope.sharedText.text = this.scope.list[index].text;
	this.location.path("/lists");	
};

function deleteFromView(){	
	var scope = this.$parent;		
	scope.list.splice(this.$index,1);	
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
	var scope = this;
	openDB().then(function(request){
		var db = request.result;
		var tr = db.transaction("themes",'readwrite');					
		tr.objectStore("themes").delete(itemToBeDeleted.name).onsuccess = deleteFromView.bind(scope);		
	});	
};

function createTheme(scope){				
		scope.newTheme = {
			name:scope.newThemeName,
			text:null
		};
		
		openDB().then(function(request){
			var db = request.result;
			var tr = db.transaction("themes",'readwrite');														
			tr.objectStore("themes").put(scope.newTheme).onsuccess =  createOnView.bind(scope);		
		});				
};

function updateTheme(object){
		openDB().then(function(request){
			var db = request.result;
			var tr = db.transaction("themes",'readwrite');														
			tr.objectStore("themes").put(object);		
		});				
};

(function(){
	"use strict";
	var app = angular.module("listApp", ["ngTouch","ngAnimate","ngRoute"]);
	
	app.config(["$routeProvider", function($routeProvider){
		
		$routeProvider
			.when("/themes",{
				templateUrl: "views/listView.html",
				controller: "listController"
			})
			.when("/lists",{
				templateUrl: "views/textView.html",
				controller: "textController"
			})
			.otherwise({
				redirectTo: "/themes"
			})			
		
	}]);
	
	app.service("readData", [function(){
		var that = this;
		that.read = false;
		that.data = [];
		that.getData = new Promise(function(resolve, reject){
			openDB().then(function(request){
				// read data at start					
				var db = request.result;
				var tr = db.transaction("themes",'readwrite');					
				
				return new Promise(function(resolve,reject){
					tr.objectStore("themes").getAll().onsuccess = function(e){					
						resolve(e.target.result);
					};					
				});	
			}).then(function(data){	
				that.read = true;				
				that.data = data;
				resolve(true);
			});	 					
		});
		that.getRead = function(){
			return that.read;
		};
		that.getReadData = function(){
			return that.data;
		};
	}]);
	
	app.factory("sharedText", function(){
		return{
			index:null,
			text:null			
		}
	});
	
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
	// enter directive (redefine standard enter action)
	app.directive("onNewEnter", function(){
		return function(scope,element,attributes){			
			element.bind("keydown keypress", function(event){												
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
	// list view controller
	app.controller("listController", function($scope, $location, $interval, sharedText, readData){															
		var promise = new Promise(function(resolve, reject){
			readData.getData.then(function(){									
				document.getElementById("butAdd").addEventListener("click",function(){							
					$scope.$apply(function(){
						$scope.showPopup = true;				
						//document.getElementById("newThemeName").focus();
						//document.getElementById("newThemeName").select();
						//$("#newTheme").focus();						
					});			
				});							
				
				$scope.$apply(function(){
					$scope.list = readData.getReadData();					
					resolve(true);
				});	
			});			
		});
											
		$scope.$on("$routeChangeSuccess", function(event, current, previous){							
			promise.then(function(){
				if(previous&&current.$$route.originalPath==="/themes"&&current.scope.list){				
					current.scope.list[current.scope.sharedText.index].text = current.scope.sharedText.text;
					updateTheme({name:current.scope.list[current.scope.sharedText.index].name, text:current.scope.list[current.scope.sharedText.index].text});
				}; 								
			});
		});				
			
		$scope.sharedText = sharedText;
		$scope.themeClick = themeClickHandler.bind({scope:$scope,location:$location});	
		$scope.showActions = false;
		$scope.themeDelete = themeDelete;
		$scope.newThemeName = "";
		$scope.newTheme = {};
		$scope.addTheme = function(){
			this.showPopup = true;
			this.$apply();			
		}.bind($scope);		
	});				
	
	app.controller("textController", function($scope, $location, sharedText){
		$scope.sharedText = sharedText;
	});
	
	// register service worker	
	if("serviceWorker" in navigator){
		navigator.
		serviceWorker.
		register("./service-worker.js");
	};
	
})();