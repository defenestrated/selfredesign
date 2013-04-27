define([
  // Application.
  "app",
  "modules/cartofolio",
  "modules/project"
],

function(app, Cartofolio, Project) {

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
			
			Cartofolio.elders.on("reset", function () {
				app.projviews = _(Cartofolio.elders.models).map(function ( model ) {
					return new Cartofolio.Views.Single({ model: model });
				});
				app.trigger("viewsready");
			});

		},
		
	/* !routes */
	routes: {
		"carto": "carto",
		"skeleton": "skeleton",
		"contact": "contact",
		"resumes": "resumes",
		"debug": "debug",
		"projects/:proj": "single",
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
	
	single: function (project) {
		console.log("single project route for " + project);
		if (project == "skeleton") this.navigate("skeleton", {trigger: true});
		
		app.on("viewsready", function () {
			app.switchSingle(project);
		});
		if (typeof app.projviews !== "undefined") {
			if (app.projviews.length != 1) {
				app.switchSingle(project);
			}	
		}
	},
	
	debug: function() {
		app.skelContainer();
	},
	
	index: function() {
		console.log("index route called.");
		switchTo( app.layouts.home );
	},

	splatter: function (splat) {
		console.log("splat: " + splat);
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
			   if ( $(".container").find($(".skeleton")).length || $(".container").find($(".single")).length ) {
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
				app.layouts.mondo.setView(".header", app.layouts.nav).render().done(function() {
					$("a." + newlayout.className).css("color", "white");
					if (newlayout.className == "single") {
						$("a.skeleton").text("back to projects");
					}
					
				});
			}
						
			else {
				app.layouts.mondo.setView(".header", app.layouts.nav).render().done(function () {
					$("a." + newlayout.className).css("color", "white");
					if (newlayout.className == "single") {
						$("a.skeleton").text("back to projects");
					}
					
					$(".header").fadeIn(600, "easeInQuad", function () {
						$("a." + newlayout.className).css("color", "white");
						if (newlayout.className == "single") {
							$("a.skeleton").text("back to projects");
						}
						
					});
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
					(newlayout.className == "skeleton" || newlayout.className == "single") ? app.skelContainer() : app.moveContainer();
					$(".container").fadeIn(600, "easeInQuad");
				});
			});
		}
		
		else {
			app.layouts.mondo.setView(".container", newlayout).render().done(function () {
				(newlayout.className == "skeleton" || newlayout.className == "single") ? app.skelContainer() : app.moveContainer();
				$(".container").fadeIn(600, "easeInQuad");
			});
		}
		
	}
	
	app.switchSingle = function ( project ) {
		var singleview;
		_(app.projviews).map(function ( view ) {
			if (view.model.get("slug") == project) {
				singleview = view;
			}
		});
		if (typeof singleview !== "undefined") {
			switchTo( singleview );
		}
		else {
			var newrouter = new Backbone.Router({});
			newrouter.navigate("", {trigger: true});
		}
	}
	
	app.moveContainer = function() {
		var ww = $(window).width();
		var wh = $(window).height();
		$(".container").css("width", "auto");
		$(".container").css("height", "auto");
		var tw = $(".container").width();
		var th = $(".container").height();
		
/* 		console.log(ww, wh, tw, th); */
		
		
		$(".container").css("left", (ww-tw)/2 + "px");
		$(".container").css("top", (wh-th)/2 + "px");
	}
	
	app.skelContainer = function () {
		var buffer = 20;
	  	$(".container").css("width", $(window).width()-buffer*2);
	  	$(".container").css("height", ($(window).height()-$(".header").outerHeight())-buffer*2);
	  	$(".container").css("left", buffer);
	  	$(".container").css("top", ($(".header").outerHeight() + buffer) + "px");
	  	
	  	if ($(".container").find($(".single")).length) {
	  		var sbw;
	  		if ($(".container").width()/4 < 300) $(".sidebar").css("width", "300px");
	  		else if ($(".container").width()/4 >= 300) $(".sidebar").css("width", $(".container").width()/4 + "px");
	  		
			$(".sidebar").css("height", $(".container").height() + "px");
			
			var available = $(".sidebar").height();
			$(".sidebar th").css("height", available/($(".sidebar td").length + 1) + "px");
			$(".sidebar td").css("height", available/($(".sidebar td").length + 1) + "px");
			$(".mainstage").css("left", $(".sidebar").outerWidth() + "px");
			
			var msw = $(".container").width()-$(".sidebar").outerWidth();
			var newwidth;
			if (msw > 900) newwidth = 900;
			else if (msw <= 700 && msw > 400) newwidth = $(".container").width()-$(".sidebar").outerWidth();
			else if (msw <= 400) newwidth = 400;
			$(".mainstage").css("height", $(".container").height() + "px");
			$(".mainstage").css("width", newwidth + "px");
/*
			$(".sidebar td").each(function ( index ) {
				if (index%2 == 0) $(this).css("background-color", "red");
			})
*/
	  	}
	}
	
	app.fixDate = function ( model ) {
		var m_names = new Array("January", "February", "March", 
		"April", "May", "June", "July", "August", "September", 
		"October", "November", "December");
		
		var modeldate = new Date(model.get("date"));
		var month = m_names[modeldate.getMonth()];
		var year = modeldate.getFullYear();
		var fulldate = month + ", " + year;
		return fulldate;
	}
	
	app.fixList = function ( model, attribute ) {
		var list = _(model.get(attribute)).map(function (item) {
			return " " + item;
		});
		return list;
	}
	
	app.fixScale = function ( model ) { 
		if (model.get("scale") == 1) return model.get("scale") + " cubic foot";
		else return model.get("scale") + " cubic feet";
	}

  return mainrouter;

});
