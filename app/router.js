define([
  // Application.
  "app",
  "modules/cartofolio",
  "modules/project"
],

function(app, Cartofolio, Project) {

	app.rtime = new Date(1, 1, 2000, 12,00,00);
	app.timeout = false;
	app.delta = 200;
	app.currpage = "";
	app.shouldBeSkinny = false;
	
	// default page view
	var pageView = Backbone.Layout.extend({
		collection: Cartofolio.elders,
		className: "defaultPageClass",
		firstRender: true
	});
	
  // Defining the application router, you can attach sub routers here.
	var mainrouter = Backbone.Router.extend({

		initialize: function () {
			
			app.weightwatcher(false);
			
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
					app.on("weightchange", function () {
						console.log("changed weight");
						if (app.shouldBeSkinny) $(".nav").addClass("skinny");
						else $(".nav").removeClass("skinny");
					});
					
					if (this.firstRender) {
						$(".header").css("visibility", "hidden");
						var hh = $(".header").height();
						var th = $(".nav ul li").height();
						$(".nav ul li").css("padding-top", (hh-th)/2 + "px !important");						
						$(".header").css({
							"visibility": "visible",
							"display": "none"
						});
						
					}
				},
				
				afterRender: function () {
					$("a." + app.currpage).css("color", "white");
					if (app.shouldBeSkinny) $(".nav").addClass("skinny");
						else $(".nav").removeClass("skinny");
					if (app.currpage == "single") $("a.skeleton").text("back to the list of projects");
					if (this.firstRender) { 
						$(".header").fadeIn(600, "easeInOutQuad");
						this.firstRender = false;
					}
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
			
			Cartofolio.elders.on("reset", function () {
				app.projviews = _(Cartofolio.elders.models).map(function ( model ) {
					return new Cartofolio.Views.Single({ model: model });
				});
				app.trigger("viewsready");
			});
			
			$(window).resize(function() {
				app.rtime = new Date();
			    if (app.timeout === false) {
			        app.timeout = true;
			        setTimeout(app.resizeend, app.delta);
			    }
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
		console.log(":: carto route");
		app.layouts.mondo.setView(".container", app.layouts.carto).render();			
	},
	skeleton: function() {
		console.log(":: skeleton route");
		switchTo( app.layouts.skel );
		//app.layouts.skel.showprojects();
	},
	contact: function() {
		console.log(":: contact route");
		switchTo( app.layouts.contact )
	},
	resumes: function() {
		console.log(":: resumes route");
		switchTo( app.layouts.resumes )
	},
	single: function (project) {
		console.log(":: single project route for " + project);
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
		console.log(":: debug route");
		
		app.weightwatcher();
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
	
	function switchTo( newlayout ) {
		
		app.currpage = newlayout.className;
		
		if (newlayout.className != "home") {
			app.layouts.mondo.setView(".header", app.layouts.nav).render();
		}
		
		else if (newlayout.className == "home") {
			app.layouts.nav.firstRender = true;
			if ( $(".header").is(":visible") ) {
				$(".header").fadeOut(1000, "easeInOutQuad");
			}
		}
		
		if ($(".container").is(":visible")) {
			$(".container").fadeOut("fast", function () {
				app.layouts.mondo.setView(".container", newlayout).render().done(function () {
					(newlayout.className == "skeleton" || newlayout.className == "single") ? app.skelContainer() : app.moveContainer();
					$(".container").fadeIn(600, "easeInOutQuad");
				});
				
			});
		}
		
		else {
			app.layouts.mondo.setView(".container", newlayout).render().done(function () {
				(newlayout.className == "skeleton" || newlayout.className == "single") ? app.skelContainer() : app.moveContainer();
				$(".container").fadeIn(600, "easeInOutQuad");
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
		
		if ($(window).width() < 875) {
			app.currsize = "little";
			
			$(".container").css("width", "100%");
			$(".container").css("text-align", "center");
			$(".container").css("height", "auto");
			
			
		}
		else {
			app.currsize = "big";
			
			$(".container").css("width", "auto");
			$(".container").css("height", "auto");
			
			
		}
		
		var tw = $(".container").width();
		var th = $(".container").height();
		
/* 		console.log(ww, wh, tw, th); */
		
		
		$(".container").css("left", (ww-tw)/2 + "px");
		$(".container").css("top", (wh-th)/2 + "px");
	}
	
	app.skelContainer = function () {
		var buffer = 20;
		var ww = $(window).width();
		var wh = $(window).height();
		
	  	$(".container").css({
			"width": 	ww-buffer*2 + "px",
			"height": 	(wh-$(".header").outerHeight())-buffer*2 + "px",
			"left":		buffer + "px",
			"top":		($(".header").outerHeight() + buffer) + "px",
			"padding-bottom": "20px"
		});
	  	
	  	if ($(".container").find($(".single")).length) {
	  		
	  		if ($(window).width() < 1000) {
	  			app.currsize = "little";
		  		
		  		$(".container").css({
			  		"overflow": "auto"
		  		});
		  		
	  			$(".sidebar").css({
	  				"width": $(".container").width()/2 + "px",
	  				"height": "auto",
	  				"padding": "0px",
	  				"float": "left"
  				});
				
				$(".sidebar th").css({
					"height": "auto",
					"padding": "0 0 5px 0",
					"font-size": "20px"
				});
				
				$(".sidebar td").css({
					"height": "auto",
					"padding": "5px 0",
					"font-size": "10px"
				});
				
				if ($(".content_thumb").is(":visible")) $(".content_thumb").fadeOut(function () {
					$(".little_thumb").css({
						"left": $(".sidebar").width()+($(".container").width()-$(".sidebar").width()-$(".little_thumb").outerWidth())/2,
						"top": ($(".sidebar").height()-$(".little_thumb").outerHeight())/2
					});
					$(".little_thumb").fadeIn();
				});
				
				$(".mainstage").css({
					"overflow": "hidden",
					"left": 0,
					"top": $(".sidebar").height() + "px",
					"width": widthcalc("little") + "px"					
				});
				
	  		}
	  		
	  		else {
	  			app.currsize = "big";	  					  				
				if ($(".container").width()/4 < 300) $(".sidebar").css("width", "300px");
		  		else if ($(".container").width()/4 >= 300) $(".sidebar").css("width", $(".container").width()/4 + "px");
		  		
		  		
		  		// RESETS FOR RESIZING
		  		
		  		$(".container").css({
			  		"overflow": "hidden"
		  		});
		  		
		  		$(".sidebar").css({
	  				"height": $(".container").height() + "px",
	  				"padding": "",
	  				"clear": "both"
  				});
				
				$(".sidebar th").css({
					"padding": "",
					"font-size": "20px"
				});
				
				$(".sidebar td").css({
					"padding": "",
					"font-size": ""
				});
		  		
		  		if (!$(".content_thumb").is(":visible")) $(".little_thumb").fadeOut(function () {
				  		$(".content_thumb").fadeIn();
			  		});
		  		
				var available = $(".sidebar").height();
				$(".sidebar th").css("height", available/($(".sidebar td").length + 1) + "px");
				$(".sidebar td").css("height", available/($(".sidebar td").length + 1) + "px");
				
				$(".mainstage").css({
					"overflow": "auto",
					"left": $(".sidebar").outerWidth() + "px",
					"top": "",
					"height": $(".container").height() + "px",
					"width": widthcalc("big") + "px",
					"padding-right": $(".container").width()-$(".sidebar").outerWidth()-widthcalc("big") + "px"
				});
	  							
	  		}
	  		
	  		function widthcalc( size ) {
	  			if (size == "little") {
		  			return $(".container").width();
	  			}
	  			
	  			else {
		  			var msw = $(".container").width()-$(".sidebar").outerWidth();
					var newwidth;
					if (msw > 900) newwidth = 900;
					else if (msw <= 700 && msw > 400) newwidth = msw;
					else if (msw <= 400) newwidth = 400;
					return newwidth;		  			
	  			}  			
	  		}
	  	}
	}
	
	app.weightwatcher = function (onresize) {
		var ww = $(window).width();
		
		if (ww < 830) app.shouldBeSkinny = true;
		else app.shouldBeSkinny = false;
		
		if (onresize) app.trigger("weightchange");
		console.log("current width: " + ww + ". should be skinny? " + app.shouldBeSkinny);
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
		
/* 	!end resize fn */
	app.resizeend = function() {
	    if (new Date() - app.rtime < app.delta) {
	        setTimeout(app.resizeend, app.delta);
	    } else {
	        app.timeout = false;
	        if ( $(".container").find($(".skeleton")).length || $(".container").find($(".single")).length ) {
	       	 	app.skelContainer();
        	}
        	else {
        		app.moveContainer();
        	}
        	app.weightwatcher(true);
	    }               
	}

  return mainrouter;

});
