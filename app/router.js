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
				afterRender: function() {
					if (!$(".nav").is(":visible")) {
						$(".nav").fadeIn("slow");
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
			
			app.layouts.mondo.insertView(app.layouts.debug).render();

			

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
		app.layouts.mondo.setView(".nav", app.layouts.nav).render();
		app.layouts.mondo.setView(".container", app.layouts.contact).render();
	},
	resumes: function() {
		console.log("resumes route");
		app.layouts.mondo.setView(".nav", app.layouts.nav).render();
		app.layouts.mondo.setView(".container", app.layouts.resumes).render();
	},
	
	debug: function() {
		$(".nav").fadeOut("slow");
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
			
			this.collection.on("reset", function () {
				//console.log("elders reset");
			});
			
/* 			console.log("pageView init: " + this.className); */
		}
	});
	
	function switchTo( newlayout ) {
		
		console.log(":: switching to " + newlayout.className);
		
		if (newlayout.className == "home") { // GOING TO HOME PAGE
			
			
			/* !BROKEN */
			
			// spits out dom exception 3 - probably it can be fixed
			// by cleaning up the hierarchy and just fading out and in a single entire meta-container.
			
			if ($(".nav").length) {
				$(".nav").fadeOut("slow");
			}
			if ($(".container").length) {
				$(".container").fadeOut("slow", function () {
					app.layouts.mondo.setView(".container", newlayout).render().done(function () {
						$(".container").fadeIn("slow");
					});
				});	
			}
			
			else {
				app.layouts.mondo.setView(".container", newlayout).render().done(function () {
					$(".container").fadeIn("slow");
				});
			}
		}
		
		else { // NOT GOING TO HOME PAGE
			if ($(".container").length) {
				$(".container").fadeOut("slow", function () {
					app.layouts.mondo.setView(".nav", app.layouts.nav).render();
					app.layouts.mondo.setView(".container", newlayout).render().done(function () {
						$(".container").fadeIn("slow");
					});
				});				
			}
			
			else {
				app.layouts.mondo.setView(".container", newlayout).render().done(function () {
					$(".container").fadeIn("slow");
				});
			}
		}
		
				
		/*
if ($(".container").length) {
			// container exists
			if (typeof newlayout.attributes !== "undefined") {
				if (newlayout.attributes.name != "home") {
					$(".container").fadeOut("slow", function(){
						app.layouts.mondo.setView(".nav", app.layouts.nav).render();
						
				}
			}
			
			else {
				if ($(".nav").length) { // kill nav bar on home page
					$(".nav").fadeOut("slow");
				}
			}
			$(".container").fadeOut("slow", function(){
						app.layouts.mondo.setView(".nav", app.layouts.nav).render();
					else {
						if ($(".nav").length) { // kill nav bar on home page
							$(".nav").fadeOut("slow");
						}
					}
				}
				app.layouts.mondo.setView(".container", newlayout).render();
				$(".container").fadeIn("slow");
			});
		}
		else {
			// container doesn't exist
			app.layouts.mondo.setView(".container", newlayout).render().done(function () {
				$(".container").fadeIn("slow");
			});
		}
*/
	
	}

  return mainrouter;

});
