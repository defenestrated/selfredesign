define([
  // Application.
  "app",
  "modules/cartofolio",
  "modules/project"
],

function(app, Cartofolio, Project) {

	app.currpage;
	app.greenlight = {};
	app.shouldBeSkinny = false;
	app.sp = "";
	app.sr = "";
	app.si = "";
	app.maptype = "random",
	
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
/* 			console.log(this.className + " rendering for the first time? " + this.firstRender); */
			
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
	app.mainrouter = Backbone.Router.extend({

		initialize: function () {
			
			app.weightwatcher(false);
			
			app.layouts.mondo = new Backbone.Layout({
		  		template: "mondo",
		  		el: "body"
	  		});
	  		app.layouts.mondo.render();	  		
	  		
			console.log("router initializing...");
			
			app.mainrouter.getPosts(function (data) {	
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
			
			app.layouts.skel = new Cartofolio.Views.Skeletonview({});
			app.layouts.carto = new Cartofolio.Views.Mapview({});
			
			Cartofolio.elders.on("reset", function () {
				app.projviews = _(Cartofolio.elders.models).map(function ( model ) {
					return new Cartofolio.Views.Single({ model: model });
				});
				app.trigger("viewsready");
			});
			
			$(window).resize(function() {
				app.resize();
			});
		},
		
	/* !routes */
	routes: {
		"cartofolio": "cartofolio",
		"cartofolio/:kind" : "cartofolio",
		"skeleton": "skeleton",
		"contact": "contact",
		"resumes": "resumes",
		"debug": "debug",
		"close": "close",
		"projects/:proj": "single",
		"projects/:proj/:request/:img": "single",
		"projects/:proj/*psplat": "single",
		"skeleton/:proj": "single",
		"skeleton/:proj/:request/:img": "single",
		"skeleton/:proj/*psplat": "single",
		"": "index",
		"*splat": "splatter"
	},
	
	cartofolio: function(kind) {
/* 		console.log(":: carto route"); */
		app.maptype = kind;
		switchTo( app.layouts.carto );
	},
	skeleton: function() {
/* 		console.log(":: skeleton route"); */
		switchTo( app.layouts.skel );
		//app.layouts.skel.showprojects();
	},
	contact: function() {
/* 		console.log(":: contact route"); */
		switchTo( app.layouts.contact )
	},
	resumes: function() {
/* 		console.log(":: resumes route"); */
		switchTo( app.layouts.resumes )
	},
	single: function (project, request, item) {
		app.sp = project;
		app.sr = request;
		app.si = item;
		app.callSingle(app.sp, app.sr, app.si);
	},
	
	close: function () {
/* 		console.log("CLOSE ROUTE"); */
		app.pb.destroy();
	},
	
	debug: function() {
		console.log(":: debug route");
		
		switchTo( app.layouts.carto );
	},
	
	index: function() {
/* 		console.log("index route called."); */
		switchTo( app.layouts.home );
	},
	splatter: function (splat) {
/* 		console.log("splat: " + splat); */
		this.navigate("", { trigger: true });
	}

	});

	app.mainrouter.getPosts = function(callback) {

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
		
		console.log("== switching to " + newlayout.className + ". first render? " + newlayout.firstRender + " ==");
		
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
			/* for all pages except home and map */
			if (newlayout.className != "home" && newlayout.className != "cartofolio") {
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
					});//end render done callback
				});//end nav render done
			}//end if not home
			
			/* for the home and map pages */
			else if (newlayout.className == "home" || newlayout.className == "cartofolio") {
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
	
	app.callSingle = function (project, request, item) {
/* 		console.log(":: single project route for " + project + " req: " + request + " item: " + item); */
		
		if (project == "skeleton") this.navigate("skeleton", {trigger: true});
		
		if (typeof item !== "undefined" && request == "images") {
/* 			console.log(":: with this image: " + item); */
			
			if (typeof app.currpage === "undefined") {
				activateSingle(item);
/* 				console.log("activating single page"); */
			}
			else {
/* 				console.log("single page already exists"); */
				if (!$(".container").children(".photobox").length) {
/* 					console.log("from extant singlepage"); */
					app.pb = new Cartofolio.Views.Photobox({ 
						model: app.currpage.model,
						image: item
					});
					app.layouts.mondo.insertView(".container", app.pb).render();
				}
				else app.pb.sizefix();
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
		function activateSingle(pbimage) {
			app.on("viewsready", function () {
				app.switchSingle(project, function (view) {
/* 					console.log("got it: " + view.model.get("title")); */
					if (typeof pbimage !== "undefined") {
						app.greenlight.once("green", function () {
						if (typeof pbimage !== "undefined")
							app.pb = new Cartofolio.Views.Photobox({ 
								model: view.model,
								image: pbimage
							});
							app.layouts.mondo.insertView(".container", app.pb).render();
						})
					}
				});
			});
			if (typeof app.projviews !== "undefined") {
				if (app.projviews.length != 1) {
					app.switchSingle(project, function (view) {
/* 						console.log("other got it: " + view.model.get("title")); */
					});
				}	
			}
		}
	}
	
	app.weightwatcher = function (onresize) {
		var ww = $(window).width();
		
		if (ww < 1000) app.shouldBeSkinny = true;
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
	app.projectselect = function () {
		console.log("project selection");
		if ($("li#projects").length) {
			$("li#projects").fadeOut(250, function () {
				$(this).html("<a href='skeleton'>list view</a><span class='separator'>&nbsp;&nbsp;~&nbsp;&nbsp;</span><a href='cartofolio'>map view</a>");
				($(".homenav").length || $(".cartonav").length) ? $(".separator").css("color", "rgb(0,0,0)") : $(".separator").css({"color": "rgb(175,175,175)", "word-spacing": "0"});
				$(this).fadeIn(250);
			});	
		}
	}
		
/* 	!end resize fn */
	app.resize = _.debounce(function() {
    	app.weightwatcher(true);
    	if (app.currpage.className == "cartofolio") app.layouts.carto.resize();
    	else (app.currpage.className == "single") ? app.callSingle(app.sp, app.sr, app.si) : switchTo( app.currpage );
	}, 500);

  return app.mainrouter;

});
