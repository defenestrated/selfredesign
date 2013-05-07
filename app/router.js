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
	app.greenlight = {};
	app.shouldBeSkinny = false;
	_.extend(app.greenlight, Backbone.Events);
	
	// default page view
	var pageView = Backbone.Layout.extend({
		collection: Cartofolio.elders,
		className: "defaultPageClass",
		sizefix: function () {},
		firstRender: true,
		
		beforeRender: function () {
			app.on("weightchange", function () {
			});
		},
		
		afterRender: function () {
			console.log(this.className + " rendering for the first time? " + this.firstRender);
			
			$(".container").css({
				"width": "",
				"height": "",
				"left": "",
				"top": "",
				"visibility": ""
			});
			
			if (this.firstRender) {
				
				
					
				this.firstRender = false;
				$(".container").css({"visibility": "hidden"});
				
				if (app.shouldBeSkinny) $(".container").addClass("skinny");
				else $(".container").removeClass("skinny");
				
				var ch = $(".container").outerHeight();
				var cw = $(".container").outerWidth();
				var wh = $(window).height();
				var ww = $(window).width();	
			
				$(".container").css({
					"top": (wh-ch)/2 + "px"
				});

				if (app.shouldBeSkinny) $(".container").css({
					"left": 0
				});

				else $(".container").css({
					"left": (ww-cw)/2 + "px"
				});
			
				
				$(".container").css({
					"visibility": "visible",
					"display": "none"
				});

				$(".container").fadeIn(600, "easeInOutQuad");
			}
			
			else { // resize
				$(".container").fadeOut(300, "easeInOutQuad", function () {
					$(".container").css({"visibility": "hidden"});
					
					if (app.shouldBeSkinny) $(".container").addClass("skinny");
					else $(".container").removeClass("skinny");
					
					var ch = $(".container").outerHeight();
					var cw = $(".container").outerWidth();
					var wh = $(window).height();
					var ww = $(window).width();	
				
					$(".container").css({
						"top": (wh-ch)/2 + "px"
					});

					if (app.shouldBeSkinny) $(".container").css({
						"left": 0
					});

					else $(".container").css({
						"left": (ww-cw)/2 + "px"
					});
				
					
					$(".container").css({
						"visibility": "visible",
						"display": "none"
					});
					$(".container").fadeIn(300, "easeInOutQuad");
				});
			}
		}
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
				className: "home",
				afterRender: function () {					
					$(".container").css({
						"visibility": "hidden",
						"width": "auto",
						"height": "auto"
						
					});
					var ch = $(".container").height();
					var cw = $(".container").width();
					var wh = $(window).height();
					var ww = $(window).width();
					$(".container").css({
						"top": (wh-ch)/2 + "px",
						"left": (ww-cw)/2 + "px"
					});
				
					
					$(".container").css({
						"visibility": "visible",
						"display": "none"
					});
	
					$(".container").fadeIn(600, "easeInOutQuad");
				}
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
		"projects": "skeleton",
		"projects/:proj": "single",
		"projects/:proj/:request/:img": "single",
		"projects/:proj/*psplat": "single",
		"skeleton/:proj": "single",
		"skeleton/:proj/:request/:img": "single",
		"skeleton/:proj/*psplat": "single",
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
	single: function (project, request, item) {
		console.log(":: single project route for " + project + " req: " + request + " item: " + item);
		
		if (project == "skeleton") this.navigate("skeleton", {trigger: true});
		
		if (typeof item !== "undefined" && request == "images") {
			console.log(":: with this image: " + item);
			var pb = new Cartofolio.Views.Photobox({});
			app.greenlight.on("green", function () {
				console.log("green lit");
				$(".container").append("<div class='photobox'></div>");
				$(".photobox").css({
					"height": $(window).height() - $(".header").outerHeight() + "px",
					"top": $(".header").outerHeight() + "px",
					"display": "none",
					"visibility": "visible"
				});
				$(".photobox").on("click", function () {app.greenlight.trigger("red")});
				
				$(".photobox").fadeIn(500, "easeInOutQuad", function () {
				});			
			});
			
			
			app.greenlight.on("red", function () {
				$(".photobox").fadeOut(500, "easeInOutQuad", function () {
					$(".photobox").remove();
				});
				app.greenlight.off();
			});
			
			if (typeof app.currpage === "undefined") {
				activateSingle();
				console.log("activating single page");
			}
			else {
				console.log("single page already exists");
				if (!$(".container").children(".photobox").length) {
					console.log("from here");
					app.greenlight.trigger("green");
				}
			}
		}
		else if (typeof item === "undefined" && typeof request !== "undefined") {
			console.log("bad route: " + request);
			this.navigate("projects/" + project, {trigger: true});
		}
		
		else {
			if (typeof request !== "undefined" && request != "images") {
				console.log("bad route: " + request);
				this.navigate("projects/" + project, {trigger: true});
			}
			else {
				activateSingle();
			}
		}
		function activateSingle() {
			app.on("viewsready", function () {
				app.switchSingle(project, function (view) {
					console.log("got it: " + view.model.get("title"));
				});
			});
			if (typeof app.projviews !== "undefined") {
				if (app.projviews.length != 1) {
					app.switchSingle(project, function (view) {
						console.log("other got it: " + view.model.get("title"));
					});
				}	
			}
		}
	},
	
	debug: function() {
		console.log(":: debug route");
		
		app.greenlight.trigger("red");
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
		
		console.log("== switching to " + newlayout.className + " ==");
		
		app.currpage = newlayout;
		
		// when you navigate away from a page, reset that page's "firstRender" property
		_(app.layouts).each(function (layout) {
			if (typeof layout.className !== "undefined") {
				if (newlayout.className != layout.className && layout.className != "nav") {
					layout.firstRender = true;
				}
			};
		});
		
		if ($(".container").children().length) {
			$(".container").fadeOut(300, "easeInOutQuad", function () {
				actualswitch();
			});
		}
		else {
			actualswitch();
		}
		
		function actualswitch() {
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
						}//end fat layouts
						if (!$(".container").children(".photobox").length) {
							console.log("from here");
							app.greenlight.trigger("green");
						}
					});//end render done callback
				});//end nav render done
			}//end if not home
			
			/* for the home page */
			else if (newlayout.className == "home") {
				app.layouts.nav.firstRender = true;
				if ( $(".header").is(":visible") ) {
					$(".header").fadeOut(1000, "easeInOutQuad");
				}
				app.layouts.mondo.setView(".container", newlayout).render();
			}
			
			newlayout.sizefix();
		}
	}
	
	app.switchSingle = function ( project, callback ) {
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
			newrouter.navigate("projects", {trigger: true});
		}
		callback(singleview);
	}
	
	app.weightwatcher = function (onresize) {
		var ww = $(window).width();
		
		if (ww < 830) app.shouldBeSkinny = true;
		else app.shouldBeSkinny = false;
		
		if (onresize) app.trigger("weightchange");
/* 		console.log("current width: " + ww + ". should be skinny? " + app.shouldBeSkinny); */
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
