define([
  // Application.
  "app",
  "modules/cartofolio"
],

function(app, Cartofolio) {

  // Defining the application router, you can attach sub routers here.
	var mainrouter = Backbone.Router.extend({

		initialize: function () {

			app.layouts.mondo = new Backbone.Layout({
		  		template: "mondo",
		  		el: "body"
	  		});
	  		app.layouts.mondo.render();	  		
	  		
			console.log("router initializing...");
			
			mainrouter.getPosts(function (data) {			
				_.each(data.posts, function(post) {
					app.numprojects++;
					Cartofolio.projects.add(post);
					
				});
				Cartofolio.extractElders();
			});
			
			app.layouts.nav = new pageView({
				template: "nav",
				className: "nav",
				beforeRender: function () {
					var hh = $(".header").height();
					var th = $(".nav ul li").height();
/* 					console.log(hh, th); */
					$(".nav ul li").css("padding-top", (hh-th)/2 + "px !important");
				}
			});
			app.layouts.home = new pageView({
				template: "home",
				className: "home"
			});
			app.layouts.contact = new pageView({
				template: "contact",
				className: "contact"
			});
			app.layouts.resumes = new pageView({
				template: "resumes",
				className: "resumes"
			});
			
			app.layouts.debug = new pageView({
				template: "debug",
				className: "debug"
			});
			
			app.layouts.skel = new Cartofolio.Views.Skeletonview({
				
			});
			app.layouts.carto = new Cartofolio.Views.Mapview({});
			
			//app.layouts.mondo.insertView(app.layouts.debug).render();

			

		},
		
	/* !routes */
	routes: {
		"carto": "carto",
		"skeleton": "skeleton",
		"contact": "contact",
		"resumes": "resumes",
		"debug": "debug",
		"": "index",
		"*splat": "splatter"
	},

	carto: function() {
		console.log("carto route");
		app.layouts.mondo.setView(".container", app.layouts.carto).render();			
	},
	
	skeleton: function() {
		console.log("skeleton route");
		switchTo( app.layouts.skel );
		//app.layouts.skel.showprojects();
	},
	contact: function() {
		console.log("contact route");
		switchTo( app.layouts.contact )
	},
	resumes: function() {
		console.log("resumes route");
		switchTo( app.layouts.resumes )
	},
	
	debug: function() {
/* 		$(".nav").fadeOut("slow"); */
		$(".debug").text('elders models:');
		console.log(_(Cartofolio.elders.models).map(function (model) {
				return model.get("title");
		}));
		_(Cartofolio.elders.models).map(function (model) {
				$(".debug").append("</br>" + model.get("title"));
		});
	},
	
	index: function() {
		console.log("index route called.");
		switchTo( app.layouts.home );
	},

	splatter: function (splat) {
		console.log("splat");
		this.navigate("", { trigger: true });
	}

	});

	mainrouter.getPosts = function(callback) {

		var localcheck = document.URL.search("samgalison.com");
		//console.log("url: " + document.URL + " - samgalison.com at pos. " + localcheck);
		if (localcheck == -1) {
			// we're not on the web
			console.log("==== get posts: operating locally ====");

			$.post("http://localhost/redesign/wordpress/?json=get_recent_posts&post_type=project&count=0", function(data) {
				callback(data);
			});
		}

		else {
			// we're live!
			console.log("==== get posts: operating online ====");

			$.post("../wordpress/?json=get_recent_posts&post_type=project&count=0", function(data) {
				callback(data);
			});
		}

	};
	
	/* !page view */
	var pageView = Backbone.Layout.extend({
	
		collection: Cartofolio.elders,
		className: "defaultPageClass",
		
		initialize: function () {
			
			$(window).resize(function() {
			   if ( $(".container").find($(".skeleton")).length ) {
	        	app.skelContainer();
        	}
        	else {
        		app.moveContainer();
        	}
			});
			
			this.collection.on("reset", function () {
				//console.log("elders reset");
			});
			
/* 			console.log("pageView init: " + this.className); */
		}
	});
	
	function switchTo( newlayout ) {
		
		console.log(":: switching to " + newlayout.className);
		
		if (newlayout.className != "home") {
			if ( $(".header").is(":visible") ) {
				app.layouts.mondo.setView(".header", app.layouts.nav).render();
			}
			
			else {
				app.layouts.mondo.setView(".header", app.layouts.nav).render().done(function () {
					$(".header").fadeIn(600, "easeInQuad");
				});
			}
		}
		
		else if (newlayout.className == "home") {
			if ( $(".header").is(":visible") ) {
				$(".header").fadeOut(1000, "easeInQuad");
			}
		}
		
		if ($(".container").is(":visible")) {
			$(".container").fadeOut("fast", function () {
				app.layouts.mondo.setView(".container", newlayout).render().done(function () {
					(newlayout.className == "skeleton") ? app.skelContainer() : app.moveContainer();
					$(".container").fadeIn(600, "easeInQuad");
				});
			});
		}
		
		else {
			app.layouts.mondo.setView(".container", newlayout).render().done(function () {
				(newlayout.className == "skeleton") ? app.skelContainer() : app.moveContainer();
				$(".container").fadeIn(600, "easeInQuad");
			});
		}
	}
	
	app.moveContainer = function() {
		var ww = $(window).width();
		var wh = $(window).height();
		$(".container").css("width", "auto");
		var tw = $(".container").width();
		var th = $(".container").height();
		
/* 		console.log(ww, wh, tw, th); */
		
		
		$(".container").css("left", (ww-tw)/2 + "px");
		$(".container").css("top", (wh-th)/2 + "px");
	}
	
	app.skelContainer = function () {
		var buffer = 20;
	  	$(".container").css("width", $(window).width()-buffer*2);
	  	$(".container").css("left", buffer);
	  	$(".container").css("top", ($(".header").outerHeight() + buffer) + "px");
	}

  return mainrouter;

});
