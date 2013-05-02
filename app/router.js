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
	app.currpage;
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
					$("a." + app.currpage.className).css("color", "white");
					if (app.shouldBeSkinny) $(".nav").addClass("skinny");
						else $(".nav").removeClass("skinny");
					if (app.currpage.className == "single") $("a.skeleton").text("back to the list of projects");
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
		
		console.log("::: switching to " + newlayout.className);
		
		app.currpage = newlayout;
		
		console.log("switching with skinny? " + app.shouldBeSkinny);
		
			/****************************
			
			fade out container
			render new layout
			
			in new layout's afterrender:
				make container invisible
				fix container scaling
				fade container back in
			
			*****************************/
			
		if (newlayout.className != "skeleton") app.layouts.skel.firstRender = true;
		
		/* for all pages except home */
		if (newlayout.className != "home") {
			app.layouts.mondo.setView(".header", app.layouts.nav).render().done(function () {
				var buffer = 20;
				var ww = $(window).width();
				var wh = $(window).height();
				
				app.layouts.mondo.setView(".container", newlayout).render().done(function () {
	
					/* for skinny layouts */
					if (app.shouldBeSkinny) {
						
						/* for all pages that need full real estate */
						if (newlayout.className == "single" || newlayout.className == "skeleton") {
							$(".container").css({
								"width": 	ww-buffer*2 + "px",
								"height": 	(wh-$(".header").outerHeight())-buffer*2 + "px",
								"left":		buffer + "px",
								"top":		($(".header").outerHeight() + buffer) + "px"
							});
						}
						/* for all that don't */
						else {
							
							$(".container").css({
								"width": "100%",
								"text-align": "center",
								"height": "auto"
							});
						}//end centered content if/else
					}//end skinny layouts
					
					/* for fat layouts */
					else {						
						if (newlayout.className == "single" || newlayout.className == "skeleton") {
							$(".container").css({
								"width": 	ww-buffer*2 + "px",
								"height": 	(wh-$(".header").outerHeight())-buffer*2 + "px",
								"left":		buffer + "px",
								"top":		($(".header").outerHeight() + buffer) + "px"
							});
						}
						else $(".container").css({
							"width": "auto",
							"height": "auto"
						});
					}//end fat layouts
					
				});//end render done callback
			});//end nav render done
		}//end if not home
		
		/* for the home page */
		else if (newlayout.className == "home") {
			app.layouts.nav.firstRender = true;
			if ( $(".header").is(":visible") ) {
				$(".header").fadeOut(1000, "easeInOutQuad");
			}
		}
		newlayout.sizefix();
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
        	app.weightwatcher(true);
        	switchTo( app.currpage );
	    }               
	}

  return mainrouter;

});
